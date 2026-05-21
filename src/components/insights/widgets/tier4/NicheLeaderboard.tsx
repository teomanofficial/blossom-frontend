/**
 * NicheLeaderboard — Tier 4 widget ranking creators in a chosen niche by
 * a blended `avg_engagement × viral_hit_rate` score.
 *
 * Backend: `GET /api/insights/tier4/niche-leaderboard?niche=&tier=&limit=`
 *   → { niche, tier, leaderboard: NicheCreatorRank[] }
 *
 * UX:
 *   - Filter bar (niche text + tier multi-select) that gates the fetch
 *   - Leaderboard table on desktop; collapses to a card stack on mobile
 *   - Each row links to /dashboard/influencers/<id>
 *   - DISC + audience-archetype chips when available
 *
 * The user must supply a niche before we fire the request — the backend
 * 400s on missing niche, and a blank table is a poor first impression.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import type { NicheCreatorRank } from '../../../../types/insights'
import { compactNumber, formatPercent } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface LeaderboardResponse {
  niche: string
  tier: string[] | null
  leaderboard: NicheCreatorRank[]
}

interface NicheLeaderboardProps {
  className?: string
}

const TIER_OPTIONS = [
  { value: 'nano', label: 'Nano' },
  { value: 'micro', label: 'Micro' },
  { value: 'mid', label: 'Mid-tier' },
  { value: 'macro', label: 'Macro' },
  { value: 'mega', label: 'Mega' },
] as const

const TIER_COLORS: Record<string, string> = {
  nano: 'text-blue-300 bg-blue-500/15 border-blue-500/25',
  micro: 'text-teal-300 bg-teal-500/15 border-teal-500/25',
  mid: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
  'mid-tier': 'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
  macro: 'text-orange-300 bg-orange-500/15 border-orange-500/25',
  mega: 'text-pink-300 bg-pink-500/15 border-pink-500/25',
}

const DISC_COLORS: Record<string, string> = {
  D: 'text-rose-300 bg-rose-500/15 border-rose-500/25',
  I: 'text-amber-300 bg-amber-500/15 border-amber-500/25',
  S: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25',
  C: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25',
}

function discLetter(disc: string | undefined): string {
  if (!disc) return ''
  const first = disc.charAt(0).toUpperCase()
  return ['D', 'I', 'S', 'C'].includes(first) ? first : ''
}

function discChipTone(disc: string | undefined): string {
  return DISC_COLORS[discLetter(disc)] ?? 'text-slate-300 bg-white/5 border-white/10'
}

function CreatorAvatar({
  username,
  displayName,
  avatarUrl,
  size = 'sm',
}: {
  username: string
  displayName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}) {
  const dim = size === 'md' ? 'w-10 h-10' : 'w-9 h-9'
  const txt = size === 'md' ? 'text-sm' : 'text-xs'
  const initial = (displayName || username || '?').charAt(0).toUpperCase()
  // Avoid expiring CDN URLs that media.ts blocks (tiktokcdn, cdninstagram).
  const safe = !!avatarUrl && /^https?:\/\//.test(avatarUrl)
  if (safe) {
    return (
      <img
        src={avatarUrl as string}
        alt={`@${username}`}
        className={`${dim} rounded-xl object-cover border border-white/10 shrink-0`}
        loading="lazy"
        onError={(e) => {
          // On 403/404 from expiring CDN URLs, fall back to initials.
          const target = e.currentTarget
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement | null
          if (fallback) fallback.style.display = 'flex'
        }}
      />
    )
  }
  return (
    <div
      className={`${dim} rounded-xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center ${txt} font-black text-white/70 shrink-0`}
    >
      {initial}
    </div>
  )
}

function CreatorRow({ creator, rank }: { creator: NicheCreatorRank; rank: number }) {
  const tierTone =
    TIER_COLORS[(creator as NicheCreatorRank & { tier?: string }).tier ?? ''] ??
    null
  const discPrimary = creator.disc_primary
  const archetype = creator.audience_archetype
  return (
    <Link
      to={`/dashboard/influencers/${creator.influencer_id}`}
      className="grid grid-cols-12 items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-amber-500/20 transition-colors"
    >
      {/* Rank + Avatar + Username (mobile: full width / desktop: 4 cols) */}
      <div className="col-span-12 sm:col-span-4 flex items-center gap-3 min-w-0">
        <span className="text-[10px] font-black text-slate-600 tabular-nums w-5 shrink-0">
          #{rank}
        </span>
        <div className="relative">
          <CreatorAvatar
            username={creator.username}
            displayName={creator.display_name}
            avatarUrl={creator.avatar_url}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-100 truncate">
            {creator.display_name || creator.username}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            @{creator.username}
          </div>
        </div>
      </div>

      {/* Followers (desktop: 2 cols) */}
      <div className="hidden sm:block sm:col-span-2 text-right">
        <div className="text-xs font-bold text-slate-200 tabular-nums">
          {compactNumber(creator.follower_count)}
        </div>
        <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
          followers
        </div>
      </div>

      {/* Engagement (desktop: 2 cols) */}
      <div className="col-span-4 sm:col-span-2 text-right">
        <div className="text-xs font-bold text-teal-300 tabular-nums">
          {formatPercent(creator.avg_engagement_rate)}
        </div>
        <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
          engagement
        </div>
      </div>

      {/* Viral hit rate (desktop: 2 cols) */}
      <div className="col-span-4 sm:col-span-2 text-right">
        <div className="text-xs font-bold text-pink-300 tabular-nums">
          {formatPercent(creator.viral_hit_rate)}
        </div>
        <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
          viral hits
        </div>
      </div>

      {/* Consistency + DISC/archetype chips (desktop: 2 cols) */}
      <div className="col-span-4 sm:col-span-2 flex flex-col items-end gap-1 min-w-0">
        <div className="text-xs font-bold text-amber-300 tabular-nums">
          {formatPercent(creator.consistency_score)}
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {discPrimary ? (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-md border text-[10px] font-black ${discChipTone(discPrimary)}`}
              title={`DISC: ${discPrimary}`}
            >
              {discLetter(discPrimary)}
            </span>
          ) : null}
          {archetype ? (
            <span
              className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 text-[9px] font-bold uppercase tracking-wide max-w-[100px] truncate"
              title={archetype}
            >
              {archetype}
            </span>
          ) : null}
          {tierTone ? (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wide ${tierTone}`}
            >
              {(creator as NicheCreatorRank & { tier?: string }).tier}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function FilterBar({
  niche,
  setNiche,
  tier,
  setTier,
  onApply,
  loading,
}: {
  niche: string
  setNiche: (v: string) => void
  tier: string
  setTier: (v: string) => void
  onApply: () => void
  loading: boolean
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onApply()
      }}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4"
    >
      <div className="relative flex-1 min-w-0">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500" />
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. fashion, fitness, finance…"
          className="w-full bg-white/[0.04] border border-white/10 focus:border-amber-500/40 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-600 transition-colors"
        />
      </div>
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value)}
        className="bg-white/[0.04] border border-white/10 focus:border-amber-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-100 transition-colors"
      >
        <option value="">All tiers</option>
        {TIER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !niche.trim()}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest transition-opacity shrink-0"
      >
        <i className="fas fa-bolt mr-1.5 text-[10px]" />
        Apply
      </button>
    </form>
  )
}

export default function NicheLeaderboard({ className = '' }: NicheLeaderboardProps) {
  const [niche, setNiche] = useState('')
  const [tier, setTier] = useState('')
  const [appliedNiche, setAppliedNiche] = useState('')
  const [appliedTier, setAppliedTier] = useState('')

  const path = useMemo(() => {
    if (!appliedNiche.trim()) return ''
    const params = new URLSearchParams()
    params.set('niche', appliedNiche.trim())
    if (appliedTier) params.set('tier', appliedTier)
    params.set('limit', '25')
    return `tier4/niche-leaderboard?${params.toString()}`
  }, [appliedNiche, appliedTier])

  const { data, loading, error, retry } = useInsights<LeaderboardResponse>(path, {
    enabled: !!path,
  })

  const creators = data?.leaderboard ?? []

  return (
    <WidgetCard
      title="Niche leaderboard"
      subtitle="Top creators ranked by engagement × viral hit rate."
      icon="fa-ranking-star"
      iconBg="bg-amber-500/15"
      iconColor="text-amber-400"
      size="lg"
      className={className}
      loading={!!path && loading}
      error={!!path ? error : null}
      onRetry={retry}
      isEmpty={!!path && !loading && !error && creators.length === 0}
      emptyIcon="fa-magnifying-glass"
      emptyMessage="Try a different niche or tier — no creators match these filters."
    >
      <FilterBar
        niche={niche}
        setNiche={setNiche}
        tier={tier}
        setTier={setTier}
        onApply={() => {
          setAppliedNiche(niche)
          setAppliedTier(tier)
        }}
        loading={loading}
      />

      {!path ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <i className="fas fa-trophy text-amber-400 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md">
            Enter a niche above to see the top creators ranked by engagement,
            hit rate, and consistency.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Desktop column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <div className="col-span-4">Creator</div>
            <div className="col-span-2 text-right">Followers</div>
            <div className="col-span-2 text-right">Engagement</div>
            <div className="col-span-2 text-right">Viral hits</div>
            <div className="col-span-2 text-right">Consistency</div>
          </div>
          {creators.map((c, i) => (
            <CreatorRow key={c.influencer_id} creator={c} rank={i + 1} />
          ))}
        </div>
      )}
    </WidgetCard>
  )
}
