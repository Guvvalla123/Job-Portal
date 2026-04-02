const nodemailer = require("nodemailer");
const { logger } = require("../config/logger");

let transporter = null;
let breaker = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: port === "465",
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendMailRaw({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    return { preview: text || html?.slice(0, 100) };
  }
  return transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@careersync.com",
    to,
    subject,
    html: html || text,
    text: text || html?.replace(/<[^>]*>/g, ""),
  });
}

function getBreaker() {
  if (breaker) return breaker;
  try {
    const CircuitBreaker = require("opossum");
    breaker = new CircuitBreaker(sendMailRaw, {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });
    breaker.on("open", () => logger.warn("Mail circuit breaker opened"));
    breaker.on("halfOpen", () => logger.info("Mail circuit breaker half-open"));
    breaker.on("close", () => logger.info("Mail circuit breaker closed"));
    return breaker;
  } catch {
    return null;
  }
}

async function sendMail(payload) {
  if (!getTransporter()) {
    logger.debug("[MAIL] No SMTP configured", { to: payload.to, subject: payload.subject });
    return { preview: payload.text || payload.html?.slice(0, 100) };
  }
  try {
    const b = getBreaker();
    return b ? await b.fire(payload) : await sendMailRaw(payload);
  } catch (err) {
    logger.error("Mail send failed", { error: err.message, to: payload.to });
    throw err;
  }
}

module.exports = { sendMail, getTransporter };
