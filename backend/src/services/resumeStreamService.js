const { cloudinary } = require("../config/cloudinary");
const { logger } = require("../config/logger");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");

/**
 * Build signed delivery URLs for a raw resume public_id.
 */
function signedRawUrls(publicId) {
  const urls = [];
  for (const type of ["upload", "authenticated"]) {
    try {
      urls.push(
        cloudinary.url(publicId, {
          resource_type: "raw",
          secure: true,
          sign_url: true,
          type,
        })
      );
    } catch (e) {
      logger.warn("resumeStream: signed URL build failed", { type, error: e.message });
    }
  }
  return urls;
}

function collectResumeUrls(user) {
  if (!user?.resumeUrl && !user?.resumePublicId) return [];

  const urls = [];
  if (user.resumePublicId) {
    for (const u of signedRawUrls(user.resumePublicId)) {
      if (u && !urls.includes(u)) urls.push(u);
    }
  }
  if (user.resumeUrl && !urls.includes(user.resumeUrl)) {
    urls.push(user.resumeUrl);
  }
  return urls;
}

/**
 * Try each URL and pipe the first successful PDF response to Express `res` (no full buffering in Node).
 * @returns {Promise<boolean>} true if streaming started and completed
 */
async function pipeResumePdfToResponse(res, user, filename = "resume.pdf") {
  const urls = collectResumeUrls(user);
  if (!urls.length) return false;

  for (const url of urls) {
    if (res.headersSent) return false;
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Accept: "application/pdf,*/*" },
      });
      if (!response.ok) continue;
      const upstream = response.body;
      if (!upstream) continue;

      const safeName = filename || "resume.pdf";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const len = response.headers.get("content-length");
      if (len) res.setHeader("Content-Length", len);

      await pipeline(Readable.fromWeb(upstream), res);
      return true;
    } catch (err) {
      logger.warn("resumeStream: pipe failed", { url: url?.slice(0, 96), error: err.message });
      if (res.headersSent) return false;
    }
  }
  return false;
}

/**
 * @deprecated Prefer pipeResumePdfToResponse for HTTP responses.
 */
async function fetchResumePdfBuffer(user) {
  const urls = collectResumeUrls(user);
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Accept: "application/pdf,*/*" },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length) continue;
      return { buffer: buf, contentType: "application/pdf" };
    } catch (err) {
      logger.warn("resumeStream: fetch failed", { url: url?.slice(0, 96), error: err.message });
    }
  }
  return null;
}

module.exports = { pipeResumePdfToResponse, fetchResumePdfBuffer, collectResumeUrls };
