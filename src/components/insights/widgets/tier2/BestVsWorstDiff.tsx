/**
 * BestVsWorstDiff — Tier 2 widget contrasting the user's top-5 and
 * bottom-5 videos across a fixed set of variables.
 *
 * Layout: two columns (Top 5 | Bottom 5) with matching stat tiles, plus
 * a "headline delta" callout at the top showing the biggest difference
 * between them (e.g. "Top 5 use Curiosity hooks 4× more than Bottom 5").
 *
 * Color coding:
 *   - Top column: emerald (what works)
 *   - Bottom column: rose (what doesn't)
 *
 * Data source: GET /api/insights/tier2/best-vs-worst
 *   → BE3 returns either the BestVsWorstSummary directly OR
 *     `{ data: null, reason: 'insufficient_data' }` when the user has
 *     fewer than 2 videos in either bucket.
 *
 * Empty state: "Analyze more of your content to unlock this comparison."
 */

import { useMemo } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'
import {
  isBestVsWorstSummary,
  type BestVsWorstBucket,
  type BestVsWorstDeltas,
  type BestVsWorstResponse,
} from './best-vs-worst-types'

interface BestVsWorstDiffProps {
  className?: string
}

interface ColumnStat {
  label: string
  value: string
}

function prettifyCategorical(raw: string | null | undefined): string {
  if (!raw) return '—'
  return raw
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

function topOfMix(mix: Record<string, number>): string | null {
  let bestKey: string | null = null
  let bestCount = 0
  for (const [k, v] of Object.entries(mix)) {
    if (v > bestCount) {
      bestKey = k
      bestCount = v
    }
  }
  return bestKey
}

function buildStats(bucket: BestVsWorstBucket): ColumnStat[] {
  return [
    {
      label: 'Avg views',
      value: compactNumber(bucket.avg_views),
    },
    {
      label: 'Avg engagement',
      value: `${(bucket.avg_engagement_rate <= 1
        ? bucket.avg_engagement_rate * 100
        : bucket.avg_engagement_rate
      ).toFixed(2)}%`,
    },
    {
      label: 'Median scroll-stop',
      value:
        bucket.median_scroll_stop_power === null
          ? '—'
          : String(bucket.median_scroll_stop_power),
    },
    {
      label: 'Median hook (s)',
      value:
        bucket.median_hook_seconds === null
          ? '—'
          : String(bucket.median_hook_seconds),
    },
    {
      label: 'Top primal trigger',
      value: prettifyCategorical(topOfMix(bucket.primal_trigger_mix)),
    },
    {
      label: 'Top emotion',
      value: prettifyCategorical(topOfMix(bucket.primary_emotion_mix)),
    },
  ]
}

interface HeadlineDelta {
  text: string
  emphasis: string
  tone: 'emerald' | 'amber' | 'rose'
}

/**
 * Compose a one-sentence "headline" delta from the deltas object. We
 * prefer the categorical mismatch (most legible) when one exists; fall
 * back to the scroll_stop_power delta or the avg_views lift.
 */
function buildHeadline(deltas: BestVsWorstDeltas): HeadlineDelta | null {
  if (
    deltas.top_primal_trigger_best &&
    deltas.top_primal_trigger_worst &&
    deltas.top_primal_trigger_best !== deltas.top_primal_trigger_worst
  ) {
    return {
      text: `Top 5 lean on "${prettifyCategorical(deltas.top_primal_trigger_best)}" hooks while Bottom 5 default to "${prettifyCategorical(deltas.top_primal_trigger_worst)}".`,
      emphasis: 'Primal trigger',
      tone: 'amber',
    }
  }
  if (
    deltas.top_primary_emotion_best &&
    deltas.top_primary_emotion_worst &&
    deltas.top_primary_emotion_best !== deltas.top_primary_emotion_worst
  ) {
    return {
      text: `Your hits land on "${prettifyCategorical(deltas.top_primary_emotion_best)}", your misses on "${prettifyCategorical(deltas.top_primary_emotion_worst)}".`,
      emphasis: 'Emotion',
      tone: 'amber',
    }
  }
  if (
    deltas.scroll_stop_power_delta !== null &&
    Math.abs(deltas.scroll_stop_power_delta) >= 5
  ) {
    const delta = deltas.scroll_stop_power_delta
    return {
      text: `Top 5 scroll-stop power outpaces Bottom 5 by ${Math.abs(delta).toFixed(1)} points.`,
      emphasis: 'Scroll-stop power',
      tone: 'emerald',
    }
  }
  if (
    deltas.hook_seconds_delta !== null &&
    Math.abs(deltas.hook_seconds_delta) >= 0.5
  ) {
    const delta = deltas.hook_seconds_delta
    const direction = delta < 0 ? 'shorter' : 'longer'
    return {
      text: `Top 5 hooks run ${Math.abs(delta).toFixed(1)}s ${direction} than Bottom 5 hooks.`,
      emphasis: 'Hook length',
      tone: 'emerald',
    }
  }
  if (deltas.avg_views_lift_x > 1.5) {
    return {
      text: `Top 5 average ${deltas.avg_views_lift_x.toFixed(1)}× the views of your Bottom 5.`,
      emphasis: 'Reach',
      tone: 'emerald',
    }
  }
  return null
}

function StatRow({ stat, tone }: { stat: ColumnStat; tone: 'emerald' | 'rose' }) {
  const valueColor = tone === 'emerald' ? 'text-emerald-200' : 'text-rose-200'
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {stat.label}
      </span>
      <span className={`text-sm font-black tabular-nums ${valueColor} truncate max-w-[60%] text-right`}>
        {stat.value}
      </span>
    </li>
  )
}

function Column({
  title,
  subtitle,
  stats,
  tone,
  iconClass,
}: {
  title: string
  subtitle: string
  stats: ColumnStat[]
  tone: 'emerald' | 'rose'
  iconClass: string
}) {
  const borderColor = tone === 'emerald' ? 'border-emerald-500/20' : 'border-rose-500/20'
  const bg = tone === 'emerald' ? 'bg-emerald-500/[0.04]' : 'bg-rose-500/[0.04]'
  const iconBg = tone === 'emerald' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
  const iconColor = tone === 'emerald' ? 'text-emerald-300' : 'text-rose-300'

  return (
    <div className={`rounded-2xl border ${borderColor} ${bg} p-4`}>
      <header className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <i className={`fas ${iconClass} ${iconColor} text-[11px]`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-200">
            {title}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">{subtitle}</div>
        </div>
      </header>
      <ul className="space-y-0">
        {stats.map((s) => (
          <StatRow key={s.label} stat={s} tone={tone} />
        ))}
      </ul>
    </div>
  )
}

const TONE_PILL: Record<HeadlineDelta['tone'], string> = {
  emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  rose: 'bg-rose-500/15 text-rose-200 border-rose-500/25',
}

export default function BestVsWorstDiff({ className = '' }: BestVsWorstDiffProps) {
  const { data, loading, error, retry, locked } = useInsights<BestVsWorstResponse>(
    'tier2/best-vs-worst',
  )

  const summary = isBestVsWorstSummary(data) ? data : null

  const bestStats = useMemo(
    () => (summary ? buildStats(summary.best) : []),
    [summary],
  )
  const worstStats = useMemo(
    () => (summary ? buildStats(summary.worst) : []),
    [summary],
  )
  const headline = useMemo(
    () => (summary ? buildHeadline(summary.deltas) : null),
    [summary],
  )

  return (
    <WidgetCard
      title="Best vs Worst"
      subtitle="What's different between your top-5 and bottom-5 posts."
      icon="fa-scale-balanced"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && summary === null}
      emptyIcon="fa-chart-bar"
      emptyMessage="Analyze more of your content to unlock this comparison."
      size="lg"
      className={className}
      locked={locked}
      tier={2}
      info={{
        what: 'What separates your top 5 videos from your bottom 5.',
        howToRead:
          "We diff the structural signals across your hits and your flops. The headline delta is the variable that most consistently differs — that's your highest-leverage lever. Fix that one thing and you'll see compounding gains across future posts.",
        computation:
          'Your top-5 by views vs your bottom-5 by views, comparing hook_seconds, scroll_stop_power, primal_trigger, primary_emotion, and top tactics.',
      }}
    >
      <div className="flex flex-col gap-4">
        {headline ? (
          <div
            className={`px-3 py-2.5 rounded-2xl border ${TONE_PILL[headline.tone]} flex items-start gap-2.5`}
          >
            <i className="fas fa-lightbulb text-[12px] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-80">
                {headline.emphasis}
              </div>
              <div className="text-[12px] font-semibold leading-snug">{headline.text}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Column
            title="Your Top 5"
            subtitle={
              summary
                ? `${summary.best.sample_size} posts · ${compactNumber(summary.best.avg_views)} avg views`
                : ''
            }
            stats={bestStats}
            tone="emerald"
            iconClass="fa-rocket"
          />
          <Column
            title="Your Bottom 5"
            subtitle={
              summary
                ? `${summary.worst.sample_size} posts · ${compactNumber(summary.worst.avg_views)} avg views`
                : ''
            }
            stats={worstStats}
            tone="rose"
            iconClass="fa-arrow-trend-down"
          />
        </div>

        {summary ? (
          <div className="text-[10px] text-slate-600 text-center pt-1">
            Top 5 reach{' '}
            <span className="font-black text-slate-300 tabular-nums">
              {summary.deltas.avg_views_lift_x.toFixed(1)}×
            </span>{' '}
            the views of your Bottom 5.
          </div>
        ) : null}
      </div>
    </WidgetCard>
  )
}
