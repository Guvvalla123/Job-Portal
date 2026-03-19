/**
 * NoSQL injection and prototype pollution prevention
 * - Strips $ and . from object keys (MongoDB operators)
 * - Blocks __proto__, constructor, prototype
 * - Recursion depth limit to prevent DoS
 */
const MAX_DEPTH = 10;
const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

const isDangerousKey = (key) => {
  if (typeof key !== "string") return false;
  const lower = key.toLowerCase();
  return DANGEROUS_KEYS.includes(lower) || key.includes("__proto__") || key.includes("constructor");
};

const sanitizeKey = (key) => {
  if (typeof key !== "string") return key;
  return key.replace(/\$/g, "").replace(/^\.+|\.+$/g, "").replace(/\.{2,}/g, ".");
};

const sanitizeObject = (value, depth = 0) => {
  if (depth > MAX_DEPTH) return value;

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = sanitizeObject(item, depth + 1);
    });
    return value;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    for (const key of keys) {
      if (isDangerousKey(key)) {
        delete value[key];
        continue;
      }

      const sanitizedKey = sanitizeKey(key);
      const val = value[key];

      if (sanitizedKey !== key) {
        value[sanitizedKey] = sanitizeObject(val, depth + 1);
        delete value[key];
      } else {
        value[key] = sanitizeObject(val, depth + 1);
      }
    }
  }

  return value;
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === "object") {
      sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === "object") {
      sanitizeObject(req.params);
    }
  } catch (err) {
    return next(err);
  }
  next();
};

module.exports = { sanitizeInput, sanitizeObject };
