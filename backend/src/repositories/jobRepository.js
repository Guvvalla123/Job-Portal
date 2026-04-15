const { Job } = require("../models/Job");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const create = (data) => Job.create(data);

const findById = (id) =>
  Job.findById(id).populate("company", "name logoUrl location description website");

const findByIdSelect = (id, select) => Job.findById(id).select(select);

const findByIdPopulatePostedBy = (id, postedBySelect) =>
  Job.findById(id).populate("postedBy", postedBySelect);

const findByIdPopulateCompanyName = (id) => Job.findById(id).populate("company", "name");

const findTitleLean = (id) => Job.findById(id).select("title").lean();

const findCreatedInWindowForDigest = (since, now) =>
  Job.find({
    createdAt: { $gte: since },
    isActive: { $ne: false },
    isDraft: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .populate("company", "name")
    .lean();

const findPostedBySelectLean = (userId, select) =>
  Job.find({ postedBy: userId }).select(select).lean();

const publicJobVisibilityFilter = () => {
  const now = new Date();
  return {
    isActive: true,
    isDraft: false,
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  };
};

const findActiveById = (id) =>
  Job.findOne({ _id: id, ...publicJobVisibilityFilter() }).populate(
    "company",
    "name logoUrl location description website"
  );

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  salary_high: { maxSalary: -1, createdAt: -1 },
  salary_low: { minSalary: 1, createdAt: -1 },
};

const findWithFilter = (filter, options = {}) => {
  const { page = 1, limit = 10, sortKey = "newest" } = options;
  const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
  const skip = (page - 1) * limit;
  return Job.find(filter)
    .populate("company", "name logoUrl location")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

const count = (filter) => Job.countDocuments(filter);

const findByPostedBy = (userId) =>
  Job.find({ postedBy: userId }).populate("company", "name").sort({ createdAt: -1 });

const findJobIdsByPostedBy = (userId) => Job.find({ postedBy: userId }).select("_id").lean();

const updateById = (id, updates) => Job.findByIdAndUpdate(id, updates, { returnDocument: "after" });

const buildListFilter = (query) => {
  const visibility = publicJobVisibilityFilter();
  const filter = { ...visibility };
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
  if (query.q) filter.$text = { $search: query.q };
  return filter;
};

module.exports = {
  create,
  findById,
  findByIdSelect,
  findByIdPopulatePostedBy,
  findByIdPopulateCompanyName,
  findTitleLean,
  findCreatedInWindowForDigest,
  findPostedBySelectLean,
  publicJobVisibilityFilter,
  findActiveById,
  findWithFilter,
  SORT_MAP,
  count,
  findByPostedBy,
  findJobIdsByPostedBy,
  updateById,
  buildListFilter,
};
