/**
 * Readiness endpoint requires DB. In test we don't connect DB, so ready returns 503.
 * This test verifies the endpoint exists and returns proper structure.
 */
const request = require("supertest");
const { app } = require("../app");

describe("GET /api/ready", () => {
  it("returns 503 when DB not connected (test env)", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("message", "Service not ready");
  });
});
