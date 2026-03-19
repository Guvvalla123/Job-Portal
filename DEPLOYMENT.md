# Job Portal – Deployment Guide

Deploy the MERN job portal to production with this guide.

---

## 1. Backend (Render / Railway / AWS)

### Render

1. Create a new **Web Service**
2. Connect your GitHub repo
3. **Build:**
   - `cd backend && npm install && npm run build` (if you have a build script)
   - Or: `cd backend && npm install`
4. **Start:** `cd backend && npm start`
5. **Root directory:** `backend` (or leave empty and set build/start commands)
6. **Environment variables:** Add all from `backend/.env.example`:
   - `NODE_ENV=production`
   - `PORT=5000` (Render sets this)
   - `CLIENT_URL` = your frontend URL (e.g. `https://jobportal.vercel.app`)
   - `MONGODB_URI` = MongoDB Atlas connection string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (64+ char random strings)
   - `CLOUDINARY_*` credentials

### Railway

1. New → Deploy from GitHub
2. **Root directory:** `backend`
3. **Start command:** `npm start`
4. Add env vars from `.env.example`

---

## 2. Frontend (Vercel / Netlify)

### Vercel

1. Import project from GitHub
2. **Root directory:** `frontend` (or project root)
3. **Build command:** `cd frontend && npm run build`
4. **Output directory:** `frontend/dist`
5. **Environment variables:**
   - `VITE_SITE_URL` = your deployed frontend URL (e.g. `https://jobportal.vercel.app`)
   - `VITE_GA_MEASUREMENT_ID` = Google Analytics ID (optional)
   - Social links (optional)

### Netlify

1. New site → Import from Git
2. **Base directory:** `frontend`
3. **Build command:** `npm run build`
4. **Publish directory:** `dist`
5. Add env vars same as Vercel

---

## 3. API Proxy (Important)

The frontend calls `/api` which is proxied to the backend in dev. In production:

**Option A:** Same domain (recommended)
- Deploy frontend and backend together (e.g. Vercel + serverless API)
- Or use a reverse proxy (nginx, Cloudflare) so `/api` goes to backend

**Option B:** Different domains
- Set `VITE_API_URL=https://your-backend.onrender.com/api` in frontend env
- Update `apiClient` baseURL to use `import.meta.env.VITE_API_URL`
- Update backend `CLIENT_URL` for CORS
- Add backend URL to CORS allowed origins

---

## 4. Environment Variables Summary

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | Server port (default 5000) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | 64+ char random |
| `JWT_REFRESH_SECRET` | Yes | 64+ char random |
| `CLOUDINARY_*` | Yes | Cloudinary credentials |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SITE_URL` | Yes (prod) | Deployed frontend URL |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics ID |
| `VITE_API_URL` | No | Backend API URL (if different domain) |

---

## 5. Post-Deployment Checklist

- [ ] Backend health: `GET https://your-backend-url/api/health`
- [ ] Frontend loads and API calls work
- [ ] Login / Register works
- [ ] CORS allows requests from frontend origin
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` for Render/Railway
- [ ] Update `sitemap.xml` and `robots.txt` with your domain (via `VITE_SITE_URL` at build)
