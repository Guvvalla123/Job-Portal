const { User } = require("../models/User");

const findByEmail = (email) => User.findOne({ email });

const findById = (id, select = "") => User.findById(id).select(select);

const findOne = (filter) => User.findOne(filter);

const create = (data) => User.create(data);

const updateById = (id, updates, options = {}) =>
  User.findByIdAndUpdate(id, updates, { returnDocument: "after", runValidators: true, ...options });

const findByIdAndDelete = (id) => User.findByIdAndDelete(id);

module.exports = {
  findByEmail,
  findById,
  findOne,
  create,
  updateById,
  findByIdAndDelete,
};
