/**
 * VideoMetaHeader — the top-of-page identity row: thumbnail, title,
 * surface-level metrics (views / likes / engagement rate) and the
 * hook/format classification chips.
 *
 * Sits ABOVE the DivergedVariableCard. Keeps page chrome small so the
 * hero finding can dominate the fold.
 */

import { Link } from 'react-router-dom'
import { getStorageUrl } from '../../lib/media'
import type { PostMortemResponse } from '../../types/insights'

interface VideoMetaHeaderProps {
  video: PostMortemResponse['video']
  /** Slot for the video selector dropdown to live in the header row. */
  rightSlot?: React.ReactNode
  className?: string
}

function fmt(n: number): string {
  if (!n || !Number.isFinite(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

function fmtPct(rate: number): string {
  if (!Number.isFinite(rate)) return '0%'
  const pct = rate <= 1 ? rate * 100 : rate
  return `${pct.toFixed(2)}%`
}

export default function VideoMetaHeader({
  video,
  rightSlot,
  className = '',
}: VideoMetaHeaderProps) {
  const thumb = getStorageUrl(video.thumbnail_url) || video.thumbnail_url || null

  return (
    <section className={`glass-card rounded-3xl p-4 sm:p-6 ${className}`}>
      <div className="flex flex-row gap-4 sm:gap-5">
        {/* Thumbnail — compact on mobile, larger on desktop. Kept
            horizontal at every breakpoint so the diverged-variable
            hero card stays close to the fold. */}
        <div className="shrink-0 w-20 sm:w-32 lg:w-40 aspect-[9/16] rounded-2xl bg-white/[0.05] border border-white/[0.06] overflow-hidden flex items-center justify-center">
          {thumb ? (
            <img
              src={thumb}
              alt={video.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <i className="fas fa-video text-slate-600 text-xl sm:text-2xl" />
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Post-mortem
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-100 leading-snug line-clamp-2">
                {video.title || 'Untitled video'}
              </h1>
            </div>
            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </div>

          {/* Classification chips */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {video.hook_class ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[11px] font-bold">
                <i className="fas fa-fish-fins text-[10px]" />
                {video.hook_class}
              </span>
            ) : null}
            {video.format_class ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 text-[11px] font-bold">
                <i className="fas fa-shapes text-[10px]" />
                {video.format_class}
              </span>
            ) : null}
            <Link
              to={`/dashboard/analyze/${video.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] text-slate-300 hover:text-white border border-white/10 text-[11px] font-bold transition-colors ml-auto"
            >
              <i className="fas fa-arrow-up-right-from-square text-[10px]" />
              Full analysis
            </Link>
          </div>

          {/* Metric strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                Views
              </div>
              <div className="text-base sm:text-lg font-black text-white tabular-nums">
                {fmt(video.views)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                Likes
              </div>
              <div className="text-base sm:text-lg font-black text-white tabular-nums">
                {fmt(video.likes)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                Engagement
              </div>
              <div className="text-base sm:text-lg font-black text-white tabular-nums">
                {fmtPct(video.engagement_rate)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
