/**
 * LifecycleDistribution — Tier 0 widget showing the niche's overall
 * trend health: what share of trend classes are emerging, rising,
 * peaking, stable, or declining.
 *
 * UI shape:
 *   - Horizontal stacked bar with 5 segments (blue → emerald → yellow →
 *     slate → rose). Segment widths in % of the total class population.
 *   - A legend underneath shows the stage + percentage + count.
 *
 * Empty handling: until the lifecycle_stage backfill ships, the backend
 * may return `total === 0`. In that case we render a friendly
 * "Backfilling lifecycle stages" empty state with the LifecycleDial set
 * to "stable" so the visual identity of the widget still reads.
 *
 * Data source: `GET /api/insights/tier0/lifecycle` → LifecycleDistribution
 * (the type-name collision with the type definition itself is fine —
 * the widget file lives in a different module and resolves locally).
 */

import { useInsights } from '../../../../lib/useInsights'
import type {
  LifecycleDistribution as LifecycleDistributionPayload,
  LifecycleStage,
} from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import LifecycleDial from '../../shared/LifecycleDial'
import WidgetCard from '../../shared/WidgetCard'

interface LifecycleDistributionProps {
  className?: string
}

const STAGE_ORDER: readonly LifecycleStage[] = [
  'emerging',
  'rising',
  'peaking',
  'stable',
  'declining',
] as const

const STAGE_META: Record<
  LifecycleStage,
  { label: string; fill: string; dot: string; text: string }
> = {
  emerging: {
    label: 'Emerging',
    fill: 'bg-blue-400',
    dot: 'bg-blue-400',
    text: 'text-blue-300',
  },
  rising: {
    label: 'Rising',
    fill: 'bg-emerald-400',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  peaking: {
    label: 'Peaking',
    fill: 'bg-yellow-400',
    dot: 'bg-yellow-400',
    text: 'text-yellow-300',
  },
  stable: {
    label: 'Stable',
    fill: 'bg-slate-400',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
  },
  declining: {
    label: 'Declining',
    fill: 'bg-rose-400',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
  },
}

function getCount(
  dist: LifecycleDistributionPayload,
  stage: LifecycleStage,
): number {
  return Math.max(0, dist[stage] || 0)
}

function dominantStage(
  dist: LifecycleDistributionPayload,
): LifecycleStage {
  let best: LifecycleStage = 'stable'
  let bestCount = -1
  for (const stage of STAGE_ORDER) {
    const c = getCount(dist, stage)
    if (c > bestCount) {
      bestCount = c
      best = stage
    }
  }
  return best
}

export default function LifecycleDistribution({
  className = '',
}: LifecycleDistributionProps) {
  const { data, loading, error, retry } =
    useInsights<LifecycleDistributionPayload>('tier0/lifecycle')

  const total = data?.total ?? 0
  // Empty-state handled inline so we can keep the LifecycleDial visual.
  const isBackfilling = !loading && !error && total === 0

  return (
    <WidgetCard
      title="Lifecycle Distribution"
      subtitle="How emerging vs. declining your niche is right now."
      icon="fa-chart-pie"
      iconBg="bg-emerald-500/15"
      iconColor="text-emerald-400"
      loading={loading}
      error={error}
      onRetry={retry}
      size="lg"
      className={className}
      info={{
        what: "The share of trend classes in your niche at each lifecycle stage.",
        howToRead:
          "Emerging and rising mean opportunity — new patterns gaining steam you can ride. Peaking means it's working but crowded. Stable is the niche's evergreen baseline. Declining means it's burnt out — skip it. A healthy niche has plenty of emerging + rising.",
        computation:
          "We classify every trend class (hook, format, sound) into one of five lifecycle stages based on its 30-day video count growth curve, then tally the share per stage.",
      }}
    >
      {isBackfilling ? (
        <div className="flex flex-col items-center justify-center text-center py-6 gap-4">
          <LifecycleDial stage="stable" size="md" showLabel={false} />
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-slate-300 font-semibold">
              Backfilling lifecycle stages
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              We're computing the emerging → declining mix across the trend
              classes in your niche. Check back soon.
            </p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Stacked horizontal bar */}
          <div
            className="w-full h-7 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06] flex"
            role="img"
            aria-label="Lifecycle distribution stacked bar"
          >
            {STAGE_ORDER.map((stage) => {
              const count = getCount(data, stage)
              const pct = total > 0 ? (count / total) * 100 : 0
              if (pct === 0) return null
              const meta = STAGE_META[stage]
              return (
                <div
                  key={stage}
                  className={`${meta.fill} h-full flex items-center justify-center text-[9px] font-black text-black/70 tabular-nums transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${meta.label}: ${pct.toFixed(1)}% (${compactNumber(count)})`}
                >
                  {pct >= 8 ? `${Math.round(pct)}%` : ''}
                </div>
              )
            })}
          </div>

          {/* Legend grid */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
            {STAGE_ORDER.map((stage) => {
              const count = getCount(data, stage)
              const pct = total > 0 ? (count / total) * 100 : 0
              const meta = STAGE_META[stage]
              return (
                <li
                  key={stage}
                  className="flex items-center gap-2 min-w-0"
                  title={`${count} classes`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-bold text-slate-300 truncate">
                    {meta.label}
                  </span>
                  <span
                    className={`ml-auto text-[10px] font-black tabular-nums ${meta.text}`}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Dominant
            </div>
            <div
              className={`text-[11px] font-black uppercase tracking-widest ${STAGE_META[dominantStage(data)].text}`}
            >
              {STAGE_META[dominantStage(data)].label}
            </div>
            <div className="text-[10px] font-bold text-slate-500 tabular-nums">
              {compactNumber(total)} classes
            </div>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
