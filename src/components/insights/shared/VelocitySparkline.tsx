/**
 * VelocitySparkline — tiny inline trend line, no chart library.
 *
 * Sized to fit alongside a number/badge inside a widget row. Detects
 * direction automatically (last value vs first value) and colors the
 * stroke green for rising, red for falling, slate for flat. Callers
 * can force the color via the `positive` prop when the rising/falling
 * polarity is contextual (e.g. "rising danger zone count" should be
 * red even though numerically up).
 */

interface VelocitySparklineProps {
  values: number[]
  /** Render height in px. Width adapts to the data length × 4px. */
  height?: number
  /** Render width in px. Defaults to `values.length * 6`. */
  width?: number
  /** Force polarity: true = green, false = red. Auto-detect otherwise. */
  positive?: boolean
  /** Optional className for layout. */
  className?: string
  /** Optional ARIA label. */
  ariaLabel?: string
}

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = height / 2
    return `M 0 ${y.toFixed(2)} L ${width.toFixed(2)} ${y.toFixed(2)}`
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  // Small padding so the line doesn't touch the top/bottom edges.
  const pad = Math.max(1, height * 0.1)
  const innerH = height - pad * 2
  return values
    .map((v, i) => {
      const x = i * stepX
      const y = pad + (1 - (v - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export default function VelocitySparkline({
  values,
  height = 24,
  width,
  positive,
  className = '',
  ariaLabel,
}: VelocitySparklineProps) {
  const w = width ?? Math.max(40, values.length * 6)

  if (values.length === 0) {
    return (
      <svg
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        className={className}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={w}
          y2={height / 2}
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    )
  }

  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const delta = last - first
  // Auto-detect: positive prop overrides if provided.
  const isPositive =
    typeof positive === 'boolean' ? positive : delta > 0
  const isFlat = typeof positive !== 'boolean' && Math.abs(delta) < 1e-9
  const stroke = isFlat
    ? '#94a3b8' // slate-400
    : isPositive
      ? '#34d399' // emerald-400
      : '#fb7185' // rose-400
  const fill = isFlat
    ? 'rgba(148, 163, 184, 0.10)'
    : isPositive
      ? 'rgba(52, 211, 153, 0.12)'
      : 'rgba(251, 113, 133, 0.12)'

  const path = buildPath(values, w, height)
  // Build a closed area under the line for subtle fill.
  const areaPath = `${path} L ${w.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`

  // Endpoint marker for the latest data point.
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = Math.max(1, height * 0.1)
  const innerH = height - pad * 2
  const lastX = w
  const lastY = pad + (1 - (last - min) / range) * innerH

  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <path d={areaPath} fill={fill} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={1.75} fill={stroke} />
    </svg>
  )
}
