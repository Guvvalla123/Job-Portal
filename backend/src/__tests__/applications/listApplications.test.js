const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter, createCandidate } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");
const { createJob } = require("../setup/factories/jobFactory");
const { createApplication } = require("../setup/factories/applicationFactory");
const { loginAs } = require("../setup/authAgent");
const { generateValidPassword } = require("../setup/factories/userFactory");

describe("GET /api/v1/applications/me", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should list applications for authenticated candidate", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter();
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const cand = await createCandidate({ email: `lst-${Date.now()}@t.test`, password });
    await createApplication(job._id, cand._id);
    const { accessToken } = await loginAs(app, cand.email, password);
    const res = await request(app).get("/api/v1/applications/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.applications)).toBe(true);
    expect(res.body.data.applications.length).toBeGreaterThanOrEqual(1);
  });
});
