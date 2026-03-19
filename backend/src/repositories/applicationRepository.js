const { Application } = require("../models/Application");

const create = (data) => Application.create(data);

const findById = (id, populatePath = "") =>
  populatePath ? Application.findById(id).populate(populatePath) : Application.findById(id);

const findOne = (filter) => Application.findOne(filter);

const findByCandidate = (candidateId) =>
  Application.find({ candidate: candidateId })
    .populate({ path: "job", populate: { path: "company", select: "name logoUrl" } })
    .sort({ createdAt: -1 });

const findByJob = (jobId) =>
  Application.find({ job: jobId })
    .populate("candidate", "fullName email profileImageUrl resumeUrl resumeFileName")
    .sort({ createdAt: -1 });

const countByJobs = (jobIds) => Application.countDocuments({ job: { $in: jobIds } });

const aggregateByStatus = (jobIds) =>
  Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

const updateById = (id, updates) => Application.findByIdAndUpdate(id, updates, { returnDocument: "after" });

module.exports = {
  create,
  findById,
  findOne,
  findByCandidate,
  findByJob,
  countByJobs,
  aggregateByStatus,
  updateById,
};
