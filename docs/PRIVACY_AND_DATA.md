# Privacy, data handling, and GDPR

## Current stance (this repository)

The product stores **PII** (names, emails, phones, profile text, resumes). There is **no** dedicated “data export” or “right to erasure” self-service flow beyond normal **account deletion** / admin tooling as implemented in the app—**verify** those paths against your legal requirements before marketing to **EU/UK**.

**Explicit outcome:** Treat as **single-region / non-EU-first** until you add export/erasure workflows and a Records of Processing Activities (RoPA) aligned with counsel. Before EU launch: add documented export/delete, DPA with processors (Atlas, Cloudinary, email, Sentry), and cookie/consent if you use non-essential trackers.

## Recommendations

- Minimize what you log (see `docs/DEPLOYMENT.md` — logging & PII).
- Configure Sentry scrubbing / `sendDefaultPii: false` (backend `config/sentry.js`; frontend already sets `sendDefaultPii: false` when Sentry is enabled).
- Retention: audit logs TTL is configured via `AUDIT_LOG_TTL_DAYS` (see `PROJECT_OVERVIEW.txt`).
