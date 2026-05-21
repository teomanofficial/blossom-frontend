/**
 * ScoreBreakdown — the four progress bars that make the verdict
 * inspectable. Each row pairs a copy-tested label with a 0-100 bar
 * and a numeric readout.
 *
 * The four scores are:
 *   1. Hook strength       — predicted_hook_strength
 *   2. Niche fit           — niche_fit.score
 *   3. Format momentum     — format_fit.score
 *   4. Overall greenlight  — overall_score
 *
 * If the backend returned `score_breakdown` we use its values directly
 * (they round to integers); otherwise we fall back to the response's
 * top-level rounded numbers so the component is still useful even if
 * an older payload arrives.
 *
 * Pure presentational; parent passes the full GreenlightResponse.
 */

import type { GreenlightResponse } from '../../types/insights'

interface ScoreBreakdownProps {
  response: GreenlightResponse
  className?: string
}

interface ScoreRow {
  key: string
  label: string
  value: number
  /** 1-sentence subtitle that becomes the row's hover hint + helper text. */
  hint: string
}

function toneFor(value: number): {
  bar: string
  ring: string
  text: string
  label: string
} {
  if (value >= 70) {
    return {
      bar: 'bg-gradient-to-r from-emerald-400 to-teal-300',
      ring: 'shadow-[0_0_18px_-4px_rgba(16,185,129,0.6)]',
      text: 'text-emerald-300',
      label: 'Strong',
    }
  }
  if (value >= 50) {
    return {
      bar: 'bg-gradient-to-r from-amber-400 to-orange-300',
      ring: 'shadow-[0_0_18px_-4px_rgba(245,158,11,0.55)]',
      text: 'text-amber-300',
      label: 'Mid',
    }
  }
  if (value >= 30) {
    return {
      bar: 'bg-gradient-to-r from-orange-400 to-rose-400',
      ring: 'shadow-[0_0_18px_-4px_rgba(249,115,22,0.55)]',
      text: 'text-orange-300',
      label: 'Weak',
    }
  }
  return {
    bar: 'bg-gradient-to-r from-rose-500 to-red-500',
    ring: 'shadow-[0_0_18px_-4px_rgba(244,63,94,0.6)]',
    text: 'text-rose-300',
    label: 'Floor',
  }
}

function ScoreBar({ row }: { row: ScoreRow }) {
  const value = Math.max(0, Math.min(100, Math.round(row.value)))
  const tone = toneFor(value)
  // 5% minimum width so very low values are still visible as a sliver.
  const width = Math.max(5, value)
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-white truncate">
            {row.label}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
            {row.hint}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl sm:text-2xl font-black tabular-nums text-white leading-none">
            {value}
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">/100</span>
          </div>
          <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${tone.text}`}>
            {tone.label}
          </div>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.04]">
        <div
          className={`h-full rounded-full ${tone.bar} ${tone.ring} transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          aria-label={row.label}
        />
      </div>
    </div>
  )
}

export default function ScoreBreakdown({ response, className = '' }: ScoreBreakdownProps) {
  const breakdown = response.score_breakdown
  const rows: ScoreRow[] = [
    {
      key: 'hook',
      label: 'Hook strength',
      value: breakdown?.hook_strength ?? response.predicted_hook_strength,
      hint: 'Predicted scroll-stop power vs. niche baseline.',
    },
    {
      key: 'niche',
      label: 'Niche fit',
      value: breakdown?.niche_fit ?? Math.round(response.niche_fit.score),
      hint: response.niche_fit.explanation || 'How well this lands with your audience.',
    },
    {
      key: 'format',
      label: 'Format momentum',
      value: breakdown?.format_fit ?? Math.round(response.format_fit.score),
      hint: response.format_fit.reasoning || 'Where this format sits in its lifecycle.',
    },
    {
      key: 'overall',
      label: 'Overall greenlight score',
      value: response.overall_score,
      hint: 'Weighted blend — hook 40%, niche 30%, format 20%, DISC 10%.',
    },
  ]

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 lg:p-7 ${className}`}
      aria-label="Score breakdown"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
          <i className="fas fa-gauge-high text-pink-400 text-xs sm:text-sm" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
            Score breakdown
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            The four dimensions feeding the verdict above.
          </p>
        </div>
      </div>
      <div className="space-y-5">
        {rows.map((row) => (
          <ScoreBar key={row.key} row={row} />
        ))}
      </div>
    </section>
  )
}
