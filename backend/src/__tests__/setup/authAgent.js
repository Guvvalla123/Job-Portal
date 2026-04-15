const request = require("supertest");

/**
 * Logs in via API and returns supertest agent with cookie jar + tokens for CSRF-safe mutations.
 */
async function loginAs(app, email, password) {
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    agent,
    accessToken: res.body.data.accessToken,
    csrfToken: res.body.data.csrfToken,
    user: res.body.data.user,
  };
}

function withCsrf(req, accessToken, csrfToken) {
  return req.set("Authorization", `Bearer ${accessToken}`).set("X-CSRF-Token", csrfToken);
}

module.exports = { loginAs, withCsrf };
