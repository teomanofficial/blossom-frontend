/**
 * EmotionDistribution — Tier 3 Anatomy widget showing which primary
 * emotion shows up most often in top-decile videos for the user's
 * niche.
 *
 * Backend: `GET /api/insights/tier3/emotion-distribution`
 *   → { distribution: [{emotion, count, pct}], niche, sample_size }
 *
 * Rendered as a horizontal bar list rather than a pie because emotion
 * labels are long (e.g. "amusement", "frustration") and pies make
 * comparisons hard at small sizes. Each bar widths to the emotion's
 * share of the top-decile pool; numeric % sits at the right.
 */

import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface EmotionRow {
  emotion: string
  count: number
  pct: number
}

interface EmotionDistributionResponse {
  distribution: EmotionRow[]
  niche: string | null
  sample_size: number
}

interface EmotionDistributionProps {
  className?: string
  niche?: string
}

// Light tonal mapping — emotion → accent. Falls back to a soft pink for
// anything we haven't explicitly classed.
const EMOTION_TONE: Record<string, { bar: string; chip: string }> = {
  amusement: { bar: 'from-amber-400 to-amber-500', chip: 'text-amber-300' },
  joy: { bar: 'from-amber-400 to-yellow-400', chip: 'text-amber-300' },
  surprise: { bar: 'from-sky-400 to-cyan-400', chip: 'text-sky-300' },
  curiosity: { bar: 'from-cyan-400 to-teal-400', chip: 'text-cyan-300' },
  awe: { bar: 'from-violet-400 to-fuchsia-500', chip: 'text-violet-300' },
  inspiration: { bar: 'from-emerald-400 to-green-500', chip: 'text-emerald-300' },
  relatability: { bar: 'from-rose-400 to-pink-500', chip: 'text-rose-300' },
  frustration: { bar: 'from-rose-400 to-red-500', chip: 'text-rose-300' },
  anger: { bar: 'from-red-400 to-red-600', chip: 'text-red-300' },
  fear: { bar: 'from-indigo-400 to-purple-500', chip: 'text-indigo-300' },
  sadness: { bar: 'from-blue-400 to-indigo-500', chip: 'text-blue-300' },
  nostalgia: { bar: 'from-amber-300 to-orange-400', chip: 'text-amber-300' },
  pride: { bar: 'from-fuchsia-400 to-pink-500', chip: 'text-fuchsia-300' },
  empowerment: { bar: 'from-emerald-400 to-teal-500', chip: 'text-emerald-300' },
}

const DEFAULT_TONE = {
  bar: 'from-pink-400 to-pink-500',
  chip: 'text-pink-300',
}

function tone(emotion: string) {
  return EMOTION_TONE[emotion.toLowerCase()] ?? DEFAULT_TONE
}

export default function EmotionDistribution({
  className = '',
  niche,
}: EmotionDistributionProps) {
  const path = niche
    ? `tier3/emotion-distribution?niche=${encodeURIComponent(niche)}`
    : 'tier3/emotion-distribution'
  const { data, loading, error, retry, locked } = useInsights<EmotionDistributionResponse>(path)

  const rows = data?.distribution ?? []
  const isEmpty = !loading && !error && rows.length === 0

  // Cap displayed list at 10 to keep the panel scannable. Backend already
  // sorts DESC by count.
  const visible = rows.slice(0, 10)
  const maxPct = visible.reduce((m, r) => Math.max(m, r.pct), 0) || 1

  return (
    <WidgetCard
      title="Emotion Distribution"
      subtitle="Which primary emotion drives top-decile videos most often."
      icon="fa-face-smile-beam"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-face-smile-beam"
      emptyMessage="No primary-emotion data classified yet."
      size="md"
      className={className}
      locked={locked}
      tier={3}
      actions={
        data && data.sample_size > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            n={compactNumber(data.sample_size)}
          </span>
        ) : null
      }
    >
      <ul className="space-y-2">
        {visible.map((row) => {
          const t = tone(row.emotion)
          const widthPct = Math.max(4, (row.pct / maxPct) * 100)
          return (
            <li key={row.emotion} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className={`font-bold capitalize ${t.chip}`}>{row.emotion}</span>
                <span className="text-slate-500 tabular-nums">
                  <span className={`font-black ${t.chip}`}>{row.pct.toFixed(1)}%</span>
                  <span className="ml-1.5 text-[10px] text-slate-600">
                    ({compactNumber(row.count)})
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${t.bar}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </WidgetCard>
  )
}
