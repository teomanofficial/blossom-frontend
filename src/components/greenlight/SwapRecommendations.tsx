/**
 * SwapRecommendations — the editable layer. Backend returns 3 concrete
 * "swap_from → swap_to" pairs with an expected_lift (0-100). We render
 * each as a card with a horizontal flow:
 *
 *   ┌──────────────────────────────────┐
 *   │ FROM "old phrasing"              │
 *   │       ↓                          │
 *   │ TO   "concrete edit"             │  +X% lift gauge
 *   └──────────────────────────────────┘
 *
 * A primary "Re-roll with my swaps applied" CTA at the bottom hands
 * control back to the page so it can splice the swaps into the concept
 * and re-submit. The button is disabled when `loading` (parent is
 * already running an evaluation).
 *
 * Pure presentational + a single button callback.
 */

import type { GreenlightResponse } from '../../types/insights'

interface SwapRecommendationsProps {
  swaps: GreenlightResponse['swap_recommendations']
  /** When provided, renders the re-roll CTA. Click bubbles to parent. */
  onReroll?: () => void
  loading?: boolean
  className?: string
}

type Swap = GreenlightResponse['swap_recommendations'][number]

function LiftGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const tone =
    v >= 70
      ? {
          ring: 'border-emerald-500/40',
          text: 'text-emerald-300',
          bar: 'bg-gradient-to-r from-emerald-400 to-teal-300',
        }
      : v >= 40
        ? {
            ring: 'border-amber-500/40',
            text: 'text-amber-300',
            bar: 'bg-gradient-to-r from-amber-400 to-orange-300',
          }
        : {
            ring: 'border-slate-500/30',
            text: 'text-slate-300',
            bar: 'bg-gradient-to-r from-slate-500 to-slate-400',
          }
  return (
    <div
      className={`shrink-0 sm:w-32 sm:flex-none rounded-2xl border ${tone.ring} bg-black/20 px-3 py-2.5`}
    >
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
        Expected lift
      </div>
      <div className={`text-2xl font-black tabular-nums ${tone.text} leading-none`}>
        +{v}
        <span className="text-xs font-bold text-slate-500 ml-0.5">pts</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
          style={{ width: `${Math.max(5, v)}%` }}
        />
      </div>
    </div>
  )
}

function SwapCard({ swap, index }: { swap: Swap; index: number }) {
  return (
    <article className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 hover:bg-white/[0.05] transition-colors">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black tabular-nums">
              {index + 1}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Swap
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">
                  From
                </span>
                <i className="fas fa-strikethrough text-rose-300/60 text-[9px]" />
              </div>
              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed line-through decoration-rose-500/40 decoration-2 break-words">
                {swap.swap_from}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-arrow-down text-slate-500 text-xs" />
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                  To
                </span>
                <i className="fas fa-wand-magic-sparkles text-emerald-300/80 text-[9px]" />
              </div>
              <p className="text-sm sm:text-[15px] text-white leading-relaxed font-medium break-words">
                {swap.swap_to}
              </p>
            </div>
          </div>
        </div>
        <LiftGauge value={swap.expected_lift} />
      </div>
    </article>
  )
}

export default function SwapRecommendations({
  swaps,
  onReroll,
  loading = false,
  className = '',
}: SwapRecommendationsProps) {
  const hasSwaps = swaps && swaps.length > 0

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 lg:p-7 ${className}`}
      aria-label="Swap recommendations"
    >
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
            <i className="fas fa-arrows-rotate text-pink-400 text-xs sm:text-sm" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
              Targeted edits
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-snug">
              {hasSwaps
                ? 'Three specific changes the AI thinks would lift this concept the most.'
                : 'No swaps available — the concept is too thin to suggest specific edits.'}
            </p>
          </div>
        </div>
      </div>

      {hasSwaps ? (
        <>
          <div className="space-y-3 sm:space-y-4">
            {swaps.map((swap, i) => (
              <SwapCard key={`${swap.swap_from.slice(0, 30)}-${i}`} swap={swap} index={i} />
            ))}
          </div>

          {onReroll ? (
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug min-w-0 flex-1">
                Apply all swaps to the concept text and run the evaluation again.
              </p>
              <button
                type="button"
                onClick={onReroll}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                  loading
                    ? 'bg-white/[0.04] border border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-px'
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin text-[10px]" />
                    Re-rolling…
                  </>
                ) : (
                  <>
                    <i className="fas fa-dice text-[10px]" />
                    Re-roll with my swaps applied
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <i className="fas fa-arrows-rotate text-slate-500 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
            No swap candidates surfaced. Expand the concept with more detail and try again.
          </p>
        </div>
      )}
    </section>
  )
}
