/**
 * LockedWidget — the tier-gated upgrade CTA that renders inside a
 * widget's slot when the backend returns 403 (`tier_required`).
 *
 * The product positioning is **"Stop creating in the dark"** —
 * pain-first, emotionally clear, never corporate. Each tier's lock
 * copy maps to the research-validated pain it addresses:
 *
 *   - Tier 1 (actions)     → "Stop guessing what to post next"
 *   - Tier 2 (forensics)   → "Why did this flop?"
 *   - Tier 3 (anatomy)     → "The strategic anatomy of viral content"
 *   - Tier 4 (creators)    → "Who's winning in your niche"
 *   - Flagship (N1/N2/N3)  → full-page lock takes priority; tier 1/2
 *                            copy reused for inline result-panel locks
 *
 * The card matches the WidgetCard glass aesthetic but with a subtle
 * gradient border and a solid gradient CTA button so it reads as a
 * "premium" surface without introducing a new visual language.
 *
 * Two variants:
 *   - `variant="card"`     (default) — sized like a normal WidgetCard
 *   - `variant="page"`     full-page lock for flagship routes
 *
 * Usage:
 *   <LockedWidget tier={1} requiredPlan="premium" widgetTitle="Outlier feed" />
 */

import { Link } from 'react-router-dom'

export type LockTier = 0 | 1 | 2 | 3 | 4 | 'flagship'

interface LockedWidgetProps {
  /** Plan slug the user needs to upgrade to (`premium`, `platin`, etc.). */
  requiredPlan: string
  /** Tier the locked widget belongs to. Drives the copy block. */
  tier: LockTier
  /** Original widget title — shown so users see what they're missing. */
  widgetTitle: string
  /** Tailwind classes passed through to the section wrapper. */
  className?: string
  /** `card` (default) sits inside a tier grid; `page` is a full route lock. */
  variant?: 'card' | 'page'
}

interface TierCopy {
  /** Short headline that names the pain. */
  headline: string
  /** Body paragraph — the research-driven copy from the implementation plan. */
  body: string
  /** Glyph for the corner icon. */
  icon: string
}

const TIER_COPY: Record<LockTier, TierCopy> = {
  0: {
    headline: 'Algorithm Weather is Premium',
    body: "What's the algorithm rewarding this week, who's surging, and what's about to break. Premium tier.",
    icon: 'fa-cloud-bolt',
  },
  1: {
    headline: 'Stop guessing what to post next',
    body: 'Premium shows you the breakouts in your niche, the outliers worth reverse-engineering, and the suggestions ranked for your DISC + tactic gaps.',
    icon: 'fa-arrow-trend-up',
  },
  2: {
    headline: 'Why did this flop?',
    body: 'Premium runs a tactic-level autopsy on every video — what diverged from your hits, what to swap next time.',
    icon: 'fa-magnifying-glass-chart',
  },
  3: {
    headline: 'The strategic anatomy of viral content',
    body: 'The strategic anatomy of viral content in your niche — cognitive triggers, hook patterns, optimal length curves, retention danger zones. Premium tier.',
    icon: 'fa-dna',
  },
  4: {
    headline: "Who's winning in your niche",
    body: "Who's winning in your niche, who's surging, what their audience archetype is. Premium tier.",
    icon: 'fa-trophy',
  },
  flagship: {
    headline: 'Stop creating in the dark',
    body: "This feature autopsies every video, predicts your next post's verdict, and reverse-engineers the outliers in your niche. Upgrade to unlock.",
    icon: 'fa-rocket',
  },
}

/** Pretty-print a plan slug (`premium` → `Premium`). */
function prettyPlan(slug: string): string {
  if (!slug) return 'Premium'
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export default function LockedWidget({
  requiredPlan,
  tier,
  widgetTitle,
  className = '',
  variant = 'card',
}: LockedWidgetProps) {
  const copy = TIER_COPY[tier] ?? TIER_COPY.flagship
  const planLabel = prettyPlan(requiredPlan)
  const isPage = variant === 'page'

  // Gradient border via a wrapper div — the inner card sits inset by 1px
  // so the gradient frames the glass. Keeps us using the existing
  // `glass-card` utility without inventing a new one.
  const wrapperPadding = isPage ? 'p-7 sm:p-10' : 'p-5 sm:p-6'
  const wrapperRadius = isPage ? 'rounded-3xl' : 'rounded-3xl'

  return (
    <section
      aria-label={`${widgetTitle} — upgrade required`}
      className={`relative ${wrapperRadius} overflow-hidden ${className}`}
    >
      {/* Gradient halo for the "premium" feel — subtle, doesn't shout. */}
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/25 via-fuchsia-500/15 to-violet-500/25 opacity-80 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className={`relative ${wrapperRadius} bg-slate-950/80 backdrop-blur-xl border border-white/[0.08] ${wrapperPadding} m-px`}
      >
        {/* Original widget title so users see what they're missing. */}
        <header className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/30 to-fuchsia-500/30 border border-white/15 flex items-center justify-center shrink-0">
            <i className={`fas ${copy.icon} text-pink-200 text-sm`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-pink-300/90 mb-0.5 inline-flex items-center gap-1.5">
              <i className="fas fa-lock text-[9px]" aria-hidden="true" />
              {planLabel} only
            </div>
            <h3
              className={`${isPage ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'} font-bold leading-tight text-slate-100`}
            >
              {widgetTitle}
            </h3>
          </div>
        </header>

        <div className={`${isPage ? 'max-w-2xl' : ''} mb-5`}>
          <h4
            className={`${isPage ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'} font-extrabold tracking-tight leading-tight mb-2`}
          >
            <span className="gradient-text font-display">{copy.headline}</span>
          </h4>
          <p
            className={`${isPage ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} text-slate-300/90 leading-relaxed`}
          >
            {copy.body}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/dashboard/account/billing"
            className={`inline-flex items-center gap-2 ${isPage ? 'px-5 py-2.5 text-xs sm:text-sm' : 'px-4 py-2 text-[11px] sm:text-xs'} rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-white font-black uppercase tracking-widest shadow-lg shadow-pink-500/25 transition-all hover:-translate-y-0.5 hover:shadow-pink-500/40`}
          >
            <i className="fas fa-rocket text-[10px]" aria-hidden="true" />
            Upgrade to {planLabel}
          </Link>
          {isPage ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              <i className="fas fa-arrow-left text-[10px]" aria-hidden="true" />
              Back to dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
