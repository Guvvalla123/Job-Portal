const { Job } = require("../models/Job");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const create = (data) => Job.create(data);

const findById = (id) =>
  Job.findById(id).populate("company", "name logoUrl location description website");

const findActiveById = (id) =>
  Job.findOne({ _id: id, isActive: true }).populate("company", "name logoUrl location description website");

const findWithFilter = (filter, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
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
  const filter = { isActive: true };
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
  if (query.q) filter.$text = { $search: query.q };
  return filter;
};

module.exports = {
  create,
  findById,
  findActiveById,
  findWithFilter,
  count,
  findByPostedBy,
  findJobIdsByPostedBy,
  updateById,
  buildListFilter,
};
