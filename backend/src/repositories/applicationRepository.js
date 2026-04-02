const mongoose = require("mongoose");
const { Application } = require("../models/Application");

const create = (data) => Application.create(data);

const findById = (id, populatePath = "") =>
  populatePath ? Application.findById(id).populate(populatePath) : Application.findById(id);

const findOne = (filter) => Application.findOne(filter);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CANDIDATE_LIST_FIELDS =
  "fullName email profileImageUrl phone skills experience headline location resumeFileName";

const candidateProject = Object.fromEntries(
  CANDIDATE_LIST_FIELDS.split(" ").filter(Boolean).map((f) => [f, 1])
);

const findByCandidate = (candidateId) =>
  Application.find({ candidate: candidateId })
    .populate({ path: "job", populate: { path: "company", select: "name logoUrl" } })
    .sort({ createdAt: -1 });

/**
 * @returns {{ applications: object[], total: number, page: number, limit: number, totalPages: number }}
 */
const findByCandidatePaginated = async (candidateId, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;
  const filter = { candidate: candidateId };
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({ path: "job", populate: { path: "company", select: "name logoUrl" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Application.countDocuments(filter),
  ]);
  return {
    applications,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
};

/**
 * Paginated applications for a job. Uses aggregation when `q` or `skill` filters are present.
 */
const findByJobPaginated = async (jobId, { status, page = 1, limit = 20, q, skill } = {}) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;
  const jid = new mongoose.Types.ObjectId(String(jobId));

  const hasTextFilters = Boolean(String(q || "").trim()) || Boolean(String(skill || "").trim());

  if (!hasTextFilters) {
    const filter = { job: jid };
    if (status) filter.status = status;
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("candidate", CANDIDATE_LIST_FIELDS)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Application.countDocuments(filter),
    ]);
    return {
      applications,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
    };
  }

  const pipeline = [
    { $match: { job: jid, ...(status ? { status } : {}) } },
    {
      $lookup: {
        from: "users",
        localField: "candidate",
        foreignField: "_id",
        as: "candidateArr",
        pipeline: [{ $project: candidateProject }],
      },
    },
    { $unwind: { path: "$candidateArr", preserveNullAndEmptyArrays: true } },
  ];

  if (String(q || "").trim()) {
    const needle = new RegExp(escapeRegex(String(q).trim()), "i");
    pipeline.push({
      $match: {
        $or: [{ "candidateArr.fullName": needle }, { "candidateArr.email": needle }],
      },
    });
  }
  if (String(skill || "").trim()) {
    const s = new RegExp(escapeRegex(String(skill).trim()), "i");
    pipeline.push({ $match: { "candidateArr.skills": { $elemMatch: { $regex: s } } } });
  }

  pipeline.push({ $sort: { updatedAt: -1 } });
  pipeline.push({
    $facet: {
      total: [{ $count: "n" }],
      data: [{ $skip: skip }, { $limit: safeLimit }],
    },
  });

  const [agg] = await Application.aggregate(pipeline);
  const total = agg?.total?.[0]?.n ?? 0;
  const slice = agg?.data ?? [];
  const applications = slice.map(({ candidateArr, ...rest }) => ({
    ...rest,
    candidate: candidateArr,
  }));

  return {
    applications,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
};

const countByJobs = (jobIds) => Application.countDocuments({ job: { $in: jobIds } });

const aggregateByStatus = (jobIds) =>
  Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

const updateById = (id, updates) => Application.findByIdAndUpdate(id, updates, { returnDocument: "after" });

const findUpcomingInterviewsForJobs = (jobIds, fromDate = new Date()) =>
  Application.find({
    job: { $in: jobIds },
    "interview.scheduledAt": { $gte: fromDate },
    "interview.status": "scheduled",
  })
    .populate("candidate", "fullName email")
    .populate("job", "title")
    .sort({ "interview.scheduledAt": 1 })
    .limit(50);

module.exports = {
  create,
  findById,
  findOne,
  findByCandidate,
  findByCandidatePaginated,
  findByJobPaginated,
  countByJobs,
  aggregateByStatus,
  updateById,
  findUpcomingInterviewsForJobs,
};
