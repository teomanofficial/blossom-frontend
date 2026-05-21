/**
 * Quadrant — 2x2 scatter with cross-hairs at median(x) / median(y).
 *
 * Renders a labeled four-corner space (default labels: Emerging /
 * Saturated / Blue Ocean / Dead — i.e. low-x/high-y, high-x/high-y,
 * low-x/low-y, high-x/low-y). Bubble size optional, color optional.
 *
 * Used by Tier 3 widgets:
 *  - FormatQuadrant (engagement vs adoption)
 *  - SaveShareRewatchQuadrant (virality dimensions)
 *
 * Built on Recharts ScatterChart for accessibility + interactions.
 */

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from 'recharts'

export interface QuadrantPoint {
  x: number
  y: number
  label: string
  size?: number
  color?: string
  meta?: Record<string, unknown>
}

interface QuadrantProps {
  points: QuadrantPoint[]
  xLabel: string
  yLabel: string
  /**
   * Labels in clockwise order from top-left:
   *   [topLeft, topRight, bottomRight, bottomLeft]
   * Defaults: ['Emerging', 'Saturated', 'Dead', 'Blue Ocean'].
   * Semantics: top = high y; right = high x.
   */
  quadrantLabels?: [string, string, string, string]
  height?: number
  /** Default fill color when a point omits `color`. */
  defaultColor?: string
}

const DEFAULT_LABELS: [string, string, string, string] = [
  'Emerging',
  'Saturated',
  'Dead',
  'Blue Ocean',
]

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
  }
  return sorted[mid] ?? 0
}

interface QuadrantTooltipPayload {
  payload: QuadrantPoint
}

function QuadrantTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean
  payload?: QuadrantTooltipPayload[]
  xLabel: string
  yLabel: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs">
      <div className="font-bold text-white mb-1">{p.label}</div>
      <div className="text-slate-300">
        <span className="text-slate-500">{xLabel}:</span>{' '}
        <span className="font-semibold text-white">{p.x.toFixed(2)}</span>
      </div>
      <div className="text-slate-300">
        <span className="text-slate-500">{yLabel}:</span>{' '}
        <span className="font-semibold text-white">{p.y.toFixed(2)}</span>
      </div>
      {p.meta
        ? Object.entries(p.meta)
            .filter(([k]) => k !== 'label')
            .slice(0, 4)
            .map(([k, v]) => (
              <div key={k} className="text-slate-400 mt-0.5">
                <span className="text-slate-500">{k}:</span>{' '}
                <span className="text-white">{String(v)}</span>
              </div>
            ))
        : null}
    </div>
  )
}

export default function Quadrant({
  points,
  xLabel,
  yLabel,
  quadrantLabels = DEFAULT_LABELS,
  height = 360,
  defaultColor = '#a78bfa', // violet-400
}: QuadrantProps) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No data to display
      </div>
    )
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const xMedian = median(xs)
  const yMedian = median(ys)

  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  // Pad domains so points aren't flush against the axes.
  const padX = Math.max((xMax - xMin) * 0.08, 0.5)
  const padY = Math.max((yMax - yMin) * 0.08, 0.5)
  const xDomain: [number, number] = [xMin - padX, xMax + padX]
  const yDomain: [number, number] = [yMin - padY, yMax + padY]

  const sizes = points.map((p) => p.size ?? 1)
  const sizeRange: [number, number] = [
    Math.min(...sizes),
    Math.max(...sizes) || 1,
  ]

  // Group points by color so each Scatter series carries a consistent fill.
  const groups = new Map<string, QuadrantPoint[]>()
  for (const p of points) {
    const c = p.color ?? defaultColor
    const arr = groups.get(c) ?? []
    arr.push(p)
    groups.set(c, arr)
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Quadrant labels — absolute-positioned, point-events none. */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <span className="absolute top-1 left-2 text-[10px] uppercase tracking-widest font-black text-slate-500/70">
          {quadrantLabels[0]}
        </span>
        <span className="absolute top-1 right-2 text-[10px] uppercase tracking-widest font-black text-slate-500/70">
          {quadrantLabels[1]}
        </span>
        <span className="absolute bottom-8 right-2 text-[10px] uppercase tracking-widest font-black text-slate-500/70">
          {quadrantLabels[2]}
        </span>
        <span className="absolute bottom-8 left-2 text-[10px] uppercase tracking-widest font-black text-slate-500/70">
          {quadrantLabels[3]}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            domain={xDomain}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: xLabel,
              position: 'insideBottom',
              offset: -8,
              fill: '#94a3b8',
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            domain={yDomain}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              fill: '#94a3b8',
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="size" range={[40, 360]} domain={sizeRange} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }}
            content={<QuadrantTooltip xLabel={xLabel} yLabel={yLabel} />}
          />
          <ReferenceLine
            x={xMedian}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={yMedian}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
          />
          {Array.from(groups.entries()).map(([color, pts]) => (
            <Scatter
              key={color}
              data={pts}
              fill={color}
              fillOpacity={0.7}
              stroke={color}
              strokeWidth={1.5}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
