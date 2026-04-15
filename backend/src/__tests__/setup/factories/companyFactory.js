const { Company } = require("../../../models/Company");

async function createCompany(recruiterId, overrides = {}) {
  return Company.create({
    name: `Co-${Date.now()}`,
    website: "https://example.com",
    location: "Remote",
    description: "Test company",
    createdBy: recruiterId,
    ...overrides,
  });
}

module.exports = { createCompany };
