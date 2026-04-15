const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createRecruiter } = require("../setup/factories/userFactory");
const { createCompany } = require("../setup/factories/companyFactory");

describe("GET /api/v1/companies", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should return public company list", async () => {
    const r = await createRecruiter();
    await createCompany(r._id, { name: "Listed Co" });
    const res = await request(app).get("/api/v1/companies");
    expect(res.status).toBe(200);
    const names = (res.body.data.companies || []).map((c) => c.name);
    expect(names).toContain("Listed Co");
  });
});
