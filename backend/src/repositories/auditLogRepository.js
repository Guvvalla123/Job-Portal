const { AuditLog } = require("../models/AuditLog");

const create = (doc) => AuditLog.create(doc);

module.exports = {
  create,
};
