const { Application } = require("../../../models/Application");

async function createApplication(jobId, candidateId, overrides = {}) {
  return Application.create({
    job: jobId,
    candidate: candidateId,
    coverLetter: "",
    status: "applied",
    ...overrides,
  });
}

module.exports = { createApplication };
