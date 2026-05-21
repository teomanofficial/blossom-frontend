/**
 * NextPostsRanked — Tier 1 widget that surfaces the user's own
 * content_suggestions reranked by BE2's composite score (DISC + niche
 * + tactic gap + trend + difficulty).
 *
 * Backend: `GET /api/insights/tier1/next-posts` →
 *   { next_posts: NextPostItem[], user_niche: string }
 *
 * Each card shows:
 *   - Big title + description excerpt
 *   - Composite-score badge with a hover-revealed breakdown (the five
 *     additive components from the BE2 scoring function)
 *   - Suggested hook (italicised quote)
 *   - Suggested tactics as colored chips (fallback styling — these come
 *     as plain text from the suggestions table, so we don't have a
 *     category for TacticChip; we render a neutral pill instead)
 *   - Difficulty + platform-hint badges
 *   - Primary CTA "Run through Greenlight Studio" →
 *       /dashboard/greenlight?suggestion_id=<id>
 *   - Secondary "Save for later" → POSTs /api/analysis/suggestions/:id/save
 *     (same endpoint Suggestions.tsx uses) with optimistic UI.
 *
 * Empty state is forward-looking, not error-shaped: when the suggestion
 * pipeline hasn't run for this user yet we tell them so honestly.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../../../../lib/api'
import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'

interface ScoreBreakdown {
  format_match: boolean
  closes_tactic_gap: boolean
  matches_niche: boolean
  high_trend: boolean
  difficulty_match: boolean
}

interface NextPostItem {
  suggestion_id: string
  title: string
  description: string
  format_class_id: string | null
  primary_keyword_id: string | null
  trend_strength: number
  difficulty: string | null
  platform_hint: string | null
  suggested_hook: string | null
  composite_score: number
  score_breakdown: ScoreBreakdown
  user_disc_primary: string | null
  /** Optional — emitted when the row joins suggested_tactics (text[]) in
   *  a follow-up; we render chips if present, skip if absent. */
  suggested_tactics?: string[] | null
}

interface NextPostsResponse {
  next_posts: NextPostItem[]
  user_niche?: string
}

interface NextPostsRankedProps {
  className?: string
}

// The five additive components from the BE2 scoring rubric. Order
// matters — the tooltip lists them in the same sequence the score is
// computed so users can audit the math.
const BREAKDOWN_LABELS: ReadonlyArray<{
  key: keyof ScoreBreakdown
  label: string
  points: number
}> = [
  { key: 'format_match', label: 'Format match', points: 30 },
  { key: 'closes_tactic_gap', label: 'Closes a tactic gap', points: 20 },
  { key: 'matches_niche', label: 'Matches your niche', points: 15 },
  { key: 'high_trend', label: 'High trend strength', points: 10 },
  { key: 'difficulty_match', label: 'Difficulty matches tier', points: 5 },
]

const FALLBACK_DIFFICULTY_TONE =
  'bg-slate-500/15 text-slate-300 border-slate-500/25'

const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  med: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  hard: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  high: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
}

function difficultyTone(level: string | null): string {
  if (!level) return FALLBACK_DIFFICULTY_TONE
  return DIFFICULTY_TONE[level.toLowerCase()] ?? FALLBACK_DIFFICULTY_TONE
}

function ScoreBadge({ score, breakdown }: { score: number; breakdown: ScoreBreakdown }) {
  const rounded = Math.max(0, Math.min(100, Math.round(score)))
  // Color tiers track the visual language used elsewhere in insights
  // (green >= 60, amber 30-59, rose < 30).
  const tone =
    rounded >= 60
      ? {
          glow: 'from-amber-500/40 to-orange-500/30',
          chip: 'from-amber-500 to-orange-500 shadow-amber-500/30',
        }
      : rounded >= 30
        ? {
            glow: 'from-slate-500/30 to-slate-700/20',
            chip: 'from-slate-500 to-slate-700 shadow-slate-500/20',
          }
        : {
            glow: 'from-rose-500/30 to-rose-700/20',
            chip: 'from-rose-500 to-rose-700 shadow-rose-500/20',
          }

  return (
    <div className="relative shrink-0 group/score">
      <div className={`absolute -inset-1.5 bg-gradient-to-br ${tone.glow} rounded-xl blur-md opacity-80`} />
      <span
        className={`relative inline-flex flex-col items-center px-2 py-0.5 rounded-xl bg-gradient-to-br ${tone.chip} text-white border border-white/15 shadow-lg`}
        aria-label={`Composite score ${rounded} out of 80`}
      >
        <span className="text-sm font-black tabular-nums leading-none">{rounded}</span>
        <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-0.5">
          score
        </span>
      </span>

      {/* Hover-revealed breakdown */}
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-60 opacity-0 group-hover/score:opacity-100 transition-opacity duration-150"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/60 p-3 text-left">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            How we ranked this
          </div>
          <ul className="space-y-1.5">
            {BREAKDOWN_LABELS.map(({ key, label, points }) => {
              const hit = breakdown[key]
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span
                    className={`flex items-center gap-1.5 ${
                      hit ? 'text-slate-100 font-semibold' : 'text-slate-600 line-through'
                    }`}
                  >
                    <i
                      className={`fas ${hit ? 'fa-check text-emerald-400' : 'fa-minus text-slate-700'} text-[9px]`}
                    />
                    {label}
                  </span>
                  <span
                    className={`tabular-nums font-black text-[10px] ${
                      hit ? 'text-amber-300' : 'text-slate-700'
                    }`}
                  >
                    +{points}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

function TacticPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold whitespace-nowrap">
      <span className="w-1 h-1 rounded-full bg-amber-300" aria-hidden="true" />
      {name}
    </span>
  )
}

interface SaveState {
  saved: boolean
  pending: boolean
}

function NextPostCard({ item }: { item: NextPostItem }) {
  const [saveState, setSaveState] = useState<SaveState>({
    saved: false,
    pending: false,
  })

  const onSave = useCallback(async () => {
    if (saveState.pending) return
    setSaveState((s) => ({ ...s, pending: true }))
    try {
      const res = await authFetch(
        `/api/analysis/suggestions/${item.suggestion_id}/save`,
        { method: 'POST' },
      )
      const json = (await res.json().catch(() => null)) as { saved?: boolean } | null
      setSaveState({
        saved: Boolean(json?.saved ?? !saveState.saved),
        pending: false,
      })
    } catch (err) {
      console.error('Failed to save suggestion', err)
      setSaveState((s) => ({ ...s, pending: false }))
    }
  }, [item.suggestion_id, saveState.pending, saveState.saved])

  const tactics = (item.suggested_tactics ?? []).filter((t) => t && t.trim().length > 0)

  return (
    <article className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-amber-500/20 transition-colors p-3.5">
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-[15px] font-bold text-slate-100 leading-snug">
            {item.title}
          </h4>
          {item.description ? (
            <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">
              {item.description}
            </p>
          ) : null}
        </div>
        <ScoreBadge score={item.composite_score} breakdown={item.score_breakdown} />
      </header>

      {item.suggested_hook ? (
        <div className="rounded-lg bg-white/[0.03] border-l-2 border-amber-400/60 px-2.5 py-1.5 mb-2.5">
          <p className="text-[11px] text-slate-300 italic leading-snug line-clamp-2">
            &ldquo;{item.suggested_hook}&rdquo;
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {item.difficulty ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${difficultyTone(item.difficulty)} border text-[10px] font-bold capitalize`}
            title="Difficulty"
          >
            <i className="fas fa-gauge-simple-high text-[9px]" />
            {item.difficulty}
          </span>
        ) : null}
        {item.platform_hint ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[10px] font-bold capitalize">
            <i className="fas fa-mobile-screen text-[9px]" />
            {item.platform_hint}
          </span>
        ) : null}
        {item.trend_strength > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
            <i className="fas fa-fire text-[9px]" />
            {Math.round(item.trend_strength * 100)}% trend
          </span>
        ) : null}
        {tactics.slice(0, 3).map((t) => (
          <TacticPill key={t} name={t} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/dashboard/greenlight?suggestion_id=${encodeURIComponent(item.suggestion_id)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-colors"
        >
          <i className="fas fa-traffic-light text-[9px]" />
          Run through Greenlight
          <i className="fas fa-arrow-right text-[9px]" />
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={saveState.pending}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
            saveState.saved
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-200'
              : 'bg-white/[0.04] hover:bg-white/[0.10] border-white/10 text-slate-300'
          }`}
          title={saveState.saved ? 'Saved — click to remove' : 'Save for later'}
          aria-pressed={saveState.saved}
        >
          <i
            className={`fas ${saveState.pending ? 'fa-spinner fa-spin' : saveState.saved ? 'fa-bookmark' : 'fa-bookmark'} text-[9px]`}
          />
          {saveState.saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  )
}

export default function NextPostsRanked({ className = '' }: NextPostsRankedProps) {
  const { data, loading, error, retry } = useInsights<NextPostsResponse>(
    'tier1/next-posts',
  )

  // Defensive: sort by composite_score DESC. Backend already returns
  // pre-sorted but the contract is "top 10" so we trim regardless.
  const [items, setItems] = useState<NextPostItem[]>([])
  useEffect(() => {
    const next = (data?.next_posts ?? [])
      .slice()
      .sort((a, b) => b.composite_score - a.composite_score)
      .slice(0, 10)
    setItems(next)
  }, [data])

  return (
    <WidgetCard
      title="Next posts, ranked"
      subtitle="Your suggestions re-ranked by DISC + niche + tactic gaps."
      icon="fa-list-ol"
      iconBg="bg-amber-500/15"
      iconColor="text-amber-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && items.length === 0}
      emptyIcon="fa-pen-ruler"
      emptyMessage="We're crafting personalized suggestions — check back in a few hours."
      size="lg"
      className={className}
    >
      <div className="space-y-2.5">
        {items.map((item) => (
          <NextPostCard key={item.suggestion_id} item={item} />
        ))}
      </div>
    </WidgetCard>
  )
}
