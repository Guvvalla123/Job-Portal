# Job Portal MERN

Production-oriented starter for a Naukri-like job portal using:
- MongoDB Atlas
- Express
- React (Vite)
- Node.js
- Tailwind CSS
- Cloudinary uploads

## Folder structure

- `backend`: Express API with auth, RBAC, jobs, applications, Cloudinary uploads
- `frontend`: React + Tailwind app shell with protected routes and core screens

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas cluster
- Cloudinary account

## Backend setup

1. Copy `backend/.env.example` to `backend/.env`
2. Fill all required values
3. Run:

```bash
cd backend
npm install
npm run dev
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## Initial APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs` (recruiter/admin)
- `POST /api/applications` (candidate)
- `GET /api/applications/me` (candidate)
- `PATCH /api/applications/:id/status` (recruiter/admin)
- `POST /api/companies` (recruiter/admin)
- `GET /api/companies/me` (recruiter/admin)
- `PATCH /api/users/profile`
- `POST /api/users/profile/image`
- `POST /api/users/profile/resume`
