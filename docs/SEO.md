# SEO Configuration Guide

## Quick Reference

| What to change | File |
|----------------|------|
| Site URL, name, description | `utils/seo.ts` |
| Keywords, OpenGraph, Twitter | `app/layout.tsx` |
| Page-specific titles | `app/[page]/layout.tsx` |
| Blocked routes | `app/robots.ts` |
| Public URLs | `app/sitemap.ts` |

---

## File Structure

```
utils/
└── seo.ts              # Shared constants (DRY)

app/
├── layout.tsx          # Root metadata (inherited by all pages)
├── robots.ts           # → /robots.txt
├── sitemap.ts          # → /sitemap.xml
├── admin/layout.tsx    # noindex
├── login/layout.tsx    # noindex
├── signup/layout.tsx   # noindex
├── profile/layout.tsx  # noindex
├── forgot-password/layout.tsx  # noindex
└── reset-password/layout.tsx   # noindex
```

---

## Common Tasks

### Change Site Description

Edit `utils/seo.ts`:

```typescript
export const siteConfig = {
  description: {
    en: 'Your new English description',
    ko: '새로운 한국어 설명',
  },
}
```

### Add Keywords

Edit `app/layout.tsx`:

```typescript
keywords: ['mentoring', 'donation', 'new-keyword'],
```

### Change a Page Title

Edit the page's layout file (e.g., `app/admin/layout.tsx`):

```typescript
export const metadata: Metadata = {
  title: 'New Admin Title',
}
```

Title will render as: `New Admin Title | Donation Mentoring`

### Add a New Public Page to Sitemap

Edit `app/sitemap.ts`:

```typescript
return [
  { url: siteConfig.url, lastModified: new Date() },
  { url: `${siteConfig.url}/new-page`, lastModified: new Date() },
]
```

### Block a Route from Crawlers

Edit `app/robots.ts`:

```typescript
disallow: ['/admin', '/login', '/new-private-route'],
```

---

## How It Works

1. **Root layout** (`app/layout.tsx`) defines default metadata
2. **Child layouts** can override specific fields (title, robots)
3. **Title template**: `%s | Donation Mentoring` auto-appends site name
4. **Metadata merges** from root → child (child wins on conflicts)

---

## Verification

```bash
npm run dev

# Check these URLs:
# http://localhost:3000/robots.txt
# http://localhost:3000/sitemap.xml

# View page source to inspect <head> tags
```

---

## Protected Pages (noindex)

These pages have `robots: { index: false, follow: false }`:

- `/admin` - Admin dashboard
- `/login` - Authentication
- `/signup` - Registration
- `/profile` - User profile
- `/forgot-password` - Password recovery
- `/reset-password` - Password reset

Search engines won't index these pages.
