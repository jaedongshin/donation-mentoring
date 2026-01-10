// SEO configuration constants
// Centralized for DRY - update values here, reflected across all pages

export const siteConfig = {
  name: 'Donation Mentoring',
  url: 'https://www.donation-mentoring.org',
  description: {
    en: 'Connect with experienced mentors for donation-based mentoring sessions',
    ko: '기부 기반 멘토링 세션을 위한 경험 많은 멘토와 연결하세요',
  },
  locale: 'en_US',
  alternateLocale: 'ko_KR',
} as const

// Reusable OpenGraph defaults
export const defaultOpenGraph = {
  siteName: siteConfig.name,
  locale: siteConfig.locale,
  type: 'website' as const,
}
