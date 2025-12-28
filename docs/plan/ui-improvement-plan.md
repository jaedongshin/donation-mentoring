# UI Implementation - Charcoal & Dusty Blue Theme

## Current Implementation ✅

### Design System

**Theme: "Charcoal & Dusty Blue"** - Professional, modern, with dark mode support

```typescript
// app/page.tsx - BASE_THEME
const BASE_THEME = {
  primaryBg: 'bg-neutral-800',      // Charcoal
  primaryHover: 'hover:bg-neutral-900',
  primaryText: 'text-neutral-800',
  primaryLight: 'bg-neutral-100',
  accentBg: 'bg-sky-600',           // Dusty Blue
  accentHover: 'hover:bg-sky-700',
  accentText: 'text-sky-600',
  accentLight: 'bg-sky-50',
  accentBorder: 'border-sky-200',
};
```

### Dark Mode
- Toggle in header (Moon/Sun icons)
- Persisted via localStorage across pages
- `dm` object for consistent dark mode classes:
  - `dm.bg`, `dm.bgCard`, `dm.text`, `dm.textMuted`, `dm.border`

### Components Implemented

| Component | Features |
|-----------|----------|
| **Header** | Sticky, language toggle, dark mode toggle, admin link |
| **Hero** | Gradient background, parallax scroll, animated decorative blobs |
| **MentorCard** | Image overlay with name/position, hover effects, tag pills, LinkedIn badge |
| **MentorModal** | Slide-in animation, Calendly integration, bilingual content |
| **FilterSidebar** | Desktop sidebar + mobile drawer, tag normalization, "show more" |
| **Admin Page** | Dark theme, sticky header, search, custom delete modal |

### Animations (globals.css)

```css
/* Key animations */
@keyframes fadeInUp { ... }
@keyframes fadeIn { ... }
@keyframes scaleIn { ... }
@keyframes float { ... }
@keyframes pulse-soft { ... }

/* Utility classes */
.animate-fade-in-up
.animate-float
.stagger-1 through .stagger-8
.card-hover
```

### UX Patterns

1. **Collapsible "How it Works"** - Bento cards hidden by default, expand on click
2. **Sticky filter header** - Mobile: sticky section header when scrolling
3. **Tag normalization** - Groups similar tags (case/space insensitive)
4. **Single-row tags** - MentorCard shows max 3 tags + "+N" overflow indicator

---

## Color System (globals.css)

Note: CSS variables defined but **not actively used** - Tailwind utility classes preferred.

```css
:root {
  /* Primary - Warm Coral (legacy, unused) */
  --color-primary-500: #e07a5f;

  /* Secondary - Sage Green (legacy, unused) */
  --color-secondary-500: #5e8a6a;

  /* Neutrals - Warm Gray */
  --color-neutral-50 through --color-neutral-900;
}
```

**Actual colors used:** Tailwind's `neutral-*`, `sky-*`, `gray-*` utilities directly.

---

## Files Changed

```
app/
├── globals.css          # Animations, gradients, scrollbar styling
├── page.tsx             # Main page with theme, dark mode, all sections
├── admin/page.tsx       # Admin with dark mode, search, delete modal
└── components/
    ├── MentorCard.tsx   # Theme-aware card with dm props
    ├── MentorModal.tsx  # Theme-aware modal
    └── FilterSidebar.tsx # Tag filtering with normalization

utils/
├── useMentorFilters.ts  # Tag normalization (normalizeTag, preferDisplayName)
└── i18n.ts              # 40+ translation keys
```

---

## Future Considerations

- [ ] FilterSidebar dark mode support (currently light-only)
- [ ] Move hardcoded strings to i18n
- [ ] Hydration-safe dark mode initialization
