# SEO Configuration Guide

Comprehensive SEO setup for traditional search engines AND AI search platforms.

---

## Quick Reference

| What to change | File |
|----------------|------|
| Site URL, name, descriptions | `utils/seo.ts` → `siteConfig` |
| Keywords | `utils/seo.ts` → `seoKeywords` |
| AI crawlers list | `utils/seo.ts` → `aiCrawlers` |
| JSON-LD structured data | `utils/seo.ts` → `*JsonLd` exports |
| Protected routes | `utils/seo.ts` → `protectedRoutes` |
| Page-specific titles | `app/[page]/layout.tsx` |

**Single source of truth**: Most SEO changes happen in `utils/seo.ts`

---

## File Structure

```
utils/
└── seo.ts                 # ALL SEO configuration (single source of truth)

app/
├── layout.tsx             # Root metadata + JSON-LD injection
├── robots.ts              # → /robots.txt (uses seo.ts config)
├── sitemap.ts             # → /sitemap.xml
└── [route]/layout.tsx     # Page-specific overrides (noindex, etc.)
```

---

## What's Configured

### Traditional SEO
- Meta title with template pattern (`%s | Donation Mentoring`)
- Meta description (bilingual)
- Keywords (English + Korean)
- OpenGraph tags (Facebook, LinkedIn sharing)
- Twitter Card tags
- Canonical URLs
- robots.txt with sitemap reference

### AI Search Optimization (GEO)
- **JSON-LD Structured Data**: Organization, WebSite, Service schemas
- **AI Crawler Access**: Explicit allows for GPTBot, ClaudeBot, PerplexityBot, etc.
- **Entity Definition**: Clear organization identity for AI understanding

---

## AI Search Platforms Supported

| Platform | Crawler | What it Powers |
|----------|---------|----------------|
| ChatGPT | GPTBot, OAI-SearchBot | ChatGPT search & citations |
| Claude | ClaudeBot, Claude-Web | Claude AI responses |
| Perplexity | PerplexityBot | Perplexity AI search |
| Google | Google-Extended | Gemini, AI Overviews |
| Microsoft | Bingbot | Copilot |

All crawlers are explicitly allowed in `robots.txt`.

---

## Common Tasks

### Change Site Description

Edit `utils/seo.ts`:

```typescript
export const siteConfig = {
  description: {
    en: 'Your new full description for AI context...',
    ko: '새로운 전체 설명...',
  },
  shortDescription: {
    en: 'Short version for meta tags (under 160 chars)',
    ko: '메타 태그용 짧은 버전',
  },
}
```

- `description`: Full description, used in JSON-LD (AI reads this)
- `shortDescription`: For meta tags (Google preview)

### Add/Remove Keywords

Edit `utils/seo.ts`:

```typescript
export const seoKeywords = {
  primary: ['mentoring', 'new-keyword'],
  secondary: ['career advice', 'another-keyword'],
  korean: ['멘토링', '새 키워드'],
}
```

### Update JSON-LD (Structured Data)

Edit the schema objects in `utils/seo.ts`:

```typescript
export const organizationJsonLd = {
  '@type': 'Organization',
  name: siteConfig.name,
  // Add logo when available:
  logo: `${siteConfig.url}/logo.png`,
  // Add social profiles:
  sameAs: [
    'https://twitter.com/yourhandle',
    'https://linkedin.com/company/yourcompany',
  ],
}
```

### Block a New Route

Edit `utils/seo.ts`:

```typescript
export const protectedRoutes = [
  '/admin',
  '/login',
  // ...existing routes
  '/new-private-route',  // Add here
]
```

Both `robots.ts` and page layouts use this array.

### Add a Page to Sitemap

Edit `app/sitemap.ts`:

```typescript
return [
  { url: siteConfig.url, lastModified: new Date() },
  { url: `${siteConfig.url}/new-public-page`, lastModified: new Date() },
]
```

---

## How It Works

### Metadata Inheritance

```
app/layout.tsx (root - defines defaults)
    ↓ inherits
app/page.tsx (homepage - uses defaults)
    ↓ overrides
app/admin/layout.tsx (adds noindex)
```

Child layouts/pages can override specific fields.

### JSON-LD Injection

```typescript
// app/layout.tsx injects structured data into <head>
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", ... },
      { "@type": "WebSite", ... },
      { "@type": "Service", ... }
    ]
  }
</script>
```

AI models parse this to understand:
- **Who you are** (Organization)
- **What your site is** (WebSite)
- **What you offer** (Service)

---

## Verification

```bash
npm run build   # Should succeed
npm run dev     # Start server

# Check generated files:
# http://localhost:3000/robots.txt
# http://localhost:3000/sitemap.xml

# Validate JSON-LD:
# 1. View page source
# 2. Find <script type="application/ld+json">
# 3. Paste into: https://validator.schema.org/
```

---

## Protected Pages (noindex)

These pages have `robots: { index: false, follow: false }`:

- `/admin`
- `/login`
- `/signup`
- `/profile`
- `/forgot-password`
- `/reset-password`

Defined in `utils/seo.ts` → `protectedRoutes`

---

## Technical Advantages (Already Built-in)

| Requirement | Status | Why It Matters |
|-------------|--------|----------------|
| Server-Side Rendering | ✅ Next.js | AI crawlers can't execute JS |
| Fast TTFB | ✅ Static generation | AI crawlers expect <200ms |
| Semantic HTML | ✅ React components | Clear content structure |
| Bilingual content | ✅ en/ko support | Broader reach |

---

## Future Enhancements

When ready, uncomment in `utils/seo.ts`:

- [ ] Add `logo` to organizationJsonLd
- [ ] Add `sameAs` social profiles
- [ ] Add `potentialAction` for site search
- [ ] Create FAQ schema for common questions
- [ ] Add individual mentor profile pages to sitemap

---

## Resources

- [Schema.org Validator](https://validator.schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Next.js Metadata Docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
