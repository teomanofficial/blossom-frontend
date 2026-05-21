/**
 * ScrollStopLeaderboard — Tier 3 Hook Lab widget ranking hook classes
 * by their average scroll-stop-power score (0-100).
 *
 * Each row shows:
 *   - hook class name
 *   - lifecycle dial (so the user can see whether the hook is rising
 *     or already past its peak)
 *   - a small HookHoldGauge visualising the 0-100 average score
 *   - sample size (how many top-decile videos contributed to the avg)
 *
 * Sortable on score (default DESC) and sample size.
 *
 * Backend: `GET /api/insights/tier3/scroll-stop-leaderboard`
 *   → { hooks: [{id, name, avg_scroll_stop, sample, lifecycle}],
 *       niche, sample_size }
 */

import { useMemo, useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import type { LifecycleStage } from '../../../../types/insights'
import { compactNumber } from '../../../../lib/format'
import HookHoldGauge from '../../shared/HookHoldGauge'
import LifecycleDial from '../../shared/LifecycleDial'
import WidgetCard from '../../shared/WidgetCard'

interface ScrollStopHook {
  id: string
  name: string
  avg_scroll_stop: number
  sample: number
  lifecycle: LifecycleStage
}

interface ScrollStopLeaderboardResponse {
  hooks: ScrollStopHook[]
  niche: string | null
  sample_size: number
}

type SortKey = 'score' | 'sample'

interface ScrollStopLeaderboardProps {
  className?: string
  niche?: string
}

export default function ScrollStopLeaderboard({
  className = '',
  niche,
}: ScrollStopLeaderboardProps) {
  const path = niche
    ? `tier3/scroll-stop-leaderboard?niche=${encodeURIComponent(niche)}`
    : 'tier3/scroll-stop-leaderboard'
  const { data, loading, error, retry, locked } =
    useInsights<ScrollStopLeaderboardResponse>(path)
  const [sortKey, setSortKey] = useState<SortKey>('score')

  const sorted = useMemo(() => {
    const hooks = data?.hooks ?? []
    return [...hooks].sort((a, b) => {
      if (sortKey === 'sample') return b.sample - a.sample
      return b.avg_scroll_stop - a.avg_scroll_stop
    })
  }, [data?.hooks, sortKey])

  const isEmpty = !loading && !error && sorted.length === 0

  return (
    <WidgetCard
      title="Scroll-Stop Leaderboard"
      subtitle="Hook classes ranked by how reliably they freeze the thumb in the first two seconds."
      icon="fa-bullseye"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-bullseye"
      emptyMessage="Not enough scored hooks to build a leaderboard yet."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
      actions={
        <div className="flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/10 p-0.5">
          <SortButton
            label="Score"
            active={sortKey === 'score'}
            onClick={() => setSortKey('score')}
          />
          <SortButton
            label="Sample"
            active={sortKey === 'sample'}
            onClick={() => setSortKey('sample')}
          />
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.05]">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="col-span-1">#</span>
          <span className="col-span-6 sm:col-span-5">Hook</span>
          <span className="col-span-3 sm:col-span-2">Lifecycle</span>
          <span className="col-span-2 sm:col-span-2 text-right">Sample</span>
          <span className="hidden sm:block sm:col-span-2 text-right">Score</span>
        </div>
        <ul>
          {sorted.map((h, idx) => (
            <li
              key={h.id}
              className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <span className="col-span-1 text-[11px] font-black tabular-nums text-slate-500">
                {idx + 1}
              </span>
              <span className="col-span-6 sm:col-span-5 text-[12px] sm:text-sm font-bold text-slate-100 truncate">
                {h.name}
              </span>
              <span className="col-span-3 sm:col-span-2">
                <LifecycleDial stage={h.lifecycle} size="sm" showLabel={false} />
              </span>
              <span className="col-span-2 sm:col-span-2 text-right text-[11px] font-bold text-slate-300 tabular-nums">
                {compactNumber(h.sample)}
              </span>
              <span className="hidden sm:flex sm:col-span-2 justify-end">
                <HookHoldGauge value={h.avg_scroll_stop} size={64} showValue />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  )
}

function SortButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
        active
          ? 'bg-cyan-500/20 text-cyan-200'
          : 'text-slate-500 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )
}
