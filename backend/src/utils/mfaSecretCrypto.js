const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;

function deriveKey(material) {
  return crypto.createHash("sha256").update(String(material), "utf8").digest();
}

/**
 * @param {string} plainSecret - base32 TOTP secret
 * @param {string} encryptionKey - MFA_ENCRYPTION_KEY from env
 */
function encryptTotpSecret(plainSecret, encryptionKey) {
  const key = deriveKey(encryptionKey);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const enc = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/**
 * @returns {string|null}
 */
function decryptTotpSecret(encB64, encryptionKey) {
  if (!encB64 || !encryptionKey) return null;
  try {
    const raw = Buffer.from(encB64, "base64");
    if (raw.length < IV_LEN + AUTH_TAG_LEN + 1) return null;
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const data = raw.subarray(IV_LEN + AUTH_TAG_LEN);
    const key = deriveKey(encryptionKey);
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

module.exports = { encryptTotpSecret, decryptTotpSecret };
