# Deployment Guide

## Environment Strategy

| Environment | Purpose | Key Config |
|-------------|---------|------------|
| **development** | Local dev | `.env` with `MONGODB_URI=localhost`, `CLIENT_URL=http://localhost:5173` |
| **test** | CI / unit tests | `jest.setup.js` / `NODE_ENV=test`, test DB |
| **staging** | Pre-production | Staging DB, staging URLs, full env vars |
| **production** | Live | Production DB, secrets from vault, `NODE_ENV=production` |

## Required Environment Variables

### Backend
- `MONGODB_URI` – MongoDB connection string
- `JWT_ACCESS_SECRET` – Min 16 chars
- `JWT_REFRESH_SECRET` – Min 16 chars
- `CLOUDINARY_*` – Cloudinary credentials
- `CLIENT_URL` – Frontend origin (for CORS)
- `REDIS_URL` (optional) – For production caching

### Frontend
- `VITE_API_URL` (optional) – API base URL; defaults to `/api` for same-origin

## Docker

### Full stack (production-like)
```bash
# Create .env from backend/.env.example, fill secrets
cp backend/.env.example .env

# Build and run
docker compose up -d

# Backend: http://localhost:5000
# Frontend: http://localhost
# MongoDB: localhost:27017
# Redis: localhost:6379
```

### Development (MongoDB + Redis only)
```bash
docker compose -f docker-compose.dev.yml up -d
# Then: cd backend && npm run dev
# And:  cd frontend && npm run dev
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- **On push/PR** to `main` or `develop`:
  - Backend: lint, test (with MongoDB service)
  - Frontend: lint, test, build

### Deployment (manual / external)
1. Build images: `docker compose build`
2. Push to registry (e.g. Docker Hub, ECR)
3. Deploy to target (K8s, ECS, etc.)
4. Set secrets via env or secret manager
5. Use health (`/api/health`) and ready (`/api/ready`) probes

## Rollback
- Keep previous image tag; redeploy previous tag on failure
- Database migrations: run backward-compatible; avoid breaking changes in single deploy

## Security
- Never commit `.env` or secrets
- Use secret managers (AWS Secrets Manager, Vault) in production
- Rotate JWT secrets periodically
- Ensure `CLIENT_URL` matches deployed frontend origin
