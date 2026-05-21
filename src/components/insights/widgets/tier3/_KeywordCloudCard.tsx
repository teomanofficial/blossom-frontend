/**
 * _KeywordCloudCard — internal shared shell used by both
 * SpokenHookKeywords and OnScreenHookKeywords.
 *
 * Same response shape, same visual treatment, different endpoint and
 * different tonal accents — splitting the rendering into a single
 * component keeps the two widget files paper-thin and the styling in
 * lock-step.
 *
 * Layout:
 *  - Top 8 keywords get a horizontal-bar row each, sorted DESC by
 *    frequency. The bar width is normalised against the leading
 *    keyword's frequency so the relative scale reads cleanly even
 *    when the absolute numbers are tiny.
 *  - Below the bars, the remaining keywords (up to ~30 total returned
 *    by the backend) are surfaced as a wrapped flex grid of "chips".
 *    Chip font-size scales with frequency, so the high-volume ones
 *    pop without needing a literal word-cloud library.
 */

import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface KeywordRow {
  keyword: string
  frequency: number
  video_count: number
}

interface KeywordResponse {
  keywords: KeywordRow[]
  niche: string | null
  sample_size: number
}

interface BarTone {
  /** Tailwind gradient e.g. `from-pink-400 to-rose-500` */
  gradient: string
  text: string
  chip: string
  chipHi: string
}

interface KeywordCloudCardProps {
  path: string
  niche?: string
  className?: string
  title: string
  subtitle: string
  icon: string
  iconBg: string
  iconColor: string
  barTone: BarTone
}

export default function KeywordCloudCard({
  path,
  niche,
  className = '',
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  barTone,
}: KeywordCloudCardProps) {
  const fullPath = niche ? `${path}?niche=${encodeURIComponent(niche)}` : path
  const { data, loading, error, retry } = useInsights<KeywordResponse>(fullPath)

  const keywords = data?.keywords ?? []
  const isEmpty = !loading && !error && keywords.length === 0

  const top = keywords.slice(0, 8)
  const tail = keywords.slice(8)

  const maxFreq = top.reduce((m, k) => Math.max(m, k.frequency), 0) || 1
  const minTail = tail.reduce(
    (m, k) => Math.min(m, k.frequency),
    Number.POSITIVE_INFINITY,
  )
  const maxTail = tail.reduce((m, k) => Math.max(m, k.frequency), 0)
  const tailSpan = Math.max(1, maxTail - (Number.isFinite(minTail) ? minTail : 0))

  function tailFontPx(freq: number): number {
    if (!Number.isFinite(minTail)) return 11
    const t = (freq - minTail) / tailSpan
    return 11 + Math.round(t * 7) // 11 → 18px
  }

  return (
    <WidgetCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconBg={iconBg}
      iconColor={iconColor}
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon={icon}
      emptyMessage="No keyword data extracted yet for your scope."
      size="md"
      className={className}
      actions={
        data && data.sample_size > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            n={compactNumber(data.sample_size)}
          </span>
        ) : null
      }
    >
      <ul className="space-y-2 mb-4">
        {top.map((k) => {
          const pct = Math.max(6, (k.frequency / maxFreq) * 100)
          return (
            <li key={k.keyword} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[11px]">
                <span className={`font-bold truncate ${barTone.text}`}>{k.keyword}</span>
                <span className="text-slate-500 tabular-nums shrink-0">
                  <span className={`font-black ${barTone.text}`}>{k.frequency}</span>
                  <span className="ml-1.5 text-[10px] text-slate-600">
                    in {compactNumber(k.video_count)} vids
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barTone.gradient}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {tail.length > 0 ? (
        <div className="pt-3 border-t border-white/[0.05]">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">
            Also seen
          </div>
          <div className="flex flex-wrap gap-1.5 leading-tight">
            {tail.map((k) => {
              const isHigh = k.frequency >= (Number.isFinite(minTail) ? minTail : 0) + tailSpan * 0.5
              return (
                <span
                  key={k.keyword}
                  className={`inline-flex items-center px-2 py-0.5 rounded-md border font-semibold ${
                    isHigh ? barTone.chipHi : barTone.chip
                  }`}
                  style={{ fontSize: `${tailFontPx(k.frequency)}px`, lineHeight: 1.2 }}
                  title={`${k.frequency} mentions in ${k.video_count} videos`}
                >
                  {k.keyword}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
