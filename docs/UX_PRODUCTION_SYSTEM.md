# Production UX & layout system

## 1. Global layout

| Element | Behavior |
|---------|----------|
| **Header** | `sticky top-0`, fixed row height `h-14` / `min-h-[3.5rem]`, `max-w-7xl` aligned with content |
| **Main** | `flex-1`, `min-w-0`, background `gray-50` / `gray-950` (dark) |
| **Page shell** | Non-home: `max-w-7xl` + `px-4 sm:px-6 lg:px-8 lg:py-8`. Home: full width (sections own padding) |
| **Footer** | Unchanged `max-w-7xl` inner grid — aligns with header + page shell |
| **Route transition** | `AnimatedPage`: `key={pathname}` + `animate-page-enter` + `min-h` to limit jump |

## 2. Scroll & navigation

- **`ScrollToTop`** (`components/ScrollToTop.jsx`) — `BrowserRouter` cannot use `<ScrollRestoration>` (data router only). We scroll to top on **PUSH/REPLACE** and skip on **POP** so back/forward keeps native scroll when possible.
- **Mobile menu** closes on `pathname` change (`useEffect` in `AppLayout`).
- **Header shadow** deepens after ~8px scroll (`useHeaderScrolled`).

## 3. Responsive & touch

- **Mobile nav**: `Sheet` from **left**, `fullWidth` on small screens, safe-area padding, **44px+** nav rows (`min-h-12`).
- **Tap targets**: `.tap-target` utility (`min-h-11 min-w-11`) on menu + sheet close.
- **FAB**: `env(safe-area-inset-*)` on mobile.
- **Jobs grid**: `md:grid-cols-2`, `xl:grid-cols-3`; filter **Sheet** unchanged side on small viewports.

## 4. React Query

- **Default** `refetchOnWindowFocus: false` — less surprise refetch / layout shift.
- **Notifications** override: `refetchOnWindowFocus: true`.
- **Jobs list** `placeholderData: (p) => p` — keeps previous page visible while refetching (e.g. filters).

## 5. Jobs page

- **Debounced search** (`useDebouncedValue`, ~320ms) — fewer API calls while typing.
- **URL sync** — `q`, `location`, `employmentType`, `experienceLevel`, `sort`, `page` in query string; **`POP`** navigation rehydrates form state from URL.

## 6. Save job

- **Optimistic** toggle + **rollback** on error via `prevUser` snapshot.

## 7. Patterns to reuse

```jsx
// Page section vertical rhythm
className="space-y-6 lg:space-y-8"

// Stable content area while loading
className="min-h-[min(52vh,32rem)]"
```

## 8. Optional follow-ups

- `refetchInterval` for recruiter dashboards.
- Virtualized job list for very large result sets.
- `useLayoutEffect` scroll-to-top for selected routes only (if product wants always top).
