/**
 * PostingTimeHeatmap — 7×24 day×hour grid for Tier 3 "Best Day×Hour"
 * widget. Lighter wrapper around HeatGrid that bakes in:
 *  - The day-of-week and hour labels.
 *  - A pink-shifted color scale that matches the existing
 *    BestTimesHeatmap (so the dashboard reads as a single design system).
 *  - A tighter tooltip formatter.
 *
 * Data shape: `data` is a 7×24 matrix indexed as `data[day][hour]`
 * where day 0 = Sunday and hour 0 = 12 am. Cells should already be
 * normalized (e.g. avg_engagement, post_count, or any aggregate the
 * backend chooses). The component does not interpret units beyond
 * coloring relative to min/max.
 */

import { useMemo, useState } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12a'
  if (hour === 12) return '12p'
  if (hour < 12) return `${hour}a`
  return `${hour - 12}p`
}

function formatFullHour(hour: number): string {
  if (hour === 0) return '12 am'
  if (hour === 12) return '12 pm'
  if (hour < 12) return `${hour} am`
  return `${hour - 12} pm`
}

interface PostingTimeHeatmapProps {
  data: number[][]
  /**
   * Optional tooltip-value formatter. Defaults to fixed-2.
   */
  formatValue?: (v: number) => string
  /**
   * Optional value label shown above the number in the tooltip.
   */
  valueLabel?: string
}

interface TooltipState {
  day: number
  hour: number
  value: number
  x: number
  y: number
}

export default function PostingTimeHeatmap({
  data,
  formatValue,
  valueLabel = 'Engagement',
}: PostingTimeHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { min, max, isEmpty } = useMemo(() => {
    let lo = Number.POSITIVE_INFINITY
    let hi = Number.NEGATIVE_INFINITY
    let any = false
    for (let d = 0; d < data.length; d++) {
      const row = data[d]
      if (!row) continue
      for (let h = 0; h < row.length; h++) {
        const v = row[h]
        if (v === undefined || v === null || Number.isNaN(v)) continue
        any = true
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    if (!any) return { min: 0, max: 1, isEmpty: true }
    if (lo === hi) hi = lo + 1
    return { min: lo, max: hi, isEmpty: false }
  }, [data])

  const fmt = formatValue ?? ((v: number) => v.toFixed(2))

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-xs py-12">
        No posting-time data yet
      </div>
    )
  }

  function intensity(value: number): number {
    if (max === min) return 0.5
    return (value - min) / (max - min)
  }

  return (
    <div className="relative" data-posting-heatmap>
      {/* Hour header */}
      <div className="flex ml-10 mb-1 gap-px">
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="flex-1 text-center text-[9px] sm:text-[10px] text-slate-600 select-none"
          >
            {h % 3 === 0 ? formatHourLabel(h) : ''}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="flex flex-col gap-px">
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="flex items-center gap-px">
            <div className="w-8 sm:w-10 text-right pr-1.5 text-[10px] sm:text-xs text-slate-500 font-medium shrink-0 select-none">
              {DAY_LABELS[day]}
            </div>
            {Array.from({ length: 24 }, (_, hour) => {
              const value = data[day]?.[hour]
              const hasValue = value !== undefined && value !== null && !Number.isNaN(value)
              const t = hasValue ? intensity(value) : 0
              // Match existing BestTimesHeatmap's pink palette (0.1 → 0.85).
              const opacity = hasValue ? 0.1 + t * 0.75 : 0
              return (
                <div
                  key={hour}
                  className="flex-1 aspect-square rounded-[2px] sm:rounded-sm cursor-default transition-colors"
                  style={{
                    backgroundColor: hasValue
                      ? `rgba(236, 72, 153, ${opacity})`
                      : 'rgba(255,255,255,0.02)',
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!hasValue) return
                    const target = e.currentTarget
                    const parent = target.closest('[data-posting-heatmap]')
                    if (!parent) return
                    const parentRect = parent.getBoundingClientRect()
                    const targetRect = target.getBoundingClientRect()
                    setTooltip({
                      day,
                      hour,
                      value,
                      x: targetRect.left - parentRect.left + targetRect.width / 2,
                      y: targetRect.top - parentRect.top,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

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
            {DAY_LABELS[tooltip.day]} · {formatFullHour(tooltip.hour)}
          </div>
          <div className="text-white font-bold">
            {valueLabel}: {fmt(tooltip.value)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
