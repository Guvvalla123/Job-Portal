/**
 * Integration test: Health check endpoint
 * Run: npm test
 */
const request = require("supertest");
const { app } = require("../app");

describe("GET /api/health", () => {
  it("returns 200 and success message", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "API is healthy");
    expect(res.body).toHaveProperty("uptimeSeconds");
  });
});
