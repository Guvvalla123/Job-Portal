/**
 * Audit middleware - logs successful mutations.
 * Wraps res.json to detect success; logs only on 2xx/3xx with req.user.
 */
const auditLogService = require("../services/auditLogService");

const audit = (action, resourceType, getResourceId = (req) => req.params?.id) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const id = typeof getResourceId === "function" ? getResourceId(req, body) : getResourceId;
      const resourceId = id?.toString?.() || id || undefined;
      auditLogService.log({
        userId: req.user.userId,
        action,
        resourceType,
        resourceId,
        req,
      });
    }
    return originalJson(body);
  };
  next();
};

module.exports = { audit };
