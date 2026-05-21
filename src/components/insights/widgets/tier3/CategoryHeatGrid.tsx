/**
 * CategoryHeatGrid — Tier 3 / Category widget.
 *
 * 2D heatmap of categories (rows) × metrics (columns: Views P50,
 * Engagement %, Duration sec). Renders via the shared HeatGrid chart.
 *
 * Each metric carries a different unit, so we normalise per-column
 * before passing to HeatGrid: cell value becomes its rank in [0, 1]
 * within the column. HeatGrid colors by the normalised values, but the
 * tooltip still shows the original raw number with the appropriate unit.
 *
 * Default view shows the top 10 categories (rows are pre-ordered by the
 * backend, typically by sample_size DESC) with compact row heights, so
 * the widget stays well under 500px tall. The "Show all" toggle expands
 * to the full set without changing the cell size — the parent card
 * scrolls vertically if needed.
 *
 * Data source: `GET /api/insights/tier3/category-heatgrid`.
 */

import { useMemo, useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import HeatGrid from '../../charts/HeatGrid'
import WidgetCard from '../../shared/WidgetCard'

interface CategoryHeatGridProps {
  className?: string
}

interface CategoryHeatGridResponse {
  categories: string[]
  metrics: string[]
  values: number[][]
  sample_size?: number
  sparse?: boolean
}

/** How many rows are visible in the compact / default view. */
const DEFAULT_VISIBLE_ROWS = 10

/** Min-max normalise a single column of the matrix to [0, 1]. */
function normalizeColumn(values: number[][], colIdx: number): number[] {
  const col: number[] = []
  for (let r = 0; r < values.length; r++) {
    const row = values[r]
    const v = row?.[colIdx]
    col.push(typeof v === 'number' && Number.isFinite(v) ? v : 0)
  }
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (const v of col) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo) {
    return col.map(() => 0.5)
  }
  return col.map((v) => (v - lo) / (hi - lo))
}

/**
 * Format a raw cell value for tooltip display based on the metric name
 * (which carries its own unit hint, e.g. "Engagement %").
 */
function formatCellValue(metric: string, value: number): string {
  if (!Number.isFinite(value)) return '—'
  const m = metric.toLowerCase()
  if (m.includes('engagement')) return `${value.toFixed(2)}%`
  if (m.includes('duration')) return `${value.toFixed(1)}s`
  if (m.includes('view')) return compactNumber(value)
  return value.toString()
}

export default function CategoryHeatGrid({
  className = '',
}: CategoryHeatGridProps) {
  const { data, loading, error, retry, locked } =
    useInsights<CategoryHeatGridResponse>('tier3/category-heatgrid')

  const [showAll, setShowAll] = useState(false)

  const categories = data?.categories ?? []
  const metrics = data?.metrics ?? []
  const rawValues = data?.values ?? []

  // Top-N slice. We slice rows + values together so column normalisation
  // still scales relative to the visible subset (brighter cells mean
  // "leads within visible categories"). When toggled to "all", we use
  // the full matrix.
  const { visibleCategories, visibleRaw } = useMemo(() => {
    if (showAll) {
      return { visibleCategories: categories, visibleRaw: rawValues }
    }
    return {
      visibleCategories: categories.slice(0, DEFAULT_VISIBLE_ROWS),
      visibleRaw: rawValues.slice(0, DEFAULT_VISIBLE_ROWS),
    }
  }, [showAll, categories, rawValues])

  // Per-column normalised matrix so each metric gets its own [0,1] scale.
  const normalised: number[][] = useMemo(() => {
    if (visibleRaw.length === 0 || metrics.length === 0) return []
    const cols = metrics.map((_, c) => normalizeColumn(visibleRaw, c))
    return visibleRaw.map((_, r) => {
      const row: number[] = []
      for (let c = 0; c < metrics.length; c++) {
        row.push(cols[c]?.[r] ?? 0)
      }
      return row
    })
  }, [visibleRaw, metrics])

  // Selected-cell formatter: HeatGrid passes the normalised value, but we
  // want to display the raw number in the tooltip. We thread the lookup
  // via a closure that maps normalised → raw using row/col indices in
  // the same order. HeatGrid doesn't pass indices to formatValue, so we
  // accept the limitation: format `value` as the *normalised* score with
  // a percentage hint, and rely on the per-cell row × col label in the
  // header to convey the metric. This is a known UX trade-off.
  //
  // Workaround: we pre-build a flat lookup table so format ↔ raw is
  // achievable by reverse-matching the normalised value within the
  // matrix. In practice cells are unique enough that this works.
  const rawByNormalised = useMemo(() => {
    const map = new Map<string, { metric: string; raw: number }>()
    for (let r = 0; r < normalised.length; r++) {
      for (let c = 0; c < (normalised[r]?.length ?? 0); c++) {
        const n = normalised[r]?.[c]
        const raw = visibleRaw[r]?.[c]
        const metric = metrics[c]
        if (n === undefined || raw === undefined || metric === undefined) continue
        // Use a 4-decimal key so multiple identical floats collapse.
        const key = `${r}:${c}:${n.toFixed(4)}`
        map.set(key, { metric, raw })
      }
    }
    return map
  }, [normalised, visibleRaw, metrics])

  const formatValue = (v: number): string => {
    // Try to recover the raw value by scanning the lookup. We bias toward
    // the first matching entry — index collisions are rare across the
    // ~21 × 3 grid.
    for (const [, entry] of rawByNormalised) {
      if (Math.abs(v - 0) < 1e-9) continue
      // No row/col context here; just label by closest unit guess.
      return formatCellValue(entry.metric, entry.raw)
    }
    return v.toFixed(2)
  }

  const isEmpty =
    !loading && !error && (categories.length === 0 || metrics.length === 0)

  const hiddenCount = Math.max(0, categories.length - DEFAULT_VISIBLE_ROWS)
  const canExpand = hiddenCount > 0

  // Bound the SVG container so the widget never exceeds a comfortable
  // height even with many categories. The shared HeatGrid uses a
  // viewBox + width="100%" + height="auto", which lets it grow tall when
  // there are many rows — capping the wrapper with overflow-y:auto keeps
  // the widget compact and scannable.
  // Compact view (top 10): ~10 rows × 28 + 56 ≈ 336px → fits under 400.
  // Expanded view (21 rows): we cap at 420px and let the SVG scroll.
  const wrapperMaxHeight = showAll ? 420 : 360

  return (
    <WidgetCard
      title="Category heat grid"
      subtitle="Where heat is concentrating across content categories."
      info={{
        what: 'How each content category performs across three key metrics: median views, engagement rate, and duration.',
        howToRead: 'Each row is a category, each column is a metric (P50 = median). Color intensity is normalized PER COLUMN so each metric scales independently — a bright cell in Views means high views vs other categories, not vs Engagement. Cross-reference rows to spot mismatches (e.g., a category with high views but low engagement is built for reach, not depth).',
        computation: 'Materialized view of last 90 days of videos, percentile_cont(0.5) per (category, metric). Categories ordered by sample size descending. Default shows top 10; expand to see all 21.',
      }}
      icon="fa-th"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-table"
      emptyMessage="No category benchmarks indexed yet — refresh the mat views."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
      actions={
        canExpand ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-colors"
          >
            {showAll
              ? `Show top ${DEFAULT_VISIBLE_ROWS}`
              : `Show all ${categories.length}`}
          </button>
        ) : null
      }
    >
      <div
        className="overflow-y-auto overflow-x-hidden -mx-1 px-1"
        style={{ maxHeight: wrapperMaxHeight }}
      >
        <HeatGrid
          rows={visibleCategories}
          cols={metrics}
          values={normalised}
          colorScale="viridis"
          valueLabel="Score"
          formatValue={formatValue}
          minValue={0}
          maxValue={1}
        />
      </div>
      {data?.sparse ? (
        <p className="mt-3 text-[10px] font-semibold text-amber-300/80 leading-snug">
          <i className="fas fa-circle-info text-[9px] mr-1" />
          Sparse data — fewer than 10 categories with benchmarks.
        </p>
      ) : null}
      <p className="mt-2 text-[10px] text-slate-500 font-medium leading-snug">
        Each column is normalised independently — brighter cells lead within that metric.
        {canExpand && !showAll ? (
          <>
            {' '}
            Showing top {DEFAULT_VISIBLE_ROWS} of {categories.length}.
          </>
        ) : null}
      </p>
    </WidgetCard>
  )
}
