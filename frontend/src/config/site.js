/**
 * Site-wide configuration for production deployment.
 * Update these values for your production environment.
 */

/** Display name across the product (navbar, legal copy, emails meta). */
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'CareerSync'

/** Short mark in the header logo chip (e.g. CS). */
export const SITE_LOGO_MARK = import.meta.env.VITE_SITE_LOGO_MARK || 'CS'

/** Production site URL - used for SEO, sitemap, canonical URLs */
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://careersync.example.com'

/** Public support inbox (Contact page, footers). Override with VITE_SUPPORT_EMAIL in env. */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@careersync.com'

/** Google Analytics measurement ID (e.g. G-XXXXXXXXXX). Set to empty to disable. */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

/** Social media links - company pages, not personal profiles */
export const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/company/careersync',
    icon: 'linkedin',
  },
  {
    label: 'Twitter',
    href: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/careersync',
    icon: 'twitter',
  },
  {
    label: 'Facebook',
    href: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/careersync',
    icon: 'facebook',
  },
  {
    label: 'Instagram',
    href: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/careersync',
    icon: 'instagram',
  },
].filter((link) => link.href)
