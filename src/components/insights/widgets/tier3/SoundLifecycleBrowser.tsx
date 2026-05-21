/**
 * SoundLifecycleBrowser — Tier 3 / Sound widget.
 *
 * Lets the user pick a trending sound (from `/sounds-by-platform`) and
 * inspects its weekly adoption curve, lifecycle stage, jump-in window,
 * and niche fit. The chart side renders the weekly_adoption series via
 * the shared TrendLineChart (90 days of buckets, video_count over time).
 *
 * Data sources:
 *   - `GET /api/insights/tier3/sounds-by-platform?limit=20` — to populate
 *     the picker. Both platforms folded into a single sorted list.
 *   - `GET /api/insights/tier3/sound-lifecycle/:music_id` — fetched only
 *     once a sound is selected (`enabled` gated on selection state).
 *
 * The endpoint extends SoundLifecycleItem with an optional `sparse` flag
 * (week_count < 10) — we surface that as a soft caveat under the chart.
 */

import { useEffect, useMemo, useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import type {
  LifecycleStage,
  NicheFitScore,
  Platform,
} from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import LifecycleDial from '../../shared/LifecycleDial'
import NicheFitBadge from '../../shared/NicheFitBadge'
import WidgetCard from '../../shared/WidgetCard'
import TrendLineChart, {
  type TrendSeries,
} from '../../charts/TrendLineChart'

interface SoundLifecycleBrowserProps {
  className?: string
}

interface SoundListItem {
  id: string
  platform: Platform
  title: string
  artist: string
  is_original: boolean
  play_url: string | null
  cover_url: string | null
  recent_count: number
  prior_count: number
  wow_change_pct: number
  avg_views: number
  total_views: number
}

interface SoundsByPlatformResponse {
  instagram: SoundListItem[]
  tiktok: SoundListItem[]
  sparse?: boolean
}

interface SoundLifecycleResponse {
  music_id: string
  title: string
  artist: string
  platform: Platform
  is_original: boolean
  play_url?: string
  weekly_adoption: Array<{
    week: string
    video_count: number
    avg_views?: number
  }>
  lifecycle: LifecycleStage
  jump_in_window_remaining_days: number
  niche_fit: NicheFitScore
  sparse?: boolean
}

const PLATFORM_META: Record<Platform, { label: string; icon: string; accent: string }> = {
  instagram: { label: 'Instagram', icon: 'fa-instagram', accent: 'text-pink-300' },
  tiktok: { label: 'TikTok', icon: 'fa-tiktok', accent: 'text-sky-300' },
}

/** Format YYYY-MM-DD as "MMM D" (e.g. "Apr 14"). */
function formatWeekLabel(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function SoundPicker({
  sounds,
  selectedId,
  onSelect,
}: {
  sounds: SoundListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-slate-900/80 border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-slate-200 max-w-[200px] sm:max-w-[280px] truncate focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
    >
      {sounds.length === 0 ? (
        <option value="" disabled>
          No sounds available
        </option>
      ) : null}
      {sounds.map((s) => {
        const label =
          (s.title || 'Untitled') +
          (s.artist ? ` — ${s.artist}` : '') +
          ` (${PLATFORM_META[s.platform].label})`
        return (
          <option key={`${s.platform}-${s.id}`} value={s.id}>
            {label}
          </option>
        )
      })}
    </select>
  )
}

function JumpInCountdown({
  days,
  stage,
}: {
  days: number
  stage: LifecycleStage
}) {
  if (!Number.isFinite(days) || days <= 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
          Jump-in window
        </div>
        <div className="text-xs font-semibold text-slate-300">
          {stage === 'declining' ? 'Window closed' : 'No clear window'}
        </div>
      </div>
    )
  }
  const urgent = days <= 7
  return (
    <div
      className={`rounded-2xl px-3 py-2.5 border ${
        urgent
          ? 'bg-amber-500/10 border-amber-500/25'
          : 'bg-emerald-500/10 border-emerald-500/25'
      }`}
    >
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
        Jump-in window
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-base font-black tabular-nums ${
            urgent ? 'text-amber-200' : 'text-emerald-200'
          }`}
        >
          {days}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {days === 1 ? 'day' : 'days'} left
        </span>
      </div>
    </div>
  )
}

function SoundDetail({ data }: { data: SoundLifecycleResponse }) {
  const meta = PLATFORM_META[data.platform]
  const weekly = data.weekly_adoption ?? []

  const series: TrendSeries[] = useMemo(() => {
    if (weekly.length === 0) return []
    return [
      {
        name: 'Videos posted',
        color: '#22d3ee', // cyan-400
        data: weekly.map((p) => ({
          x: formatWeekLabel(p.week),
          y: Number(p.video_count) || 0,
        })),
      },
    ]
  }, [weekly])

  return (
    <div className="space-y-4">
      {/* Header — sound metadata + play button */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {data.title || 'Untitled sound'}
          </h4>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-[11px] font-semibold text-slate-400 truncate">
              {data.artist || 'Unknown artist'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold">
              <i className={`fab ${meta.icon} text-[9px] ${meta.accent}`} />
              <span className="text-slate-300">{meta.label}</span>
            </span>
            {data.is_original ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[10px] font-black uppercase tracking-widest text-purple-200">
                Original
              </span>
            ) : null}
          </div>
        </div>
        {data.play_url ? (
          <a
            href={data.play_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 text-[10px] font-black uppercase tracking-widest text-cyan-200 transition-colors shrink-0"
          >
            <i className="fas fa-play text-[9px]" />
            Listen
          </a>
        ) : null}
      </div>

      {/* Lifecycle + jump-in + niche fit row */}
      <div className="grid grid-cols-3 gap-3 items-stretch">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] p-2.5">
          <LifecycleDial stage={data.lifecycle} size="sm" />
        </div>
        <JumpInCountdown
          days={data.jump_in_window_remaining_days}
          stage={data.lifecycle}
        />
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-2.5 flex items-center justify-center">
          <NicheFitBadge score={data.niche_fit} size="sm" />
        </div>
      </div>

      {/* Adoption curve */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Weekly adoption
          </h5>
          <span className="text-[10px] font-semibold text-slate-600">
            {weekly.length} {weekly.length === 1 ? 'week' : 'weeks'}
          </span>
        </div>
        {series.length === 0 ? (
          <div className="flex items-center justify-center text-[11px] text-slate-600 py-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
            No adoption data yet for this sound.
          </div>
        ) : (
          <TrendLineChart
            series={series}
            height={160}
            formatY={(v) => compactNumber(v)}
          />
        )}
        {data.sparse ? (
          <p className="mt-1.5 text-[10px] font-semibold text-amber-300/80 leading-snug">
            <i className="fas fa-circle-info text-[9px] mr-1" />
            Sparse data — fewer than 10 weekly buckets recorded so far.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function SoundLifecycleBrowser({
  className = '',
}: SoundLifecycleBrowserProps) {
  // 1) Pull a list of trending sounds for the picker.
  const {
    data: poolData,
    loading: poolLoading,
    error: poolError,
    retry: poolRetry,
    locked: poolLocked,
  } = useInsights<SoundsByPlatformResponse>('tier3/sounds-by-platform?limit=20')

  const pool: SoundListItem[] = useMemo(() => {
    const ig = poolData?.instagram ?? []
    const tt = poolData?.tiktok ?? []
    // Merge + sort by recent_count, then avg_views.
    return [...ig, ...tt].sort((a, b) => {
      if (b.recent_count !== a.recent_count) return b.recent_count - a.recent_count
      return b.avg_views - a.avg_views
    })
  }, [poolData])

  // 2) Selected sound — defaults to the first available once the list loads.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedId && pool.length > 0) {
      const first = pool[0]
      if (first) setSelectedId(first.id)
    }
  }, [pool, selectedId])

  // 3) Lifecycle fetch — gated on selection.
  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
    retry: detailRetry,
    locked: detailLocked,
  } = useInsights<SoundLifecycleResponse>(
    selectedId ? `tier3/sound-lifecycle/${selectedId}` : 'tier3/sound-lifecycle/0',
    { enabled: !!selectedId },
  )

  const error = poolError ?? detailError
  const onRetry = () => {
    if (poolError) poolRetry()
    if (detailError) detailRetry()
  }
  // Both endpoints are Tier 3; first lock wins for the unified CTA.
  const locked = poolLocked ?? detailLocked
  const isEmpty = !poolLoading && !poolError && pool.length === 0

  return (
    <WidgetCard
      title="Sound lifecycle"
      subtitle="Each sound's weekly adoption curve and current lifecycle stage."
      icon="fa-music"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={poolLoading}
      error={error}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyIcon="fa-volume-xmark"
      emptyMessage="No trending sounds indexed yet — analyse more content to populate this widget."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
      actions={
        pool.length > 0 ? (
          <SoundPicker
            sounds={pool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : undefined
      }
    >
      {detailLoading ? (
        <div className="space-y-3 animate-pulse" aria-hidden="true">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/[0.04] rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-14 bg-white/[0.03] rounded-2xl" />
            <div className="h-14 bg-white/[0.03] rounded-2xl" />
            <div className="h-14 bg-white/[0.03] rounded-2xl" />
          </div>
          <div className="h-40 bg-white/[0.02] rounded-2xl" />
        </div>
      ) : detail ? (
        <SoundDetail data={detail} />
      ) : (
        <div className="flex items-center justify-center text-[11px] text-slate-600 py-8">
          Select a sound to see its lifecycle.
        </div>
      )}
    </WidgetCard>
  )
}
