/**
 * Apply + Idempotency-Key + unique index (MongoDB). Requires Mongo + CSRF_ENFORCE_IN_TEST in CI.
 */
const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../app");
const { Application } = require("../models/Application");

const PASSWORD = "SecurePass1!";
const emailFor = (label) => `idem-${label}-${Date.now()}@example.com`;

describe("Application idempotency (integration)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  async function registerRecruiterWithCompanyAndJob(agent) {
    const email = emailFor("rec");
    const reg = await agent.post("/api/v1/auth/register").send({
      fullName: "Recruiter Idem",
      email,
      password: PASSWORD,
      role: "recruiter",
    });
    expect(reg.status).toBe(201);
    const { accessToken, csrfToken } = reg.body.data;

    const co = await agent
      .post("/api/v1/companies")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ name: `Co ${Date.now()}`, website: "https://example.com" });
    expect(co.status).toBe(201);
    const companyId = co.body.data?.company?.id || co.body.data?.company?._id;

    const jobBody = {
      title: "Integration Idempotency Role",
      description: "Twenty chars minimum job description for apply integration tests here.",
      location: "Remote",
      employmentType: "full-time",
      experienceLevel: "mid",
      minSalary: 50_000,
      maxSalary: 90_000,
      skills: ["node"],
      companyId,
      isDraft: false,
    };
    const jobRes = await agent
      .post("/api/v1/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send(jobBody);
    expect(jobRes.status).toBe(201);
    const jobId = jobRes.body.data?.job?.id || jobRes.body.data?.job?._id;
    expect(jobId).toBeTruthy();
    return { jobId: String(jobId) };
  }

  async function registerCandidate(agent) {
    const email = emailFor("cand");
    const reg = await agent.post("/api/v1/auth/register").send({
      fullName: "Candidate Idem",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    expect(reg.status).toBe(201);
    return {
      accessToken: reg.body.data.accessToken,
      csrfToken: reg.body.data.csrfToken,
    };
  }

  it("same Idempotency-Key twice returns one persisted application (sequential)", async () => {
    if (process.env.CSRF_ENFORCE_IN_TEST !== "true") {
      return;
    }
    const recAgent = request.agent(app);
    const { jobId } = await registerRecruiterWithCompanyAndJob(recAgent);

    const candAgent = request.agent(app);
    const { accessToken, csrfToken } = await registerCandidate(candAgent);

    const idemKey = `idem-seq-${Date.now()}`;
    const body = { jobId, coverLetter: "hello" };

    const first = await candAgent
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-CSRF-Token", csrfToken)
      .set("Idempotency-Key", idemKey)
      .send(body);
    expect(first.status).toBe(201);
    const appId = first.body.data?.application?.id || first.body.data?.application?._id;
    expect(appId).toBeTruthy();

    const second = await candAgent
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-CSRF-Token", csrfToken)
      .set("Idempotency-Key", idemKey)
      .send(body);
    expect(second.status).toBe(201);
    expect(second.body.data?.application?.id || second.body.data?.application?._id).toBe(appId);

    const count = await Application.countDocuments({ job: jobId });
    expect(count).toBe(1);
  });

  it("parallel duplicate apply: at most one application; 409 DUPLICATE_KEY or idempotent replay", async () => {
    if (process.env.CSRF_ENFORCE_IN_TEST !== "true") {
      return;
    }
    const recAgent = request.agent(app);
    const { jobId } = await registerRecruiterWithCompanyAndJob(recAgent);

    const candAgent = request.agent(app);
    const { accessToken, csrfToken } = await registerCandidate(candAgent);

    const idemKey = `idem-par-${Date.now()}`;
    const body = { jobId, coverLetter: "parallel" };

    const [a, b] = await Promise.all([
      candAgent
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", idemKey)
        .send(body),
      candAgent
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", idemKey)
        .send(body),
    ]);

    expect([a.status, b.status].every((s) => [201, 409].includes(s))).toBe(true);
    expect(a.status === 201 || b.status === 201).toBe(true);

    const count = await Application.countDocuments({ job: jobId });
    expect(count).toBe(1);
  });
});
