/**
 * DivergedVariableCard — the HEADLINE finding of the post-mortem.
 * This sits above the fold and is the single thing the user reads
 * first. Big text. Emotionally clear. No hedging.
 *
 * Copy guidance (from research synthesis):
 *   - "Here's what likely went wrong" — not "Analysis indicates..."
 *   - Lead with the human-readable variable name and the actual
 *     numbers. Numbers are sticky.
 *   - Confidence chip in the corner so users know we know we might
 *     be wrong.
 */

import type { PostMortemResponse } from '../../types/insights'

interface DivergedVariableCardProps {
  diverged: PostMortemResponse['diverged_variable']
  className?: string
}

/**
 * Map our internal variable slug to a user-facing label + 1-sentence
 * plain-English explanation. Unknown variables fall back to a
 * prettified version of the slug.
 */
const VARIABLE_META: Record<
  string,
  { label: string; whatItIs: string; unit?: string }
> = {
  scroll_stop_power: {
    label: 'Scroll-stop power',
    whatItIs:
      'How sticky your opening frame is. The single biggest predictor of whether a viewer pauses on your video at all.',
    unit: '/100',
  },
  hook_seconds: {
    label: 'Hook length',
    whatItIs:
      'How long it takes for the actual hook to land. Top videos in your niche cut it short — yours is too long.',
    unit: 's',
  },
  primal_trigger: {
    label: 'Primal trigger',
    whatItIs:
      "The emotional pressure your hook applies. Yours doesn't match what your hits use to grab.",
  },
  primary_emotion: {
    label: 'Primary emotion',
    whatItIs:
      'The dominant feeling your video evokes. Yours diverges from the feeling your audience actually rewards.',
  },
  share_motivation: {
    label: 'Share motivation',
    whatItIs:
      "Why someone would forward this. Yours doesn't trigger the share reflex your hits do.",
  },
  cliffhanger_strength: {
    label: 'Cliffhanger strength',
    whatItIs:
      'How much your video promises a payoff worth waiting for. Yours pays off too fast.',
    unit: '/10',
  },
  emotion_intensity: {
    label: 'Emotion intensity',
    whatItIs:
      "How strongly your video swings the viewer's mood. Yours is too flat for what your audience expects.",
    unit: '/10',
  },
}

function prettify(slug: string): string {
  return slug
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    const rounded =
      Number.isInteger(value) || Math.abs(value) >= 100
        ? Math.round(value)
        : Math.round(value * 10) / 10
    return `${rounded}${unit ?? ''}`
  }
  return String(value)
}

export default function DivergedVariableCard({
  diverged,
  className = '',
}: DivergedVariableCardProps) {
  const meta = VARIABLE_META[diverged.name] ?? {
    label: prettify(diverged.name),
    whatItIs:
      "This variable diverged most from your hits — it's the most likely thing the algorithm noticed.",
  }
  const confidencePct = Math.round(
    Math.max(0, Math.min(1, diverged.confidence)) * 100,
  )

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-rose-500/15 p-6 sm:p-8 lg:p-10 ${className}`}
    >
      {/* Decorative glow */}
      <div className="absolute -top-24 -right-16 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Top eyebrow row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-pink-500/25 rounded-xl flex items-center justify-center">
              <i className="fas fa-magnifying-glass-chart text-pink-300 text-xs" />
            </div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-pink-200">
              Here&apos;s what likely went wrong
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-bold text-slate-300">
            <i className="fas fa-shield-check text-[9px] text-emerald-300" />
            {confidencePct}% confidence
          </span>
        </div>

        {/* The headline finding */}
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
          Your{' '}
          <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 bg-clip-text text-transparent">
            {meta.label.toLowerCase()}
          </span>{' '}
          tanked.
        </h2>

        {/* The numbers — sticky and inescapable */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              This video
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tabular-nums">
              {formatValue(diverged.your_value, meta.unit)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Your typical post
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-200 tabular-nums">
              {formatValue(diverged.your_median, meta.unit)}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/25 p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">
              Your top hits
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-200 tabular-nums">
              {formatValue(diverged.your_top5_median, meta.unit)}
            </div>
          </div>
        </div>

        {/* Plain-English explanation */}
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
          {meta.whatItIs}{' '}
          <span className="text-pink-200 font-semibold">{diverged.delta}.</span>{' '}
          Out of every variable we checked, this is the one the algorithm most likely
          noticed — and where the fix has the most upside.
        </p>
      </div>
    </section>
  )
}
