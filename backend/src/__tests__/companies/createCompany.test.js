const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter, createCandidate } = require("../setup/factories/userFactory");
const { loginAs, withCsrf } = require("../setup/authAgent");
const { generateValidPassword } = require("../setup/factories/userFactory");

describe("POST /api/v1/companies", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should create company as recruiter", async () => {
    const password = generateValidPassword();
    const r = await createRecruiter({ email: `co-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, r.email, password);
    const res = await withCsrf(agent.post("/api/v1/companies"), accessToken, csrfToken).send({
      name: "Acme Corp",
      website: "https://acme.test",
      location: "NYC",
      description: "We hire great people.",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.company.name).toBe("Acme Corp");
  });

  it("should return 403 when candidate creates company", async () => {
    const password = generateValidPassword();
    const c = await createCandidate({ email: `cnc-${Date.now()}@t.test`, password });
    const { agent, accessToken, csrfToken } = await loginAs(app, c.email, password);
    const res = await withCsrf(agent.post("/api/v1/companies"), accessToken, csrfToken).send({
      name: "X",
      website: "",
      location: "Y",
      description: "Z",
    });
    expect(res.status).toBe(403);
  });
});
