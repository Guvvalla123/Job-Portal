const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createCandidate, generateValidPassword } = require("../setup/factories/userFactory");
const { User } = require("../../models/User");

describe("POST /api/v1/auth/refresh", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should return new accessToken when refresh cookie is valid", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `ref-${Date.now()}@t.test`, password });
    const agent = request.agent(app);
    const login = await agent.post("/api/v1/auth/login").send({ email: u.email, password });
    expect(login.status).toBe(200);
    const refresh = await agent.post("/api/v1/auth/refresh").send({});
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeTruthy();
    expect(refresh.body.data.csrfToken).toBeTruthy();
  });

  /**
   * Rotation is enforced in authService.refreshTokens (new refresh JWT + new SHA-256 in DB).
   * Asserting the stored hash in tests is brittle with supertest cookie jars; instead verify
   * the user-visible session contract: new access token, new Set-Cookie, Bearer works.
   */
  it("should issue new session on refresh (access token, cookie, and /auth/me)", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `rot-${Date.now()}@t.test`, password });
    const agent = request.agent(app);
    const loginRes = await agent.post("/api/v1/auth/login").send({ email: u.email, password });
    expect(loginRes.status).toBe(200);
    const firstAccess = loginRes.body.data.accessToken;
    const refreshRes = await agent.post("/api/v1/auth/refresh").send({});
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
    expect(refreshRes.body.data.csrfToken).toBeTruthy();
    expect(refreshRes.body.data.accessToken).not.toBe(firstAccess);
    const setCookie = refreshRes.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
    expect(String(Array.isArray(setCookie) ? setCookie.join(";") : setCookie)).toMatch(/jid_refresh=/);
    const me = await agent
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${refreshRes.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(u.email);
  });

  it("should return 401 when refresh cookie is missing", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});
    expect(res.status).toBe(401);
  });

  /**
   * Reuse: authService.refreshTokens() stores hash(newRefreshJwt); re-presenting the pre-rotation
   * JWT fails hash match → 401 "Refresh token reused - session revoked".
   */
  it("should return 401 when same refresh JWT is sent again after rotation (reuse detection)", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `reuse-${Date.now()}@t.test`, password });
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    expect(login.status).toBe(200);
    const raw = Array.isArray(login.headers["set-cookie"]) ? login.headers["set-cookie"].join(";") : String(login.headers["set-cookie"] || "");
    const m = raw.match(/jid_refresh=([^;]+)/);
    expect(m).toBeTruthy();
    const oldRefresh = decodeURIComponent(m[1]);
    const cookieHeader = `jid_refresh=${encodeURIComponent(oldRefresh)}`;
    const first = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookieHeader).send({});
    expect(first.status).toBe(200);
    const again = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookieHeader).send({});
    expect(again.status).toBe(401);
  });

  it("should return 403 when user is disabled after login", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `disref-${Date.now()}@t.test`, password });
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    const raw = Array.isArray(login.headers["set-cookie"]) ? login.headers["set-cookie"].join(";") : "";
    const m = raw.match(/jid_refresh=([^;]+)/);
    const cookie = decodeURIComponent(m[1]);
    await User.updateOne({ _id: u._id }, { $set: { isActive: false } });
    const ref = await request(app).post("/api/v1/auth/refresh").set("Cookie", `jid_refresh=${cookie}`).send({});
    expect(ref.status).toBe(403);
  });
});
