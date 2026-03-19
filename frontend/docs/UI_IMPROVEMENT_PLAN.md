# UI/UX Improvement Plan – Job Portal

## Design System

### Color Palette
| Token | Value | Use |
|-------|-------|-----|
| Primary | `#4F46E5` (indigo-600) | CTAs, links, active states |
| Primary Hover | `#4338CA` (indigo-700) | Button hover |
| Success | `#059669` (emerald-600) | Success states, applied badge |
| Warning | `#D97706` (amber-600) | Pending, shortlisted |
| Error | `#DC2626` (red-600) | Errors, rejected |
| Neutral | gray-50 to gray-900 | Backgrounds, text |

### Typography
- **Font:** Inter (already in use)
- **Headings:** font-bold, tracking-tight
- **Body:** text-sm to text-base, leading-relaxed
- **Labels:** text-sm font-medium text-gray-700

### Spacing
- Section gap: `space-y-6` or `gap-6`
- Card padding: `p-5` sm:`p-6`
- Input padding: `px-4 py-2.5` or `py-3`

---

## Folder Structure

```
src/
├── components/
│   ├── ui/           # Reusable primitives
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Tooltip.jsx
│   │   ├── Tabs.jsx
│   │   ├── Skeleton.jsx
│   │   └── EmptyState.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   └── PageHeader.jsx
│   └── [feature components]
```

---

## Implementation Phases

### Phase 1: Design System & Primitives
- Button variants (primary, secondary, ghost, danger)
- Input with error/success states
- Card with hover, padding variants
- Skeleton loaders (improved)
- EmptyState component

### Phase 2: Overlay Components
- Modal (apply job, confirm delete)
- Dropdown (profile menu, filters)
- Tooltip (icon buttons)
- Tabs (dashboard sections – already present, enhance)

### Phase 3: Forms & Pages
- Login/Register: improved layout, loading states, validation feedback
- JobDetails: Apply in modal
- JobsPage: filter dropdowns, improved pagination

### Phase 4: Dashboard & Layout
- Profile dropdown (settings, logout)
- Dashboard cards with hover, animations
- Improved empty states

### Phase 5: Polish
- Transitions (transition-all duration-200)
- Accessibility (aria-labels, focus states)
- Responsive refinements
