# SEO & crawling (SPA)

## Current model

The product is a **client-rendered React SPA** (Vite build). Public routes use `react-helmet-async` for per-page `<title>` and meta descriptions. `public/robots.txt` and `sitemap.xml` are adjusted at build time via `frontend/scripts/replace-seo-domain.js` using `VITE_SITE_URL`.

## Honest limits

Search engines may index the **initial HTML shell** quickly, but **job and company detail content** is loaded after JavaScript runs. Ranking for long-tail job queries may lag behind a **server-rendered** or **prerendered** site unless you add:

- Prerendering for `/jobs/:id` and `/companies/:id`, or
- A small **marketing/SSR** slice (e.g. Next.js) for landing URLs, or
- A static **jobs feed** (e.g. XML sitemap of canonical URLs + structured data) with care for freshness.

## Product choice

Until mitigation ships, treat **organic job SEO as a roadmap item**, not a guarantee of the current stack. Internal search and direct links remain fully functional.

## Nav / placeholders

Footer and routing no longer advertise standalone “Careers”, “Press”, or `/resources/*` placeholder pages; those URLs **redirect to `/about`** so users are not dropped on empty shells.
