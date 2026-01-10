/**
 * SEO Configuration - Single Source of Truth
 *
 * This file centralizes all SEO-related configuration for:
 * - Traditional search engines (Google, Bing)
 * - AI search engines (ChatGPT, Perplexity, Claude, Gemini)
 * - Social sharing (OpenGraph, Twitter)
 * - Structured data (JSON-LD)
 */

// =============================================================================
// CORE SITE IDENTITY
// =============================================================================

export const siteConfig = {
  name: 'Donation Mentoring',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.donation-mentoring.org',

  description: {
    en: 'Connect with experienced mentors for donation-based mentoring sessions. Get career guidance, professional advice, and personal growth support from industry experts who donate their time.',
    ko: '기부 기반 멘토링 세션을 위한 경험 많은 멘토와 연결하세요. 시간을 기부하는 업계 전문가로부터 커리어 가이드, 전문적인 조언, 개인 성장 지원을 받으세요.',
  },

  // Short description for meta tags (under 160 chars)
  shortDescription: {
    en: 'Connect with experienced mentors for donation-based mentoring sessions',
    ko: '기부 기반 멘토링 세션을 위한 경험 많은 멘토와 연결하세요',
  },

  locale: 'en_US',
  alternateLocale: 'ko_KR',

  // Primary language, used in <html lang="">
  language: 'en',
} as const

// =============================================================================
// KEYWORDS & TOPICS (for AI context)
// =============================================================================

export const seoKeywords = {
  primary: [
    'mentoring',
    'donation mentoring',
    'career mentorship',
    'professional guidance',
    'mentor matching',
  ],
  secondary: [
    'career advice',
    'professional development',
    'industry experts',
    'volunteer mentors',
    'free mentoring',
  ],
  korean: [
    '멘토링',
    '기부 멘토링',
    '커리어 멘토십',
    '전문가 조언',
    '무료 멘토링',
  ],
} as const

// Combined for meta keywords
export const allKeywords = [
  ...seoKeywords.primary,
  ...seoKeywords.secondary,
  ...seoKeywords.korean,
]

// =============================================================================
// OPENGRAPH DEFAULTS
// =============================================================================

export const defaultOpenGraph = {
  siteName: siteConfig.name,
  locale: siteConfig.locale,
  type: 'website' as const,
}

// =============================================================================
// AI CRAWLERS CONFIGURATION
// =============================================================================

/**
 * AI search engine crawlers that should be allowed to index the site.
 * These are the user-agents for major AI platforms.
 *
 * Allowing these enables your content to appear in:
 * - ChatGPT responses (with citations)
 * - Perplexity AI answers
 * - Claude responses
 * - Google AI Overviews (SGE)
 * - Microsoft Copilot
 */
export const aiCrawlers = [
  // OpenAI
  'GPTBot',           // General ChatGPT training/indexing
  'OAI-SearchBot',    // ChatGPT search feature
  'ChatGPT-User',     // ChatGPT browsing mode

  // Anthropic
  'ClaudeBot',        // Claude AI
  'Claude-Web',       // Claude web browsing

  // Perplexity
  'PerplexityBot',    // Perplexity AI search

  // Google AI
  'Google-Extended',  // Google Gemini/Bard AI features

  // Microsoft
  'Bingbot',          // Already allowed by default, powers Copilot
] as const

// =============================================================================
// STRUCTURED DATA (JSON-LD)
// =============================================================================

/**
 * Organization schema - Defines who you are as an entity.
 * AI models use this to understand your organization.
 */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description.en,
  // Add these when available:
  // logo: `${siteConfig.url}/logo.png`,
  // sameAs: [
  //   'https://twitter.com/donationmentoring',
  //   'https://linkedin.com/company/donationmentoring',
  // ],
}

/**
 * WebSite schema - Defines the website with search capability.
 * Enables sitelinks search box in Google.
 */
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description.en,
  inLanguage: ['en', 'ko'],
  // Uncomment when you have site search:
  // potentialAction: {
  //   '@type': 'SearchAction',
  //   target: `${siteConfig.url}/search?q={search_term_string}`,
  //   'query-input': 'required name=search_term_string',
  // },
}

/**
 * Service schema - Defines the mentoring service offering.
 * Helps AI understand what you provide.
 */
export const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Donation-Based Mentoring',
  description: 'One-on-one mentoring sessions with experienced professionals who donate their time to help others grow.',
  provider: {
    '@type': 'Organization',
    name: siteConfig.name,
  },
  serviceType: 'Mentoring',
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Job seekers, career changers, professionals seeking guidance',
  },
  // Free service indicator
  isRelatedTo: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free donation-based mentoring',
  },
}

/**
 * Combined JSON-LD for the homepage.
 * Use this in the root layout.
 */
export const homePageJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationJsonLd,
    websiteJsonLd,
    serviceJsonLd,
  ],
}

// =============================================================================
// PROTECTED ROUTES (noindex)
// =============================================================================

/**
 * Routes that should not be indexed by any crawler.
 * Used in robots.ts and for page-level metadata.
 */
export const protectedRoutes = [
  '/admin',
  '/login',
  '/signup',
  '/profile',
  '/forgot-password',
  '/reset-password',
  '/api',
] as const
