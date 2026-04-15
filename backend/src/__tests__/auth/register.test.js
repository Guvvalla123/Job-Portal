/**
 * Registration API — mongodb-memory-server (isolated worker).
 * Complements auth.test.js validation-only cases; full success paths need DB.
 */
const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { User } = require("../../models/User");
const { createCandidate } = require("../setup/factories/userFactory");
const { generateValidPassword } = require("../setup/factories/userFactory");

describe("POST /api/v1/auth/register", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should register candidate with valid data and return 201 with user and accessToken", async () => {
    const email = `reg-${Date.now()}@example.com`;
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Reg User",
      email,
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email.toLowerCase());
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.csrfToken).toBeTruthy();
  });

  it("should register recruiter with valid data", async () => {
    const email = `rec-${Date.now()}@example.com`;
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Rec User",
      email,
      password: generateValidPassword(),
      role: "recruiter",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("recruiter");
  });

  it("should set httpOnly jid_refresh cookie and jid_csrf cookie on success", async () => {
    const email = `cookie-${Date.now()}@example.com`;
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Cookie User",
      email,
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(201);
    const setCookie = res.headers["set-cookie"] || [];
    const joined = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie);
    expect(joined).toMatch(/jid_refresh=/);
    expect(joined).toMatch(/jid_csrf=/);
  });

  it("should hash password in storage (not store plain text)", async () => {
    const email = `hash-${Date.now()}@example.com`;
    const plain = generateValidPassword();
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Hash User",
      email,
      password: plain,
      role: "candidate",
    });
    const u = await User.findOne({ email: email.toLowerCase() }).select("+password");
    expect(u.password).not.toBe(plain);
    expect(u.password.length).toBeGreaterThan(20);
  });

  it("should return 409 when email already exists", async () => {
    const email = `dup-${Date.now()}@example.com`;
    await createCandidate({ email });
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Dup",
      email,
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(409);
  });

  it("should return 422 when password is too weak (short)", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test",
      email: "weak@example.com",
      password: "123",
      role: "candidate",
    });
    expect(res.status).toBe(422);
  });

  it("should return 422 when email is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test",
      email: "not-an-email",
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(422);
  });

  it("should return 422 when fullName is missing", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "noname@example.com",
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(422);
  });

  it("should return 422 when role is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Bad Role",
      email: `badrole-${Date.now()}@example.com`,
      password: generateValidPassword(),
      role: "admin",
    });
    expect(res.status).toBe(422);
  });

  it("should not return password or refreshToken in JSON body", async () => {
    const email = `safe-${Date.now()}@example.com`;
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Safe",
      email,
      password: generateValidPassword(),
      role: "candidate",
    });
    expect(res.status).toBe(201);
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/"password"\s*:\s*"SecurePass/);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshToken).toBeUndefined();
  });
});
