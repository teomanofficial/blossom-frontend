/**
 * VerdictBanner — the headline finding of a Greenlight evaluation.
 *
 * Three states, color-coded so the user gets the verdict from across
 * the room: green = ship it, yellow = tighten, red = skip.
 *
 * Each state pairs a punchy headline with a 1-sentence rationale built
 * from the overall_score + the lowest contributing score, plus a small
 * row of supporting score chips so the user has the breakdown in their
 * field of view without scrolling.
 *
 * Pure presentational — accepts the full GreenlightResponse and shapes
 * its own copy. Parent owns the data.
 */

import type { GreenlightResponse } from '../../types/insights'

interface VerdictBannerProps {
  response: GreenlightResponse
  className?: string
}

interface VerdictStyle {
  card: string
  ring: string
  iconWrap: string
  icon: string
  label: string
  headline: string
  scoreTone: string
}

const VERDICT_STYLES: Record<GreenlightResponse['verdict'], VerdictStyle> = {
  green: {
    card: 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/15 border-emerald-500/40',
    ring: 'shadow-[0_0_60px_-15px_rgba(16,185,129,0.45)]',
    iconWrap: 'bg-emerald-500/25 text-emerald-100',
    icon: 'fa-check',
    label: 'Ship this',
    headline: 'Ship this concept.',
    scoreTone: 'text-emerald-200',
  },
  yellow: {
    card: 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-orange-500/15 border-amber-500/40',
    ring: 'shadow-[0_0_60px_-15px_rgba(245,158,11,0.45)]',
    iconWrap: 'bg-amber-500/25 text-amber-100',
    icon: 'fa-screwdriver-wrench',
    label: 'Tighten before shipping',
    headline: 'Tighten before you ship.',
    scoreTone: 'text-amber-200',
  },
  red: {
    card: 'bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-red-500/20 border-rose-500/40',
    ring: 'shadow-[0_0_60px_-15px_rgba(244,63,94,0.50)]',
    iconWrap: 'bg-rose-500/25 text-rose-100',
    icon: 'fa-circle-xmark',
    label: 'Skip this concept',
    headline: 'Skip this concept.',
    scoreTone: 'text-rose-200',
  },
}

interface ScoreChip {
  label: string
  value: number
}

function pickRationale(response: GreenlightResponse): string {
  const verdict = response.verdict
  const scores: ScoreChip[] = [
    { label: 'hook strength', value: response.predicted_hook_strength },
    { label: 'niche fit', value: Math.round(response.niche_fit.score) },
    { label: 'format fit', value: Math.round(response.format_fit.score) },
  ]
  const lowest = scores.reduce<ScoreChip>(
    (acc, s) => (s.value < acc.value ? s : acc),
    scores[0]!,
  )
  if (verdict === 'green') {
    return `All three primary scores clear 70 — your ${lowest.label} (${lowest.value}/100) is the floor and it's still strong. Time to film.`
  }
  if (verdict === 'red') {
    if (response.niche_fit.score < 40) {
      return `Your niche fit is only ${Math.round(response.niche_fit.score)}/100 — this concept lands far outside what your audience rewards. Pick a different angle.`
    }
    if (response.predicted_hook_strength < 30) {
      return `Predicted hook strength is ${response.predicted_hook_strength}/100. Without a sharper cold-open this won't survive the swipe-test.`
    }
    return `Multiple primary scores collapse below the floor. The concept needs a fundamental rework, not edits.`
  }
  return `${lowest.label[0]!.toUpperCase()}${lowest.label.slice(1)} is the weakest link at ${lowest.value}/100. Apply the swaps below to push it past 70 before filming.`
}

function ScoreChipBadge({ chip, tone }: { chip: ScoreChip; tone: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 border border-white/10">
      <span className={`text-[9px] font-black uppercase tracking-widest ${tone}`}>
        {chip.label}
      </span>
      <span className="text-xs sm:text-sm font-black tabular-nums text-white">
        {chip.value}
      </span>
    </div>
  )
}

export default function VerdictBanner({ response, className = '' }: VerdictBannerProps) {
  const style = VERDICT_STYLES[response.verdict]
  const rationale = pickRationale(response)
  const chips: ScoreChip[] = [
    { label: 'Hook', value: response.predicted_hook_strength },
    { label: 'Niche', value: Math.round(response.niche_fit.score) },
    { label: 'Format', value: Math.round(response.format_fit.score) },
  ]

  return (
    <section
      role="status"
      aria-live="polite"
      className={`relative rounded-3xl border ${style.card} ${style.ring} px-5 sm:px-7 py-6 sm:py-7 ${className}`}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${style.iconWrap} flex items-center justify-center`}
        >
          <i className={`fas ${style.icon} text-xl sm:text-2xl`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${style.scoreTone}`}
            >
              {style.label}
            </span>
            <span className={`text-[10px] font-black ${style.scoreTone}/70`}>
              ·
            </span>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/80">
              Overall {response.overall_score}/100
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {style.headline}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/85 leading-relaxed max-w-3xl">
            {rationale}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <ScoreChipBadge key={c.label} chip={c} tone={style.scoreTone} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
