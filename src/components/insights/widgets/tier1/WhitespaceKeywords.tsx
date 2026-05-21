/**
 * WhitespaceKeywords — Tier 1 widget surfacing high-engagement /
 * low-volume keywords ("blue ocean" topics where demand outstrips
 * supply).
 *
 * Backend: `GET /api/insights/tier1/whitespace` — returns
 *   { whitespace: WhitespaceKeyword[] }   // already sorted by score DESC
 *
 * Each row visualises:
 *   - keyword name + category chip
 *   - engagement-vs-niche-avg bar (your rate vs the category P75 baseline)
 *   - video-count and whitespace-score badges
 *   - "Try this" CTA → /dashboard/greenlight?seed=<name>  (N2 consumes this)
 *
 * Empty state copy is intentionally upbeat ("fully explored") rather
 * than pessimistic — niches without whitespace are usually mature ones.
 */

import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import type { WhitespaceKeyword } from '../../../../types/insights'
import { compactNumber, formatPercent } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface WhitespaceResponse {
  whitespace: WhitespaceKeyword[]
}

interface WhitespaceKeywordsProps {
  className?: string
}

interface CategoryTone {
  chip: string
  dot: string
}

const FALLBACK_TONE: CategoryTone = {
  chip: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  dot: 'bg-slate-400',
}

const CATEGORY_TONE: Record<string, CategoryTone> = {
  beauty: { chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25', dot: 'bg-pink-400' },
  fashion: { chip: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25', dot: 'bg-fuchsia-400' },
  fitness: { chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-400' },
  food: { chip: 'bg-amber-500/15 text-amber-300 border-amber-500/25', dot: 'bg-amber-400' },
  travel: { chip: 'bg-sky-500/15 text-sky-300 border-sky-500/25', dot: 'bg-sky-400' },
  parenting: { chip: 'bg-rose-500/15 text-rose-300 border-rose-500/25', dot: 'bg-rose-400' },
  tech: { chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25', dot: 'bg-cyan-400' },
  finance: { chip: 'bg-green-500/15 text-green-300 border-green-500/25', dot: 'bg-green-400' },
  business: { chip: 'bg-teal-500/15 text-teal-300 border-teal-500/25', dot: 'bg-teal-400' },
  education: { chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25', dot: 'bg-indigo-400' },
  entertainment: { chip: 'bg-violet-500/15 text-violet-300 border-violet-500/25', dot: 'bg-violet-400' },
  lifestyle: { chip: 'bg-purple-500/15 text-purple-300 border-purple-500/25', dot: 'bg-purple-400' },
  general: FALLBACK_TONE,
}

function getCategoryTone(category: string): CategoryTone {
  const key = (category || 'general').toLowerCase()
  return CATEGORY_TONE[key] ?? FALLBACK_TONE
}

/**
 * Compute the engagement bar: your_rate as percent of niche P75 baseline,
 * capped at 200% so a single 10× outlier doesn't crush the rest of the chart.
 */
function engagementRatio(kw: WhitespaceKeyword): number {
  if (!Number.isFinite(kw.niche_engagement_avg) || kw.niche_engagement_avg <= 0) {
    return 1
  }
  const ratio = kw.avg_engagement_rate / kw.niche_engagement_avg
  return Math.max(0, Math.min(2, ratio))
}

function KeywordRow({ kw }: { kw: WhitespaceKeyword }) {
  const tone = getCategoryTone(kw.category)
  const ratio = engagementRatio(kw)
  const barWidthPct = Math.min(100, (ratio / 2) * 100)
  const baselineMarkerPct = 50 // niche avg sits at the 1× midpoint
  const ratioLabel = `${ratio.toFixed(1).replace(/\.0$/, '')}×`
  const score = Math.round(kw.whitespace_score)

  return (
    <li className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-emerald-500/20 transition-colors p-3 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-100 leading-tight truncate">
            {kw.name}
          </h4>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tone.chip} border text-[10px] font-bold`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
              <span className="capitalize">{kw.category || 'general'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <i className="fas fa-video text-[9px]" />
              {compactNumber(kw.video_count)} videos
            </span>
          </div>
        </div>
        <div
          className="relative shrink-0"
          title="Whitespace score — higher means more demand vs supply."
        >
          <div className="absolute -inset-1.5 bg-gradient-to-br from-emerald-500/30 to-green-500/20 rounded-xl blur-md opacity-80" />
          <span className="relative inline-flex items-center px-2 py-0.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white text-xs font-black tabular-nums shadow-lg shadow-emerald-500/30 border border-white/15">
            {score}
          </span>
        </div>
      </div>

      {/* Engagement-vs-baseline bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500 font-semibold">
            {formatPercent(kw.avg_engagement_rate)}{' '}
            <span className="text-slate-600">engagement</span>
          </span>
          <span className="text-emerald-300 font-black tabular-nums">{ratioLabel} P75</span>
        </div>
        <div
          className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(ratio * 100)}
          aria-valuemin={0}
          aria-valuemax={200}
          aria-label={`${ratioLabel} the category P75 engagement`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all"
            style={{ width: `${barWidthPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-white/40"
            style={{ left: `${baselineMarkerPct}%` }}
            aria-hidden="true"
            title="Category P75 baseline"
          />
        </div>
      </div>

      <Link
        to={`/dashboard/greenlight?seed=${encodeURIComponent(kw.name)}`}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-colors"
      >
        <i className="fas fa-bolt text-[9px]" />
        Try this
        <i className="fas fa-arrow-right text-[9px]" />
      </Link>
    </li>
  )
}

export default function WhitespaceKeywords({
  className = '',
}: WhitespaceKeywordsProps) {
  const { data, loading, error, retry, locked } = useInsights<WhitespaceResponse>(
    'tier1/whitespace',
  )

  const keywords = data?.whitespace ?? []
  // Backend already sorts DESC; sort defensively just in case.
  const sorted = [...keywords].sort(
    (a, b) => (b.whitespace_score ?? 0) - (a.whitespace_score ?? 0),
  )
  const top = sorted.slice(0, 6)

  return (
    <WidgetCard
      title="Whitespace keywords"
      subtitle="High engagement, low competition — your blue ocean."
      icon="fa-map-location-dot"
      iconBg="bg-emerald-500/15"
      iconColor="text-emerald-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && top.length === 0}
      emptyIcon="fa-compass"
      emptyMessage="Your niche is fully explored — no whitespace right now."
      size="lg"
      className={className}
      locked={locked}
      tier={1}
      info={{
        what: 'Topics with high engagement but low video count in your niche.',
        howToRead:
          "These are blue-ocean opportunities — creators aren't making this content yet, but when they do, it performs above average. Try one before someone else discovers it. The bar shows how much each keyword's engagement beats the niche P75 baseline.",
        computation:
          'Whitespace score = (engagement rate above niche P75) − (video count below niche median × 50). Sorted descending so the biggest opportunities float to the top.',
      }}
    >
      <ul className="space-y-2.5">
        {top.map((kw) => (
          <KeywordRow key={kw.keyword_id} kw={kw} />
        ))}
      </ul>
    </WidgetCard>
  )
}
