/**
 * ComparableWinners — top-5 videos that share this concept's hook +
 * format + niche. Each card surfaces:
 *
 *   - the thumbnail (9:16 aspect)
 *   - the `why_comparable` 1-line rationale from the backend
 *   - a small ID badge for cross-reference
 *   - a click-through to /dashboard/videos/<id> (existing detail page)
 *
 * The grid is 1-col on mobile, 2-col on sm, 3-col on lg. Each card is
 * a Link to the video detail page when possible — the backend returns
 * `video_id` as a string id, so we route to /dashboard/analyze/{id}.
 *
 * Pure presentational; parent passes the array.
 */

import { Link } from 'react-router-dom'
import type { GreenlightResponse } from '../../types/insights'

interface ComparableWinnersProps {
  winners: GreenlightResponse['comparable_winners']
  className?: string
}

type Winner = GreenlightResponse['comparable_winners'][number]

function ThumbPlaceholder() {
  return (
    <div className="w-full aspect-[9/16] rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center">
      <i className="fas fa-clapperboard text-purple-300/60 text-2xl" />
    </div>
  )
}

function WinnerCard({ winner, index }: { winner: Winner; index: number }) {
  // The video_id maps to content_videos.id — the detail page for a
  // specific viral video lives under /dashboard/videos/:id (admin) or
  // is reachable via the influencer feed. We point to the analyze
  // detail surface since it's the only public detail route shaped
  // around a single video id. Fall back to plain content when no
  // thumbnail is provided so the card still tells a story.
  const hasThumbnail = winner.thumbnail_url && winner.thumbnail_url.trim().length > 0

  return (
    <article className="group glass-card rounded-2xl p-3 hover:bg-white/[0.04] transition-colors">
      <div className="relative">
        {hasThumbnail ? (
          <img
            src={winner.thumbnail_url}
            alt=""
            loading="lazy"
            className="w-full aspect-[9/16] object-cover rounded-xl border border-white/[0.04]"
          />
        ) : (
          <ThumbPlaceholder />
        )}
        <span className="absolute top-2 left-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/60 backdrop-blur text-[10px] font-black tabular-nums text-white border border-white/15">
          {index + 1}
        </span>
      </div>
      <div className="mt-3 px-1">
        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-4">
          {winner.why_comparable}
        </p>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span className="font-mono truncate max-w-[60%]">#{winner.video_id}</span>
          <span className="inline-flex items-center gap-1 text-pink-300/80 group-hover:text-pink-300 transition-colors">
            View
            <i className="fas fa-arrow-up-right-from-square text-[9px]" />
          </span>
        </div>
      </div>
    </article>
  )
}

export default function ComparableWinners({ winners, className = '' }: ComparableWinnersProps) {
  const hasWinners = winners && winners.length > 0

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 lg:p-7 ${className}`}
      aria-label="Comparable winners"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
          <i className="fas fa-trophy text-orange-400 text-xs sm:text-sm" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
            Comparable winners
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-snug">
            {hasWinners
              ? 'Top videos sharing your hook + format + niche. Study what they did right.'
              : 'No close matches yet — your concept is in a sparse corner of the dataset.'}
          </p>
        </div>
      </div>

      {hasWinners ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {winners.slice(0, 5).map((winner, i) => {
            // Wrap in Link only when we have a usable id; otherwise
            // render the card inline.
            const id = winner.video_id?.trim()
            if (id) {
              return (
                <Link
                  key={`${id}-${i}`}
                  to={`/dashboard/analyze/${encodeURIComponent(id)}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 rounded-2xl"
                >
                  <WinnerCard winner={winner} index={i} />
                </Link>
              )
            }
            return <WinnerCard key={`winner-${i}`} winner={winner} index={i} />
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <i className="fas fa-compass text-slate-500 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
            Once more viral videos share this hook + format, comparable winners will surface here.
          </p>
        </div>
      )}
    </section>
  )
}
