/**
 * LifecycleDial — segmented donut visualization of the 5-stage trend
 * lifecycle (emerging → rising → peaking → stable → declining). The
 * active stage is highlighted in its tier color; the rest sit at low
 * opacity so users can read direction-of-travel at a glance.
 *
 * Pure SVG, no chart library. The order of segments around the ring
 * follows the natural lifecycle progression starting at 12 o'clock.
 */

import type { LifecycleStage } from '../../../types/insights'

interface LifecycleDialProps {
  stage: LifecycleStage
  size?: 'sm' | 'md' | 'lg'
  /** Optional layout className for positioning. */
  className?: string
  /** When false, hides the textual stage label beneath the dial. */
  showLabel?: boolean
}

const STAGE_ORDER: readonly LifecycleStage[] = [
  'emerging',
  'rising',
  'peaking',
  'stable',
  'declining',
] as const

const STAGE_META: Record<
  LifecycleStage,
  { label: string; color: string; faded: string; icon: string }
> = {
  emerging: {
    label: 'Emerging',
    color: '#60a5fa', // blue-400
    faded: 'rgba(96, 165, 250, 0.18)',
    icon: 'fa-seedling',
  },
  rising: {
    label: 'Rising',
    color: '#34d399', // emerald-400
    faded: 'rgba(52, 211, 153, 0.18)',
    icon: 'fa-arrow-trend-up',
  },
  peaking: {
    label: 'Peaking',
    color: '#facc15', // yellow-400
    faded: 'rgba(250, 204, 21, 0.20)',
    icon: 'fa-mountain',
  },
  stable: {
    label: 'Stable',
    color: '#94a3b8', // slate-400
    faded: 'rgba(148, 163, 184, 0.20)',
    icon: 'fa-grip-lines',
  },
  declining: {
    label: 'Declining',
    color: '#fb7185', // rose-400
    faded: 'rgba(251, 113, 133, 0.18)',
    icon: 'fa-arrow-trend-down',
  },
}

const SIZE_DIMS: Record<NonNullable<LifecycleDialProps['size']>, {
  px: number
  stroke: number
  font: string
}> = {
  sm: { px: 48, stroke: 6, font: 'text-[10px]' },
  md: { px: 72, stroke: 9, font: 'text-[11px]' },
  lg: { px: 96, stroke: 11, font: 'text-xs' },
}

/**
 * Compute the SVG arc path for one segment between angles
 * `startDeg` and `endDeg` (measured clockwise from 12 o'clock).
 */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  // SVG arcs use the standard math frame (0° at 3 o'clock,
  // CCW positive). Convert "clockwise from 12" → standard.
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const s = toRad(startDeg)
  const e = toRad(endDeg)
  const x1 = cx + r * Math.cos(s)
  const y1 = cy + r * Math.sin(s)
  const x2 = cx + r * Math.cos(e)
  const y2 = cy + r * Math.sin(e)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`
}

export default function LifecycleDial({
  stage,
  size = 'md',
  className = '',
  showLabel = true,
}: LifecycleDialProps) {
  const dims = SIZE_DIMS[size]
  const px = dims.px
  const center = px / 2
  const radius = (px - dims.stroke) / 2
  const segmentArc = 360 / STAGE_ORDER.length
  // Small visual gap between segments so they read as discrete pills.
  const gap = 4

  const activeMeta = STAGE_META[stage]

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className="relative"
        style={{ width: px, height: px }}
        role="img"
        aria-label={`Lifecycle stage: ${activeMeta.label}`}
      >
        <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
          {STAGE_ORDER.map((s, i) => {
            const meta = STAGE_META[s]
            const isActive = s === stage
            const startDeg = i * segmentArc + gap / 2
            const endDeg = (i + 1) * segmentArc - gap / 2
            return (
              <path
                key={s}
                d={arcPath(center, center, radius, startDeg, endDeg)}
                fill="none"
                stroke={isActive ? meta.color : meta.faded}
                strokeWidth={dims.stroke}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <i
            className={`fas ${activeMeta.icon}`}
            style={{
              color: activeMeta.color,
              fontSize: px * 0.28,
            }}
            aria-hidden="true"
          />
        </div>
      </div>
      {showLabel ? (
        <div
          className={`mt-1.5 font-black uppercase tracking-widest ${dims.font}`}
          style={{ color: activeMeta.color }}
        >
          {activeMeta.label}
        </div>
      ) : null}
    </div>
  )
}
