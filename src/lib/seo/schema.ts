// JSON-LD schema builders.
//
// Each builder returns a plain object with `@context: 'https://schema.org'` so it
// can be serialized directly into a `<script type="application/ld+json">` tag.
// Per-entity `@id` IRIs reference the sitewide @graph in `index.html` so search
// engines treat the Organization/WebSite as a single canonical entity.

import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_ID,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from './constants'

type JsonLd = Record<string, unknown>

// ---------- Organization ----------

export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo-dark.png`,
    sameAs: ['https://www.instagram.com/bloss.ai/'],
  }
}

// ---------- WebSite ----------

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

// ---------- SoftwareApplication ----------

export interface SoftwareApplicationOptions {
  /** Display price string. Defaults to '0' (free tier). */
  priceText?: string
}

export function softwareApplicationSchema(
  opts?: SoftwareApplicationOptions,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    url: `${SITE_URL}/`,
    publisher: { '@id': ORGANIZATION_ID },
    offers: {
      '@type': 'Offer',
      price: opts?.priceText ?? '0',
      priceCurrency: 'USD',
    },
  }
}

// ---------- BreadcrumbList ----------

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ---------- FAQPage ----------

export interface FaqEntry {
  question: string
  answer: string
}

export function faqSchema(items: FaqEntry[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

// ---------- BlogPosting ----------

export interface BlogPostingAuthor {
  name: string
  /** Optional URL identifying the Person (profile page or external sameAs). */
  url?: string
}

export interface BlogPostingOptions {
  /** Canonical URL of the post. */
  url: string
  headline: string
  description: string
  /** ISO-8601 publication date. */
  datePublished: string
  /** ISO-8601 last-modified date. Defaults to `datePublished` when omitted. */
  dateModified?: string
  author: BlogPostingAuthor
  /** Absolute URL to the post hero/OG image. */
  image?: string
  /** Optional tag list rendered as `keywords`. */
  keywords?: string[]
}

export function blogPostingSchema(opts: BlogPostingOptions): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${opts.url}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': opts.url,
    },
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: {
      '@type': 'Person',
      name: opts.author.name,
      ...(opts.author.url ? { url: opts.author.url } : {}),
    },
    publisher: { '@id': ORGANIZATION_ID },
    image: opts.image ?? DEFAULT_OG_IMAGE,
    url: opts.url,
    ...(opts.keywords && opts.keywords.length > 0
      ? { keywords: opts.keywords.join(', ') }
      : {}),
  }
}
