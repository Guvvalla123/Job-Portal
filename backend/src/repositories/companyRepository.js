const { Company } = require("../models/Company");

const findById = (id) => Company.findById(id);

const findCreatedBySelect = (userId, select) =>
  Company.find({ createdBy: userId }).select(select).lean();

module.exports = {
  findById,
  findCreatedBySelect,
};
