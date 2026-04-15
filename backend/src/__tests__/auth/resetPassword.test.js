const crypto = require("crypto");
const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createCandidate, generateValidPassword } = require("../setup/factories/userFactory");
const { User } = require("../../models/User");

describe("POST /api/v1/auth/reset-password/:token", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should reset password with valid token", async () => {
    const u = await createCandidate({ email: `rs-${Date.now()}@t.test` });
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(plainToken).digest("hex");
    await User.updateOne(
      { _id: u._id },
      { $set: { passwordResetToken: hashed, passwordResetExpires: Date.now() + 3600000 } }
    );
    const newPass = "NewSecurePass2!";
    const res = await request(app).post(`/api/v1/auth/reset-password/${plainToken}`).send({ password: newPass });
    expect(res.status).toBe(200);
    const login = await request(app).post("/api/v1/auth/login").send({ email: u.email, password: newPass });
    expect(login.status).toBe(200);
  });

  it("should return 400 for invalid token", async () => {
    const res = await request(app).post("/api/v1/auth/reset-password/badtoken").send({ password: generateValidPassword() });
    expect(res.status).toBe(400);
  });
});
