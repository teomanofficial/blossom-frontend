/**
 * NichePercentileRing — circular ring showing where this video lands
 * in the niche distribution.
 *
 * The ring sweeps from 0% (left) to 100% (right), with two tick marks
 * for niche P50 (midpoint, slate) and niche P90 (top-decile, emerald).
 * The user's percentile is rendered as a solid arc from 0 to their
 * value, color-graded by how bad/good it is.
 *
 * Pure SVG — same approach as HookHoldGauge. No chart lib dep.
 */

import type { PostMortemResponse } from '../../types/insights'
import WidgetCard from '../insights/shared/WidgetCard'

interface NichePercentileRingProps {
  benchmark: PostMortemResponse['niche_benchmark']
  /** Optional copy override for the "what this means" sentence. */
  className?: string
}

function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

/**
 * Convert a 0-100 value to an (x,y) point on the ring, where the
 * top of the ring (12 o'clock) is value=50 and the bottom (6 o'clock)
 * is the start/end of the sweep at value=0/100.
 *
 * We use a 270° sweep starting at 225° (bottom-left) and ending at
 * 315° (bottom-right via the top), so the ring "opens" downward —
 * a familiar gauge mental-model.
 */
function pointOnRing(value: number, radius: number, cx: number, cy: number) {
  const startAngle = 135 // bottom-left
  const sweep = 270
  const angleDeg = startAngle + (clamp(value) / 100) * sweep
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

function arcPath(
  startValue: number,
  endValue: number,
  radius: number,
  cx: number,
  cy: number,
): string {
  const start = pointOnRing(startValue, radius, cx, cy)
  const end = pointOnRing(endValue, radius, cx, cy)
  const sweep = ((endValue - startValue) / 100) * 270
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function tickPath(
  value: number,
  innerR: number,
  outerR: number,
  cx: number,
  cy: number,
): string {
  const inner = pointOnRing(value, innerR, cx, cy)
  const outer = pointOnRing(value, outerR, cx, cy)
  return `M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`
}

function getTone(percentile: number): { stroke: string; text: string; verdict: string } {
  if (percentile >= 80) {
    return {
      stroke: '#22c55e',
      text: 'text-green-300',
      verdict: 'Top of your niche',
    }
  }
  if (percentile >= 60) {
    return {
      stroke: '#34d399',
      text: 'text-emerald-300',
      verdict: 'Above average',
    }
  }
  if (percentile >= 40) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-300',
      verdict: 'Middle of the pack',
    }
  }
  if (percentile >= 20) {
    return {
      stroke: '#fb7185',
      text: 'text-rose-300',
      verdict: 'Below your peers',
    }
  }
  return {
    stroke: '#f43f5e',
    text: 'text-rose-300',
    verdict: 'Bottom of the niche',
  }
}

export default function NichePercentileRing({
  benchmark,
  className = '',
}: NichePercentileRingProps) {
  const pct = clamp(benchmark.your_percentile)
  const tone = getTone(pct)
  const size = 220
  const stroke = 18
  const cx = size / 2
  const cy = size / 2
  const radius = (size - stroke) / 2

  return (
    <WidgetCard
      title="Where you rank in your niche"
      subtitle="A bird's-eye view of this video's place in the wider distribution."
      icon="fa-bullseye"
      iconBg="bg-violet-500/15"
      iconColor="text-violet-400"
      size="lg"
      className={className}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <path
              d={arcPath(0, 100, radius, cx, cy)}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* User percentile arc */}
            <path
              d={arcPath(0, pct, radius, cx, cy)}
              fill="none"
              stroke={tone.stroke}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 12px ${tone.stroke}66)`,
                transition: 'd 0.4s ease-out',
              }}
            />
            {/* P50 tick — slate, behind the rest */}
            <path
              d={tickPath(50, radius - stroke / 2 - 2, radius + stroke / 2 + 2, cx, cy)}
              stroke="#94a3b8"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* P90 tick — emerald */}
            <path
              d={tickPath(90, radius - stroke / 2 - 2, radius + stroke / 2 + 2, cx, cy)}
              stroke="#34d399"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* Center label */}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="fill-white font-black"
              style={{ fontSize: 44 }}
            >
              {Math.round(pct)}
            </text>
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              className="fill-slate-500 font-black uppercase tracking-widest"
              style={{ fontSize: 10 }}
            >
              Percentile
            </text>
          </svg>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className={`text-lg sm:text-xl font-black ${tone.text} mb-2`}>
            {tone.verdict}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            You scored higher than{' '}
            <span className="font-bold text-white">{Math.round(pct)}%</span> of comparable
            content in your niche.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Niche median (P50)
                </span>
              </div>
              <div className="text-base font-black text-slate-200 tabular-nums">
                {Math.round(benchmark.niche_p50)}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                  Top decile (P90)
                </span>
              </div>
              <div className="text-base font-black text-emerald-200 tabular-nums">
                {Math.round(benchmark.niche_p90)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}
