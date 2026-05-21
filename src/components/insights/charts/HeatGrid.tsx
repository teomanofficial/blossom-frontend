/**
 * HeatGrid — pure-SVG 2D heatmap with axis labels and hover tooltips.
 *
 * Designed for any rows × cols numeric matrix. Used by:
 *  - Tier 3 CognitiveInterruptionMatrix (primal_trigger × niche)
 *  - Tier 3 CategoryHeatGrid (category × metric)
 *  - PostingTimeHeatmap (delegates here via the dedicated wrapper)
 *
 * Color scales:
 *  - viridis (sequential, dark→bright; default — good for absolute lift)
 *  - plasma  (sequential, warmer; good for emphasis)
 *  - diverging (red ↔ slate ↔ emerald; good when values straddle zero)
 *
 * Renders into a 100%-width SVG with a `viewBox`, so it scales fluidly
 * inside any `glass-card`. No external chart lib required.
 */

import { useMemo, useState } from 'react'

type ColorScale = 'viridis' | 'plasma' | 'diverging'

interface HeatGridProps {
  rows: string[]
  cols: string[]
  values: number[][]
  colorScale?: ColorScale
  valueLabel?: string
  minValue?: number
  maxValue?: number
  /**
   * Optional formatter for the tooltip value. Defaults to fixed-3.
   */
  formatValue?: (v: number) => string
}

interface TooltipState {
  row: number
  col: number
  x: number
  y: number
  value: number | null
}

// ---- color sampling -----------------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [r, g, b]
}

function rgbToCss(rgb: [number, number, number]): string {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`
}

function gradient(stops: string[], t: number): string {
  if (stops.length === 0) return 'rgba(255,255,255,0.05)'
  if (stops.length === 1) return stops[0] as string
  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (stops.length - 1)
  const idx = Math.floor(scaled)
  const next = Math.min(stops.length - 1, idx + 1)
  const localT = scaled - idx
  const a = hexToRgb(stops[idx] as string)
  const b = hexToRgb(stops[next] as string)
  return rgbToCss([lerp(a[0], b[0], localT), lerp(a[1], b[1], localT), lerp(a[2], b[2], localT)])
}

// Approximated palettes — keep deps zero. Hand-picked stops for legibility on dark glass.
const SCALES: Record<ColorScale, string[]> = {
  viridis: ['#1e1b4b', '#312e81', '#4338ca', '#0ea5e9', '#22d3ee', '#a3e635', '#facc15'],
  plasma: ['#1e1b4b', '#7c3aed', '#c026d3', '#ec4899', '#f97316', '#facc15'],
  diverging: ['#f43f5e', '#fb7185', '#475569', '#34d399', '#10b981'],
}

function colorFor(scale: ColorScale, value: number, min: number, max: number): string {
  if (max === min) return 'rgba(255,255,255,0.06)'
  if (scale === 'diverging') {
    // Center around 0 if min<0<max; otherwise around mid.
    const center = min < 0 && max > 0 ? 0 : (min + max) / 2
    const half = Math.max(Math.abs(max - center), Math.abs(center - min)) || 1
    const t = (value - center) / half // -1..+1
    const normalized = (t + 1) / 2
    return gradient(SCALES.diverging, normalized)
  }
  const t = (value - min) / (max - min)
  return gradient(SCALES[scale], t)
}

// ---- layout constants ---------------------------------------------------

const TOP_LABEL_HEIGHT = 56
const LEFT_LABEL_WIDTH = 96
const CELL_GAP = 2
const CELL_RADIUS = 3

function maxLabelLines(labels: string[], maxChars: number): number {
  return labels.reduce((m, l) => Math.max(m, Math.ceil(l.length / maxChars)), 1)
}

// ---- component ----------------------------------------------------------

export default function HeatGrid({
  rows,
  cols,
  values,
  colorScale = 'viridis',
  valueLabel = 'Value',
  minValue,
  maxValue,
  formatValue,
}: HeatGridProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { min, max } = useMemo(() => {
    if (minValue !== undefined && maxValue !== undefined) {
      return { min: minValue, max: maxValue }
    }
    let lo = Number.POSITIVE_INFINITY
    let hi = Number.NEGATIVE_INFINITY
    for (let r = 0; r < values.length; r++) {
      const row = values[r]
      if (!row) continue
      for (let c = 0; c < row.length; c++) {
        const v = row[c]
        if (v === undefined || v === null || Number.isNaN(v)) continue
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    if (!Number.isFinite(lo)) lo = 0
    if (!Number.isFinite(hi)) hi = 1
    return { min: minValue ?? lo, max: maxValue ?? hi }
  }, [values, minValue, maxValue])

  // Empty state.
  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-xs py-10">
        No data to display
      </div>
    )
  }

  // Use a viewBox so SVG scales. Width units arbitrary.
  const cellSize = 28
  const gridW = cols.length * cellSize
  const gridH = rows.length * cellSize
  const viewW = LEFT_LABEL_WIDTH + gridW
  const viewH = TOP_LABEL_HEIGHT + gridH

  const showRotatedColLabels = cols.length > 8 || maxLabelLines(cols, 6) > 1

  const fmt = formatValue ?? ((v: number) => v.toFixed(2))

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={`Heatmap of ${rows.length} rows by ${cols.length} columns`}
        className="block"
      >
        {/* Column labels (top) */}
        {cols.map((col, ci) => {
          const cx = LEFT_LABEL_WIDTH + ci * cellSize + cellSize / 2
          const cy = TOP_LABEL_HEIGHT - 8
          if (showRotatedColLabels) {
            return (
              <text
                key={`col-${ci}`}
                x={cx}
                y={cy}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="start"
                transform={`rotate(-45 ${cx} ${cy})`}
                className="select-none"
              >
                {col}
              </text>
            )
          }
          return (
            <text
              key={`col-${ci}`}
              x={cx}
              y={cy}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              className="select-none"
            >
              {col}
            </text>
          )
        })}

        {/* Row labels (left) */}
        {rows.map((row, ri) => {
          const ry = TOP_LABEL_HEIGHT + ri * cellSize + cellSize / 2 + 4
          return (
            <text
              key={`row-${ri}`}
              x={LEFT_LABEL_WIDTH - 8}
              y={ry}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
              className="select-none"
            >
              {row.length > 14 ? `${row.slice(0, 12)}…` : row}
            </text>
          )
        })}

        {/* Cells */}
        {rows.map((_, ri) => {
          const rowValues = values[ri]
          return cols.map((_c, ci) => {
            const v = rowValues?.[ci]
            const hasValue = v !== undefined && v !== null && !Number.isNaN(v)
            const fill = hasValue
              ? colorFor(colorScale, v as number, min, max)
              : 'rgba(255,255,255,0.04)'
            const x = LEFT_LABEL_WIDTH + ci * cellSize + CELL_GAP / 2
            const y = TOP_LABEL_HEIGHT + ri * cellSize + CELL_GAP / 2
            const size = cellSize - CELL_GAP
            return (
              <rect
                key={`cell-${ri}-${ci}`}
                x={x}
                y={y}
                width={size}
                height={size}
                rx={CELL_RADIUS}
                ry={CELL_RADIUS}
                fill={fill}
                stroke={tooltip && tooltip.row === ri && tooltip.col === ci ? '#fff' : 'transparent'}
                strokeWidth={tooltip && tooltip.row === ri && tooltip.col === ci ? 1 : 0}
                style={{ cursor: hasValue ? 'crosshair' : 'default' }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement
                  if (!svg) return
                  const parent = svg.parentElement
                  if (!parent) return
                  const parentRect = parent.getBoundingClientRect()
                  const targetRect = e.currentTarget.getBoundingClientRect()
                  setTooltip({
                    row: ri,
                    col: ci,
                    x: targetRect.left - parentRect.left + targetRect.width / 2,
                    y: targetRect.top - parentRect.top,
                    value: hasValue ? (v as number) : null,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })
        })}
      </svg>

      {tooltip ? (
        <div
          className="absolute z-50 pointer-events-none rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-slate-300 text-[10px] font-medium uppercase tracking-widest mb-1">
            {rows[tooltip.row]} × {cols[tooltip.col]}
          </div>
          <div className="text-white font-bold">
            {valueLabel}: {tooltip.value !== null ? fmt(tooltip.value) : '—'}
          </div>
        </div>
      ) : null}
    </div>
  )
}
