/**
 * RetentionCurve — viewer-retention line over duration in seconds.
 *
 * Renders a 0-100% Y axis vs seconds X axis. Optional `predicted`
 * second line draws as a dashed comparison curve (used in PostMortem
 * "yours vs predicted optimal", and in Greenlight retention preview).
 *
 * `dangerZones` produce vertical ReferenceAreas — each spans
 * ±0.75s around the timestamp and hovers a reason tooltip.
 *
 * The data shape matches the API contract verbatim:
 *   retention_curve: { yours, predicted_optimal } from PostMortemResponse
 *   retention_prediction.curve / danger_zones from GreenlightResponse
 */

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface RetentionPoint {
  sec: number
  pct: number
}

export interface RetentionDangerZone {
  sec: number
  reason: string
}

interface RetentionCurveProps {
  curve: RetentionPoint[]
  predicted?: RetentionPoint[]
  dangerZones?: RetentionDangerZone[]
  height?: number
  /**
   * Optional series labels (default: "Actual" / "Predicted Optimal").
   */
  actualLabel?: string
  predictedLabel?: string
}

interface MergedRow {
  sec: number
  actual?: number | null
  predicted?: number | null
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function CurveTooltip({
  active,
  payload,
  label,
  dangerZones,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number
  dangerZones?: RetentionDangerZone[]
}) {
  if (!active || !payload?.length) return null
  const seconds = typeof label === 'number' ? label : Number(label)
  const dangerHit = dangerZones?.find(
    (z) => Math.abs(z.sec - seconds) <= 0.75
  )
  return (
    <div className="rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs">
      <div className="text-white font-bold mb-1">
        {Number.isFinite(seconds) ? `${seconds.toFixed(1)}s` : '—'}
      </div>
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
              : `${entry.value.toFixed(0)}%`}
          </span>
        </div>
      ))}
      {dangerHit ? (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-triangle-exclamation" />
            Danger Zone
          </div>
          <div className="text-slate-300 mt-1 max-w-xs whitespace-normal">
            {dangerHit.reason}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function RetentionCurve({
  curve,
  predicted,
  dangerZones,
  height = 280,
  actualLabel = 'Actual',
  predictedLabel = 'Predicted Optimal',
}: RetentionCurveProps) {
  // Merge the two curves into a single dataset keyed by `sec`.
  const merged: MergedRow[] = useMemo(() => {
    const map = new Map<number, MergedRow>()
    for (const p of curve) {
      map.set(p.sec, { sec: p.sec, actual: p.pct })
    }
    if (predicted) {
      for (const p of predicted) {
        const existing = map.get(p.sec)
        if (existing) existing.predicted = p.pct
        else map.set(p.sec, { sec: p.sec, predicted: p.pct })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sec - b.sec)
  }, [curve, predicted])

  if (merged.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No retention data
      </div>
    )
  }

  const maxSec = merged[merged.length - 1]?.sec ?? 30

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={merged}
          margin={{ top: 12, right: 16, bottom: 8, left: -10 }}
        >
          <defs>
            <linearGradient id="retentionActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="sec"
            type="number"
            domain={[0, maxSec]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}s`}
            label={{
              value: 'Seconds',
              position: 'insideBottom',
              offset: -2,
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={<CurveTooltip dangerZones={dangerZones} />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '3 3' }}
          />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />

          {/* Danger zones as vertical highlights. */}
          {dangerZones?.map((zone, i) => (
            <ReferenceArea
              key={`danger-${i}`}
              x1={Math.max(0, zone.sec - 0.75)}
              x2={Math.min(maxSec, zone.sec + 0.75)}
              y1={0}
              y2={100}
              fill="#f43f5e"
              fillOpacity={0.18}
              stroke="none"
              ifOverflow="visible"
            />
          ))}

          {/* Marker dots over the curve at each danger zone for visibility. */}
          {dangerZones?.map((zone, i) => {
            const matchingRow = merged.find((r) => Math.abs(r.sec - zone.sec) < 0.75)
            const y = matchingRow?.actual ?? matchingRow?.predicted
            if (y === undefined || y === null) return null
            return (
              <ReferenceDot
                key={`danger-dot-${i}`}
                x={zone.sec}
                y={y}
                r={4}
                fill="#f43f5e"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            )
          })}

          <Area
            type="monotone"
            dataKey="actual"
            name={actualLabel}
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#retentionActualGrad)"
            dot={false}
            connectNulls
          />
          {predicted ? (
            <Line
              type="monotone"
              dataKey="predicted"
              name={predictedLabel}
              stroke="#34d399"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
