/**
 * Seeds fixed E2E users + one public job (idempotent). Run from repo: `node backend/scripts/e2e-seed.js`
 * Requires MONGODB_URI and backend env (use same .env as API).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env"), quiet: true });

const mongoose = require("mongoose");
const { User } = require("../src/models/User");
const { Company } = require("../src/models/Company");
const { Job } = require("../src/models/Job");
const { Application } = require("../src/models/Application");
const { ROLES } = require("../src/constants/roles");

const PASSWORD = "SecurePass1!";
const CANDIDATE_EMAIL = "e2e-candidate@jobportal.test";
const RECRUITER_EMAIL = "e2e-recruiter@jobportal.test";
const JOB_TITLE = "E2E Apply Target Job";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }
  await mongoose.connect(uri);

  let recruiter = await User.findOne({ email: RECRUITER_EMAIL });
  if (!recruiter) {
    recruiter = await User.create({
      fullName: "E2E Recruiter",
      email: RECRUITER_EMAIL,
      password: PASSWORD,
      role: ROLES.RECRUITER,
    });
  }

  let candidate = await User.findOne({ email: CANDIDATE_EMAIL });
  if (!candidate) {
    candidate = await User.create({
      fullName: "E2E Candidate",
      email: CANDIDATE_EMAIL,
      password: PASSWORD,
      role: ROLES.CANDIDATE,
    });
  }

  await User.updateOne(
    { _id: candidate._id },
    {
      $set: {
        resumeUrl: "https://example.com/e2e-resume-placeholder.pdf",
        resumeFileName: "e2e-resume.pdf",
        resumePublicId: "e2e_public_id",
        resumeSize: 1024,
      },
    }
  );

  let company = await Company.findOne({ createdBy: recruiter._id, name: "E2E Test Company" });
  if (!company) {
    company = await Company.create({
      name: "E2E Test Company",
      website: "https://example.com",
      location: "Remote",
      description: "Seeded company for Playwright.",
      createdBy: recruiter._id,
    });
  }

  let job = await Job.findOne({ postedBy: recruiter._id, title: JOB_TITLE });
  if (!job) {
    job = await Job.create({
      title: JOB_TITLE,
      description:
        "Automated test job listing. This description is long enough for validation. " + "x".repeat(40),
      location: "Remote",
      employmentType: "full-time",
      experienceLevel: "junior",
      minSalary: 50000,
      maxSalary: 90000,
      skills: ["e2e"],
      company: company._id,
      postedBy: recruiter._id,
      isActive: true,
      isDraft: false,
    });
  }

  await Application.deleteMany({ job: job._id, candidate: candidate._id });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      ok: true,
      candidateEmail: CANDIDATE_EMAIL,
      password: PASSWORD,
      jobId: String(job._id),
      jobTitle: JOB_TITLE,
    })
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
