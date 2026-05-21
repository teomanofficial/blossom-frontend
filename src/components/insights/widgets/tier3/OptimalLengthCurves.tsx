/**
 * OptimalLengthCurves — Tier 3 Anatomy widget showing the "sweet spot"
 * duration buckets for both the hook seconds and the total video
 * length, comparing the top-decile slice against all videos in the
 * scope.
 *
 * Backend: `GET /api/insights/tier3/optimal-lengths`
 *   → {
 *       hook:     { top_decile_buckets, all_buckets, bucket_edges },
 *       duration: { top_decile_buckets, all_buckets, bucket_edges },
 *       niche
 *     }
 *
 * Hook histogram: 20 buckets between 0 and 10 s (0.5 s wide).
 * Duration histogram: 24 buckets between 0 and 120 s (5 s wide).
 *
 * Visual treatment: pure-SVG overlapping histograms. We don't reach
 * for Recharts because the chart is small (24 bars max) and we need
 * the "two distributions on top of each other" overlay pattern, which
 * is awkward in Recharts. The grey/translucent layer is the "all
 * videos" distribution; the colored layer on top is the "top decile".
 * Where the two diverge is where the sweet spot lives.
 */

import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'

interface BucketSeries {
  top_decile_buckets: number[]
  all_buckets: number[]
  bucket_edges: number[]
}

interface OptimalLengthsResponse {
  hook: BucketSeries
  duration: BucketSeries
  niche: string | null
}

interface OptimalLengthCurvesProps {
  className?: string
  niche?: string
}

export default function OptimalLengthCurves({
  className = '',
  niche,
}: OptimalLengthCurvesProps) {
  const path = niche
    ? `tier3/optimal-lengths?niche=${encodeURIComponent(niche)}`
    : 'tier3/optimal-lengths'
  const { data, loading, error, retry, locked } = useInsights<OptimalLengthsResponse>(path)

  const hookHasData =
    (data?.hook.top_decile_buckets.some((n) => n > 0) ?? false) ||
    (data?.hook.all_buckets.some((n) => n > 0) ?? false)
  const durHasData =
    (data?.duration.top_decile_buckets.some((n) => n > 0) ?? false) ||
    (data?.duration.all_buckets.some((n) => n > 0) ?? false)
  const isEmpty = !loading && !error && !hookHasData && !durHasData

  return (
    <WidgetCard
      title="Optimal Length Curves"
      subtitle="Where the top-decile cluster diverges from the average — that gap is the sweet spot."
      icon="fa-wave-square"
      iconBg="bg-emerald-500/15"
      iconColor="text-emerald-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-wave-square"
      emptyMessage="Not enough analysed videos to build length distributions yet."
      size="md"
      className={className}
      locked={locked}
      tier={3}
    >
      {data ? (
        <div className="space-y-5">
          <HistogramRow
            label="Hook duration"
            unit="s"
            series={data.hook}
            color="#34d399" // emerald-400
          />
          <HistogramRow
            label="Total duration"
            unit="s"
            series={data.duration}
            color="#22d3ee" // cyan-400
          />
        </div>
      ) : null}
      <div className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-white/10" />
          <span className="text-slate-400">All videos</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-emerald-400/70" />
          <span className="text-slate-400">Top decile</span>
        </span>
      </div>
    </WidgetCard>
  )
}

function HistogramRow({
  label,
  unit,
  series,
  color,
}: {
  label: string
  unit: string
  series: BucketSeries
  color: string
}) {
  const { top_decile_buckets, all_buckets, bucket_edges } = series
  const n = top_decile_buckets.length
  // Normalise each series independently to a 0-1 share so the visual
  // comparison stays about *shape* not absolute volume (top-decile is
  // ~10% of all_buckets by definition).
  const topTotal = top_decile_buckets.reduce((a, b) => a + b, 0) || 1
  const allTotal = all_buckets.reduce((a, b) => a + b, 0) || 1
  const topShares = top_decile_buckets.map((v) => v / topTotal)
  const allShares = all_buckets.map((v) => v / allTotal)
  const maxShare = Math.max(...topShares, ...allShares, 0.01)

  // Find the modal top-decile bucket — surface as a "sweet spot" caption.
  let modalIdx = 0
  for (let i = 1; i < topShares.length; i++) {
    if ((topShares[i] ?? 0) > (topShares[modalIdx] ?? 0)) modalIdx = i
  }
  const sweetSpotLo = bucket_edges[modalIdx] ?? 0
  const sweetSpotHi = bucket_edges[modalIdx + 1] ?? sweetSpotLo

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
          {label}
        </h4>
        {topTotal > 1 ? (
          <span className="text-[10px] text-slate-500">
            Sweet spot{' '}
            <span className="text-emerald-300 font-bold tabular-nums">
              {sweetSpotLo}–{sweetSpotHi}
              {unit}
            </span>
          </span>
        ) : null}
      </div>
      <div className="relative h-20 rounded-lg bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        <svg viewBox={`0 0 ${n * 10} 80`} width="100%" height="100%" preserveAspectRatio="none">
          {/* All-videos backdrop bars */}
          {allShares.map((share, i) => {
            const h = (share / maxShare) * 76
            return (
              <rect
                key={`all-${i}`}
                x={i * 10 + 1}
                y={80 - h}
                width={8}
                height={h}
                fill="rgba(148, 163, 184, 0.18)"
              />
            )
          })}
          {/* Top-decile bars on top */}
          {topShares.map((share, i) => {
            const h = (share / maxShare) * 76
            return (
              <rect
                key={`top-${i}`}
                x={i * 10 + 2}
                y={80 - h}
                width={6}
                height={h}
                fill={color}
                fillOpacity={0.85}
                rx={1}
              />
            )
          })}
        </svg>
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
        <span>0{unit}</span>
        <span>
          {bucket_edges[Math.floor(bucket_edges.length / 2)]}
          {unit}
        </span>
        <span>
          {bucket_edges[bucket_edges.length - 1]}
          {unit}
        </span>
      </div>
    </div>
  )
}
