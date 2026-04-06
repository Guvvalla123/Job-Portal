# MongoDB Atlas (production checklist)

Operational settings live in Atlas; this is the **minimum** bar for production.

## Network

- **IP access list:** Prefer non-global rules (office IP, Render egress IPs, or Atlas Private Endpoint). Avoid `0.0.0.0/0` except short-lived debugging.
- **Region:** Place the Atlas cluster in the **same region** as the API (e.g. Render `oregon` ↔ Atlas `us-west-2`) to reduce latency.

## Access control

- **Database user:** Separate user for the app with **readWrite** on the application database only—not Atlas admin.
- **Connection string:** Use `mongodb+srv` with TLS; rotate password if leaked.

## Backups & recovery

- Enable **Cloud Backup** (M10+ includes continuous backup; lower tiers have snapshot limits—verify your tier).
- Document **RPO/RTO** expectations and run a **restore drill** once.

## Observability

- Use Atlas **Performance Advisor** and **slow query** logs for index tuning (this app also calls `ensureIndexes()` on startup—see `backend/src/models/indexes.js`).
