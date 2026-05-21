/**
 * CategoryHeatGrid — Tier 3 / Category widget.
 *
 * Compact horizontal heatmap: metrics are the 3 rows (Views P50,
 * Engagement %, Duration sec) and categories spread across as columns.
 * Categories outnumber metrics ~5:1, so a wide-and-short layout fits the
 * full set at a glance without scrolling.
 *
 * Each metric carries a different unit, so we normalise per-row before
 * passing to HeatGrid: cell value becomes its rank in [0, 1] within the
 * row. HeatGrid colors by the normalised values; the tooltip still shows
 * the original raw number with the appropriate unit.
 *
 * Data source: `GET /api/insights/tier3/category-heatgrid`.
 */

import { useMemo } from 'react'
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

/** Min-max normalise a single row of the matrix to [0, 1]. */
function normalizeRow(row: number[]): number[] {
  const safe = row.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0))
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (const v of safe) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo) {
    return safe.map(() => 0.5)
  }
  return safe.map((v) => (v - lo) / (hi - lo))
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

  const categories = data?.categories ?? []
  const metrics = data?.metrics ?? []
  const rawValues = data?.values ?? []

  // Transposed matrix: rows are metrics, columns are categories.
  // raw[c][m] in the source → transposed[m][c] for HeatGrid.
  const transposedRaw: number[][] = useMemo(() => {
    if (metrics.length === 0 || categories.length === 0) return []
    return metrics.map((_m, mi) => {
      const row: number[] = []
      for (let ci = 0; ci < categories.length; ci++) {
        const v = rawValues[ci]?.[mi]
        row.push(typeof v === 'number' && Number.isFinite(v) ? v : 0)
      }
      return row
    })
  }, [metrics, categories, rawValues])

  // Per-row normalised matrix so each metric gets its own [0,1] scale.
  const normalised: number[][] = useMemo(
    () => transposedRaw.map((row) => normalizeRow(row)),
    [transposedRaw],
  )

  // Reverse-lookup table to recover raw values + metric labels in the
  // tooltip (HeatGrid only passes the normalised value).
  const rawByNormalised = useMemo(() => {
    const map = new Map<string, { metric: string; raw: number }>()
    for (let r = 0; r < normalised.length; r++) {
      for (let c = 0; c < (normalised[r]?.length ?? 0); c++) {
        const n = normalised[r]?.[c]
        const raw = transposedRaw[r]?.[c]
        const metric = metrics[r]
        if (n === undefined || raw === undefined || metric === undefined) continue
        const key = `${r}:${c}:${n.toFixed(4)}`
        map.set(key, { metric, raw })
      }
    }
    return map
  }, [normalised, transposedRaw, metrics])

  const formatValue = (v: number): string => {
    for (const [, entry] of rawByNormalised) {
      if (Math.abs(v - 0) < 1e-9) continue
      return formatCellValue(entry.metric, entry.raw)
    }
    return v.toFixed(2)
  }

  const isEmpty =
    !loading && !error && (categories.length === 0 || metrics.length === 0)

  return (
    <WidgetCard
      title="Category heat grid"
      subtitle="Where heat is concentrating across content categories."
      info={{
        what: 'How each content category performs across three key metrics: median views, engagement rate, and duration.',
        howToRead: 'Each row is a metric (P50 = median), each column is a category. Color intensity is normalized PER ROW so each metric scales independently — a bright cell in the Views row means high views vs other categories, not vs Engagement. Scan a column to spot mismatches (e.g., bright Views but dim Engagement = built for reach, not depth).',
        computation: 'Materialized view of last 90 days of videos, percentile_cont(0.5) per (category, metric). Categories ordered by sample size descending.',
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
    >
      <div className="overflow-x-auto -mx-1 px-1">
        <HeatGrid
          rows={metrics}
          cols={categories}
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
        Each row is normalised independently — brighter cells lead within that metric.
      </p>
    </WidgetCard>
  )
}
