/**
 * PostMortemEntry — Tier 2's flagship CTA card.
 *
 * The single biggest, most prominent card in Tier 2 (spans both columns
 * on lg per FE1's layout). Sells the post-mortem feature with a hero
 * headline, 2-3 sample "diverged variable" tiles, and a button that
 * routes to /dashboard/post-mortem (the dedicated page N1 shipped).
 *
 * Sample tiles use canonical metric slugs (scroll_stop_power, hook_seconds,
 * primal_trigger) so the user sees realistic shapes before committing to
 * a video. When the user already has post-mortem data available
 * (best-vs-worst returned a real summary), we surface a "Last finding"
 * tile derived from that to make it personal.
 *
 * Exports:
 *  - default PostMortemEntry — the card itself.
 *  - WhyDidThisFlopLink — a helper anchor outlier feed / video cards can
 *    drop into rows to deep-link to /dashboard/post-mortem/${videoId}.
 *
 * Data sources:
 *  - GET /tier2/best-vs-worst (optional, for the "Last finding" personalisation).
 *  - No POST /post-mortem call here — that's the dedicated page's job.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'
import type { BestVsWorstResponse } from './best-vs-worst-types'

interface PostMortemEntryProps {
  className?: string
}

/** Pretty-print a metric slug like `scroll_stop_power` → "Scroll Stop Power". */
function prettifyMetric(slug: string): string {
  return slug
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

interface SampleTile {
  label: string
  before: string
  after: string
  arrow: 'down' | 'up'
  metric: string
  tone: 'rose' | 'amber' | 'emerald'
}

/**
 * Fallback diverged-variable tiles shown when we don't have personalised
 * data from best-vs-worst yet. These intentionally mimic the shape of a
 * real post-mortem finding so users grok the experience.
 */
const FALLBACK_TILES: SampleTile[] = [
  {
    label: 'Most recent user',
    metric: 'scroll_stop_power',
    before: '85',
    after: '35',
    arrow: 'down',
    tone: 'rose',
  },
  {
    label: 'Top diverged variable',
    metric: 'primal_trigger',
    before: 'Curiosity',
    after: 'Reassurance',
    arrow: 'down',
    tone: 'amber',
  },
  {
    label: 'Hook length gap',
    metric: 'hook_seconds',
    before: '2.4s',
    after: '5.1s',
    arrow: 'up',
    tone: 'emerald',
  },
]

/**
 * If best-vs-worst returned real data, synthesise one personalised tile
 * from the headline scroll_stop_power delta. Returns null when the user
 * has too few hits to baseline.
 */
function buildPersonalisedTile(summary: BestVsWorstResponse | null): SampleTile | null {
  if (!summary || summary.data === null) return null
  const { best, worst, deltas } = summary
  // Headline pick: scroll_stop_power delta if present, else the
  // top-primal-trigger mismatch.
  if (
    deltas.scroll_stop_power_delta !== null &&
    best.median_scroll_stop_power !== null &&
    worst.median_scroll_stop_power !== null &&
    Math.abs(deltas.scroll_stop_power_delta) >= 5
  ) {
    return {
      label: 'Last finding on your library',
      metric: 'scroll_stop_power',
      before: String(best.median_scroll_stop_power),
      after: String(worst.median_scroll_stop_power),
      arrow: 'down',
      tone: 'rose',
    }
  }
  if (
    deltas.top_primal_trigger_best &&
    deltas.top_primal_trigger_worst &&
    deltas.top_primal_trigger_best !== deltas.top_primal_trigger_worst
  ) {
    return {
      label: 'Last finding on your library',
      metric: 'primal_trigger',
      before: deltas.top_primal_trigger_best,
      after: deltas.top_primal_trigger_worst,
      arrow: 'down',
      tone: 'amber',
    }
  }
  return null
}

const TONE_BG: Record<SampleTile['tone'], string> = {
  rose: 'bg-rose-500/10 border-rose-500/20',
  amber: 'bg-amber-500/10 border-amber-500/20',
  emerald: 'bg-emerald-500/10 border-emerald-500/20',
}
const TONE_TEXT: Record<SampleTile['tone'], string> = {
  rose: 'text-rose-300',
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
}
const TONE_ARROW: Record<SampleTile['arrow'], string> = {
  down: 'fa-arrow-trend-down text-rose-400',
  up: 'fa-arrow-trend-up text-emerald-400',
}

function SampleTileCard({ tile }: { tile: SampleTile }) {
  return (
    <div
      className={`flex-1 min-w-[200px] rounded-2xl border ${TONE_BG[tile.tone]} p-4 transition-colors`}
    >
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
        {tile.label}
      </div>
      <div className="text-[11px] font-bold text-slate-300 mb-2 truncate">
        <span className="font-mono">{prettifyMetric(tile.metric)}</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-bold text-slate-200 tabular-nums text-sm">{tile.before}</span>
        <i className={`fas ${TONE_ARROW[tile.arrow]} text-[10px] mx-0.5`} aria-hidden="true" />
        <span className={`font-black tabular-nums text-base ${TONE_TEXT[tile.tone]}`}>
          {tile.after}
        </span>
      </div>
    </div>
  )
}

export default function PostMortemEntry({ className = '' }: PostMortemEntryProps) {
  // Best-vs-worst is optional — fail open to the sample tiles. We don't
  // surface its loading/error states in this card; this is purely a
  // discoverability / CTA component.
  const { data: bestVsWorst } = useInsights<BestVsWorstResponse>(
    'tier2/best-vs-worst',
  )

  const tiles = useMemo<SampleTile[]>(() => {
    const personalised = buildPersonalisedTile(bestVsWorst)
    if (!personalised) return FALLBACK_TILES.slice(0, 3)
    // When personalised, put it first and keep two fallback tiles for shape.
    return [personalised, FALLBACK_TILES[1]!, FALLBACK_TILES[2]!]
  }, [bestVsWorst])

  return (
    <WidgetCard
      title="Run a forensic autopsy on your content"
      subtitle="Pick any of your videos that underperformed. We'll tell you the single variable that diverged most from your hits — with tactic-level evidence."
      icon="fa-stethoscope"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      size="xl"
      className={className}
    >
      <div className="flex flex-col gap-5">
        {/* Sample / personalised tiles */}
        <div className="flex flex-wrap gap-3">
          {tiles.map((tile, idx) => (
            <SampleTileCard key={`${tile.metric}-${idx}`} tile={tile} />
          ))}
        </div>

        {/* CTA + supporting copy */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center shrink-0">
              <i className="fas fa-magnifying-glass-chart text-purple-200 text-sm" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
                Why did this one flop?
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                One click. Tactic-level evidence. Ranked prescriptions.
              </div>
            </div>
          </div>
          <Link
            to="/dashboard/post-mortem"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            <span>Open Post-Mortem</span>
            <i className="fas fa-arrow-right text-[11px]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </WidgetCard>
  )
}

// ---------------------------------------------------------------------------
// WhyDidThisFlopLink — helper export
// ---------------------------------------------------------------------------

interface WhyDidThisFlopLinkProps {
  videoId: string | number
  /** Compact mode renders an icon-only button — good for crowded rows. */
  compact?: boolean
  className?: string
}

/**
 * A small button-styled `<Link>` that other widgets (outlier cards,
 * your-videos rows) can drop alongside a video to deep-link to that
 * video's forensic page. Pure markup, no fetching.
 */
export function WhyDidThisFlopLink({
  videoId,
  compact = false,
  className = '',
}: WhyDidThisFlopLinkProps) {
  const to = `/dashboard/post-mortem/${videoId}`
  if (compact) {
    return (
      <Link
        to={to}
        title="Why did this flop?"
        aria-label="Why did this flop?"
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-purple-300 transition-colors ${className}`}
      >
        <i className="fas fa-stethoscope text-[10px]" aria-hidden="true" />
      </Link>
    )
  }
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:text-purple-200 transition-colors ${className}`}
    >
      <i className="fas fa-stethoscope text-[9px]" aria-hidden="true" />
      <span>Why did this flop?</span>
    </Link>
  )
}
