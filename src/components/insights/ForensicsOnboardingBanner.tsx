/**
 * ForensicsOnboardingBanner — first-run guide for users without enough
 * analyzed content to power the Tier 2+ forensic widgets.
 *
 * Per the §11 P2 brief: when the user has < 3 analyzed uploads, surface
 * a banner above Tier 2 explaining that forensics get sharper with more
 * data and CTA-ing them into the analyze flow. We don't HIDE the
 * forensic widgets — they each render their own empty state — but this
 * banner gives the "you're not broken, you just need more data" framing
 * up-front so the empty states don't feel like a string of failures.
 *
 * Renders nothing while the count is loading or when the user is past
 * the threshold (count >= 3). The banner is informational; no dismiss
 * UX — once the user crosses 3 it disappears on its own next session.
 */

import { Link } from 'react-router-dom'
import { useDashboardSection } from '../../lib/useDashboardSection'

interface AnalyzedUploadsCount {
  count: number
}

const FORENSICS_THRESHOLD = 3

export default function ForensicsOnboardingBanner() {
  const { data, loading } = useDashboardSection<AnalyzedUploadsCount>(
    'analyzed-uploads-count',
  )

  // Don't render anything until we know the count. We also bail early
  // when the user is past the threshold — no banner needed.
  if (loading || !data) return null
  const count = data.count ?? 0
  if (count >= FORENSICS_THRESHOLD) return null

  const remaining = FORENSICS_THRESHOLD - count

  return (
    <section className="mb-6 lg:mb-8">
      <div
        className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden border border-pink-500/20"
        role="status"
        aria-live="polite"
      >
        {/* Decorative glow — mirrors the Quick Action card treatment. */}
        <div
          className="absolute -right-8 -top-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-pink-500/15 rounded-2xl flex items-center justify-center shrink-0 border border-pink-500/25">
            <i className="fas fa-magnifying-glass-chart text-pink-300 text-lg" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-pink-300 mb-1">
              Forensics warm-up
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug mb-1">
              Forensics get sharper with more analyzed content.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-snug">
              Analyze {remaining === 1 ? '1 more' : `${remaining} more`} of your videos to
              unlock per-video diagnostics — post-mortems, tactic gaps, and improvement
              velocity all need at least 3 baseline analyses to spot what diverged.
            </p>
          </div>
          <Link
            to="/dashboard/analyze"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-100 hover:text-white text-xs font-black uppercase tracking-widest transition-colors min-h-[44px]"
          >
            <i className="fas fa-bolt text-[11px]" aria-hidden="true" />
            Analyze a video
          </Link>
        </div>
      </div>
    </section>
  )
}
