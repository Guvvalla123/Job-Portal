/**
 * CORS preflight must allow custom headers used by the SPA (cross-origin API).
 */
const request = require("supertest");
const { app } = require("../app");

describe("CORS preflight (integration)", () => {
  it("OPTIONS allows Idempotency-Key for POST /api/v1/applications from CLIENT_URL origin", async () => {
    const origin = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    const res = await request(app)
      .options("/api/v1/applications")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type, x-csrf-token, idempotency-key");

    expect([200, 204]).toContain(res.status);
    const allowHeaders = (res.headers["access-control-allow-headers"] || "").toLowerCase();
    expect(allowHeaders).toContain("idempotency-key");
  });
});
