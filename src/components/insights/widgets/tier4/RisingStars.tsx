/**
 * RisingStars — Tier 4 widget surfacing creators whose niche-scoped
 * engagement rate has surged by ≥40% over the last 30 days.
 *
 * Backend: `GET /api/insights/tier4/rising-stars?niche=&limit=`
 *   → { niche, threshold_pct, rising_stars: RisingStar[] }
 *
 * Each card highlights the growth percentage in a gradient badge that
 * reads emotionally — "+322%" feels like momentum, "+18%" doesn't. The
 * sparkline visualises the prior-window → recent-window jump with a
 * synthetic 4-point series (the backend hands back just the two window
 * averages, which is enough signal for a slope hint).
 */

import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber, formatPercent } from '../../../../lib/format'
import VelocitySparkline from '../../shared/VelocitySparkline'
import WidgetCard from '../../shared/WidgetCard'

interface RisingStar {
  influencer_id: string
  username: string
  display_name: string
  follower_count: number
  avg_engagement_rate: number
  growth_pct: number
  recent_video_count: number
  prior_video_count: number
  disc_primary?: string
  audience_archetype?: string
  avatar_url?: string
  tier?: string
}

interface RisingStarsResponse {
  niche: string | null
  threshold_pct: number
  rising_stars: RisingStar[]
}

interface RisingStarsProps {
  className?: string
}

const TIER_COLORS: Record<string, string> = {
  nano: 'text-blue-300 bg-blue-500/15 border-blue-500/25',
  micro: 'text-teal-300 bg-teal-500/15 border-teal-500/25',
  mid: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
  'mid-tier': 'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
  macro: 'text-orange-300 bg-orange-500/15 border-orange-500/25',
  mega: 'text-pink-300 bg-pink-500/15 border-pink-500/25',
}

/**
 * Render the growth percentage as a punchy "+322%" string. Caps absurd
 * numbers at 999% so a single divide-by-tiny-prior doesn't blow out the
 * card. Returns "—" when not finite.
 */
function formatGrowth(pctRatio: number): string {
  if (!Number.isFinite(pctRatio)) return '—'
  const pct = pctRatio * 100
  if (pct >= 999) return '+999%+'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${Math.round(pct)}%`
}

function buildGrowthSeries(star: RisingStar): number[] {
  // Backend gives us the two-window averages indirectly:
  //   recent_avg = avg_engagement_rate
  //   prior_avg  = recent / (1 + growth_pct)
  if (!Number.isFinite(star.growth_pct) || star.growth_pct === -1) return []
  const recent = Math.max(0, star.avg_engagement_rate)
  const prior = recent / Math.max(0.0001, 1 + star.growth_pct)
  if (recent === 0 && prior === 0) return []
  if (recent === prior) return [prior, prior, prior, prior]
  const step = (recent - prior) / 3
  return [prior, prior + step, prior + step * 2, recent]
}

function whyRising(star: RisingStar): string {
  // Pick the bigger of the two stories — "engagement up X%" is the
  // primary signal; a noticeable video-count delta is secondary context.
  const erDeltaPct = Math.round(star.growth_pct * 100)
  const videoDelta = star.recent_video_count - star.prior_video_count
  const erStory = `Engagement rate up ${erDeltaPct}% in the last 30 days`
  if (videoDelta > 0) {
    return `${erStory} — and they posted ${videoDelta} more video${videoDelta === 1 ? '' : 's'} this window.`
  }
  if (videoDelta < 0) {
    return `${erStory} — even with ${Math.abs(videoDelta)} fewer videos.`
  }
  return `${erStory}.`
}

function StarCard({ star }: { star: RisingStar }) {
  const series = buildGrowthSeries(star)
  const tierTone = TIER_COLORS[(star.tier as string) ?? ''] ?? null
  const initial = (star.display_name || star.username || '?').charAt(0).toUpperCase()
  const safeAvatar = !!star.avatar_url && /^https?:\/\//.test(star.avatar_url)

  return (
    <Link
      to={`/dashboard/influencers/${star.influencer_id}`}
      className="group relative rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-pink-500/30 p-4 transition-colors overflow-hidden flex flex-col gap-3"
    >
      {/* Decorative gradient blob in the corner */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/25 transition-colors" />

      <div className="relative flex items-start gap-3">
        {safeAvatar ? (
          <img
            src={star.avatar_url as string}
            alt={`@${star.username}`}
            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-sm font-black text-white/70 shrink-0">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-100 truncate">
            {star.display_name || star.username}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
            <span>@{star.username}</span>
            {tierTone ? (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wide ${tierTone}`}
              >
                {star.tier}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Growth badge — the emotional centerpiece */}
      <div className="relative inline-flex flex-col items-start">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-green-500/30 blur-xl opacity-70" />
        <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20 border border-white/15">
          <i className="fas fa-arrow-trend-up text-[11px]" />
          <span className="text-base sm:text-lg font-black tabular-nums leading-none">
            {formatGrowth(star.growth_pct)}
          </span>
        </div>
      </div>

      {/* Sparkline + small stats row */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            30-day trend
          </span>
          {series.length > 0 ? (
            <VelocitySparkline
              values={series}
              height={22}
              width={130}
              positive={star.growth_pct >= 0}
              ariaLabel={`${star.username} engagement rate trend`}
            />
          ) : (
            <span className="text-[10px] text-slate-600">— no trend data —</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-200 tabular-nums">
            {compactNumber(star.follower_count)}
          </div>
          <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
            followers
          </div>
        </div>
      </div>

      {/* "Why they're rising" line */}
      <p className="relative text-[11px] text-slate-400 font-medium leading-relaxed">
        {whyRising(star)}
      </p>

      <div className="relative flex items-center justify-between mt-auto pt-2 border-t border-white/[0.05]">
        <div className="text-[10px] font-bold text-slate-500">
          Current ER:{' '}
          <span className="text-teal-300 tabular-nums">
            {formatPercent(star.avg_engagement_rate)}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 group-hover:text-pink-300 transition-colors">
          Study them
          <i className="fas fa-arrow-right ml-1 text-[9px]" />
        </span>
      </div>
    </Link>
  )
}

export default function RisingStars({ className = '' }: RisingStarsProps) {
  const { data, loading, error, retry, locked } = useInsights<RisingStarsResponse>(
    'tier4/rising-stars?limit=12',
  )

  const stars = data?.rising_stars ?? []

  return (
    <WidgetCard
      title="Rising stars"
      subtitle="Creators whose engagement is surging — catch them on the way up."
      icon="fa-arrow-up-right-dots"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      size="lg"
      className={className}
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && stars.length === 0}
      emptyIcon="fa-seedling"
      emptyMessage="No creators above the +40% growth threshold right now — check back tomorrow."
      locked={locked}
      tier={4}
      info={{
        what: 'Creators whose engagement rate has surged ≥ 40% in the last 30 days.',
        howToRead:
          "These are creators on the way up — their tactics are clearly working right now. Study them before they hit the big leagues and the formula gets borrowed by everyone else. Click 'Study them' for the full breakdown.",
        computation:
          'Growth pct = recent 30-day engagement rate / prior 30-day rate − 1. Filtered to growth ≥ 40% and ordered by absolute growth.',
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stars.map((star) => (
          <StarCard key={star.influencer_id} star={star} />
        ))}
      </div>
    </WidgetCard>
  )
}
