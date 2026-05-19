// Public barrel for the SEO library.
// Import from `@/lib/seo` (or relative equivalent) — never from a sub-module
// directly — so internal refactors don't break callers.

export { Seo } from './Seo'
export type { SeoProps, OgType } from './Seo'

export {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_ID,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
  WEBSITE_ID,
} from './constants'

export {
  blogPostingSchema,
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from './schema'
export type {
  BlogPostingAuthor,
  BlogPostingOptions,
  BreadcrumbItem,
  FaqEntry,
  SoftwareApplicationOptions,
} from './schema'
