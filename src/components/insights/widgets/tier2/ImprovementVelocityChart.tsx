/**
 * ImprovementVelocityChart — Tier 2 widget plotting the user's
 * optimization_score over time across their iterated uploads.
 *
 * Data source: GET /api/insights/tier2/improvement-velocity
 *   → BE3 unified envelope: `{ data: { velocity: VelocityPoint[] } | null, reason? }`.
 *     Empty-state (no iterated uploads) returns `{ data: null, reason: 'no_versions' }`;
 *     success returns `{ data: { velocity: [...] } }` ordered by created_at ASC.
 *     Each point has an `upload_id`, `version_group_id`, `created_at`, and
 *     `optimization_score`. See P2 envelope-consistency fix.
 *
 * Rendering: single-series TrendLineChart. We slice out points with a
 * null score so the line stays continuous. Above the chart we surface
 * three derived stats:
 *   - Current score (last data point)
 *   - Trajectory (current - first), color-coded
 *   - Milestones crossed (≥50 and ≥70 thresholds), with bullets per
 *     threshold so the user gets a sense of how far they've come.
 *
 * Empty state: "Iterate on a video twice to start tracking improvement
 * velocity." We require ≥ 2 points before showing the chart — a single
 * point is just noise for a velocity widget.
 */

import { useMemo } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import { TrendLineChart } from '../../charts'
import type { TrendSeries } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface ImprovementVelocityChartProps {
  className?: string
}

interface VelocityPoint {
  upload_id: string
  version_group_id: string | null
  created_at: string
  optimization_score: number | null
  score_breakdown: Record<string, number> | null
}

interface VelocityEnvelope {
  data: { velocity: VelocityPoint[] } | null
  reason?: string
}

const MILESTONES = [50, 70] as const

interface DerivedSummary {
  current: number
  start: number
  delta: number
  trend: 'up' | 'down' | 'flat'
  crossed: number[]
}

function derive(points: VelocityPoint[]): DerivedSummary | null {
  const scored = points.filter(
    (p): p is VelocityPoint & { optimization_score: number } =>
      typeof p.optimization_score === 'number' && Number.isFinite(p.optimization_score),
  )
  if (scored.length === 0) return null
  const first = scored[0]!
  const last = scored[scored.length - 1]!
  const delta = last.optimization_score - first.optimization_score
  const trend: DerivedSummary['trend'] =
    Math.abs(delta) < 1 ? 'flat' : delta > 0 ? 'up' : 'down'

  const reached = new Set<number>()
  for (const p of scored) {
    for (const m of MILESTONES) {
      if (p.optimization_score >= m) reached.add(m)
    }
  }

  return {
    current: last.optimization_score,
    start: first.optimization_score,
    delta,
    trend,
    crossed: Array.from(reached).sort((a, b) => a - b),
  }
}

function formatChartX(iso: string, idx: number, total: number): string {
  // Compact M/D label; fall back to a counter when total is sparse so
  // axis labels don't collide.
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return `#${idx + 1}`
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  // For really long series we drop every other label by returning ""; the
  // Recharts XAxis `interval='preserveStartEnd'` will sample the visible
  // labels.
  if (total > 40 && idx % 2 === 1) return ''
  return `${month} ${day}`
}

const TREND_COLORS: Record<DerivedSummary['trend'], string> = {
  up: 'text-emerald-300',
  flat: 'text-slate-300',
  down: 'text-rose-300',
}
const TREND_ARROW: Record<DerivedSummary['trend'], string> = {
  up: 'fa-arrow-trend-up text-emerald-400',
  flat: 'fa-arrows-left-right text-slate-400',
  down: 'fa-arrow-trend-down text-rose-400',
}

export default function ImprovementVelocityChart({
  className = '',
}: ImprovementVelocityChartProps) {
  const { data, loading, error, retry, locked } = useInsights<VelocityEnvelope>(
    'tier2/improvement-velocity',
  )

  const points = useMemo(() => data?.data?.velocity ?? [], [data])
  const summary = useMemo(() => derive(points), [points])

  // Build the chart series. Skip null scores so the line stays clean.
  const series = useMemo<TrendSeries[]>(() => {
    if (points.length === 0) return []
    const scored = points.filter(
      (p): p is VelocityPoint & { optimization_score: number } =>
        typeof p.optimization_score === 'number' && Number.isFinite(p.optimization_score),
    )
    if (scored.length === 0) return []
    return [
      {
        name: 'Optimization score',
        color: '#34d399', // emerald-400
        data: scored.map((p, i) => ({
          x: formatChartX(p.created_at, i, scored.length),
          y: Math.round(p.optimization_score * 10) / 10,
        })),
      },
    ]
  }, [points])

  const scoredCount = series[0]?.data.length ?? 0
  const needMore = !loading && !error && scoredCount < 2

  return (
    <WidgetCard
      title="Improvement Velocity"
      subtitle="Are your revisions actually getting better? Version-over-version progress."
      icon="fa-chart-line"
      iconBg="bg-emerald-500/15"
      iconColor="text-emerald-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={needMore}
      emptyIcon="fa-arrows-up-down"
      emptyMessage="Iterate on a video twice to start tracking improvement velocity."
      size="lg"
      className={className}
      locked={locked}
      tier={2}
    >
      {summary ? (
        <div className="flex flex-col gap-4">
          {/* Headline metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Current
              </div>
              <div className="text-xl font-black tabular-nums text-slate-100">
                {Math.round(summary.current)}
                <span className="text-[10px] font-bold text-slate-500 ml-1">/ 100</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Trajectory
              </div>
              <div className={`text-xl font-black tabular-nums ${TREND_COLORS[summary.trend]}`}>
                <i
                  className={`fas ${TREND_ARROW[summary.trend]} text-sm mr-1`}
                  aria-hidden="true"
                />
                {summary.delta >= 0 ? '+' : ''}
                {summary.delta.toFixed(1)}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Iterations
              </div>
              <div className="text-xl font-black tabular-nums text-slate-100">{scoredCount}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3">
            <TrendLineChart
              series={series}
              height={180}
              formatY={(v) => `${Math.round(v)}`}
            />
          </div>

          {/* Milestone bullets */}
          <div className="flex items-center gap-2 flex-wrap">
            {MILESTONES.map((m) => {
              const reached = summary.crossed.includes(m)
              return (
                <span
                  key={m}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${
                    reached
                      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}
                >
                  <i
                    className={`fas ${reached ? 'fa-circle-check' : 'fa-circle-dashed'} text-[10px]`}
                    aria-hidden="true"
                  />
                  {reached ? `Crossed ${m}` : `Goal: ${m}`}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
