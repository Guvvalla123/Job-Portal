const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter, createCandidate } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");
const { createJob, createDraftJob } = require("../setup/factories/jobFactory");
const { loginAs, withCsrf } = require("../setup/authAgent");
const { generateValidPassword } = require("../setup/factories/userFactory");
const { Notification } = require("../../models/Notification");

describe("POST /api/v1/applications", () => {
  let addEmailJobSpy;

  beforeAll(async () => {
    await testDb.connect();
    addEmailJobSpy = jest.spyOn(require("../../queues/emailQueue"), "addEmailJob").mockResolvedValue(undefined);
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    if (addEmailJobSpy?.mockRestore) addEmailJobSpy.mockRestore();
    await testDb.disconnect();
  });
  it("should create application as candidate and return 201", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter();
    const c = await createCompany(r._id);
    const job = await createJob(r._id, c._id);
    const cand = await createCandidate({ email: `ap-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, cand.email, password);
    const res = await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({
      jobId: String(job._id),
      coverLetter: "Hi",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.application).toBeTruthy();
  });

  it("should return 409 when candidate applies twice", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter();
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const cand = await createCandidate({ email: `twice-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, cand.email, password);
    const first = await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({
      jobId: String(job._id),
    });
    expect(first.status).toBe(201);
    const second = await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({
      jobId: String(job._id),
    });
    expect(second.status).toBe(409);
  });

  it("should return 404 when job is draft", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter();
    const co = await createCompany(r._id);
    const job = await createDraftJob(r._id, co._id);
    const cand = await createCandidate({ email: `drf-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, cand.email, password);
    const res = await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({
      jobId: String(job._id),
    });
    expect(res.status).toBe(404);
  });

  it("should return 403 when recruiter tries to apply", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `rapp-${Date.now()}@t.test`, password });
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const res = await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({
      jobId: String(job._id),
    });
    expect(res.status).toBe(403);
  });

  it("should persist notification for recruiter when application created", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter();
    const co = await createCompany(r._id);
    const job = await createJob(r._id, co._id);
    const cand = await createCandidate({ email: `notif-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, cand.email, password);
    await withCsrf(agent.post("/api/v1/applications"), accessToken, csrfToken).send({ jobId: String(job._id) });
    const n = await Notification.findOne({ user: r._id, type: "APPLICATION_RECEIVED" });
    expect(n).toBeTruthy();
  });
});
