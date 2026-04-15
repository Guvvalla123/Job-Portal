# CareerSync — Job Portal

Production-oriented job portal built with the MERN stack. Candidates browse and apply for jobs. Recruiters manage the hiring pipeline. Admins oversee the platform.

## Documentation

- [BACKEND_SUMMARY.txt](BACKEND_SUMMARY.txt) — Complete backend reference
- [FRONTEND_SUMMARY.txt](FRONTEND_SUMMARY.txt) — Complete frontend reference
- Additional guides: `docs/` (deployment, architecture, API contract, project status)

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (Atlas or local)
- Cloudinary account

### Run locally

**Terminal 1 (Backend):**

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Tech Stack

**Backend:** Node.js, Express 5, MongoDB, JWT, BullMQ, Cloudinary  
**Frontend:** React 19, Vite 7, Tailwind 4, TanStack Query

## Testing

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npx playwright test
```

## Project Status

**Stage:** Development (not yet deployed)

**Backend tests:** 67/67 passing

**Known bugs:** See [FRONTEND_SUMMARY.txt](FRONTEND_SUMMARY.txt) §13 (Known bugs).

## Environment Setup

See `backend/.env.example` for all variables. **Required:** `MONGODB_URI`, JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, min 32 chars), Cloudinary credentials.

---

_For root workspace scripts (`npm run dev` from repo root), Postman collections, and extended deployment notes, see `docs/DEPLOYMENT.md` and the root `package.json`._
