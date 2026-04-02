/**
 * Company API — all JSON responses use `success` / `created` from apiResponse (no raw res.json).
 */
const { Company } = require("../models/Company");
const { Job } = require("../models/Job");
const { cloudinary } = require("../config/cloudinary");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");
const jobRepository = require("../repositories/jobRepository");

const uploadLogoStream = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

async function assertCompanyOwner(companyId, userId) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found");
  if (!company.createdBy || company.createdBy.toString() !== userId) {
    throw new ApiError(403, "You do not own this company");
  }
  return company;
}

const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({
    name: req.body.name,
    website: req.body.website || "",
    location: req.body.location || "",
    description: req.body.description || "",
    createdBy: req.user.userId,
  });

  return created(res, { company }, "Company created");
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await assertCompanyOwner(req.params.id, req.user.userId);
  const { name, website, location, description } = req.body;
  if (name !== undefined) company.name = name;
  if (website !== undefined) company.website = website ?? "";
  if (location !== undefined) company.location = location ?? "";
  if (description !== undefined) company.description = description ?? "";
  await company.save();
  return success(res, { company }, "Company updated");
});

const deleteCompany = asyncHandler(async (req, res) => {
  const company = await assertCompanyOwner(req.params.id, req.user.userId);
  const activeJobs = await Job.countDocuments({ company: company._id, isActive: { $ne: false } });
  if (activeJobs > 0) {
    throw new ApiError(409, "Deactivate or delete jobs for this company before removing it");
  }
  await Company.findByIdAndDelete(company._id);
  return success(res, {}, "Company deleted");
});

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Image file is required");
  const company = await assertCompanyOwner(req.params.id, req.user.userId);
  const result = await uploadLogoStream(req.file.buffer, "job-portal/company-logos");
  company.logoUrl = result.secure_url;
  await company.save();
  return success(res, { company }, "Logo updated");
});

const listMyCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
  return success(res, { companies });
});

const listPublicCompanies = asyncHandler(async (req, res) => {
  const { q = "", page = "1", limit = "12" } = req.query;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 50);

  const filter = {};
  if (q?.trim()) {
    const esc = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const needle = new RegExp(esc, "i");
    filter.$or = [{ name: needle }, { location: needle }, { description: needle }];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("name logoUrl location website description createdAt"),
    Company.countDocuments(filter),
  ]);

  return success(
    res,
    {
      companies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
    "Companies loaded"
  );
});

const getPublicCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = await Company.findById(id).select("name logoUrl location website description createdAt");
  if (!company) throw new ApiError(404, "Company not found");

  const vis = jobRepository.publicJobVisibilityFilter();
  const jobs = await Job.find({ company: id, ...vis }).populate("company", "name logoUrl location").sort({ createdAt: -1 });

  return success(res, { company, jobs }, "Company loaded");
});

module.exports = {
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  listMyCompanies,
  listPublicCompanies,
  getPublicCompany,
};
