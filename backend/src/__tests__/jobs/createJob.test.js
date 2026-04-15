const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter, createCandidate } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");
const { loginAs, withCsrf } = require("../setup/authAgent");
const { generateValidPassword } = require("../setup/factories/userFactory");

const jobPayload = (companyId) => ({
  title: "New Backend Role",
  description: "Long enough description for validation rules to pass here.",
  location: "Remote",
  employmentType: "full-time",
  experienceLevel: "senior",
  minSalary: 100000,
  maxSalary: 150000,
  skills: ["node"],
  companyId: String(companyId),
});

describe("POST /api/v1/jobs", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should create job as recruiter and return 201", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `cj-${Date.now()}@t.test`, password });
    const c = await createCompany(r._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const res = await withCsrf(agent.post("/api/v1/jobs"), accessToken, csrfToken).send(jobPayload(c._id));
    expect(res.status).toBe(201);
    expect(res.body.data.job.title).toBe("New Backend Role");
  });

  it("should create draft when isDraft true", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `dr-${Date.now()}@t.test`, password });
    const c = await createCompany(r._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const body = { ...jobPayload(c._id), isDraft: true };
    const res = await withCsrf(agent.post("/api/v1/jobs"), accessToken, csrfToken).send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.job.isDraft).toBe(true);
  });

  it("should return 401 when not authenticated", async () => {
    const r = await createRecruiter();
    const c = await createCompany(r._id);
    const res = await request(app).post("/api/v1/jobs").send(jobPayload(c._id));
    expect(res.status).toBe(401);
  });

  it("should return 403 when candidate tries to create", async () => {
    const password = generateValidPassword();
    const cand = await createCandidate({ email: `candj-${Date.now()}@t.test`, password });
    const r = await createRecruiter();
    const c = await createCompany(r._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, cand.email, password);
    const res = await withCsrf(agent.post("/api/v1/jobs"), accessToken, csrfToken).send(jobPayload(c._id));
    expect(res.status).toBe(403);
  });

  it("should return 422 when title missing", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `val-${Date.now()}@t.test`, password });
    const c = await createCompany(r._id);
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const b = jobPayload(c._id);
    delete b.title;
    const res = await withCsrf(agent.post("/api/v1/jobs"), accessToken, csrfToken).send(b);
    expect(res.status).toBe(422);
  });
});
