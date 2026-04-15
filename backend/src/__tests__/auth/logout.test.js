const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createCandidate, generateValidPassword } = require("../setup/factories/userFactory");
const { User } = require("../../models/User");
const { isBlacklisted } = require("../../utils/tokenBlacklist");

describe("POST /api/v1/auth/logout", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should return 204 and clear refresh cookie on valid logout", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `out-${Date.now()}@t.test`, password });
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    const token = login.body.data.accessToken;
    const res = await request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(204);
    const cleared = String(res.headers["set-cookie"] || "");
    expect(cleared).toMatch(/jid_refresh=/);
  });

  it("should clear refreshToken in MongoDB for user", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `outdb-${Date.now()}@t.test`, password });
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    const token = login.body.data.accessToken;
    await request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`).send({});
    const dbu = await User.findById(u._id).select("+refreshToken");
    expect(dbu.refreshToken).toBeFalsy();
  });

  it("should blacklist access token jti when Bearer present", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `bl-${Date.now()}@t.test`, password });
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    const token = login.body.data.accessToken;
    const jwt = require("jsonwebtoken");
    const payload = jwt.decode(token);
    expect(payload.jti).toBeTruthy();
    await request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`).send({});
    const revoked = await isBlacklisted(payload.jti);
    expect(revoked).toBe(true);
  });

  it("should return 204 when Bearer is invalid but agent still has refresh cookie", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `orph-${Date.now()}@t.test`, password });
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/login").send({ email: u.email, password });
    const res = await agent.post("/api/v1/auth/logout").set("Authorization", "Bearer not.a.valid.jwt").send({});
    expect(res.status).toBe(204);
  });
});