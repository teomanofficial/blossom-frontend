/**
 * OutlierCard — single tile in the Outlier Hunter grid.
 *
 * The multiple badge is the headline. Everything else (creator info,
 * tactic chips, niche fit, CTAs) is supporting context. Sizing rules:
 *   - Thumbnail aspect ratio defaults to 9:16 (vertical, since most
 *     viral content is reels/shorts). Carousel/instagram-photo thumbs
 *     still render correctly because we use `object-cover`.
 *   - Badge overlays the top-left of the thumbnail with a pink/purple
 *     gradient that mirrors N1's hero treatment so the design system
 *     reads as one product.
 *
 * Save state is owned by the parent (controlled `saved` + `onToggleSave`)
 * so the SavedOutliers section can re-render without local-state drift.
 */

import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { OutlierVideo } from '../../types/insights'
import NicheFitBadge from '../insights/shared/NicheFitBadge'
import TacticChip from '../insights/shared/TacticChip'
import TeardownPanel from './TeardownPanel'

interface OutlierCardProps {
  outlier: OutlierVideo
  /** Whether this video is currently saved to the user's bookmarks. */
  saved: boolean
  /** Toggle save state for this outlier. */
  onToggleSave: (videoId: string) => void
  /** Hide the niche-fit badge — used when user has no niche set. */
  hideNicheFit?: boolean
  className?: string
}

/**
 * Format large numbers compactly (1.2M / 14.5k / 999). Same shape as the
 * sidebar `fmt` helper but local so this card stays self-contained.
 */
function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

/**
 * Format the multiple as a hero number. Anything above 100x rounds to int
 * (so "700x" reads clean); under 100x keeps one decimal ("4.3x").
 */
function formatMultiple(multiple: number): string {
  if (!Number.isFinite(multiple) || multiple <= 0) return '0x'
  if (multiple >= 100) return `${Math.round(multiple)}x`
  return `${multiple.toFixed(1).replace(/\.0$/, '')}x`
}

/**
 * Resolve the human-facing tier label from the snake-case enum
 * mv_outliers_30d stores (nano / micro / mid-tier / macro / mega).
 */
function tierLabel(tier?: string | null): string {
  if (!tier) return ''
  const map: Record<string, string> = {
    nano: 'Nano',
    micro: 'Micro',
    'mid-tier': 'Mid-tier',
    mid: 'Mid-tier',
    macro: 'Macro',
    mega: 'Mega',
  }
  return map[tier.toLowerCase()] ?? tier
}

const PLATFORM_META: Record<string, { icon: string; chip: string; label: string }> = {
  instagram: {
    icon: 'fa-instagram',
    chip: 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 border-pink-500/30 text-pink-200',
    label: 'Instagram',
  },
  tiktok: {
    icon: 'fa-tiktok',
    chip: 'bg-white/[0.06] border-white/15 text-slate-100',
    label: 'TikTok',
  },
}

/** Constructs a platform deep-link from the influencer + content_url when present. */
function platformLink(outlier: OutlierVideo): string | null {
  if (outlier.content_url) return outlier.content_url
  // No canonical permalink — fall back to creator profile so the user can still
  // jump to the source surface (cheap escape hatch until BE2 backfills URLs).
  const username = outlier.influencer.username
  if (!username) return null
  if (outlier.platform === 'tiktok') return `https://www.tiktok.com/@${username}`
  return `https://www.instagram.com/${username}/`
}

export default function OutlierCard({
  outlier,
  saved,
  onToggleSave,
  hideNicheFit = false,
  className = '',
}: OutlierCardProps) {
  const [teardownOpen, setTeardownOpen] = useState(false)
  const navigate = useNavigate()

  const multipleLabel = formatMultiple(outlier.multiple)
  const tierText = tierLabel(outlier.influencer.tier)
  const link = platformLink(outlier)
  const platformMeta = outlier.platform ? PLATFORM_META[outlier.platform] : null

  // Show up to 5 tactic chips — keeps the card height bounded while still
  // hinting at what's inside the teardown panel.
  const previewTactics = outlier.tactic_teardown.slice(0, 5)
  const moreCount = Math.max(0, outlier.tactic_teardown.length - previewTactics.length)

  const handleReverseEngineer = () => {
    toast.success('Sending to Greenlight Studio…', {
      icon: '🌱',
      duration: 1800,
      style: {
        background: '#0a0a12',
        color: '#f8fafc',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    })
    navigate(`/dashboard/greenlight?fromOutlier=${encodeURIComponent(outlier.video_id)}`)
  }

  const handleSaveToggle = () => {
    onToggleSave(outlier.video_id)
    if (!saved) {
      toast.success('Outlier saved', {
        icon: '🔖',
        duration: 2000,
        style: {
          background: '#0a0a12',
          color: '#f8fafc',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      })
    }
  }

  return (
    <article
      className={`glass-card rounded-3xl overflow-hidden flex flex-col group transition-shadow duration-300 hover:shadow-[0_20px_60px_-20px_rgba(236,72,153,0.35)] ${className}`}
    >
      {/* Thumbnail surface with hero multiple badge */}
      <div className="relative aspect-[9/16] sm:aspect-[3/4] bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-slate-900 overflow-hidden">
        {outlier.thumbnail_url ? (
          <img
            src={outlier.thumbnail_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-image text-slate-700 text-3xl" />
          </div>
        )}

        {/* Bottom gradient overlay so we can land badges on top of any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Hero multiple badge — top-left, oversized, gradient. */}
        <div className="absolute top-3 left-3 z-10">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-pink-500/40 via-fuchsia-500/40 to-purple-500/40 rounded-2xl blur-xl opacity-90" />
            <div className="relative inline-flex flex-col items-start px-3 py-2 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 shadow-2xl shadow-pink-500/40 border border-white/20">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/80 leading-none">
                Their median ×
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-none mt-0.5 font-display tracking-tighter">
                {multipleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Platform chip — top-right */}
        {platformMeta ? (
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${platformMeta.chip}`}
            >
              <i className={`fab ${platformMeta.icon} text-[11px]`} />
              <span className="hidden sm:inline">{platformMeta.label}</span>
            </span>
          </div>
        ) : null}

        {/* Save button — top-right (below platform chip) */}
        <button
          type="button"
          onClick={handleSaveToggle}
          aria-label={saved ? 'Remove from saved' : 'Save outlier'}
          aria-pressed={saved}
          className={`absolute ${platformMeta ? 'top-12 sm:top-12' : 'top-3'} right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-colors ${
            saved
              ? 'bg-pink-500/30 border-pink-400/40 text-pink-200 hover:bg-pink-500/40'
              : 'bg-black/40 border-white/15 text-white hover:bg-black/60'
          }`}
        >
          <i className={`${saved ? 'fas' : 'far'} fa-bookmark text-sm ${saved ? '' : 'opacity-90'}`} />
        </button>

        {/* Views + creator overlay along bottom */}
        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 z-10">
          <div className="flex items-end justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/70">
                Views
              </div>
              <div className="text-lg sm:text-xl font-black text-white leading-tight font-display">
                {compact(outlier.views)}
              </div>
              <div className="text-[10px] font-bold text-white/60 mt-0.5">
                vs {compact(outlier.creator_median_views)} median
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Creator row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {outlier.influencer.avatar_url ? (
              <img
                src={outlier.influencer.avatar_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-xs font-bold text-slate-200">
                {outlier.influencer.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-100 truncate">
              @{outlier.influencer.username || 'unknown'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
              <span>{compact(outlier.influencer.follower_count)} followers</span>
              {tierText ? (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="font-bold text-slate-400">{tierText}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Niche fit + hook/format meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {!hideNicheFit && outlier.niche_fit ? (
            <NicheFitBadge score={outlier.niche_fit} size="sm" />
          ) : null}
          {outlier.format_class ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-bold text-slate-300">
              <i className="fas fa-shapes text-[9px] opacity-70" />
              {outlier.format_class}
            </span>
          ) : null}
          {outlier.hook_class ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-bold text-slate-300">
              <i className="fas fa-comment-dots text-[9px] opacity-70" />
              {outlier.hook_class}
            </span>
          ) : null}
        </div>

        {/* Top tactic chips */}
        {previewTactics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {previewTactics.map((tactic, idx) => (
              <TacticChip
                key={`${tactic.tactic_name}-${idx}`}
                name={tactic.tactic_name}
                category={tactic.category}
                size="sm"
              />
            ))}
            {moreCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-bold text-slate-400">
                +{moreCount}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Action row — mt-auto pushes to bottom for consistent card heights */}
        <div className="mt-auto pt-3 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTeardownOpen((open) => !open)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-200 transition-colors"
              aria-expanded={teardownOpen}
              aria-label={teardownOpen ? 'Hide teardown' : 'View teardown'}
            >
              <i className={`fas ${teardownOpen ? 'fa-chevron-up' : 'fa-flask'} text-[10px]`} />
              {teardownOpen ? 'Hide' : 'Teardown'}
            </button>
            <button
              type="button"
              onClick={handleReverseEngineer}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-white text-[11px] font-black uppercase tracking-widest shadow-md shadow-pink-500/30 transition-all"
              aria-label="Reverse-engineer this outlier in Greenlight Studio"
            >
              <i className="fas fa-wand-magic-sparkles text-[10px]" />
              Reverse
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/dashboard/post-mortem/${outlier.video_id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors"
              aria-label="Open post-mortem for this video"
            >
              <i className="fas fa-magnifying-glass-chart text-[10px]" />
              Autopsy
            </Link>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors"
                aria-label="View on platform"
              >
                <i className="fas fa-arrow-up-right-from-square text-[10px]" />
                Source
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black uppercase tracking-widest text-slate-700">
                <i className="fas fa-link-slash text-[10px]" />
                No link
              </span>
            )}
          </div>
        </div>

        {/* Inline teardown panel — collapsible */}
        {teardownOpen ? (
          <TeardownPanel teardown={outlier.tactic_teardown} />
        ) : null}
      </div>
    </article>
  )
}
