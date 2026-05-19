// Canonical SEO constants for Blossom.
// These are referenced everywhere meta tags, canonicals, and JSON-LD are produced.

export const SITE_URL = 'https://blossai.com'
export const SITE_NAME = 'Blossom'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-dark.png`

export const TWITTER_HANDLE = '@blossai_goviral'

// Stable IRIs for the sitewide @graph entities defined in index.html.
// Per-page JSON-LD references these via @id so search engines de-duplicate.
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
