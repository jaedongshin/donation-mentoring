# SEO Deployment Guide

Guide for deployment engineers to configure SEO after deploying Donation Mentoring.

**Default URL**: `https://www.donation-mentoring.org` (works out of the box)

---

## Post-Deployment: Submit to Search Engines

After deployment is live, submit your sitemap for faster indexing.

### Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **Domain** and enter: `donation-mentoring.org`
4. Verify ownership via DNS TXT record:
   - Add TXT record to DNS: `google-site-verification=XXXXX`
   - Wait for DNS propagation (up to 48 hours)
5. Once verified, go to **Sitemaps** in left sidebar
6. Submit: `https://www.donation-mentoring.org/sitemap.xml`
7. Check **Coverage** report for indexing status

### Bing Webmaster Tools

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Sign in with Microsoft account
3. Click **Add Site**
4. Enter: `https://www.donation-mentoring.org`
5. Verify via:
   - Option 1: XML file upload
   - Option 2: Meta tag (already in our HTML)
   - Option 3: DNS CNAME record
6. Go to **Sitemaps** → Submit: `https://www.donation-mentoring.org/sitemap.xml`

### Optional: Other Search Engines

| Search Engine | Webmaster Tool |
|---------------|----------------|
| Yandex | [webmaster.yandex.com](https://webmaster.yandex.com) |
| Baidu | [ziyuan.baidu.com](https://ziyuan.baidu.com) |
| Naver (Korea) | [searchadvisor.naver.com](https://searchadvisor.naver.com) |

---

## Domain Configuration

### Verify Domain Consistency

Make sure your domain setup is consistent:

```
www.donation-mentoring.org  ← Default URL in code
```

If someone visits `donation-mentoring.org` (no www), it should redirect to `www.donation-mentoring.org`.

### Cloudflare DNS Setup

Since the domain is registered with Cloudflare:

1. Go to **Cloudflare Dashboard → donation-mentoring.org → DNS**
2. Add DNS records pointing to your hosting:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `www` | `your-vercel-app.vercel.app` | Proxied (orange) |
| CNAME | `@` | `your-vercel-app.vercel.app` | Proxied (orange) |

3. Set up www redirect (choose one method):

#### Option A: Cloudflare Redirect Rules (Recommended)

1. Go to **Rules → Redirect Rules**
2. Create rule:
   - **Name**: `Redirect non-www to www`
   - **When**: Hostname equals `donation-mentoring.org`
   - **Then**: Dynamic redirect to `https://www.donation-mentoring.org${http.request.uri.path}`
   - **Status code**: 301

#### Option B: Cloudflare Page Rules (Legacy)

1. Go to **Rules → Page Rules**
2. Create rule:
   - **URL**: `donation-mentoring.org/*`
   - **Setting**: Forwarding URL (301)
   - **Destination**: `https://www.donation-mentoring.org/$1`

### Vercel Domain Setup (if using Vercel)

1. Go to **Vercel Dashboard → Project → Settings → Domains**
2. Add: `www.donation-mentoring.org`
3. Vercel will provide a CNAME target (e.g., `cname.vercel-dns.com`)
4. Use this target in your Cloudflare DNS records above

### Cloudflare SSL Settings

1. Go to **SSL/TLS → Overview**
2. Set mode to **Full (strict)**
3. Go to **Edge Certificates**
4. Enable **Always Use HTTPS**

---

## Verification Checklist

After deployment, verify these URLs work:

```bash
# Should return robots.txt content
curl https://www.donation-mentoring.org/robots.txt

# Should return XML sitemap
curl https://www.donation-mentoring.org/sitemap.xml
```

### robots.txt Should Contain

```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /login
...

User-Agent: GPTBot
Allow: /
...

Sitemap: https://www.donation-mentoring.org/sitemap.xml
```

### sitemap.xml Should Contain

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.donation-mentoring.org</loc>
    ...
  </url>
</urlset>
```

### HTML Head Should Contain

View page source and verify:

```html
<title>Donation Mentoring - Connect with Mentors for a Cause</title>
<meta name="description" content="Connect with experienced mentors...">
<meta property="og:title" content="Donation Mentoring">
<script type="application/ld+json">{"@context":"https://schema.org"...}</script>
```

---

## Monitoring & Maintenance

### Google Search Console (Weekly)

Check:
- **Coverage**: Any indexing errors?
- **Performance**: Search impressions and clicks
- **Enhancements**: Any structured data issues?

### Update Sitemap When Adding Pages

If you add new public pages (e.g., `/about`, `/faq`), update:

**File**: `app/sitemap.ts`

```typescript
return [
  { url: siteConfig.url, lastModified: new Date() },
  { url: `${siteConfig.url}/about`, lastModified: new Date() },  // Add new pages
]
```

---

## Troubleshooting

### robots.txt Not Updating

```bash
# Rebuild and redeploy
npm run build
# Deploy to hosting
```

### Search Console Shows Errors

Common issues:
- **Redirect errors**: Check www/non-www consistency
- **404 errors**: Old pages removed, add redirects or remove from sitemap
- **Blocked by robots.txt**: Check `app/robots.ts` disallow rules

---

## Optional: Custom Domain URL

If using a different domain (e.g., staging, custom domain), set the environment variable.

### Environment Variable

Add to your hosting environment:

```bash
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
```

This URL is used in:
- `robots.txt` (sitemap reference)
- `sitemap.xml` (page URLs)
- Meta tags (canonical URLs, OpenGraph)
- JSON-LD structured data

**Location in code**: `utils/seo.ts`

```typescript
url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.donation-mentoring.org'
```

### Vercel Environment Variables

1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**
2. Add:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-custom-domain.com` | Production |

3. **Redeploy** after adding variables (required for changes to take effect)

### Self-Hosting

Add to `.env.production`:

```bash
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
```

Then rebuild:

```bash
npm run build
```

---

## Contact

For SEO configuration questions, refer to:
- `docs/SEO.md` - Technical SEO documentation
- `utils/seo.ts` - SEO configuration source code
