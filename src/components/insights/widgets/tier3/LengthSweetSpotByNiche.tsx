/**
 * LengthSweetSpotByNiche — Tier 3 / Category widget.
 *
 * Histogram of total-duration buckets (5-90s, 5s bins). Plots two series:
 *   - top_decile_buckets — videos in the P90 views band for this niche
 *   - all_buckets        — every video in the niche
 * The backend computes `optimal_seconds` (midpoint of the top-decile peak
 * bucket) and we expose it as a big callout above the chart, with the
 * peak bucket highlighted in the histogram itself.
 *
 * Data source: `GET /api/insights/tier3/length-sweetspot-by-niche?niche=`.
 */

import { useMemo, useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'

interface LengthSweetSpotByNicheProps {
  className?: string
}

interface LengthSweetspotResponse {
  top_decile_buckets: number[]
  all_buckets: number[]
  bucket_edges: number[]
  optimal_seconds: number
  sample_size: number
  sparse: boolean
  niche: string | null
  note?: string
}

/**
 * Two-series histogram, similar to SonicDNAPanel's BPM chart. We
 * highlight the top-decile peak bucket in amber so the callout above
 * has visual anchor.
 */
function DurationHistogram({
  topBuckets,
  allBuckets,
  edges,
  peakIdx,
}: {
  topBuckets: number[]
  allBuckets: number[]
  edges: number[]
  peakIdx: number
}) {
  const n = Math.min(topBuckets.length, allBuckets.length)
  const W = 340
  const H = 150
  const PAD_X = 8
  const PAD_TOP = 8
  const PAD_BOTTOM = 26

  const maxAll = Math.max(...allBuckets, 0)
  const maxTop = Math.max(...topBuckets, 0)
  const max = Math.max(maxAll, maxTop, 1)

  const innerW = W - PAD_X * 2
  const innerH = H - PAD_TOP - PAD_BOTTOM
  const barW = innerW / n

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="Duration sweet-spot histogram"
      className="block"
    >
      {/* Peak bucket highlight underlay */}
      {peakIdx >= 0 ? (
        <rect
          x={PAD_X + peakIdx * barW}
          y={PAD_TOP}
          width={barW}
          height={innerH}
          fill="rgba(250, 204, 21, 0.08)"
          rx={4}
        />
      ) : null}

      {/* All-videos backdrop */}
      {allBuckets.slice(0, n).map((v, i) => {
        const h = (v / max) * innerH
        const x = PAD_X + i * barW
        const y = H - PAD_BOTTOM - h
        return (
          <rect
            key={`all-${i}`}
            x={x + 1}
            y={y}
            width={Math.max(0, barW - 2)}
            height={h}
            rx={2}
            fill="rgba(148, 163, 184, 0.18)"
          />
        )
      })}

      {/* Top-decile bars */}
      {topBuckets.slice(0, n).map((v, i) => {
        const h = (v / max) * innerH
        const x = PAD_X + i * barW
        const y = H - PAD_BOTTOM - h
        const isPeak = i === peakIdx
        return (
          <rect
            key={`top-${i}`}
            x={x + 1}
            y={y}
            width={Math.max(0, barW - 2)}
            height={h}
            rx={2}
            fill={isPeak ? '#facc15' : '#34d399'}
          />
        )
      })}

      {/* X-axis labels — show every 2nd edge */}
      {edges.map((edge, i) => {
        if (i % 2 !== 0 && i !== edges.length - 1) return null
        if (i > n) return null
        const x = PAD_X + i * barW
        return (
          <text
            key={`tick-${i}`}
            x={x}
            y={H - PAD_BOTTOM + 14}
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
          >
            {edge}s
          </text>
        )
      })}
    </svg>
  )
}

export default function LengthSweetSpotByNiche({
  className = '',
}: LengthSweetSpotByNicheProps) {
  const [niche, setNiche] = useState<string>('')
  const nicheQ = niche.trim() ? `?niche=${encodeURIComponent(niche.trim())}` : ''

  const { data, loading, error, retry, locked } = useInsights<LengthSweetspotResponse>(
    `tier3/length-sweetspot-by-niche${nicheQ}`,
  )

  const top = data?.top_decile_buckets ?? []
  const all = data?.all_buckets ?? []
  const edges = data?.bucket_edges ?? []
  const optimal = data?.optimal_seconds ?? 0
  const sampleSize = data?.sample_size ?? 0

  // Peak top-decile bucket index for highlight.
  const peakIdx = useMemo(() => {
    let bestIdx = -1
    let bestVal = 0
    for (let i = 0; i < top.length; i++) {
      const v = top[i] ?? 0
      if (v > bestVal) {
        bestVal = v
        bestIdx = i
      }
    }
    return bestIdx
  }, [top])

  const peakRange = useMemo(() => {
    if (peakIdx < 0) return null
    const lo = edges[peakIdx]
    const hi = edges[peakIdx + 1]
    if (lo === undefined || hi === undefined) return null
    return { lo, hi }
  }, [peakIdx, edges])

  const isEmpty = !loading && !error && sampleSize === 0
  const subtitleCopy =
    niche.trim().length > 0
      ? `The duration band where ${niche.trim()} consistently overperforms.`
      : 'The duration band where viral videos overperform (all niches).'

  return (
    <WidgetCard
      title="Length sweet spot"
      subtitle={subtitleCopy}
      icon="fa-ruler-horizontal"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-ruler-combined"
      emptyMessage={data?.note ?? 'No duration data for this niche yet.'}
      size="md"
      className={className}
      locked={locked}
      tier={3}
      info={{
        what: 'The duration band where viral videos in your niche cluster.',
        howToRead:
          "Green bars = top-decile videos (the hits). Grey backdrop = all videos. The amber highlight is the bucket where hits concentrate most — that's your sweet spot. Aim your next post at that duration band.",
        computation:
          'Buckets are 5-second wide between 5s and 90s. Optimal seconds is the midpoint of the peak top-decile bucket.',
      }}
      actions={
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Niche (optional)"
          className="bg-slate-900/80 border border-white/10 rounded-full px-3 py-1 text-[11px] font-bold text-slate-200 w-32 sm:w-40 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      }
    >
      {/* Optimal callout */}
      {optimal > 0 ? (
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 px-4 py-3 mb-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/80">
                Optimal duration
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black tabular-nums text-amber-100 leading-none">
                  {optimal}
                </span>
                <span className="text-sm font-black uppercase tracking-widest text-amber-200">
                  sec
                </span>
              </div>
            </div>
            {peakRange ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-black tabular-nums text-amber-200">
                <i className="fas fa-bullseye text-[9px]" />
                Sweet-spot {peakRange.lo}-{peakRange.hi}s
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Histogram */}
      <DurationHistogram
        topBuckets={top}
        allBuckets={all}
        edges={edges}
        peakIdx={peakIdx}
      />

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ backgroundColor: '#34d399' }}
            />
            Top decile
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.45)' }}
            />
            All videos
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-600 tabular-nums">
          n = {sampleSize.toLocaleString()}
        </span>
      </div>

      {data?.sparse ? (
        <p className="mt-2 text-[10px] font-semibold text-amber-300/80 leading-snug">
          <i className="fas fa-circle-info text-[9px] mr-1" />
          Sparse data — fewer than 50 videos in this filter.
        </p>
      ) : null}
    </WidgetCard>
  )
}
