/**
 * OverviewTeaserStrip — reusable section used 4× on the Overview dashboard
 * to tease the four drill-down pages (Action / Forensics / Anatomy /
 * Creators). Renders a section header (icon + tier label + title +
 * subtitle), a body slot for the caller to mount 3-5 real items, and a
 * "See all →" CTA pointing at the drill-down page.
 *
 * The body slot is rendered by the caller — this component intentionally
 * doesn't fetch. Pages compose teasers by passing the small rendered item
 * list as `children`. That keeps each teaser's data shape local to the
 * Overview page while sharing the chrome.
 *
 * When the underlying widget(s) inside `children` are tier-locked, they
 * each render their own `<LockedWidget>` via `<WidgetCard locked={...}>`
 * — this strip does not need to know about lock state.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface OverviewTeaserStripProps {
  /** Short eyebrow label, e.g. "Action" / "Forensics" / "Anatomy". */
  eyebrow: string
  /** One-line title that reads as the answer to a user question. */
  title: string
  /** Optional subtitle clarifying what's inside. */
  subtitle?: string
  /** FontAwesome icon class (no `fa` prefix), e.g. "fa-rocket". */
  icon: string
  /** Tailwind tint utility for the icon chip. */
  iconBg: string
  /** Tailwind text-color utility for the icon. */
  iconColor: string
  /** Drill-down target — the "See all" CTA destination. */
  viewAllHref: string
  /** Action label override (default "See all"). */
  viewAllLabel?: string
  /** The 3-5 rendered items (or a single hero widget) shown inside the strip. */
  children: ReactNode
}

export default function OverviewTeaserStrip({
  eyebrow,
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  viewAllHref,
  viewAllLabel = 'See all',
  children,
}: OverviewTeaserStripProps) {
  return (
    <section className="mb-8 lg:mb-12">
      <header className="mb-4 sm:mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div
            className={
              'w-10 h-10 sm:w-11 sm:h-11 ' +
              iconBg +
              ' rounded-2xl flex items-center justify-center shrink-0 ' +
              iconColor
            }
          >
            <i className={'fas ' + icon + ' text-sm sm:text-base'} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div
              className={
                'text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 ' +
                iconColor
              }
            >
              {eyebrow}
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold leading-tight">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 leading-snug">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-[11px] font-black uppercase tracking-widest text-slate-200 hover:text-white transition-colors shrink-0"
        >
          {viewAllLabel}
          <i className="fas fa-arrow-right text-[10px]" aria-hidden="true" />
        </Link>
      </header>

      <div>{children}</div>
    </section>
  )
}
