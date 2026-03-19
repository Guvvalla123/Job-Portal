const { Company } = require("../models/Company");
const { Job } = require("../models/Job");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({
    name: req.body.name,
    website: req.body.website || "",
    location: req.body.location || "",
    description: req.body.description || "",
    createdBy: req.user.userId,
  });

  return res.status(201).json({
    success: true,
    message: "Company created",
    data: { company },
  });
});

const listMyCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: { companies },
  });
});

const listPublicCompanies = asyncHandler(async (req, res) => {
  const { q = "", page = "1", limit = "12" } = req.query;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 50);

  const filter = {};
  if (q?.trim()) {
    filter.$or = [
      { name: new RegExp(q.trim(), "i") },
      { location: new RegExp(q.trim(), "i") },
      { description: new RegExp(q.trim(), "i") },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("name logoUrl location website description createdAt"),
    Company.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      companies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

const getPublicCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = await Company.findById(id).select("name logoUrl location website description createdAt");
  if (!company) throw new ApiError(404, "Company not found");

  const jobs = await Job.find({ company: id, isActive: true })
    .populate("company", "name logoUrl location")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: { company, jobs },
  });
});

module.exports = { createCompany, listMyCompanies, listPublicCompanies, getPublicCompany };
