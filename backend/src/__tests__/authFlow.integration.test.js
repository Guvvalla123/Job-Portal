/**
 * Integration flows against real MongoDB (CI service). Requires CSRF_ENFORCE_IN_TEST=true in CI.
 */
const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../app");

const PASSWORD = "SecurePass1!";
const emailFor = (label) => `integration-${label}-${Date.now()}@example.com`;

describe("Auth & RBAC integration", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterEach(async () => {
    const { User } = require("../models/User");
    await User.deleteMany({ email: /@example\.com$/ });
  });

  it("register → GET /auth/me with access token", async () => {
    const email = emailFor("me");
    const reg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Integration User",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    expect(reg.status).toBe(201);
    const { accessToken } = reg.body.data;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data?.user?.email).toBe(email.toLowerCase());
    expect(me.body.data?.user?.id || me.body.data?.user?._id).toBeTruthy();
  });

  it("login with cookie → POST /auth/refresh returns new access token", async () => {
    const email = emailFor("refresh");
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Refresh User",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    const agent = request.agent(app);
    const login = await agent.post("/api/v1/auth/login").send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
    const refresh = await agent.post("/api/v1/auth/refresh").send({});
    expect(refresh.status).toBe(200);
    expect(refresh.body.data?.accessToken).toBeTruthy();
  });

  it("PATCH /users/profile without CSRF returns 403 when CSRF_ENFORCE_IN_TEST=true", async () => {
    if (process.env.CSRF_ENFORCE_IN_TEST !== "true") {
      return;
    }
    const email = emailFor("csrf");
    const reg = await request(app).post("/api/v1/auth/register").send({
      fullName: "CSRF User",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    expect(reg.status).toBe(201);
    const { accessToken } = reg.body.data;
    const res = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ headline: "should fail" });
    expect(res.status).toBe(403);
    expect(res.body.code || res.body.message).toBeTruthy();
  });

  it("PATCH /users/profile succeeds with X-CSRF-Token when CSRF enforced", async () => {
    if (process.env.CSRF_ENFORCE_IN_TEST !== "true") {
      return;
    }
    const email = emailFor("csrfok");
    const agent = request.agent(app);
    const reg = await agent.post("/api/v1/auth/register").send({
      fullName: "CSRF OK",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    expect(reg.status).toBe(201);
    const { accessToken, csrfToken } = reg.body.data;
    const patch = await agent
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ headline: "integration headline" });
    expect(patch.status).toBe(200);
  });

  it("candidate receives 403 on GET /api/v1/admin/stats", async () => {
    const email = emailFor("admin");
    const reg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Cand",
      email,
      password: PASSWORD,
      role: "candidate",
    });
    expect(reg.status).toBe(201);
    const { accessToken } = reg.body.data;
    const res = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});
