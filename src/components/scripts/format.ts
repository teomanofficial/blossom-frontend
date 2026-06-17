/**
 * Number formatting helpers shared across Script Studio surfaces.
 * Mirrors the treatment used on outlier video cards so provenance
 * badges read identically (e.g. "7.2M", "114x").
 */

/** Compact count formatting: 7_200_000 → "7.2M", 7_200 → "7.2k".
 *  Accepts strings too — pg serializes BIGINT/NUMERIC as strings over JSON. */
export function compactCount(value: number | string | null | undefined): string {
  const n = value == null ? NaN : Number(value)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

/**
 * Outlier multiple label. ≥100x drops the decimal so "700x" reads clean;
 * under 100x keeps one decimal ("4.3x"). Accepts strings too (pg NUMERIC).
 */
export function formatMultiple(value: number | string | null | undefined): string {
  const multiple = value == null ? NaN : Number(value)
  if (!Number.isFinite(multiple) || multiple <= 0) return '0x'
  if (multiple >= 100) return `${Math.round(multiple)}x`
  return `${multiple.toFixed(1).replace(/\.0$/, '')}x`
}

/** Estimated spoken duration in seconds from a word count (~2.5 words/sec). */
export function estimateDurationSeconds(wordCount: number | null | undefined): number {
  if (!wordCount || wordCount <= 0) return 0
  return Math.round(wordCount / 2.5)
}

/** Human "0:45" / "1:20" style label from a second count. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
