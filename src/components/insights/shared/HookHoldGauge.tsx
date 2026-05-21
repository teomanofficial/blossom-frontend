/**
 * HookHoldGauge — semicircular 0-100 gauge used by hook-strength /
 * scroll-stop-power widgets. Color-graded so the user gets verdict +
 * magnitude in a single glance:
 *   < 40 → red (weak)
 *   40-69 → amber (mid)
 *   70+ → green (strong)
 *
 * Optional benchmark tick lets the widget overlay a comparison value
 * (e.g. niche P90 or category median) without a separate component.
 */

interface HookHoldGaugeProps {
  /** 0-100. Clamped on render. */
  value: number
  label?: string
  /** Optional 0-100 benchmark to overlay as a tick mark. */
  benchmark?: number
  /** Render width in px. Height is auto-derived (gauge is semicircle). */
  size?: number
  className?: string
  /** Show the numeric value in the centre. Defaults to true. */
  showValue?: boolean
}

function getTone(value: number): { stroke: string; glow: string; text: string } {
  if (value >= 70) {
    return {
      stroke: '#22c55e', // green-500
      glow: 'rgba(34, 197, 94, 0.45)',
      text: 'text-green-300',
    }
  }
  if (value >= 40) {
    return {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.45)',
      text: 'text-amber-300',
    }
  }
  return {
    stroke: '#f43f5e', // rose-500
    glow: 'rgba(244, 63, 94, 0.45)',
    text: 'text-rose-300',
  }
}

/**
 * Convert a 0-100 value to an (x, y) point on the semicircular arc.
 * The arc sweeps from 180° (left, value=0) to 360° (right, value=100)
 * passing through 270° (top, value=50).
 */
function pointOnArc(
  cx: number,
  cy: number,
  r: number,
  value: number,
): { x: number; y: number } {
  const t = Math.max(0, Math.min(100, value)) / 100
  const deg = 180 + t * 180
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function HookHoldGauge({
  value,
  label,
  benchmark,
  size = 160,
  className = '',
  showValue = true,
}: HookHoldGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const tone = getTone(clamped)

  // Semicircle dims — gauge is wider than it is tall.
  const width = size
  const strokeWidth = Math.max(6, size * 0.08)
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  // Total visible height = radius + strokeWidth/2 (plus padding for tick + label).
  const svgHeight = Math.ceil(radius + strokeWidth + 4)

  // Background arc (full semicircle).
  const start = pointOnArc(cx, cy, radius, 0)
  const end = pointOnArc(cx, cy, radius, 100)
  const bgPath = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`

  // Foreground arc — same path but truncated by stroke-dasharray.
  const semiCircumference = Math.PI * radius
  const filled = (clamped / 100) * semiCircumference

  const valueLabelSize = size * 0.22

  // Benchmark tick (optional).
  let benchmarkTick: { x1: number; y1: number; x2: number; y2: number } | null = null
  if (typeof benchmark === 'number' && Number.isFinite(benchmark)) {
    const inner = pointOnArc(cx, cy, radius - strokeWidth / 2 - 2, benchmark)
    const outer = pointOnArc(cx, cy, radius + strokeWidth / 2 + 2, benchmark)
    benchmarkTick = { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y }
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width, height: svgHeight }}>
        <svg
          width={width}
          height={svgHeight}
          viewBox={`0 0 ${width} ${svgHeight}`}
          role="img"
          aria-label={label ? `${label}: ${Math.round(clamped)}` : `Gauge value ${Math.round(clamped)}`}
        >
          <defs>
            <filter id="hookHoldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background track */}
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled portion */}
          <path
            d={bgPath}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filled.toFixed(2)} ${semiCircumference.toFixed(2)}`}
            style={{ filter: `drop-shadow(0 0 6px ${tone.glow})` }}
            className="transition-all duration-700 ease-out"
          />
          {/* Benchmark tick */}
          {benchmarkTick ? (
            <line
              x1={benchmarkTick.x1}
              y1={benchmarkTick.y1}
              x2={benchmarkTick.x2}
              y2={benchmarkTick.y2}
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        {showValue ? (
          <div
            className="absolute inset-x-0 flex flex-col items-center"
            style={{ top: cy - valueLabelSize * 0.85 }}
          >
            <span
              className={`font-black tabular-nums ${tone.text}`}
              style={{ fontSize: valueLabelSize, lineHeight: 1 }}
            >
              {Math.round(clamped)}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
              / 100
            </span>
          </div>
        ) : null}
      </div>
      {label ? (
        <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </div>
      ) : null}
      {typeof benchmark === 'number' && Number.isFinite(benchmark) ? (
        <div className="mt-1 text-[10px] text-slate-500">
          <i className="fas fa-flag-checkered mr-1 text-[9px] text-slate-400" />
          Benchmark <span className="font-bold text-slate-300">{Math.round(benchmark)}</span>
        </div>
      ) : null}
    </div>
  )
}
