/**
 * CognitiveInterruptionHeatmap — Tier 3 Anatomy widget showing how each
 * primal trigger performs across each niche.
 *
 * The matrix is a niches × triggers grid where each cell is the *lift*
 * in average views vs. the global top-decile baseline. Values around
 * 1.0 mean "neutral", > 1.0 means "this trigger lands in this niche",
 * < 1.0 means "this trigger underperforms here". A diverging color
 * scale makes the boundary at 1.0 readable at a glance.
 *
 * Backend reality check (per BE4a): the live data uses the lowercased
 * trigger names that the analyzer actually emits — `curiosity`,
 * `desire`, `belonging`, `fear`, `status`, `controversy`, `frustration`,
 * `fomo`. The spec doc mentions abstract names like `expectation_violation`
 * but those aren't in the database, so we follow the data.
 *
 * Backend: `GET /api/insights/tier3/cognitive-interruption`
 *   → { triggers, niches, values, samples, baseline_avg_views, niche_filter }
 *
 * Cells with sample count < 5 are returned as 1.0 / 0 samples and we
 * keep them — they appear in neutral mid-color so the grid stays
 * rectangular and the user can scan rows/columns cleanly.
 */

import { useInsights } from '../../../../lib/useInsights'
import { HeatGrid } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface CognitiveInterruptionResponse {
  triggers: string[]
  niches: string[]
  values: number[][]
  samples: number[][]
  baseline_avg_views: number
  niche_filter: string | null
}

interface CognitiveInterruptionHeatmapProps {
  className?: string
  niche?: string
}

const TRIGGER_LABEL: Record<string, string> = {
  curiosity: 'Curiosity',
  desire: 'Desire',
  belonging: 'Belonging',
  fear: 'Fear',
  status: 'Status',
  controversy: 'Controversy',
  frustration: 'Frustration',
  fomo: 'FOMO',
}

function prettify(label: string): string {
  return (
    TRIGGER_LABEL[label] ??
    label
      .split(/[_\s-]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
  )
}

export default function CognitiveInterruptionHeatmap({
  className = '',
  niche,
}: CognitiveInterruptionHeatmapProps) {
  const path = niche
    ? `tier3/cognitive-interruption?niche=${encodeURIComponent(niche)}`
    : 'tier3/cognitive-interruption'
  const { data, loading, error, retry, locked } = useInsights<CognitiveInterruptionResponse>(path)

  const isEmpty =
    !loading &&
    !error &&
    (!data || data.niches.length === 0 || data.triggers.length === 0)

  const triggerLabels = (data?.triggers ?? []).map(prettify)
  const nicheLabels = (data?.niches ?? []).map((n) =>
    n.charAt(0).toUpperCase() + n.slice(1),
  )

  return (
    <WidgetCard
      title="Cognitive Interruption Matrix"
      subtitle="Lift in average views by primal trigger × niche — find what interrupts the scroll in your space."
      icon="fa-fire-flame-curved"
      iconBg="bg-orange-500/15"
      iconColor="text-orange-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-fire-flame-curved"
      emptyMessage="Not enough top-decile hook analyses to chart this matrix yet."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
      actions={
        data?.baseline_avg_views ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Baseline {formatViews(data.baseline_avg_views)}
          </span>
        ) : null
      }
    >
      <HeatGrid
        rows={nicheLabels}
        cols={triggerLabels}
        values={data?.values ?? []}
        colorScale="diverging"
        valueLabel="Lift vs baseline"
        formatValue={(v) => `${v.toFixed(2)}×`}
      />
      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-rose-400/60" />
            <span className="text-slate-400">Underperforms</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-slate-500/60" />
            <span className="text-slate-400">Neutral</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-400/60" />
            <span className="text-slate-400">Outperforms</span>
          </span>
        </div>
        {data?.niche_filter ? (
          <span className="text-cyan-300">{data.niche_filter}</span>
        ) : null}
      </div>
    </WidgetCard>
  )
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k views`
  return `${Math.round(n)} views`
}
