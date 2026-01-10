import { MetadataRoute } from 'next'
import { siteConfig } from '@/utils/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login', '/signup', '/profile', '/forgot-password', '/reset-password'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
