/**
 * Optional Sentry for API errors. Gated by SENTRY_DSN — no-op when unset or in test.
 */
const { env } = require("./env");

let Sentry = null;
let enabled = false;

try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  Sentry = require("@sentry/node");
} catch {
  Sentry = null;
}

function initSentry() {
  if (!Sentry || !env.SENTRY_DSN || env.NODE_ENV === "test") return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || undefined,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.05 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === "object") {
        event.request.data = { redacted: true };
      }
      if (event.request?.cookies) {
        event.request.cookies = "[redacted]";
      }
      return event;
    },
  });
  enabled = true;
}

/**
 * @param {Error} err
 * @param {{ requestId?: string }} [ctx]
 */
function captureException(err, ctx = {}) {
  if (!enabled || !Sentry) return;
  Sentry.withScope((scope) => {
    if (ctx.requestId) {
      scope.setTag("request_id", ctx.requestId);
      scope.setContext("request", { requestId: ctx.requestId });
    }
    Sentry.captureException(err);
  });
}

function isSentryEnabled() {
  return enabled;
}

module.exports = { initSentry, captureException, isSentryEnabled };
