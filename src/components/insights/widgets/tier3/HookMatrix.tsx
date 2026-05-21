/**
 * HookMatrix — Tier 3 Anatomy widget plotting hook classes on a 2D
 * quadrant of adoption (video_count) vs. performance (avg_views).
 *
 * Backend: `GET /api/insights/tier3/hook-matrix`
 *   → { points: HookMatrixPoint[], niche, sample_size }
 *
 * Visual mapping:
 *   - x = video_count (adoption / how many people are doing it)
 *   - y = avg_views   (performance / how loud it lands)
 *   - bubble size scales with `velocity` so trending hooks pop
 *   - bubble color encodes lifecycle (emerging / rising / etc.)
 *
 * The four labelled quadrants describe the *competitive landscape*:
 *
 *   • Mainstream Winners (top-right)  — high adoption + high performance.
 *   • Blue Ocean       (top-left)     — low adoption + high performance.
 *   • Saturated        (bottom-right) — high adoption + low performance.
 *   • Emerging         (bottom-left)  — low adoption + low performance (yet).
 *
 * The widget aims to answer "where should I copy from, and where is the
 * untapped white space?".
 */

import { useInsights } from '../../../../lib/useInsights'
import type { LifecycleStage } from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import { Quadrant } from '../../charts'
import type { QuadrantPoint } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface HookMatrixPoint {
  id: string
  name: string
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  lifecycle: LifecycleStage
  velocity: number
}

interface HookMatrixResponse {
  points: HookMatrixPoint[]
  niche: string | null
  sample_size: number
}

const LIFECYCLE_COLOR: Record<LifecycleStage, string> = {
  emerging: '#60a5fa', // blue-400
  rising: '#34d399', // emerald-400
  peaking: '#facc15', // yellow-400
  stable: '#94a3b8', // slate-400
  declining: '#fb7185', // rose-400
}

interface HookMatrixProps {
  className?: string
  niche?: string
}

export default function HookMatrix({ className = '', niche }: HookMatrixProps) {
  const path = niche ? `tier3/hook-matrix?niche=${encodeURIComponent(niche)}` : 'tier3/hook-matrix'
  const { data, loading, error, retry } = useInsights<HookMatrixResponse>(path)

  const points: QuadrantPoint[] = (data?.points ?? []).map((p) => ({
    x: p.video_count,
    y: p.avg_views,
    label: p.name,
    size: Math.max(0.25, Math.abs(p.velocity) + 0.25),
    color: LIFECYCLE_COLOR[p.lifecycle],
    meta: {
      videos: compactNumber(p.video_count),
      avg_views: compactNumber(p.avg_views),
      lifecycle: p.lifecycle,
      velocity: p.velocity.toFixed(2),
    },
  }))

  const nicheLabel = data?.niche ?? niche ?? null

  return (
    <WidgetCard
      title="Hook Matrix"
      subtitle="Hook classes plotted by adoption × performance — find blue-ocean styles before they saturate."
      icon="fa-grip"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && points.length === 0}
      emptyIcon="fa-grip"
      emptyMessage="Not enough classified hooks to draw a matrix yet."
      size="lg"
      className={className}
      actions={
        nicheLabel ? (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-300">
            {nicheLabel}
          </span>
        ) : null
      }
    >
      <Quadrant
        points={points}
        xLabel="Adoption (videos)"
        yLabel="Avg views"
        quadrantLabels={[
          'Blue Ocean', // top-left   (low x, high y)
          'Mainstream Winners', // top-right  (high x, high y)
          'Saturated', // bottom-right
          'Emerging', // bottom-left
        ]}
        height={360}
      />
      <LifecycleLegend />
    </WidgetCard>
  )
}

function LifecycleLegend() {
  const entries: Array<[LifecycleStage, string]> = [
    ['emerging', 'Emerging'],
    ['rising', 'Rising'],
    ['peaking', 'Peaking'],
    ['stable', 'Stable'],
    ['declining', 'Declining'],
  ]
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
      <span className="text-slate-600">Lifecycle</span>
      {entries.map(([stage, label]) => (
        <span key={stage} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: LIFECYCLE_COLOR[stage] }}
          />
          <span className="text-slate-400">{label}</span>
        </span>
      ))}
      <span className="ml-auto text-slate-600 hidden sm:inline">
        Bubble size = trend velocity
      </span>
    </div>
  )
}
