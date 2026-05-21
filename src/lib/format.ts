/**
 * Shared number/value formatters for the insights dashboard.
 *
 * Multiple components ship their own `formatNumber` / `compact` helpers
 * (see analysis/helpers.ts, OutlierFeed.tsx, Suggestions.tsx). The Tier
 * 0 widgets — and future tier widgets — should consume these instead so
 * the abbreviation rules stay consistent.
 *
 * Keep this file dependency-free: zero React, zero side-effects, so it
 * can be imported from anywhere in the frontend tree.
 */

/**
 * Compact-format a count: 1234 → "1.2k", 1_500_000 → "1.5M".
 *
 * Returns `'0'` for non-finite / negative inputs to keep callers from
 * having to guard. Strips trailing `.0` so "5.0k" reads as "5k".
 */
export function compactNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return String(Math.round(n))
}

/**
 * Render a multiplier badge string: 9.5 → "9.5×", 12.7 → "12.7×",
 * 100+ → "100×". Used by breakouts (z-score multiple of normal).
 */
export function formatMultiplier(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0×'
  if (value >= 100) return `${Math.round(value)}×`
  if (value >= 10) return `${value.toFixed(1).replace(/\.0$/, '')}×`
  return `${value.toFixed(1).replace(/\.0$/, '')}×`
}

/**
 * Format a percentage with one decimal, suffixed with `%`.
 * Accepts either ratios (0-1) or already-scaled (0-100).
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const pct = Math.abs(value) <= 1 ? value * 100 : value
  return `${pct.toFixed(1).replace(/\.0$/, '')}%`
}

/**
 * Format a signed percentage change with an arrow prefix.
 *   +12.4 → "↑ 12.4%",  -8.0 → "↓ 8%".
 * Used by Algorithm Weather signal pills.
 */
export function formatChangePercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→'
  const abs = Math.abs(value)
  return `${arrow} ${abs.toFixed(1).replace(/\.0$/, '')}%`
}
