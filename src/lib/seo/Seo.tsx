// React 19 native document metadata.
//
// React 19 hoists `<title>`, `<meta>`, `<link>`, and `<script>` tags rendered
// inside any component up into `<head>` automatically — so no provider, no
// `react-helmet-async`, no portals required. We rely on that here.
//
// Refs:
//   https://react.dev/blog/2024/04/25/react-19#support-for-metadata-tags
//   https://react.dev/reference/react-dom/components/script
//
// On the SSR / static prerender path there is no `window`, so we guard the
// canonical-from-pathname fallback with `typeof window !== 'undefined'` and
// simply omit the `<link rel="canonical">` if neither a prop nor a window is
// available — better to emit no canonical than the wrong one.

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from './constants'

export type OgType = 'website' | 'article' | 'product'

export interface SeoProps {
  /** Full `<title>` text. */
  title: string
  /** Meta description (~155 chars). */
  description: string
  /** Absolute canonical URL. Derived from `window.location.pathname` if omitted. */
  canonical?: string
  /** Absolute URL of the OG/Twitter card image. */
  ogImage?: string
  /** Open Graph type. Defaults to `website`. */
  ogType?: OgType
  /** When true, emits `noindex,nofollow` instead of the index directive. */
  noindex?: boolean
  /** One or more JSON-LD objects to emit as `<script type="application/ld+json">` tags. */
  jsonLd?: object | object[]
}

function resolveCanonical(canonical?: string): string | undefined {
  if (canonical) return canonical
  if (typeof window === 'undefined') return undefined
  // window.location.pathname keeps the leading slash and excludes search/hash —
  // exactly what we want for canonicals.
  return `${SITE_URL}${window.location.pathname}`
}

export function Seo({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const resolvedCanonical = resolveCanonical(canonical)
  const image = ogImage ?? DEFAULT_OG_IMAGE
  const robots = noindex
    ? 'noindex,nofollow'
    : 'index,follow,max-image-preview:large,max-snippet:-1'

  const jsonLdEntries: object[] = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : []

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD — one <script> per entry */}
      {jsonLdEntries.map((entry, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Per react.dev, dangerouslySetInnerHTML is the only way to emit a
          // raw JSON-LD payload; React will not escape its children safely for
          // this case. JSON.stringify produces strictly safe JSON.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}

export default Seo
