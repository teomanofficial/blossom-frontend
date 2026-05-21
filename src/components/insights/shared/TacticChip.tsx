/**
 * TacticChip — small colored pill for a tactic, with the 15 tactic
 * categories mapped to distinct hues so the eye can pattern-match
 * across a tactic teardown / co-occurrence chart at a glance.
 *
 * The category set comes from the AI pipeline's tactic taxonomy
 * (see docs/content-analysis-pipeline.md). An unknown category
 * falls back to neutral slate so the UI never crashes if a new
 * category is added server-side.
 *
 * Pure presentational.
 */

interface TacticChipProps {
  name: string
  category: string
  /** Optional execution_score (0-100). Shown as a small numeric badge. */
  score?: number
  /** Optional layout className. */
  className?: string
  size?: 'sm' | 'md'
}

const CATEGORY_TONE: Record<
  string,
  { chip: string; dot: string }
> = {
  hook_visual: {
    chip: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    dot: 'bg-violet-400',
  },
  hook_audio: {
    chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
    dot: 'bg-indigo-400',
  },
  hook_text: {
    chip: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    dot: 'bg-blue-400',
  },
  hook_structural: {
    chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    dot: 'bg-cyan-400',
  },
  pacing: {
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  emotional: {
    chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
    dot: 'bg-pink-400',
  },
  visual_style: {
    chip: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
    dot: 'bg-fuchsia-400',
  },
  audio_design: {
    chip: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    dot: 'bg-purple-400',
  },
  text_overlay: {
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    dot: 'bg-sky-400',
  },
  framing_angle: {
    chip: 'bg-teal-500/15 text-teal-300 border-teal-500/25',
    dot: 'bg-teal-400',
  },
  content_structure: {
    chip: 'bg-green-500/15 text-green-300 border-green-500/25',
    dot: 'bg-green-400',
  },
  shareability: {
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  engagement_bait: {
    chip: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
    dot: 'bg-orange-400',
  },
  trend_leverage: {
    chip: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    dot: 'bg-rose-400',
  },
  identity_signal: {
    chip: 'bg-red-500/15 text-red-300 border-red-500/25',
    dot: 'bg-red-400',
  },
}

const FALLBACK_TONE = {
  chip: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  dot: 'bg-slate-400',
}

const SIZE_DIMS: Record<NonNullable<TacticChipProps['size']>, {
  pill: string
  dot: string
  gap: string
  score: string
}> = {
  sm: {
    pill: 'px-2 py-0.5 text-[10px] font-bold rounded-full border',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
    score: 'px-1 py-0 text-[9px]',
  },
  md: {
    pill: 'px-2.5 py-1 text-xs font-bold rounded-full border',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
    score: 'px-1.5 py-0 text-[10px]',
  },
}

function prettifyCategory(category: string): string {
  return category
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

export default function TacticChip({
  name,
  category,
  score,
  className = '',
  size = 'md',
}: TacticChipProps) {
  const tone = CATEGORY_TONE[category] ?? FALLBACK_TONE
  const sz = SIZE_DIMS[size]
  const categoryLabel = prettifyCategory(category)
  const hasScore = typeof score === 'number' && Number.isFinite(score)
  const roundedScore = hasScore ? Math.max(0, Math.min(100, Math.round(score))) : null

  return (
    <span
      className={`inline-flex items-center ${sz.gap} ${sz.pill} ${tone.chip} ${className}`}
      title={`${name} · ${categoryLabel}`}
    >
      <span className={`rounded-full ${sz.dot} ${tone.dot} shrink-0`} aria-hidden="true" />
      <span className="truncate">{name}</span>
      {roundedScore !== null ? (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-white/10 font-black tabular-nums ${sz.score}`}
          aria-label={`Execution score ${roundedScore}`}
        >
          {roundedScore}
        </span>
      ) : null}
    </span>
  )
}
