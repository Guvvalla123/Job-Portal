/**
 * Readiness reflects mongoose connection state. Other test files may connect Mongo in the same Jest worker.
 */
const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../app");

describe("GET /api/ready", () => {
  it("returns 503 when DB disconnected, 200 when connected", async () => {
    const res = await request(app).get("/api/ready");
    const connected = mongoose.connection.readyState === 1;
    expect(res.status).toBe(connected ? 200 : 503);
    expect(res.body).toHaveProperty("success", connected);
    expect(res.body).toHaveProperty("db");
  });
});
