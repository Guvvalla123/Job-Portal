# Job Portal – Packages & Scripts Reference

## Backend (`backend/package.json`)

### Production Dependencies

| Package | Purpose |
|---------|---------|
| `bcryptjs` | Password hashing |
| `cloudinary` | Image/resume file storage |
| `compression` | gzip response compression |
| `cookie-parser` | Parse cookies (refresh token) |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable loading |
| `express` | Web framework |
| `express-rate-limit` | Rate limiting |
| `helmet` | Secure HTTP headers |
| `hpp` | HTTP parameter pollution prevention |
| `jsonwebtoken` | JWT auth |
| `mongoose` | MongoDB ODM |
| `morgan` | HTTP request logging |
| `multer` | File upload handling |
| `nodemailer` | Email sending |
| `streamifier` | Stream utilities for Cloudinary |
| `uuid` | Request IDs (for tracing) |
| `winston` | Structured logging |
| `zod` | Schema validation |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `cross-env` | Cross-platform env vars in scripts |
| `eslint` | Linting |
| `eslint-config-prettier` | Prettier + ESLint compatibility |
| `jest` | Unit/integration testing |
| `nodemon` | Dev auto-reload |
| `prettier` | Code formatting |
| `supertest` | HTTP assertion for API tests |

### Scripts

```bash
npm run dev          # Start with nodemon (development)
npm start            # Start production server
npm test             # Run Jest tests with coverage
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format
npm run format:check  # Prettier check only
```

---

## Frontend (`frontend/package.json`)

### Production Dependencies

| Package | Purpose |
|---------|---------|
| `@hookform/resolvers` | Form validation (Zod) |
| `@tanstack/react-query` | Server state, caching, mutations |
| `axios` | HTTP client |
| `react` | UI library |
| `react-dom` | React DOM renderer |
| `react-error-boundary` | Error boundary component |
| `react-helmet-async` | Document head (SEO) |
| `react-hook-form` | Form state management |
| `react-router-dom` | Routing |
| `sonner` | Toast notifications |
| `zod` | Schema validation |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@tailwindcss/vite` | Tailwind CSS v4 |
| `@testing-library/jest-dom` | DOM matchers for tests |
| `@testing-library/react` | Component testing |
| `eslint` | Linting |
| `eslint-config-prettier` | Prettier + ESLint |
| `jsdom` | DOM environment for Vitest |
| `prettier` | Code formatting |
| `tailwindcss` | Utility CSS |
| `vite` | Build tool |
| `vitest` | Unit/integration testing |

### Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check only
npm test             # Run Vitest
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with coverage
```

---

## Quick Start After Clone

```bash
# Backend
cd backend
cp .env.example .env   # Edit with real values
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Engine Requirements

- **Backend:** Node.js >= 18.0.0
- **Frontend:** Node.js >= 18 (Vite 7)
