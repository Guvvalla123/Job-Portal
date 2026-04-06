const request = require("supertest");
const { app } = require("../app");

describe("POST /api/v1/auth/register", () => {
  it("returns 422 for invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ fullName: "Test", email: "invalid", password: "password123", role: "candidate" });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("returns 422 for short password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ fullName: "Test", email: "test@example.com", password: "123", role: "candidate" });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
