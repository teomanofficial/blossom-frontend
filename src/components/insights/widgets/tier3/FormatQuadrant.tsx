/**
 * FormatQuadrant — Tier 3 Anatomy widget plotting format classes on a
 * 2D quadrant of adoption (video_count) vs. performance (avg_views).
 *
 * Mirrors HookMatrix but at the *format* level — talking-head vs.
 * cinematic POV vs. screen-recording-tutorial, etc. The format choice
 * is one of the highest-leverage decisions a creator makes before
 * shooting, so giving it its own panel is intentional.
 *
 * Backend: `GET /api/insights/tier3/format-quadrant`
 *   → { points: FormatQuadrantPoint[], niche, sample_size }
 *
 * See HookMatrix for the quadrant semantics and the lifecycle color
 * convention.
 */

import { useInsights } from '../../../../lib/useInsights'
import type { LifecycleStage } from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import { Quadrant } from '../../charts'
import type { QuadrantPoint } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface FormatQuadrantPoint {
  id: string
  name: string
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  lifecycle: LifecycleStage
  velocity: number
}

interface FormatQuadrantResponse {
  points: FormatQuadrantPoint[]
  niche: string | null
  sample_size: number
}

const LIFECYCLE_COLOR: Record<LifecycleStage, string> = {
  emerging: '#60a5fa',
  rising: '#34d399',
  peaking: '#facc15',
  stable: '#94a3b8',
  declining: '#fb7185',
}

interface FormatQuadrantProps {
  className?: string
  niche?: string
}

export default function FormatQuadrant({ className = '', niche }: FormatQuadrantProps) {
  const path = niche
    ? `tier3/format-quadrant?niche=${encodeURIComponent(niche)}`
    : 'tier3/format-quadrant'
  const { data, loading, error, retry } = useInsights<FormatQuadrantResponse>(path)

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
      title="Format Quadrant"
      subtitle="Which production formats compound — and which are crowded with no payoff?"
      icon="fa-table-cells-large"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && points.length === 0}
      emptyIcon="fa-table-cells-large"
      emptyMessage="No classified formats yet — analyse more content to populate this view."
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
          'Blue Ocean',
          'Mainstream Winners',
          'Saturated',
          'Emerging',
        ]}
        height={360}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="text-slate-600">Lifecycle</span>
        {(
          [
            ['emerging', 'Emerging'],
            ['rising', 'Rising'],
            ['peaking', 'Peaking'],
            ['stable', 'Stable'],
            ['declining', 'Declining'],
          ] as Array<[LifecycleStage, string]>
        ).map(([stage, label]) => (
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
    </WidgetCard>
  )
}
