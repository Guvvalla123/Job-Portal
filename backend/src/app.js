const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const { requestId } = require("./middlewares/requestId");
const { sanitizeInput } = require("./middlewares/sanitizeInput");
const { apiRoutes } = require("./routes");
const { notFound } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");
const { corsOptions, helmetOptions, hppOptions, RATE_LIMITS } = require("./config/security");
const { logRequest } = require("./config/logger");

const app = express();

app.use(requestId);
app.use(logRequest);
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(compression());
app.use(hpp(hppOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeInput);

const authLimiter = rateLimit({
  ...RATE_LIMITS.auth,
  standardHeaders: true,
});
const strictLimiter = rateLimit({
  ...RATE_LIMITS.strict,
  standardHeaders: true,
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);
app.use("/api/v1/auth/forgot-password", strictLimiter);

const apiLimiter = rateLimit({
  ...RATE_LIMITS.api,
  standardHeaders: true,
  skip: (req) => {
    const p = req.path || req.originalUrl || "";
    return p.includes("/health") || p.includes("/ready") || p.includes("/metrics");
  },
});
app.use("/api", apiLimiter);
app.get("/api/metrics", async (req, res) => {
  try {
    const metrics = require("./config/metrics");
    res.set("Content-Type", metrics.getContentType());
    res.end(await metrics.getMetrics());
  } catch (err) {
    res.status(500).end(String(err.message));
  }
});
// v1 includes: router.use("/applications", applicationRoutes) → GET /api/v1/applications/:id/resume
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
