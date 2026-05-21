/**
 * NicheFitBadge — pill that surfaces the {@link NicheFitScore} computed
 * server-side and embedded inline in every trend-bearing response.
 *
 * - Color-coded across 4 thresholds (poor < 40, weak 40-59, fit 60-79,
 *   strong >= 80) using the project's emerald/amber/rose palette.
 * - Hover tooltip exposes the niche vs general engagement comparison,
 *   sample size, and the human-readable explanation so users can audit
 *   the score (matches the Evidence Trail philosophy).
 *
 * Pure presentational. Score data must be supplied by the parent
 * widget from its API response — there is no separate /niche-fit
 * fetch (see implementation plan §8 final bullet).
 */

import type { NicheFitScore } from '../../../types/insights'

interface NicheFitBadgeProps {
  score: NicheFitScore
  size?: 'sm' | 'md' | 'lg'
  /** Optional layout className for positioning by parent widgets. */
  className?: string
  /** When true, the verdict label sits beside the score; otherwise it only
   * appears on hover. Defaults to true for `md` / `lg`, false for `sm`. */
  showVerdict?: boolean
}

const VERDICT_LABEL: Record<NicheFitScore['verdict'], string> = {
  strong_fit: 'Strong fit',
  fit: 'Good fit',
  weak_fit: 'Weak fit',
  poor_fit: 'Poor fit',
}

/**
 * Bucket score into a color band. Thresholds match the spec:
 *   >= 80 → green, 60-79 → emerald, 40-59 → amber, < 40 → rose.
 */
function getTone(score: number): {
  pill: string
  dot: string
  ring: string
} {
  if (score >= 80) {
    return {
      pill: 'bg-green-500/20 text-green-300 border-green-500/30',
      dot: 'bg-green-400',
      ring: 'ring-green-400/40',
    }
  }
  if (score >= 60) {
    return {
      pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
      dot: 'bg-emerald-400',
      ring: 'ring-emerald-400/40',
    }
  }
  if (score >= 40) {
    return {
      pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
      ring: 'ring-amber-400/40',
    }
  }
  return {
    pill: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
    ring: 'ring-rose-400/40',
  }
}

const SIZE_VARIANTS: Record<
  NonNullable<NicheFitBadgeProps['size']>,
  { pill: string; dot: string; gap: string; verdict: string }
> = {
  sm: {
    pill: 'px-2 py-0.5 text-[10px] font-bold rounded-full border',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
    verdict: 'text-[9px]',
  },
  md: {
    pill: 'px-2.5 py-1 text-xs font-bold rounded-full border',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
    verdict: 'text-[10px]',
  },
  lg: {
    pill: 'px-3 py-1.5 text-sm font-bold rounded-full border',
    dot: 'w-2.5 h-2.5',
    gap: 'gap-2',
    verdict: 'text-xs',
  },
}

function formatEngagement(value: number): string {
  if (!Number.isFinite(value)) return '—'
  // Engagement comes back as a rate (0-1 or 0-100). We accept either and
  // normalize: anything <= 1 is treated as a ratio.
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

function formatSampleSize(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(value))
}

export default function NicheFitBadge({
  score,
  size = 'md',
  className = '',
  showVerdict,
}: NicheFitBadgeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score.score)))
  const tone = getTone(clamped)
  const sz = SIZE_VARIANTS[size]
  const verdictLabel = VERDICT_LABEL[score.verdict]
  const inlineVerdict = showVerdict ?? size !== 'sm'

  // Tooltip body — rendered via group-hover; positioned above so it
  // doesn't get clipped inside scroll containers near the bottom of a
  // widget card.
  const tooltipBody = (
    <div
      role="tooltip"
      className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 w-64 opacity-0 group-hover/nichefit:opacity-100 transition-opacity duration-150"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/60 p-3 text-left">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Niche fit
          </span>
          <span className="text-xs font-black text-white">{clamped}%</span>
        </div>
        <div className="text-[11px] font-semibold text-white mb-2 truncate">
          {verdictLabel}
          {score.niche ? <span className="text-slate-400"> · {score.niche}</span> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
              Niche avg
            </div>
            <div className="text-xs font-bold text-white">
              {formatEngagement(score.niche_avg_engagement)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
              General avg
            </div>
            <div className="text-xs font-bold text-slate-300">
              {formatEngagement(score.general_avg_engagement)}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mb-2">
          Sample size: <span className="text-slate-300 font-semibold">{formatSampleSize(score.sample_size)}</span>
        </div>
        {score.explanation ? (
          <p className="text-[11px] text-slate-300 leading-snug">{score.explanation}</p>
        ) : null}
      </div>
      {/* Tooltip arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-slate-900/95 border-r border-b border-white/10" />
    </div>
  )

  return (
    <span
      className={`group/nichefit relative inline-flex items-center ${sz.gap} ${className}`}
    >
      <span
        className={`inline-flex items-center ${sz.gap} ${sz.pill} ${tone.pill} whitespace-nowrap`}
      >
        <span className={`rounded-full ${sz.dot} ${tone.dot}`} aria-hidden="true" />
        <span>{clamped}% niche fit</span>
        {inlineVerdict ? (
          <span className={`opacity-70 font-semibold ${sz.verdict}`}>· {verdictLabel}</span>
        ) : null}
      </span>
      {tooltipBody}
    </span>
  )
}
