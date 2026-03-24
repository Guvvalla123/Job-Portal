# Premium UI system (JobPortal)

## Strategy

- **Depth:** Layered gradients, glass (`backdrop-blur`), soft shadows, hover lift on cards.
- **Hierarchy:** Eyebrow labels (`uppercase tracking-wider`), display titles (`.text-display`), muted body copy.
- **Sections:** Alternate surfaces — light gray, white, dark gradient bands, wave SVG dividers (`SectionWave`).
- **Motion:** Count-up stats (`useCountUp`), hero floats, `prefers-reduced-motion` respected globally.
- **Trust:** Dicebear avatars for testimonials, star row, company logos on job cards when API provides `company.logoUrl`.

## New / updated files

| Path | Role |
|------|------|
| `src/hooks/useCountUp.js` | Animated numbers for stats |
| `src/components/SectionWave.jsx` | Curved section separators |
| `src/components/ThemeToggle.jsx` | Header + footer dark mode |
| `src/components/FloatingRecruiterFab.jsx` | FAB → recruiter dashboard |
| `src/index.css` | `modalIn`, `shimmer`, `.text-display`, dark `body` |
| `src/components/ui/Card.jsx` | `glass`, `premium` variants; stronger hover |
| `src/components/ui/Button.jsx` | `gradient` variant |
| `src/components/ui/Badge.jsx` | Dark-mode token pairs |
| `src/components/ui/Skeleton.jsx` | Shimmer sweep |
| `src/components/ui/Modal.jsx` | Blur backdrop + scale-in |
| `src/layouts/AppLayout.jsx` | Sticky blur header, home full-bleed main, theme toggle, FAB |
| `src/components/Footer.jsx` | Multi-column, gradient shell, newsletter card, theme toggle |
| `src/pages/HomePage.jsx` | Full marketing structure (see below) |

## Homepage structure

1. Hero — photo + gradients + CTAs  
2. Wave → Stats — gradient stat tiles + count-up  
3. Wave → Featured jobs — `Card variant="premium"` + logo + tags  
4. Job categories — 6 gradient icon cards  
5. Companies band — dark gradient + optional placeholder slots  
6. How it works — 3 steps + desktop connector line  
7. Testimonials — stars + Dicebear avatars  
8. CTA — gradient + pattern (guests only)  

## Tailwind patterns (reuse)

```jsx
/* Elevated interactive surface */
'rounded-2xl border border-gray-100 bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0'

/* Eyebrow */
'text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400'

/* Glass panel */
'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md'
```

## Layout note

`/` uses full-width `<main>`; other routes keep `max-w-7xl` + padding (see `AppLayout.jsx`).

## Optional next steps

- Add `company.logoUrl` to job list API populate if not already returned.  
- Replace Dicebear with real user photos when available.  
- Add Framer Motion or `IntersectionObserver` for scroll-reveal on sections.
