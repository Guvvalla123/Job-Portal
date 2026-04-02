import { Helmet } from 'react-helmet-async'
import { SITE_NAME, SITE_URL as CONFIG_SITE_URL } from '../config/site.js'

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : CONFIG_SITE_URL

/**
 * Reusable SEO component for per-route meta tags.
 * Use with HelmetProvider (already in main.jsx).
 */
export function SeoHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Find Your Dream Job`
  const fullDescription =
    description ||
    `Find your dream job on ${SITE_NAME}. Connect with top employers and discover opportunities that match your skills.`
  const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`) : SITE_URL
  const fullOgImage = ogImage || `${SITE_URL}/og-image.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {canonical && <link rel="canonical" href={fullCanonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
    </Helmet>
  )
}
