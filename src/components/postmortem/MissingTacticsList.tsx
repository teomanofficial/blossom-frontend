/**
 * MissingTacticsList — tactics that the user's hits in this niche
 * use but this specific video skipped. Grouped by category so the
 * user can spot pattern gaps (e.g. "I'm missing 3 hook_visual tactics").
 *
 * Each entry composes the shared TacticChip. The chip has a built-in
 * `title` attr; we supplement with a per-tactic "why it worked"
 * expansion below the chip so the user gets actionable context.
 */

import { useMemo } from 'react'
import type { PostMortemResponse } from '../../types/insights'
import TacticChip from '../insights/shared/TacticChip'
import WidgetCard from '../insights/shared/WidgetCard'

interface MissingTacticsListProps {
  missing: PostMortemResponse['missing_tactics']
  className?: string
}

function prettifyCategory(slug: string): string {
  return slug
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

function formatTimestamp(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return null
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function MissingTacticsList({
  missing,
  className = '',
}: MissingTacticsListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PostMortemResponse['missing_tactics']>()
    for (const item of missing) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return Array.from(map.entries())
  }, [missing])

  return (
    <WidgetCard
      title="What your hits do that this one didn't"
      subtitle={`${missing.length} tactic${missing.length === 1 ? '' : 's'} you skipped — and what each one buys you.`}
      icon="fa-puzzle-piece"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      size="lg"
      isEmpty={missing.length === 0}
      emptyMessage="No gold-standard tactics are missing — your tactic coverage matches the top decile of your niche."
      emptyIcon="fa-circle-check"
      className={className}
    >
      <div className="space-y-5">
        {grouped.map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {prettifyCategory(category)}
              </h4>
              <span className="text-[10px] font-bold text-slate-600">
                {items.length} missing
              </span>
            </div>
            <ul className="space-y-2">
              {items.map((item, i) => {
                const ts = formatTimestamp(item.timestamp_sec)
                return (
                  <li
                    key={`${item.tactic_name}-${i}`}
                    className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 sm:p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <TacticChip name={item.tactic_name} category={item.category} size="md" />
                      {ts ? (
                        <span className="text-[10px] font-bold text-slate-500 inline-flex items-center gap-1 mt-1">
                          <i className="fas fa-clock text-[9px]" />
                          target {ts}
                        </span>
                      ) : null}
                    </div>
                    {item.why_it_worked ? (
                      <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.why_it_worked}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
