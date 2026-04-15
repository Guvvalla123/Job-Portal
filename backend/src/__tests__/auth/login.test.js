const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createCandidate, createRecruiter, createAdmin, generateValidPassword } = require("../setup/factories/userFactory");

describe("POST /api/v1/auth/login", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should login with valid credentials and return accessToken and user without password", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `login-${Date.now()}@t.test`, password });
    const res = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(u.email);
    expect(res.body.data.user.password).toBeUndefined();
    const cookies = res.headers["set-cookie"] || [];
    expect(String(cookies)).toMatch(/jid_refresh=/);
    expect(String(cookies)).toMatch(/jid_csrf=/);
  });

  it("should work for recruiter role", async () => {
    const password = generateValidPassword();
    const u = await createRecruiter({ email: `rlog-${Date.now()}@t.test`, password });
    const res = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("recruiter");
  });

  it("should work for admin role when MFA is not enabled", async () => {
    const password = generateValidPassword();
    const u = await createAdmin({ email: `alog-${Date.now()}@t.test`, password, mfaEnabled: false });
    const res = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("should return 401 for wrong password", async () => {
    const u = await createCandidate({ email: `badpw-${Date.now()}@t.test` });
    const res = await request(app).post("/api/v1/auth/login").send({ email: u.email, password: "WrongPass1!" });
    expect(res.status).toBe(401);
  });

  it("should return 401 for non-existent email with same message as wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@example.com",
      password: generateValidPassword(),
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should return 403 for disabled account", async () => {
    const password = generateValidPassword();
    const u = await createCandidate({ email: `dis-${Date.now()}@t.test`, password, isActive: false });
    const res = await request(app).post("/api/v1/auth/login").send({ email: u.email, password });
    expect(res.status).toBe(403);
  });

  it("should return 422 for missing email", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ password: "x" });
    expect(res.status).toBe(422);
  });

  it("should return 422 for missing password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "a@b.com" });
    expect(res.status).toBe(422);
  });
});
