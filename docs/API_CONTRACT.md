# API contract

- **Postman:** `postman/` collection and environment (see `postman/README.md`).
- **OpenAPI 3:** `docs/openapi.yaml` — partial snapshot (health, auth bootstrap, apply). Extend by exporting from Postman or editing the YAML.
- **Versioning:** JSON under `/api/v1/...`; system routes `/api/health`, `/api/ready`, `/api/metrics`.

## Pagination limits (list queries)

Caps are enforced in Zod; constants live in `backend/src/validations/paginationLimits.js`.

| Endpoint area | Query param `limit` max | Default |
|---------------|-------------------------|---------|
| Public jobs list (`GET /api/v1/jobs`) | **50** (`JOBS_LIST_MAX`) | 10 |
| Applications lists (`GET .../applications/...` paginated) | **100** (`APPLICATIONS_LIST_MAX`) | 20 |

## Validate OpenAPI locally

From repo root:

```bash
npm run openapi:validate
```

Uses `npx @apidevtools/swagger-cli validate` (see root `package.json` script).

## Maintenance

Prefer a single source of truth over time: either maintain `openapi.yaml` and generate clients, or export OpenAPI from Postman and replace the snapshot in CI when routes change.
