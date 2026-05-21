/**
 * BreakoutsStrip — Tier 0 widget surfacing the top 5 hooks / formats /
 * sounds / topics that surged in the last 24 hours.
 *
 * One column per breakout type (4-up grid on desktop, 2-up on tablet,
 * 1-up on mobile). Each row shows:
 *   - A bold z-score badge ("9.5× normal") in the type's accent color
 *   - The breakout name and current lifecycle dial
 *   - The embedded NicheFitBadge (compact)
 *   - A VelocitySparkline visualising the 7d → 24h video-count delta
 *
 * Data source: `GET /api/insights/tier0/breakouts` → Tier0BreakoutsResponse.
 *
 * Empty/loading/error states are delegated to WidgetCard. When every
 * category is empty the widget renders WidgetCard's `isEmpty` state.
 */

import { useInsights } from '../../../../lib/useInsights'
import type {
  BreakoutItem,
  Tier0BreakoutsResponse,
} from '../../../../types/insights'
import { compactNumber, formatMultiplier } from '../../../../lib/format'
import LifecycleDial from '../../shared/LifecycleDial'
import NicheFitBadge from '../../shared/NicheFitBadge'
import VelocitySparkline from '../../shared/VelocitySparkline'
import WidgetCard from '../../shared/WidgetCard'

interface BreakoutsStripProps {
  className?: string
}

type BreakoutType = BreakoutItem['type']

const TYPE_META: Record<
  BreakoutType,
  { label: string; icon: string; chip: string; ring: string }
> = {
  hook: {
    label: 'Hooks',
    icon: 'fa-fish-fins',
    chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
    ring: 'ring-pink-500/30',
  },
  format: {
    label: 'Formats',
    icon: 'fa-film',
    chip: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
    ring: 'ring-fuchsia-500/30',
  },
  sound: {
    label: 'Sounds',
    icon: 'fa-music',
    chip: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    ring: 'ring-purple-500/30',
  },
  topic: {
    label: 'Topics',
    icon: 'fa-hashtag',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    ring: 'ring-sky-500/30',
  },
}

const TYPE_ORDER: readonly BreakoutType[] = ['hook', 'format', 'sound', 'topic']

/**
 * Build a small 4-point synthetic series visualising the 24h surge vs
 * the 7d average. The backend doesn't return a per-day series yet, so
 * we interpolate four points between the 7d average and the latest
 * 24h count — enough to give the sparkline a meaningful slope.
 */
function buildBreakoutSeries(item: BreakoutItem): number[] {
  const baseline = Math.max(0, item.video_count_7d_avg)
  const latest = Math.max(0, item.video_count_24h)
  if (baseline === 0 && latest === 0) return []
  if (baseline === latest) return [baseline, baseline, baseline, baseline]
  const step = (latest - baseline) / 3
  return [baseline, baseline + step, baseline + step * 2, latest]
}

/**
 * Render the z-score as a "9.5× normal" badge. Falls back to the ratio
 * 24h/7dAvg when z_score is zero (it can be in dev when sample size is
 * tiny). Never shows "0×" — that's confusing.
 */
function multipleLabel(item: BreakoutItem): string {
  const z = Math.abs(item.z_score)
  if (z >= 1) return formatMultiplier(z)
  // Fallback ratio.
  if (item.video_count_7d_avg > 0) {
    const ratio = item.video_count_24h / item.video_count_7d_avg
    if (ratio > 0) return formatMultiplier(ratio)
  }
  return 'NEW'
}

function BreakoutRow({ item, type }: { item: BreakoutItem; type: BreakoutType }) {
  const meta = TYPE_META[type]
  const multiple = multipleLabel(item)
  const series = buildBreakoutSeries(item)

  return (
    <li className="group flex items-start gap-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] p-2.5 transition-colors">
      <div
        className={`flex flex-col items-center justify-center min-w-[52px] px-1.5 py-1 rounded-lg ${meta.chip} border shrink-0`}
      >
        <span className="text-xs sm:text-sm font-black tabular-nums leading-none">
          {multiple}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-0.5">
          normal
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 mb-1">
          <h4 className="text-xs sm:text-[13px] font-bold text-slate-100 leading-tight truncate flex-1">
            {item.name || 'Untitled'}
          </h4>
          <LifecycleDial stage={item.lifecycle} size="sm" showLabel={false} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NicheFitBadge score={item.niche_fit} size="sm" />
          <span className="text-[10px] font-semibold text-slate-500 inline-flex items-center gap-1">
            <i className="fas fa-eye text-[9px]" />
            {compactNumber(item.avg_views)}
          </span>
        </div>
        {series.length > 0 ? (
          <div className="mt-1.5">
            <VelocitySparkline
              values={series}
              height={18}
              width={120}
              ariaLabel={`${item.name} 24h volume trend`}
            />
          </div>
        ) : null}
      </div>
    </li>
  )
}

function BreakoutColumn({ type, items }: { type: BreakoutType; items: BreakoutItem[] }) {
  const meta = TYPE_META[type]
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <header className="flex items-center gap-2 mb-1">
        <div
          className={`w-6 h-6 ${meta.chip} border rounded-lg flex items-center justify-center shrink-0`}
        >
          <i className={`fas ${meta.icon} text-[10px]`} />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
          {meta.label}
        </h3>
        <span className="ml-auto text-[10px] font-bold text-slate-600 tabular-nums">
          {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] px-3 py-4 text-center">
          <p className="text-[10px] font-medium text-slate-600">
            No breakouts in 24h
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <BreakoutRow key={`${type}-${item.id}`} item={item} type={type} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function BreakoutsStrip({ className = '' }: BreakoutsStripProps) {
  const { data, loading, error, retry } = useInsights<Tier0BreakoutsResponse>(
    'tier0/breakouts',
  )

  const groups: Record<BreakoutType, BreakoutItem[]> = {
    hook: data?.hooks ?? [],
    format: data?.formats ?? [],
    sound: data?.sounds ?? [],
    topic: data?.topics ?? [],
  }

  const totalCount =
    groups.hook.length +
    groups.format.length +
    groups.sound.length +
    groups.topic.length

  return (
    <WidgetCard
      title="Breakouts of the Day"
      subtitle="Hooks, formats, sounds, and topics surging in the last 24h."
      icon="fa-fire"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && totalCount === 0}
      emptyIcon="fa-wind"
      emptyMessage="No breakouts detected in the last 24 hours — check back after the next refresh."
      size="lg"
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {TYPE_ORDER.map((type) => (
          <BreakoutColumn key={type} type={type} items={groups[type]} />
        ))}
      </div>
    </WidgetCard>
  )
}
