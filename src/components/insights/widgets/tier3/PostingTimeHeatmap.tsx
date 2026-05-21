/**
 * PostingTimeHeatmap (Tier 3 / Category widget).
 *
 * Day × hour heat grid showing when viral content in a niche tends to
 * post. Delegates the actual rendering to the shared
 * `<PostingTimeHeatmap>` chart from `charts/`; this component layers in
 * the data fetch, niche filter, and contextual header copy.
 *
 * Data source: `GET /api/insights/tier3/posting-time-heatmap?niche=`.
 *
 * Response carries:
 *   - `data: number[][]`        — 7×24 avg engagement_rate matrix
 *   - `samples: number[][]`     — 7×24 sample-count matrix (used for caveat)
 *   - `sample_size: number`     — global total
 *   - `sparse: boolean`         — true when sample_size < 10
 */

import { useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import PostingTimeHeatmapChart from '../../charts/PostingTimeHeatmap'
import WidgetCard from '../../shared/WidgetCard'

interface PostingTimeHeatmapWidgetProps {
  className?: string
}

interface PostingTimeHeatmapResponse {
  data: number[][]
  samples: number[][]
  sample_size: number
  sparse: boolean
  niche: string | null
  day_labels: string[]
  hour_labels: number[]
}

function formatEngagementValue(v: number): string {
  if (!Number.isFinite(v)) return '—'
  // engagement_rate is stored as a fraction (0-1). Render as %.
  const pct = v <= 1 ? v * 100 : v
  return `${pct.toFixed(2)}%`
}

export default function PostingTimeHeatmapWidget({
  className = '',
}: PostingTimeHeatmapWidgetProps) {
  const [niche, setNiche] = useState<string>('')
  const nicheQ = niche.trim() ? `?niche=${encodeURIComponent(niche.trim())}` : ''

  const { data, loading, error, retry } = useInsights<PostingTimeHeatmapResponse>(
    `tier3/posting-time-heatmap${nicheQ}`,
  )

  const matrix = data?.data ?? []
  const sampleSize = data?.sample_size ?? 0
  const isEmpty = !loading && !error && sampleSize === 0

  const headerCopy =
    niche.trim().length > 0
      ? `When ${niche.trim()} posts get the most engagement`
      : 'When posts get the most engagement (all niches)'

  return (
    <WidgetCard
      title="Posting-time heatmap"
      subtitle={headerCopy}
      icon="fa-clock"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-clock"
      emptyMessage="No published_at + engagement data for this filter."
      size="md"
      className={className}
      actions={
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Niche (optional)"
          className="bg-slate-900/80 border border-white/10 rounded-full px-3 py-1 text-[11px] font-bold text-slate-200 w-32 sm:w-40 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
        />
      }
    >
      <PostingTimeHeatmapChart
        data={matrix}
        formatValue={formatEngagementValue}
        valueLabel="Avg engagement"
      />
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] text-slate-500 font-medium leading-snug">
          Cells colored by avg engagement rate; hover for the exact value.
        </p>
        <span className="text-[10px] font-bold text-slate-600 tabular-nums">
          n = {sampleSize.toLocaleString()}
        </span>
      </div>
      {data?.sparse ? (
        <p className="mt-2 text-[10px] font-semibold text-amber-300/80 leading-snug">
          <i className="fas fa-circle-info text-[9px] mr-1" />
          Sparse data — fewer than 10 samples in this filter; results may be noisy.
        </p>
      ) : null}
    </WidgetCard>
  )
}
