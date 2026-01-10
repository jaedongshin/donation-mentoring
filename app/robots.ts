import { MetadataRoute } from 'next'
import { siteConfig, aiCrawlers, protectedRoutes } from '@/utils/seo'

/**
 * Generates robots.txt
 *
 * Strategy:
 * 1. Allow all crawlers (traditional + AI) to index public content
 * 2. Explicitly welcome AI crawlers for better AI search visibility
 * 3. Block protected/auth routes from all crawlers
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [...protectedRoutes],
      },
      // Explicitly allow AI crawlers (signals welcome)
      // While technically redundant with '*', this explicit allow
      // ensures AI platforms know they're welcome
      ...aiCrawlers.map((crawler) => ({
        userAgent: crawler,
        allow: '/',
        disallow: [...protectedRoutes],
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
