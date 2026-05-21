/**
 * JumpOnTodayFeed — Tier 0 widget that lists 3-5 high-niche-fit trend
 * items the user should "ride" today before the window closes.
 *
 * Each card surfaces:
 *   - Type chip (hook / format / sound)
 *   - Name
 *   - NicheFitBadge (embedded score from the backend)
 *   - Days-remaining countdown chip
 *   - Recommended action as the body copy
 *   - Saturation bar at the bottom (filled to saturation_pct%)
 *
 * Empty handling: when the endpoint returns no qualifying items (no
 * niche-fit > 70 emerging/rising items in the last 24h) the widget
 * shows a copy-driven nudge to widen the niche tag.
 *
 * Data source: `GET /api/insights/tier0/jump-on-today`. NOTE — the
 * backend returns the array directly (not wrapped in `{ items }`), so
 * the hook is typed against `JumpOnTodayItem[]`.
 */

import { useInsights } from '../../../../lib/useInsights'
import type { JumpOnTodayItem } from '../../../../types/insights'
import NicheFitBadge from '../../shared/NicheFitBadge'
import WidgetCard from '../../shared/WidgetCard'

interface JumpOnTodayFeedProps {
  className?: string
}

const TYPE_META: Record<
  JumpOnTodayItem['type'],
  { label: string; chip: string; icon: string }
> = {
  hook: {
    label: 'Hook',
    chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
    icon: 'fa-fish-fins',
  },
  format: {
    label: 'Format',
    chip: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
    icon: 'fa-film',
  },
  sound: {
    label: 'Sound',
    chip: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    icon: 'fa-music',
  },
}

/**
 * Color-code the days-remaining countdown. Tighter windows get more
 * urgent palettes.
 */
function daysRemainingTone(days: number): string {
  if (!Number.isFinite(days) || days <= 0)
    return 'bg-rose-500/15 text-rose-300 border-rose-500/25'
  if (days <= 3) return 'bg-rose-500/15 text-rose-300 border-rose-500/25'
  if (days <= 7) return 'bg-amber-500/15 text-amber-300 border-amber-500/25'
  if (days <= 14) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
  return 'bg-sky-500/15 text-sky-300 border-sky-500/25'
}

function saturationTone(pct: number): { fill: string; text: string } {
  if (!Number.isFinite(pct) || pct <= 0)
    return { fill: 'bg-emerald-400', text: 'text-emerald-300' }
  if (pct >= 80) return { fill: 'bg-rose-400', text: 'text-rose-300' }
  if (pct >= 50) return { fill: 'bg-amber-400', text: 'text-amber-300' }
  return { fill: 'bg-emerald-400', text: 'text-emerald-300' }
}

function JumpCard({ item }: { item: JumpOnTodayItem }) {
  const typeMeta = TYPE_META[item.type] ?? TYPE_META.hook
  const days = Math.max(0, Math.round(item.days_remaining_estimate ?? 0))
  const daysTone = daysRemainingTone(days)
  const sat = Math.max(0, Math.min(100, Math.round(item.saturation_pct ?? 0)))
  const satTone = saturationTone(sat)

  return (
    <article className="rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-colors p-3 flex flex-col gap-2">
      <header className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 ${typeMeta.chip} border px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest`}
        >
          <i className={`fas ${typeMeta.icon} text-[9px]`} />
          {typeMeta.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 ${daysTone} border px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums`}
          title={`${days} days remaining estimate`}
        >
          <i className="fas fa-hourglass-half text-[9px]" />
          {days > 0 ? `${days}d left` : 'Closing'}
        </span>
      </header>

      <h4 className="text-sm font-bold text-slate-100 leading-tight">
        {item.name || 'Untitled'}
      </h4>

      <div>
        <NicheFitBadge score={item.niche_fit} size="sm" />
      </div>

      <p className="text-[11px] text-slate-400 leading-snug">
        {item.recommended_action ||
          'Reuse this pattern in your next post to ride the surge.'}
      </p>

      <div className="mt-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Saturation
          </span>
          <span className={`text-[10px] font-black tabular-nums ${satTone.text}`}>
            {sat}%
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sat}
          aria-label={`Saturation ${sat}%`}
        >
          <div
            className={`${satTone.fill} h-full rounded-full transition-all`}
            style={{ width: `${sat}%` }}
          />
        </div>
      </div>
    </article>
  )
}

export default function JumpOnTodayFeed({ className = '' }: JumpOnTodayFeedProps) {
  // The backend returns the raw array, not `{ items: [...] }`. Type the
  // hook accordingly so consumers don't drill through a missing field.
  const { data, loading, error, retry } =
    useInsights<JumpOnTodayItem[]>('tier0/jump-on-today')

  const items = Array.isArray(data) ? data : []

  return (
    <WidgetCard
      title="Jump on Today"
      subtitle="High niche-fit trends with a closing window."
      icon="fa-rocket"
      iconBg="bg-amber-500/15"
      iconColor="text-amber-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && items.length === 0}
      emptyIcon="fa-bullseye"
      emptyMessage="Nothing matches your niche today — try widening your niche tag in settings."
      size="lg"
      className={className}
    >
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <JumpCard item={item} />
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
