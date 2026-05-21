/**
 * TeardownPanel — inline-expandable surface that surfaces the full tactic
 * teardown for an outlier (≤ 10 items per BE2 contract).
 *
 * Each row shows: TacticChip + optional timestamp pill + the "why it
 * worked" explanation. When `why_it_worked` comes back as empty string
 * (BE2 falls back through 4 layers of rationale before giving up) we
 * render a muted "No analysis yet" so users understand the gap rather
 * than assume the data is broken.
 *
 * The panel collapses to nothing when `open` is false so the surrounding
 * card height shrinks accordingly — react-router doesn't need a key here
 * because the parent OutlierCard manages its own open state.
 */

import type { TacticTeardownItem } from '../../types/insights'
import TacticChip from '../insights/shared/TacticChip'

interface TeardownPanelProps {
  teardown: TacticTeardownItem[]
  /** Optional className for layout positioning by the parent card. */
  className?: string
}

function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function TeardownRow({ item }: { item: TacticTeardownItem }) {
  const hasTimestamp =
    typeof item.timestamp_sec === 'number' &&
    Number.isFinite(item.timestamp_sec) &&
    item.timestamp_sec >= 0
  const hasWhy = item.why_it_worked && item.why_it_worked.trim().length > 0

  return (
    <li className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 sm:p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <TacticChip
          name={item.tactic_name}
          category={item.category}
          score={item.execution_score}
          size="md"
        />
        {hasTimestamp ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] font-bold text-slate-400">
            <i className="fas fa-clock text-[9px]" />
            {formatTimestamp(item.timestamp_sec as number)}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5">
        {hasWhy ? (
          <p className="text-xs sm:text-[13px] text-slate-300 leading-snug">
            {item.why_it_worked}
          </p>
        ) : (
          <p className="text-xs text-slate-600 italic font-medium">
            No analysis yet.
          </p>
        )}
      </div>
    </li>
  )
}

export default function TeardownPanel({ teardown, className = '' }: TeardownPanelProps) {
  if (!teardown || teardown.length === 0) {
    return (
      <div
        className={`mt-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] px-4 py-5 text-center ${className}`}
      >
        <i className="fas fa-flask text-slate-600 text-base mb-2 block" />
        <p className="text-xs text-slate-500 font-medium">
          No tactic teardown available yet for this outlier.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`mt-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <i className="fas fa-flask text-pink-300 text-[11px]" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          Tactic teardown
        </h4>
        <span className="text-[10px] font-bold text-slate-600">
          {teardown.length} item{teardown.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="space-y-2.5">
        {teardown.map((item, idx) => (
          <TeardownRow key={`${item.tactic_name}-${idx}`} item={item} />
        ))}
      </ul>
    </div>
  )
}
