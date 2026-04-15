const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter, createCandidate } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");
const { createJob } = require("../setup/factories/jobFactory");
const { createApplication } = require("../setup/factories/applicationFactory");
const { loginAs, withCsrf } = require("../setup/authAgent");
const { generateValidPassword } = require("../setup/factories/userFactory");

describe("PATCH /api/v1/applications/:id/status", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should update status when recruiter owns the job", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `st-${Date.now()}@t.test`, password });
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const cand = await createCandidate();
    const appDoc = await createApplication(job._id, cand._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const res = await withCsrf(agent.patch(`/api/v1/applications/${appDoc._id}/status`), accessToken, csrfToken).send({
      status: "screening",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe("screening");
  });

  it("should return 403 when another recruiter tries to update", async () => {
    const pw1 = generateValidPassword();
    const pw2 = generateValidPassword();
    const r1 = await createRecruiter({ email: `o1-${Date.now()}@t.test`, password: pw1 });
    const r2 = await createRecruiter({ email: `o2-${Date.now()}@t.test`, password: pw2 });
    const co = await createCompany(r1._id);
    const job = await createJob(r1._id, co._id);
    const cand = await createCandidate();
    const appDoc = await createApplication(job._id, cand._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r2.email, pw2);
    const res = await withCsrf(agent.patch(`/api/v1/applications/${appDoc._id}/status`), accessToken, csrfToken).send({
      status: "interview",
    });
    expect(res.status).toBe(403);
  });

  it("should return 422 for invalid status", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `inv-${Date.now()}@t.test`, password });
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const cand = await createCandidate();
    const appDoc = await createApplication(job._id, cand._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const res = await withCsrf(agent.patch(`/api/v1/applications/${appDoc._id}/status`), accessToken, csrfToken).send({
      status: "not-a-real-status",
    });
    expect(res.status).toBe(422);
  });
});
