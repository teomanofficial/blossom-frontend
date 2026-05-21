/**
 * SonicDNAPanel — Tier 3 / Sound widget.
 *
 * Folds the BPM + energy-archetype endpoints into a single two-column
 * panel that summarises the "sonic DNA" of viral content:
 *   - LEFT: BPM histogram with top-decile overlay vs all videos, plus
 *     an "Optimal BPM" pill flagging the peak top-decile bucket.
 *   - RIGHT: Four energy archetypes (build_and_drop, flat_high, flat_low,
 *     gradual_rise) shown as horizontal bars with count + avg-views.
 *
 * Both endpoints surface a `sparse` flag (the `content_video_audio` table
 * is currently empty — populated incrementally as new analyses run). When
 * either side is sparse we render an amber banner at the top of the
 * widget so users understand why the histograms look thin.
 *
 * Data sources:
 *   - `GET /api/insights/tier3/sound-bpm-distribution?niche=`
 *   - `GET /api/insights/tier3/sound-energy-archetypes?niche=`
 */

import { useMemo, useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface SonicDNAPanelProps {
  className?: string
}

interface BpmDistribution {
  top_decile: { buckets: number[]; bucket_edges: number[] }
  all_videos: { buckets: number[]; bucket_edges: number[] }
  sample_size: number
  sparse: boolean
  niche?: string | null
  note?: string
}

interface EnergyArchetypesResponse {
  archetypes: Array<{
    archetype: 'build_and_drop' | 'flat_high' | 'flat_low' | 'gradual_rise'
    count: number
    avg_views: number
  }>
  sample_size: number
  sparse: boolean
  niche?: string | null
  note?: string
}

const ARCHETYPE_META: Record<
  EnergyArchetypesResponse['archetypes'][number]['archetype'],
  { label: string; description: string; icon: string; color: string; bg: string }
> = {
  build_and_drop: {
    label: 'Build & drop',
    description: 'Builds tension, then peaks',
    icon: 'fa-wave-square',
    color: '#a78bfa',
    bg: 'bg-purple-500/15 border-purple-500/25',
  },
  flat_high: {
    label: 'Flat high',
    description: 'Sustained high energy',
    icon: 'fa-bolt',
    color: '#fb7185',
    bg: 'bg-rose-500/15 border-rose-500/25',
  },
  flat_low: {
    label: 'Flat low',
    description: 'Sustained low energy',
    icon: 'fa-water',
    color: '#38bdf8',
    bg: 'bg-sky-500/15 border-sky-500/25',
  },
  gradual_rise: {
    label: 'Gradual rise',
    description: 'Steady energy build',
    icon: 'fa-arrow-trend-up',
    color: '#34d399',
    bg: 'bg-emerald-500/15 border-emerald-500/25',
  },
}

const ARCHETYPE_ORDER: ReadonlyArray<
  EnergyArchetypesResponse['archetypes'][number]['archetype']
> = ['build_and_drop', 'flat_high', 'flat_low', 'gradual_rise']

/**
 * Tiny SVG histogram with two overlapping series. Pure SVG so we don't
 * blow up the bundle for one chart we render once.
 *
 * `series.top` draws as solid bars in cyan; `series.all` draws as a
 * faded backdrop in slate so the relative weight reads even when the
 * top-decile is sparse.
 */
function BpmHistogram({
  topBuckets,
  allBuckets,
  edges,
}: {
  topBuckets: number[]
  allBuckets: number[]
  edges: number[]
}) {
  const n = Math.min(topBuckets.length, allBuckets.length)
  const W = 320
  const H = 130
  const PAD_X = 8
  const PAD_BOTTOM = 24
  const PAD_TOP = 8

  // Normalize against the maximum across both series so both fit.
  const maxAll = Math.max(...allBuckets, 0)
  const maxTop = Math.max(...topBuckets, 0)
  const max = Math.max(maxAll, maxTop, 1)

  const innerW = W - PAD_X * 2
  const innerH = H - PAD_TOP - PAD_BOTTOM
  const barW = innerW / n

  // Identify peak top-decile bucket for highlight.
  let peakIdx = -1
  for (let i = 0; i < topBuckets.length; i++) {
    const v = topBuckets[i] ?? 0
    if (v > 0 && v === maxTop) {
      peakIdx = i
      break
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="BPM distribution histogram"
      className="block"
    >
      {/* All-videos backdrop bars */}
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
      {/* Top-decile bars overlaid */}
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
            fill={isPeak ? '#facc15' : '#22d3ee'}
          />
        )
      })}
      {/* X-axis tick labels — show every 3rd edge for readability */}
      {edges.map((edge, i) => {
        if (i % 3 !== 0 && i !== edges.length - 1) return null
        if (i > n) return null
        const x = PAD_X + i * barW
        return (
          <text
            key={`tick-${i}`}
            x={x}
            y={H - PAD_BOTTOM + 12}
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
          >
            {edge}
          </text>
        )
      })}
    </svg>
  )
}

function ArchetypeBar({
  label,
  description,
  icon,
  color,
  bg,
  count,
  avgViews,
  pctOfMax,
}: {
  label: string
  description: string
  icon: string
  color: string
  bg: string
  count: number
  avgViews: number
  pctOfMax: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-lg border ${bg} flex items-center justify-center shrink-0`}
        >
          <i className={`fas ${icon} text-[10px]`} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h6 className="text-xs font-bold text-slate-100 truncate">{label}</h6>
            <span className="text-[10px] font-black tabular-nums text-slate-200 shrink-0">
              {count} <span className="text-slate-500 font-bold">·</span>{' '}
              {compactNumber(avgViews)} views
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {description}
          </div>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, pctOfMax * 100))}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

export default function SonicDNAPanel({ className = '' }: SonicDNAPanelProps) {
  const [niche, setNiche] = useState<string>('')
  const nicheQ = niche.trim() ? `?niche=${encodeURIComponent(niche.trim())}` : ''

  const {
    data: bpm,
    loading: bpmLoading,
    error: bpmError,
    retry: bpmRetry,
    locked: bpmLocked,
  } = useInsights<BpmDistribution>(`tier3/sound-bpm-distribution${nicheQ}`)

  const {
    data: arch,
    loading: archLoading,
    error: archError,
    retry: archRetry,
    locked: archLocked,
  } = useInsights<EnergyArchetypesResponse>(
    `tier3/sound-energy-archetypes${nicheQ}`,
  )

  const loading = bpmLoading || archLoading
  const error = bpmError ?? archError
  // Either endpoint can surface the tier lock — first one wins for the
  // unified CTA. Both endpoints are Tier 3 so this is consistent.
  const locked = bpmLocked ?? archLocked
  const onRetry = () => {
    if (bpmError) bpmRetry()
    if (archError) archRetry()
  }

  // Detect sparse — either endpoint flagged it.
  const isSparse = (bpm?.sparse ?? false) || (arch?.sparse ?? false)
  const sparseNote = bpm?.note ?? arch?.note

  // Optimal BPM badge — midpoint of the peak top-decile bucket.
  const optimalBpm = useMemo(() => {
    if (!bpm) return null
    const buckets = bpm.top_decile?.buckets ?? []
    const edges = bpm.top_decile?.bucket_edges ?? []
    if (buckets.length === 0 || edges.length < 2) return null
    let peakIdx = -1
    let peakVal = 0
    for (let i = 0; i < buckets.length; i++) {
      const v = buckets[i] ?? 0
      if (v > peakVal) {
        peakVal = v
        peakIdx = i
      }
    }
    if (peakIdx < 0 || peakVal === 0) return null
    const lo = edges[peakIdx]
    const hi = edges[peakIdx + 1]
    if (lo === undefined || hi === undefined) return null
    return { lo, hi, mid: Math.round((lo + hi) / 2) }
  }, [bpm])

  // Largest archetype count for the bar normalisation.
  const archetypeMax = useMemo(() => {
    if (!arch) return 0
    return Math.max(0, ...arch.archetypes.map((a) => a.count))
  }, [arch])

  return (
    <WidgetCard
      title="Sonic DNA"
      subtitle="BPM and energy signatures of viral audio."
      icon="fa-waveform-lines"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      loading={loading}
      error={error}
      onRetry={onRetry}
      size="md"
      className={className}
      locked={locked}
      tier={3}
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
      <div className="space-y-4">
        {isSparse ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            <div className="flex items-start gap-2">
              <i className="fas fa-triangle-exclamation text-amber-300 text-[11px] mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-amber-200">
                  Sparse data
                </div>
                <p className="text-[10px] text-amber-100/80 font-medium leading-snug mt-0.5">
                  {sparseNote ??
                    `content_video_audio populates as new analyses run. Currently ${bpm?.sample_size ?? 0} rows with BPM, ${arch?.sample_size ?? 0} with energy.`}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* BPM column */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                BPM distribution
              </h5>
              <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                n = {bpm?.sample_size ?? 0}
              </span>
            </div>
            {bpm ? (
              <BpmHistogram
                topBuckets={bpm.top_decile?.buckets ?? []}
                allBuckets={bpm.all_videos?.buckets ?? []}
                edges={bpm.top_decile?.bucket_edges ?? []}
              />
            ) : (
              <div className="h-32 bg-white/[0.03] rounded-xl animate-pulse" />
            )}
            <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: '#22d3ee' }}
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
              {optimalBpm ? (
                <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-black tabular-nums text-amber-200">
                  <i className="fas fa-bullseye text-[9px]" />
                  Optimal {optimalBpm.lo}-{optimalBpm.hi} BPM
                </span>
              ) : null}
            </div>
          </div>

          {/* Energy archetype column */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Energy archetypes
              </h5>
              <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                n = {arch?.sample_size ?? 0}
              </span>
            </div>
            <div className="space-y-3">
              {ARCHETYPE_ORDER.map((name) => {
                const item =
                  arch?.archetypes.find((a) => a.archetype === name) ?? {
                    archetype: name,
                    count: 0,
                    avg_views: 0,
                  }
                const meta = ARCHETYPE_META[name]
                const pct = archetypeMax > 0 ? item.count / archetypeMax : 0
                return (
                  <ArchetypeBar
                    key={name}
                    label={meta.label}
                    description={meta.description}
                    icon={meta.icon}
                    color={meta.color}
                    bg={meta.bg}
                    count={item.count}
                    avgViews={item.avg_views}
                    pctOfMax={pct}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}
