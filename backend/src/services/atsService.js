const mongoose = require("mongoose");
const OpenAI = require("openai");
const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");
const userRepository = require("../repositories/userRepository");
const { AtsCheck } = require("../models/AtsCheck");
const { Job } = require("../models/Job");
const { User } = require("../models/User");

const MODEL = "gpt-4o-mini";
const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);
const SUGGESTION_TYPES = new Set(["keyword", "format", "skill", "experience", "quantify"]);
const PRIORITIES = new Set(["high", "medium", "low"]);

function requireOpenAi() {
  if (!env.OPENAI_API_KEY) {
    throw new ApiError(503, "AI service is not configured");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function isUserPremium(user) {
  if (!user || user.isPremium !== true) return false;
  if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date()) return false;
  return true;
}

function parseJsonFromContent(content) {
  let s = String(content || "").trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return JSON.parse(s);
}

function normalizeGrade(g) {
  const u = String(g || "F").toUpperCase().trim();
  return VALID_GRADES.has(u) ? u : "F";
}

function normalizeStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean).slice(0, 200);
}

function normalizeSuggestions(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((s) => s && typeof s === "object")
    .map((s) => {
      const type = SUGGESTION_TYPES.has(s.type) ? s.type : "keyword";
      const priority = PRIORITIES.has(s.priority) ? s.priority : "medium";
      const message = String(s.message || "Improve alignment with the job description.").slice(0, 500);
      const example = s.example != null && s.example !== "" ? String(s.example).slice(0, 500) : null;
      return { type, priority, message, example };
    })
    .slice(0, 50);
}

function normalizeFormatCheck(fc) {
  const o = fc && typeof fc === "object" ? fc : {};
  return {
    singleColumn: Boolean(o.singleColumn),
    standardFonts: Boolean(o.standardFonts),
    noTables: Boolean(o.noTables),
    properHeadings: Boolean(o.properHeadings),
    contactInfoComplete: Boolean(o.contactInfoComplete),
    consistentDates: Boolean(o.consistentDates),
    score: Math.min(100, Math.max(0, Number(o.score) || 0)),
  };
}

/**
 * @param {string} userId
 * @param {string} resumeText
 * @param {string} jobDescription
 * @param {string|null|undefined} jobId
 */
const analyzeResume = async (userId, resumeText, jobDescription, jobId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (typeof user.canUseAtsChecker !== "function" || !user.canUseAtsChecker()) {
    throw new ApiError(
      403,
      "You have reached your ATS check limit for this month. Upgrade to premium for unlimited checks."
    );
  }

  const trimmedResume = String(resumeText || "").trim();
  const trimmedJob = String(jobDescription || "").trim();
  if (trimmedResume.length < 100) {
    throw new ApiError(400, "Resume text must be at least 100 characters");
  }
  if (trimmedJob.length < 50) {
    throw new ApiError(400, "Job description must be at least 50 characters");
  }

  let jobObjectId = null;
  let jobTitle = null;
  let companyName = null;
  if (jobId != null && String(jobId).trim() !== "" && mongoose.isValidObjectId(String(jobId))) {
    jobObjectId = new mongoose.Types.ObjectId(String(jobId));
    const job = await Job.findById(jobObjectId).populate("company", "name");
    if (job) {
      jobTitle = job.title || null;
      companyName = job.company?.name || null;
    }
  }

  const start = Date.now();
  const openai = requireOpenAi();

  const systemPrompt = `You are an expert ATS (applicant tracking system) resume analyst. Compare the candidate resume to the job description.
Return a single JSON object only (no markdown fences) with this exact shape:
{
  "score": <integer 0-100>,
  "grade": "A"|"B"|"C"|"D"|"F",
  "summary": "string max 500 chars — overall assessment",
  "presentKeywords": ["string"],
  "missingKeywords": ["string"],
  "skillsGap": ["string"],
  "suggestions": [
    { "type": "keyword"|"format"|"skill"|"experience"|"quantify", "priority": "high"|"medium"|"low", "message": "string max 500", "example": "string max 500 or omit/null" }
  ],
  "formatCheck": {
    "singleColumn": boolean,
    "standardFonts": boolean,
    "noTables": boolean,
    "properHeadings": boolean,
    "contactInfoComplete": boolean,
    "consistentDates": boolean,
    "score": <integer 0-100>
  }
}
Infer format booleans from resume text only (structure, headings, dates pattern — not a binary file). Be concise and realistic.`;

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Resume:\n${trimmedResume}\n\nJob description:\n${trimmedJob}`,
        },
      ],
    });
  } catch (err) {
    const msg = err?.message || "Failed to analyze resume";
    throw new ApiError(502, msg);
  }

  const rawContent = completion?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = parseJsonFromContent(rawContent);
  } catch {
    throw new ApiError(502, "Invalid response from AI model");
  }

  const processingTimeMs = Date.now() - start;
  const tokensUsed = completion?.usage?.total_tokens ?? 0;

  const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)));
  const grade = normalizeGrade(parsed.grade);
  const summary =
    parsed.summary != null && String(parsed.summary).trim() !== ""
      ? String(parsed.summary).trim().slice(0, 500)
      : null;

  const doc = await AtsCheck.create({
    user: userId,
    jobId: jobObjectId,
    jobTitle,
    companyName,
    resumeTextLength: trimmedResume.length,
    jobDescriptionLength: trimmedJob.length,
    score,
    grade,
    summary,
    presentKeywords: normalizeStringArray(parsed.presentKeywords),
    missingKeywords: normalizeStringArray(parsed.missingKeywords),
    skillsGap: normalizeStringArray(parsed.skillsGap),
    suggestions: normalizeSuggestions(parsed.suggestions),
    formatCheck: normalizeFormatCheck(parsed.formatCheck),
    modelUsed: MODEL,
    tokensUsed,
    processingTimeMs,
    isPremiumCheck: isUserPremium(user),
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { atsChecksUsedThisMonth: 1 },
  });

  return { check: doc.toJSON() };
};

/**
 * @param {string} userId
 * @param {number} [page]
 * @param {number} [limit]
 */
const getAtsHistory = async (userId, page = 1, limit = 10) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (p - 1) * l;

  const filter = { user: userId };
  const [rows, total] = await Promise.all([
    AtsCheck.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .select("score grade summary jobTitle companyName jobId createdAt modelUsed processingTimeMs")
      .lean(),
    AtsCheck.countDocuments(filter),
  ]);

  const items = rows.map((c) => ({
    id: c._id.toString(),
    score: c.score,
    grade: c.grade,
    summary: c.summary,
    jobTitle: c.jobTitle,
    companyName: c.companyName,
    jobId: c.jobId ? c.jobId.toString() : null,
    createdAt: c.createdAt,
    modelUsed: c.modelUsed,
    processingTimeMs: c.processingTimeMs,
  }));

  return {
    items,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 0,
    },
  };
};

/**
 * @param {string} checkId
 * @param {string} userId
 */
const getAtsCheck = async (checkId, userId) => {
  if (!mongoose.isValidObjectId(checkId)) {
    throw new ApiError(400, "Invalid check id");
  }
  const check = await AtsCheck.findOne({ _id: checkId, user: userId });
  if (!check) {
    throw new ApiError(404, "ATS check not found");
  }
  return { check: check.toJSON() };
};

function nextUsageResetAt() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

/**
 * @param {string} userId
 */
const getUsageStats = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const premium = isUserPremium(user);
  return {
    atsChecksUsed: user.atsChecksUsedThisMonth ?? 0,
    atsChecksLimit: premium ? null : env.FREE_ATS_CHECKS_PER_MONTH,
    resumeReviewsUsed: user.resumeReviewsUsedThisMonth ?? 0,
    resumeReviewsLimit: premium ? null : env.FREE_RESUME_REVIEWS_PER_MONTH,
    isPremium: premium,
    resetsAt: nextUsageResetAt(),
  };
};

module.exports = {
  analyzeResume,
  getAtsHistory,
  getAtsCheck,
  getUsageStats,
};
