/**
 * SoundsByPlatform — Tier 3 / Sound widget.
 *
 * Side-by-side Instagram | TikTok columns showing the top trending sounds
 * per platform (sorted by 7-day recent_count). Each row carries title,
 * artist, recent count, and a WoW growth arrow. Clicking a row deep-links
 * into the SoundLifecycleBrowser by setting a `?sound=<id>` query param
 * (read by the browser widget if it wants to consume — for v1 the click
 * just opens the platform's play_url when available, as a low-friction
 * preview).
 *
 * Data source: `GET /api/insights/tier3/sounds-by-platform?limit=10`.
 */

import { useInsights } from '../../../../lib/useInsights'
import type { Platform } from '../../../../types/insights'
import { compactNumber, formatChangePercent } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface SoundsByPlatformProps {
  className?: string
}

interface SoundRow {
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
  instagram: SoundRow[]
  tiktok: SoundRow[]
  sparse?: boolean
}

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: string; accent: string; chipBg: string; ring: string }
> = {
  instagram: {
    label: 'Instagram',
    icon: 'fa-instagram',
    accent: 'text-pink-300',
    chipBg: 'bg-pink-500/15 border-pink-500/25',
    ring: 'hover:border-pink-500/30',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'fa-tiktok',
    accent: 'text-sky-300',
    chipBg: 'bg-sky-500/15 border-sky-500/25',
    ring: 'hover:border-sky-500/30',
  },
}

function GrowthBadge({ pct }: { pct: number }) {
  if (!Number.isFinite(pct)) return null
  const flat = Math.abs(pct) < 0.5
  const positive = pct > 0
  const tone = flat
    ? 'bg-slate-500/10 text-slate-400 border-slate-500/15'
    : positive
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
      : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-black tabular-nums ${tone}`}
    >
      {formatChangePercent(pct)}
    </span>
  )
}

function SoundItemRow({ sound, rank }: { sound: SoundRow; rank: number }) {
  const meta = PLATFORM_META[sound.platform]
  const initials = (sound.title || sound.artist || '?').slice(0, 1).toUpperCase()
  const clickable = !!sound.play_url

  const body = (
    <>
      {/* Rank */}
      <div className="text-[10px] font-black text-slate-600 w-4 text-center tabular-nums shrink-0">
        {rank}
      </div>

      {/* Cover */}
      <div
        className={`relative w-9 h-9 rounded-xl border ${meta.chipBg} flex items-center justify-center overflow-hidden shrink-0`}
      >
        {sound.cover_url ? (
          <img
            src={sound.cover_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`text-xs font-black ${meta.accent}`}>{initials}</span>
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h5 className="text-xs font-bold text-slate-100 truncate">
            {sound.title || 'Untitled'}
          </h5>
          {sound.is_original ? (
            <span className="inline-flex items-center px-1 py-0 rounded-full bg-purple-500/15 border border-purple-500/25 text-[8px] font-black uppercase tracking-widest text-purple-200 shrink-0">
              OG
            </span>
          ) : null}
        </div>
        <div className="text-[10px] text-slate-500 font-medium truncate">
          {sound.artist || 'Unknown artist'}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] font-black tabular-nums text-slate-200 inline-flex items-center gap-1">
          <i className="fas fa-film text-[8px] text-slate-500" />
          {compactNumber(sound.recent_count)}
        </span>
        <GrowthBadge pct={sound.wow_change_pct} />
      </div>
    </>
  )

  const rowClass = `flex items-center gap-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] ${meta.ring} px-2 py-1.5 transition-colors`

  return clickable ? (
    <a
      href={sound.play_url as string}
      target="_blank"
      rel="noopener noreferrer"
      className={`${rowClass} hover:bg-white/[0.04]`}
    >
      {body}
    </a>
  ) : (
    <div className={rowClass}>{body}</div>
  )
}

function PlatformColumn({
  platform,
  sounds,
}: {
  platform: Platform
  sounds: SoundRow[]
}) {
  const meta = PLATFORM_META[platform]
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <header className="flex items-center gap-2 mb-0.5">
        <div
          className={`w-6 h-6 rounded-lg border ${meta.chipBg} flex items-center justify-center shrink-0`}
        >
          <i className={`fab ${meta.icon} text-[10px] ${meta.accent}`} />
        </div>
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
          {meta.label}
        </h4>
        <span className="ml-auto text-[10px] font-bold text-slate-600 tabular-nums">
          {sounds.length}
        </span>
      </header>
      {sounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] px-3 py-4 text-center">
          <p className="text-[10px] font-medium text-slate-600">
            No sounds tracked yet
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {sounds.slice(0, 10).map((s, i) => (
            <li key={`${platform}-${s.id}`}>
              <SoundItemRow sound={s} rank={i + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SoundsByPlatform({
  className = '',
}: SoundsByPlatformProps) {
  const { data, loading, error, retry, locked } =
    useInsights<SoundsByPlatformResponse>('tier3/sounds-by-platform?limit=10')

  const ig = data?.instagram ?? []
  const tt = data?.tiktok ?? []
  const total = ig.length + tt.length

  return (
    <WidgetCard
      title="Sounds by platform"
      subtitle="What's winning on Instagram vs. TikTok this week."
      icon="fa-volume-high"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && total === 0}
      emptyIcon="fa-volume-xmark"
      emptyMessage="No sound activity in the last 14 days — check back after the next refresh."
      size="md"
      className={className}
      locked={locked}
      tier={3}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlatformColumn platform="instagram" sounds={ig} />
        <PlatformColumn platform="tiktok" sounds={tt} />
      </div>
      {data?.sparse ? (
        <p className="mt-3 text-[10px] font-semibold text-amber-300/80 leading-snug">
          <i className="fas fa-circle-info text-[9px] mr-1" />
          Sparse data — fewer than 10 sounds with recent activity.
        </p>
      ) : null}
    </WidgetCard>
  )
}
