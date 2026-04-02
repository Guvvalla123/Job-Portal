/**
 * Waits until the API responds on /api/health.
 * Reads PORT from process.env, then backend/.env, then defaults to 5000 (matches backend env schema).
 */
const fs = require("fs");
const path = require("path");
const waitOn = require("wait-on");

const root = path.join(__dirname, "..");
const envPath = path.join(root, "backend", ".env");
const feDevPath = path.join(root, "frontend", ".env.development");

function readPortFromBackendEnv() {
  try {
    if (!fs.existsSync(envPath)) return null;
    const raw = fs.readFileSync(envPath, "utf8");
    const m = raw.match(/^\s*PORT\s*=\s*(\d+)/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function readViteBackendPortFromFrontendDev() {
  try {
    if (!fs.existsSync(feDevPath)) return null;
    const raw = fs.readFileSync(feDevPath, "utf8");
    const m = raw.match(/^\s*VITE_BACKEND_PORT\s*=\s*(\d+)/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const port =
  process.env.PORT ||
  process.env.BACKEND_PORT ||
  readPortFromBackendEnv() ||
  readViteBackendPortFromFrontendDev() ||
  "5000";
const resource = `http-get://127.0.0.1:${port}/api/health`;

waitOn({ resources: [resource], timeout: 120_000, interval: 300, validateStatus: (s) => s >= 200 && s < 500 })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[wait-for-api] Timed out waiting for ${resource}`, err?.message || err);
    process.exit(1);
  });
