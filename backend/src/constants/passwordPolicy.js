/** OWASP-aligned baseline for new passwords (register / reset). Login accepts any stored hash. */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_REQUIREMENT_MESSAGE =
  "Password must be at least 8 characters and include one uppercase letter, one number, and one special character.";

module.exports = { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE };
