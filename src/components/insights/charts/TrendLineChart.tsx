/**
 * TrendLineChart — multi-line time series on a shared X axis.
 *
 * Used for trajectory widgets (Format Trajectory, Hook Trajectory,
 * Sound Adoption Curves, sparklines, Improvement Velocity, etc.).
 *
 * Series each have an independent color (palette-rotated if omitted).
 * Tooltip shows all series' values at the hovered X. Legend swatches
 * are color-coded.
 *
 * Data shape: each series carries `data: { x: string; y: number }[]`.
 * The X axis is treated as a category (date string) — Recharts handles
 * spacing automatically. This is more forgiving than parsing dates
 * across the various windows we feed it (weekly buckets, daily,
 * "Week 1" / "Week 2" labels, etc.).
 */

import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface TrendSeries {
  name: string
  color?: string
  data: Array<{ x: string; y: number }>
}

interface TrendLineChartProps {
  series: TrendSeries[]
  xKey?: string
  yLabel?: string
  height?: number
  /**
   * When true, hides axes & legend for sparkline mode. Default false.
   */
  compact?: boolean
  /**
   * Optional formatter for Y values in tooltip + axis.
   */
  formatY?: (v: number) => string
}

const DEFAULT_PALETTE = [
  '#a78bfa', // violet-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#fb7185', // rose-400
  '#38bdf8', // sky-400
  '#e879f9', // fuchsia-400
]

function defaultFormatY(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(2)
}

interface MergedRow {
  x: string
  [seriesKey: string]: string | number
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function ChartTooltip({
  active,
  payload,
  label,
  formatY,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatY: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs">
      <div className="text-white font-bold mb-1.5">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-semibold text-white">
            {entry.value === null || entry.value === undefined
              ? '—'
              : formatY(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrendLineChart({
  series,
  xKey = 'x',
  yLabel,
  height = 240,
  compact = false,
  formatY = defaultFormatY,
}: TrendLineChartProps) {
  // Merge series rows onto a common axis. Order preserved by first
  // appearance across the series. Numeric values default to `null` when
  // a series doesn't cover a given x (Recharts will gap the line).
  const merged: MergedRow[] = useMemo(() => {
    const xOrder: string[] = []
    const seen = new Set<string>()
    for (const s of series) {
      for (const point of s.data) {
        if (!seen.has(point.x)) {
          seen.add(point.x)
          xOrder.push(point.x)
        }
      }
    }
    const rows: MergedRow[] = xOrder.map((x) => ({ x }))
    const indexByX = new Map<string, number>()
    xOrder.forEach((x, i) => indexByX.set(x, i))
    for (const s of series) {
      const key = s.name
      for (const point of s.data) {
        const rowIdx = indexByX.get(point.x)
        if (rowIdx === undefined) continue
        const row = rows[rowIdx]
        if (row) row[key] = point.y
      }
    }
    return rows
  }, [series])

  if (series.length === 0 || merged.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No trend data to display
      </div>
    )
  }

  const seriesWithColor = series.map((s, i) => ({
    ...s,
    color: s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
  }))

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={merged}
          margin={{
            top: 8,
            right: compact ? 4 : 16,
            bottom: compact ? 0 : 4,
            left: compact ? 0 : -8,
          }}
        >
          {!compact ? (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          ) : null}
          <XAxis
            dataKey={xKey}
            tick={compact ? false : { fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            hide={compact}
          />
          <YAxis
            tickFormatter={formatY}
            tick={compact ? false : { fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={
              !compact && yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 11,
                    offset: 12,
                  }
                : undefined
            }
            hide={compact}
            width={compact ? 0 : undefined}
          />
          <Tooltip
            content={<ChartTooltip formatY={formatY} />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '3 3' }}
          />
          {!compact ? (
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
            />
          ) : null}
          {seriesWithColor.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              name={s.name}
              stroke={s.color}
              strokeWidth={compact ? 1.5 : 2}
              dot={false}
              activeDot={compact ? false : { r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
