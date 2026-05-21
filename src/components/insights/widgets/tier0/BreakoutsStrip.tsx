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
import NicheFitBadge from '../../shared/NicheFitBadge'
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

  // Build an SVG sparkline that fills the card as a background visual.
  // The path is drawn into a 100×30 viewBox and stretched via preserveAspectRatio="none".
  let sparkPath = ''
  let isPositive = true
  if (series.length >= 2) {
    const min = Math.min(...series)
    const max = Math.max(...series)
    const range = max - min || 1
    const points = series.map((v, i) => {
      const x = (i / (series.length - 1)) * 100
      const y = 28 - ((v - min) / range) * 24
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    sparkPath = `M${points.join(' L')}`
    const first = series[0] ?? 0
    const last = series[series.length - 1] ?? 0
    isPositive = last >= first
  }
  const gradId = `spark-${type}-${item.id}`
  const strokeColor = isPositive ? '#10b981' : '#f43f5e'

  return (
    <li className="group relative overflow-hidden rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] p-2.5 transition-colors min-h-[96px] flex flex-col">
      {/* Sparkline fills the card as background visual */}
      {sparkPath ? (
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${sparkPath} L100,30 L0,30 Z`} fill={`url(#${gradId})`} />
          <path
            d={sparkPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}

      {/* Top row: tiny multiplier chip (left) + title (right) */}
      <div className="relative flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded ${meta.chip} border text-[10px] font-black tabular-nums leading-none shrink-0`}
        >
          <span>{multiple}</span>
          <span className="text-[7px] uppercase tracking-wider opacity-70">normal</span>
        </span>
        <h4
          className="text-xs sm:text-[13px] font-bold text-slate-100 leading-tight truncate text-right min-w-0"
          title={item.name || 'Untitled'}
        >
          {item.name || 'Untitled'}
        </h4>
      </div>

      {/* Spacer pushes bottom row to the card floor */}
      <div className="flex-1" />

      {/* Bottom row: niche fit + view count */}
      <div className="relative flex items-center gap-2 flex-wrap mt-2">
        <NicheFitBadge score={item.niche_fit} size="sm" />
        <span className="text-[10px] font-semibold text-slate-400 inline-flex items-center gap-1">
          <i className="fas fa-eye text-[9px]" />
          {compactNumber(item.avg_views)}
        </span>
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
      info={{
        what: 'Hooks, formats, sounds, and topics whose 24h video count is statistically unusual compared to the 7-day baseline.',
        howToRead: "Each card shows a multiplier (how unusual today's volume is vs the 7-day average) and a sparkline of the recent trajectory. Green sparkline = rising, red = falling. The niche-fit chip tells you if the surge applies to YOUR space — strong-fit items are the ones worth acting on.",
        computation: 'Z-score of last 24h video count against the 7-day mean per item. Items with |z| ≥ 1 are surfaced and sorted by velocity within each category. Refreshed every 30 minutes.',
        example: 'A "Dance Trend" hook at 1.4× normal with a green sparkline + 50% niche fit means dance hooks are accelerating today and partially overlap with your audience — worth a test post.',
      }}
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
