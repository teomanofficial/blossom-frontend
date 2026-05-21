/**
 * HitsComparison — side-by-side table showing this video's per-metric
 * value next to the user's top hits. Grouped by hit so each "hit
 * column" reads as a single comparable example.
 *
 * The data comes from `compared_to_hits` in PostMortemResponse — a
 * flat array of `{ video_id, metric, your_value, hit_value }`. We
 * pivot that into a per-metric row keyed by hit video_id.
 *
 * If we have fewer than 1 hit, we render a friendly empty state
 * ("not enough hits to compare against"). If we have more than 3,
 * we cap at 3 to keep the visual budget under control.
 */

import { useMemo } from 'react'
import type { PostMortemResponse } from '../../types/insights'
import WidgetCard from '../insights/shared/WidgetCard'

interface HitsComparisonProps {
  comparedToHits: PostMortemResponse['compared_to_hits']
  className?: string
}

const METRIC_LABEL: Record<string, string> = {
  scroll_stop_power: 'Scroll-stop power',
  hook_seconds: 'Hook length (s)',
  primal_trigger: 'Primal trigger',
  primary_emotion: 'Primary emotion',
  share_motivation: 'Share motivation',
  cliffhanger_strength: 'Cliffhanger strength',
  emotion_intensity: 'Emotion intensity',
  emotion_polarity: 'Emotion polarity',
  pacing_style: 'Pacing style',
}

function prettifyMetric(slug: string): string {
  if (METRIC_LABEL[slug]) return METRIC_LABEL[slug]!
  return slug
    .split('_')
    .map((p) => (p.length === 0 ? p : p[0]!.toUpperCase() + p.slice(1)))
    .join(' ')
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') {
    if (Number.isInteger(value) || Math.abs(value) >= 100) return String(Math.round(value))
    return (Math.round(value * 10) / 10).toString()
  }
  const s = String(value)
  return s.length > 24 ? `${s.slice(0, 23)}…` : s
}

function isWorseThan(your: unknown, hit: unknown): boolean {
  if (typeof your === 'number' && typeof hit === 'number') {
    return your < hit
  }
  // For categorical data we don't know "worse" — fall back to "differs".
  return your !== hit
}

interface PivotRow {
  metric: string
  your_value: unknown
  hits: Array<{ video_id: string; hit_value: unknown }>
}

export default function HitsComparison({
  comparedToHits,
  className = '',
}: HitsComparisonProps) {
  const { rows, hitIds } = useMemo(() => {
    const ids: string[] = []
    const seen = new Set<string>()
    for (const row of comparedToHits) {
      if (!seen.has(row.video_id)) {
        seen.add(row.video_id)
        ids.push(row.video_id)
      }
    }
    const cappedIds = ids.slice(0, 3)

    const byMetric = new Map<string, PivotRow>()
    for (const row of comparedToHits) {
      if (!cappedIds.includes(row.video_id)) continue
      let pivot = byMetric.get(row.metric)
      if (!pivot) {
        pivot = { metric: row.metric, your_value: row.your_value, hits: [] }
        byMetric.set(row.metric, pivot)
      }
      pivot.hits.push({ video_id: row.video_id, hit_value: row.hit_value })
    }
    return { rows: Array.from(byMetric.values()), hitIds: cappedIds }
  }, [comparedToHits])

  return (
    <WidgetCard
      title="You vs. your top hits"
      subtitle="Where this video diverged on every variable we measured."
      icon="fa-scale-balanced"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      size="lg"
      isEmpty={rows.length === 0}
      emptyMessage="Not enough hits in your catalog yet to compare against. Analyze more of your videos to unlock this view."
      emptyIcon="fa-scale-unbalanced"
      className={className}
    >
      <div className="overflow-x-auto -mx-2 px-2 dashboard-scrollbar">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="text-left">
              <th className="text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2 pr-3">
                Variable
              </th>
              <th className="text-[10px] font-black uppercase tracking-widest text-pink-300 pb-2 pr-3">
                This video
              </th>
              {hitIds.map((id, i) => (
                <th
                  key={id}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-300 pb-2 pr-3"
                >
                  Hit #{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-t border-white/[0.06]">
                <td className="py-2.5 pr-3 text-xs font-bold text-slate-200">
                  {prettifyMetric(row.metric)}
                </td>
                <td className="py-2.5 pr-3 text-xs font-bold text-pink-200 tabular-nums">
                  {formatCell(row.your_value)}
                </td>
                {hitIds.map((id) => {
                  const cell = row.hits.find((h) => h.video_id === id)
                  const value = cell?.hit_value
                  const diverged = cell ? isWorseThan(row.your_value, value) : false
                  return (
                    <td
                      key={`${row.metric}-${id}`}
                      className={`py-2.5 pr-3 text-xs font-bold tabular-nums ${
                        diverged ? 'text-emerald-200' : 'text-slate-300'
                      }`}
                    >
                      {formatCell(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetCard>
  )
}
