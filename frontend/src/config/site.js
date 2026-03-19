/**
 * Site-wide configuration for production deployment.
 * Update these values for your production environment.
 */

/** Production site URL - used for SEO, sitemap, canonical URLs */
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://jobportal.example.com'

/** Google Analytics measurement ID (e.g. G-XXXXXXXXXX). Set to empty to disable. */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

/** Social media links - company pages, not personal profiles */
export const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/company/jobportal',
    icon: 'linkedin',
  },
  {
    label: 'Twitter',
    href: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/jobportal',
    icon: 'twitter',
  },
  {
    label: 'Facebook',
    href: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/jobportal',
    icon: 'facebook',
  },
  {
    label: 'Instagram',
    href: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/jobportal',
    icon: 'instagram',
  },
].filter((link) => link.href)
