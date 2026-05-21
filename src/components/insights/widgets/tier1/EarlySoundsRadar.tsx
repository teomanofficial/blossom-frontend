/**
 * EarlySoundsRadar — Tier 1 widget surfacing emerging/rising sounds
 * the user can jump on before they saturate.
 *
 * Backend: `GET /api/insights/tier1/early-sounds` →
 *   {
 *     sounds: Array<{
 *       music_id, title, artist, is_original, platform,
 *       recent_video_count, prior_video_count, growth_delta,
 *       lifecycle: 'emerging' | 'rising' | 'stable',
 *       niche_fit: NicheFitScore,
 *     }>,
 *     niche: string,
 *   }
 *
 * Each row shows lifecycle dial + growth-arrow vs prior week + niche fit
 * badge + platform glyph. The backend payload does not currently include
 * `play_url`, so the play button stays disabled until the next backend
 * update — the row still links into /dashboard/trends for the full sound
 * surface.
 *
 * Empty state nods at the niche filter — when no early sounds match
 * the user's niche we say so honestly instead of pretending the well
 * is dry globally.
 */

import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import type { LifecycleStage, NicheFitScore } from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import LifecycleDial from '../../shared/LifecycleDial'
import NicheFitBadge from '../../shared/NicheFitBadge'
import WidgetCard from '../../shared/WidgetCard'

interface EarlySound {
  music_id: string
  title: string
  artist: string | null
  is_original: boolean
  platform: string
  recent_video_count: number
  prior_video_count: number
  growth_delta: number
  lifecycle: 'emerging' | 'rising' | 'stable'
  niche_fit: NicheFitScore
  /** Optional — backend does not currently expose play_url, but we honor
   * it if a future payload includes one so the play button can light up. */
  play_url?: string
}

interface EarlySoundsResponse {
  sounds: EarlySound[]
  niche?: string
}

interface EarlySoundsRadarProps {
  className?: string
}

interface PlatformMeta {
  icon: string
  chip: string
}

const FALLBACK_PLATFORM: PlatformMeta = {
  icon: 'fa-music',
  chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
}

const PLATFORM_META: Record<string, PlatformMeta> = {
  instagram: {
    icon: 'fa-instagram',
    chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
  },
  tiktok: {
    icon: 'fa-tiktok',
    chip: 'bg-slate-500/15 text-slate-200 border-slate-500/25',
  },
}

function platformMeta(platform: string): PlatformMeta {
  const key = (platform || '').toLowerCase()
  return PLATFORM_META[key] ?? FALLBACK_PLATFORM
}

function GrowthArrow({ delta }: { delta: number }) {
  if (!Number.isFinite(delta) || delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
        <i className="fas fa-grip-lines text-[9px]" />
        {compactNumber(Math.abs(delta))}
      </span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black tabular-nums ${
        up ? 'text-emerald-300' : 'text-rose-300'
      }`}
    >
      <i className={`fas ${up ? 'fa-arrow-up-long' : 'fa-arrow-down-long'} text-[9px]`} />
      {up ? '+' : '−'}
      {compactNumber(Math.abs(delta))}
    </span>
  )
}

function SoundRow({ sound }: { sound: EarlySound }) {
  const platform = platformMeta(sound.platform)
  // LifecycleDial accepts the full 5-stage union; this endpoint only ever
  // emits emerging/rising/stable, but typing is forgiving so the cast is
  // safe and keeps the component contract honest.
  const stage: LifecycleStage = sound.lifecycle
  const hasPlayUrl = typeof sound.play_url === 'string' && sound.play_url.length > 0
  const trendsHref = `/dashboard/trends?music_id=${encodeURIComponent(sound.music_id)}`

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-pink-500/20 transition-colors p-3 group">
      <div className="shrink-0 pt-1">
        <LifecycleDial stage={stage} size="sm" showLabel={false} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-100 leading-tight truncate">
              {sound.title || 'Untitled sound'}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {sound.artist || (sound.is_original ? 'Original audio' : 'Unknown artist')}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasPlayUrl ? (
              <a
                href={sound.play_url}
                target="_blank"
                rel="noreferrer noopener"
                className="w-7 h-7 rounded-full bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 flex items-center justify-center transition-colors"
                title="Preview sound"
                aria-label="Preview sound"
              >
                <i className="fas fa-play text-[10px]" />
              </a>
            ) : null}
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${platform.chip} border`}
              title={sound.platform || 'platform'}
            >
              <i className={`fab ${platform.icon} text-xs`} />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <NicheFitBadge score={sound.niche_fit} size="sm" />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
            <i className="fas fa-clock-rotate-left text-[9px]" />
            {compactNumber(sound.recent_video_count)} this week
          </span>
          <GrowthArrow delta={sound.growth_delta} />
        </div>

        <div className="mt-2">
          <Link
            to={trendsHref}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-pink-300 hover:text-pink-200 transition-colors"
          >
            <i className="fas fa-radar text-[9px]" />
            Open in trends
            <i className="fas fa-arrow-right text-[9px]" />
          </Link>
        </div>
      </div>
    </li>
  )
}

export default function EarlySoundsRadar({
  className = '',
}: EarlySoundsRadarProps) {
  const { data, loading, error, retry } = useInsights<EarlySoundsResponse>(
    'tier1/early-sounds',
  )

  const sounds = data?.sounds ?? []
  // Trim to 6 rows so the column stays balanced with sibling widgets;
  // the dedicated trends page is the surface for the full feed.
  const top = sounds.slice(0, 6)

  return (
    <WidgetCard
      title="Early sounds radar"
      subtitle="Emerging tracks with high niche fit — jump in before saturation."
      icon="fa-music"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && top.length === 0}
      emptyIcon="fa-satellite-dish"
      emptyMessage="No emerging sounds match your niche today."
      size="lg"
      className={className}
    >
      <ul className="space-y-2.5">
        {top.map((sound) => (
          <SoundRow key={sound.music_id} sound={sound} />
        ))}
      </ul>
    </WidgetCard>
  )
}
