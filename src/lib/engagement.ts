/**
 * Engagement rate as a clamped 0–100 percentage.
 *
 * Recompute from raw counts instead of trusting a stored `engagement_rate`
 * scalar. The stored value is written once at ingest and can be stale or
 * inflated (e.g. computed when the platform returned a much smaller view
 * count), producing values that are 10x too high or exceed 100%.
 *
 * Accepts both `content_uploads` shape (comments_count) and
 * `content_videos` shape (comments). Falls back to the stored value
 * (still clamped) only when there is no usable view count.
 */
export function engagementRatePct(m: {
  views?: number | null
  likes?: number | null
  comments_count?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  engagement_rate?: number | null
} | null | undefined): number | null {
  const views = Number(m?.views) || 0
  const eng =
    (Number(m?.likes) || 0) +
    (Number(m?.comments_count ?? m?.comments) || 0) +
    (Number(m?.shares) || 0) +
    (Number(m?.saves) || 0)

  if (views > 0) return Math.min(100, (eng / views) * 100)

  const stored = Number(m?.engagement_rate)
  return Number.isFinite(stored) && stored > 0 ? Math.min(100, stored) : null
}
