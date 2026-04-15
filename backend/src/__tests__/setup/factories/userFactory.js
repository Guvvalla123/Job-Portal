const { User } = require("../../../models/User");
const { ROLES } = require("../../../constants/roles");

const DEFAULT_PASSWORD = "SecurePass1!";

function generateValidPassword() {
  return DEFAULT_PASSWORD;
}

function email(prefix = "user") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.jobportal`;
}

async function createCandidate(overrides = {}) {
  return User.create({
    fullName: "Test Candidate",
    email: email("candidate"),
    password: DEFAULT_PASSWORD,
    role: ROLES.CANDIDATE,
    isActive: true,
    ...overrides,
  });
}

async function createRecruiter(overrides = {}) {
  return User.create({
    fullName: "Test Recruiter",
    email: email("recruiter"),
    password: DEFAULT_PASSWORD,
    role: ROLES.RECRUITER,
    isActive: true,
    ...overrides,
  });
}

async function createAdmin(overrides = {}) {
  return User.create({
    fullName: "Test Admin",
    email: email("admin"),
    password: DEFAULT_PASSWORD,
    role: ROLES.ADMIN,
    isActive: true,
    mfaEnabled: false,
    ...overrides,
  });
}

module.exports = {
  createCandidate,
  createRecruiter,
  createAdmin,
  generateValidPassword,
  DEFAULT_PASSWORD,
  email,
};
