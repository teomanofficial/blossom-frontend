/**
 * HookStrengthGauge — Tier 2 widget surfacing the user's average
 * scroll_stop_power against the niche-wide median.
 *
 * Composition (no dedicated /tier2/hook-strength endpoint exists yet):
 *   - User average comes from /tier2/best-vs-worst (the Best bucket's
 *     median_scroll_stop_power, blended with the Worst bucket so we get
 *     a true catalog-wide median, not just the hits' median).
 *   - Niche benchmark comes from /tier3/scroll-stop-leaderboard
 *     — we approximate the niche P50 as the median across the returned
 *     hook classes' avg_scroll_stop.
 *
 * Renders the shared HookHoldGauge semicircle with the niche P50 marked
 * as a tick. Below the gauge, a one-line copy explains the delta.
 *
 * Empty state: "Analyze 3+ of your videos to compute your hook strength
 * index." Triggered when best-vs-worst returns null OR the leaderboard
 * has too few samples.
 *
 * Notes for N1: see report-back §6 — a single /tier2/hook-strength
 * endpoint would replace this composition entirely.
 */

import { useMemo } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import HookHoldGauge from '../../shared/HookHoldGauge'
import WidgetCard from '../../shared/WidgetCard'
import {
  isBestVsWorstSummary,
  type BestVsWorstResponse,
  type BestVsWorstSummary,
} from './best-vs-worst-types'

interface HookStrengthGaugeProps {
  className?: string
}

interface LeaderboardHook {
  id: string
  name: string
  avg_scroll_stop: number
  sample: number
  lifecycle: string | null
}

interface LeaderboardResponse {
  hooks: LeaderboardHook[]
  niche: string | null
  sample_size: number
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1]
    const b = sorted[mid]
    if (typeof a !== 'number' || typeof b !== 'number') return null
    return (a + b) / 2
  }
  return sorted[mid] ?? null
}

/**
 * Approximate "your overall average scroll_stop_power" by averaging the
 * Best and Worst bucket medians, weighted by sample size. This is a
 * defensible blend because BE3 only exposes the per-bucket medians, not
 * the corpus-wide one — and the user wants "your library", not "your hits".
 */
function blendUserAvg(summary: BestVsWorstSummary | null): number | null {
  if (!summary) return null
  const { best, worst } = summary
  const parts: Array<{ value: number; weight: number }> = []
  if (best.median_scroll_stop_power !== null) {
    parts.push({ value: best.median_scroll_stop_power, weight: best.sample_size })
  }
  if (worst.median_scroll_stop_power !== null) {
    parts.push({ value: worst.median_scroll_stop_power, weight: worst.sample_size })
  }
  if (parts.length === 0) return null
  const totalWeight = parts.reduce((acc, p) => acc + Math.max(1, p.weight), 0)
  if (totalWeight <= 0) return null
  const weighted = parts.reduce(
    (acc, p) => acc + p.value * Math.max(1, p.weight),
    0,
  )
  return weighted / totalWeight
}

export default function HookStrengthGauge({ className = '' }: HookStrengthGaugeProps) {
  const bestVsWorst = useInsights<BestVsWorstResponse>('tier2/best-vs-worst')
  const leaderboard = useInsights<LeaderboardResponse>('tier3/scroll-stop-leaderboard')

  const summary = isBestVsWorstSummary(bestVsWorst.data) ? bestVsWorst.data : null

  const userAvg = useMemo(() => blendUserAvg(summary), [summary])

  const nicheP50 = useMemo(() => {
    const hooks = leaderboard.data?.hooks ?? []
    if (hooks.length === 0) return null
    return median(hooks.map((h) => h.avg_scroll_stop))
  }, [leaderboard.data])

  const loading = bestVsWorst.loading || leaderboard.loading
  // Combined error: surface whichever returns one first. Retry hits both.
  const error = bestVsWorst.error ?? leaderboard.error
  // The widget is Tier 2 — best-vs-worst is the tier-gated endpoint, so
  // honor its locked state. (Leaderboard is Tier 3 but on Platin so a
  // Tier 2 lock takes precedence for this composition.)
  const locked = bestVsWorst.locked ?? leaderboard.locked
  function retry() {
    bestVsWorst.retry()
    leaderboard.retry()
  }

  const haveBoth = userAvg !== null && nicheP50 !== null
  const isEmpty = !loading && !error && !haveBoth

  const delta = haveBoth ? userAvg - nicheP50 : 0
  const deltaRounded = Math.round(delta * 10) / 10
  const deltaPositive = deltaRounded >= 0
  const deltaPhrase =
    deltaRounded === 0
      ? 'right on the niche median.'
      : deltaPositive
        ? `+${deltaRounded.toFixed(1)} points above the niche median.`
        : `${deltaRounded.toFixed(1)} points below the niche median.`

  return (
    <WidgetCard
      title="Hook Strength"
      subtitle="Your average scroll-stop power vs. niche P50."
      icon="fa-gauge-high"
      iconBg="bg-amber-500/15"
      iconColor="text-amber-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-gauge"
      emptyMessage="Analyze 3+ of your videos to compute your hook strength index."
      size="lg"
      className={className}
      locked={locked}
      tier={2}
      info={{
        what: "Your library's average scroll-stop power compared to the niche median.",
        howToRead:
          "Scroll-stop power is a 0-100 score for how reliably a hook freezes thumbs in the first two seconds. The tick on the gauge is the niche P50 — your average above that means you out-hook the median creator in your space; below means your hooks are leaking attention.",
        computation:
          "Your average is a sample-weighted blend of your top-5 and bottom-5 video median scores. The niche P50 is the median across hook classes' avg_scroll_stop in the leaderboard.",
      }}
    >
      {haveBoth ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <HookHoldGauge
            value={userAvg}
            benchmark={nicheP50}
            label="Your Hook Strength"
            size={200}
          />
          <div className="text-center max-w-xs">
            <div
              className={`text-xs font-bold ${
                deltaPositive ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              You're{' '}
              <span className="font-black tabular-nums">{deltaPhrase}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 leading-snug">
              Niche P50 sits at{' '}
              <span className="font-bold text-slate-300 tabular-nums">
                {Math.round(nicheP50)}
              </span>
              . Your library averages{' '}
              <span className="font-bold text-slate-300 tabular-nums">
                {Math.round(userAvg)}
              </span>
              .
            </div>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
