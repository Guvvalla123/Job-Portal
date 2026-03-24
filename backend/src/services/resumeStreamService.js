const { cloudinary } = require("../config/cloudinary");
const { logger } = require("../config/logger");

/**
 * Build signed delivery URLs for a raw resume public_id.
 * Tries type "upload" (public / standard) then "authenticated" (legacy private uploads).
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

/**
 * Fetches resume bytes from Cloudinary.
 * Signed URLs first (works for authenticated access_mode + restricted delivery), then stored secure_url.
 * @param {{ resumeUrl?: string, resumePublicId?: string }} user
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 */
async function fetchResumePdfBuffer(user) {
  if (!user?.resumeUrl && !user?.resumePublicId) return null;

  const urls = [];
  if (user.resumePublicId) {
    for (const u of signedRawUrls(user.resumePublicId)) {
      if (u && !urls.includes(u)) urls.push(u);
    }
  }
  if (user.resumeUrl && !urls.includes(user.resumeUrl)) {
    urls.push(user.resumeUrl);
  }

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

module.exports = { fetchResumePdfBuffer };
