const { JobAlert } = require("../models/JobAlert");

const findWithUserPaginated = (filter, skip, limit) =>
  JobAlert.find(filter).populate("user", "email fullName").skip(skip).limit(limit).lean();

const updateLastSentAt = (id, date = new Date()) =>
  JobAlert.updateOne({ _id: id }, { $set: { lastSentAt: date } });

const findByUserLean = (userId) => JobAlert.find({ user: userId }).lean();

module.exports = {
  findWithUserPaginated,
  updateLastSentAt,
  findByUserLean,
};
