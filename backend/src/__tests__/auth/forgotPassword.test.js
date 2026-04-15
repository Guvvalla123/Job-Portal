jest.mock("../../queues/emailQueue", () => ({
  queueEmail: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const { app } = require("../setup/testApp");
const testDb = require("../setup/testDb");
const { createCandidate } = require("../setup/factories/userFactory");
const { queueEmail } = require("../../queues/emailQueue");

describe("POST /api/v1/auth/forgot-password", () => {
  beforeAll(async () => {
    await testDb.connect();
  });
  afterEach(async () => {
    await testDb.clearDb();
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await testDb.disconnect();
  });

  it("should return 200 generic message when user exists and queue email", async () => {
    const u = await createCandidate({ email: `fp-${Date.now()}@t.test` });
    const res = await request(app).post("/api/v1/auth/forgot-password").send({ email: u.email });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/account exists/i);
    expect(queueEmail).toHaveBeenCalled();
  });

  it("should return 200 generic message when user does not exist (no enumeration)", async () => {
    const res = await request(app).post("/api/v1/auth/forgot-password").send({ email: "missing@example.com" });
    expect(res.status).toBe(200);
    expect(queueEmail).not.toHaveBeenCalled();
  });

  it("should return 422 for invalid email", async () => {
    const res = await request(app).post("/api/v1/auth/forgot-password").send({ email: "bad" });
    expect(res.status).toBe(422);
  });
});
