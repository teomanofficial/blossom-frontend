/**
 * TacticGapsList — Tier 2 widget surfacing the top-decile tactics that
 * dominate the user's niche but that the user hasn't touched yet.
 *
 * Each gap row shows:
 *   - TacticChip (name + category color)
 *   - "% of niche winners use this" line (niche_adoption_pct)
 *   - "+X% avg views" lift badge
 *   - "Add to next post checklist" CTA (placeholder toast for now)
 *
 * Sorted by `lift DESC` — biggest leverage at the top.
 *
 * Data source: GET /api/insights/tier2/tactic-gaps
 *   → BE3 unified envelope: `{ data: { gaps: TacticGap[] } | null, reason?: string }`.
 *     Empty-state path returns `{ data: null, reason: 'no_gaps' }`; success
 *     returns `{ data: { gaps: [...] } }`. See P2 envelope-consistency fix.
 *
 * Empty state: "You're already executing the top tactics in your niche."
 */

import toast from 'react-hot-toast'
import { useInsights } from '../../../../lib/useInsights'
import type { TacticGap } from '../../../../types/insights'
import TacticChip from '../../shared/TacticChip'
import WidgetCard from '../../shared/WidgetCard'

interface TacticGapsListProps {
  className?: string
}

interface TacticGapsEnvelope {
  data: { gaps: TacticGap[] } | null
  reason?: string
}

/**
 * Render the lift figure with an explicit "+" sign and "× lift" suffix.
 * Backend returns the raw performance_lift multiplier — display it the
 * way humans read multipliers (e.g. "+1.4× avg views").
 */
function formatLift(lift: number): string {
  if (!Number.isFinite(lift) || lift <= 0) return '—'
  const rounded = Math.round(lift * 100) / 100
  return `+${rounded.toFixed(2).replace(/\.?0+$/, '')}× avg views`
}

function GapRow({ gap }: { gap: TacticGap }) {
  function handleAddToChecklist() {
    toast.success('Added to checklist (coming soon)', {
      icon: '✓',
      duration: 2400,
    })
  }
  const adoption = Math.max(0, Math.min(100, Math.round(gap.niche_adoption_pct)))

  return (
    <li className="group flex items-start gap-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] p-3 transition-colors">
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TacticChip name={gap.tactic_name} category={gap.category} size="md" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-arrow-trend-up text-[9px]" aria-hidden="true" />
            {formatLift(gap.lift)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <i className="fas fa-users text-[10px] text-slate-600" aria-hidden="true" />
            <span className="font-semibold text-slate-300 tabular-nums">{adoption}%</span>
            <span>of niche winners use this</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fas fa-circle-xmark text-[10px] text-rose-400/70" aria-hidden="true" />
            <span className="font-semibold text-slate-300 tabular-nums">{gap.your_usage_count}</span>
            <span>in your posts</span>
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddToChecklist}
        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/25 text-pink-300 text-[10px] font-black uppercase tracking-widest transition-colors"
        title="Add to next post checklist"
      >
        <i className="fas fa-plus text-[9px]" aria-hidden="true" />
        Add to checklist
      </button>
    </li>
  )
}

export default function TacticGapsList({ className = '' }: TacticGapsListProps) {
  const { data, loading, error, retry } = useInsights<TacticGapsEnvelope>(
    'tier2/tactic-gaps',
  )

  // Unified envelope: `{ data: { gaps } | null, reason? }`. Empty-state
  // path returns data:null. Guard against either shape so the widget
  // tolerates rolling deploys.
  const gaps = data?.data?.gaps ?? []
  // Sort by lift descending (defensive — backend already orders, but
  // re-sort so callers can rely on the contract here too).
  const sorted = [...gaps].sort((a, b) => (b.lift ?? 0) - (a.lift ?? 0))

  return (
    <WidgetCard
      title="Tactic Gaps"
      subtitle="Tactics dominating your niche's top decile that your content skips."
      icon="fa-puzzle-piece"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && sorted.length === 0}
      emptyIcon="fa-trophy"
      emptyMessage="You're already executing the top tactics in your niche — great work."
      size="lg"
      className={className}
    >
      <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1 -mr-1">
        {sorted.map((gap) => (
          <GapRow key={gap.tactic_id} gap={gap} />
        ))}
      </ul>
    </WidgetCard>
  )
}
