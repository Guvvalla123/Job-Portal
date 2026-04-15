const { User } = require("../models/User");

const findByEmail = (email) => User.findOne({ email });

const findById = (id, select = "") => User.findById(id).select(select);

const findByIdLean = (id, select = "") => User.findById(id).select(select).lean();

const findOne = (filter) => User.findOne(filter);

const create = (data) => User.create(data);

const updateById = (id, updates, options = {}) =>
  User.findByIdAndUpdate(id, updates, { returnDocument: "after", runValidators: true, ...options });

const findByIdAndDelete = (id) => User.findByIdAndDelete(id);

const findByIdForDataExportLean = (id) =>
  User.findById(id).select("-password -refreshToken -passwordResetToken -mfaTotpSecretEnc").lean();

module.exports = {
  findByEmail,
  findById,
  findByIdLean,
  findOne,
  create,
  updateById,
  findByIdAndDelete,
  findByIdForDataExportLean,
};
