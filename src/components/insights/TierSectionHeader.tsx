/**
 * TierSectionHeader — shared section header used across the insights
 * surface area: in-page section dividers (kept for legacy callers) and
 * the new drill-down page headers (Pulse, Action, Forensics, etc.).
 *
 * Renders the eyebrow tier label, the title, the one-line question
 * subtitle, and a colored icon chip. The optional `variant="page"` mode
 * scales the typography up to read as a page header (matching the
 * gradient-text treatment used on the Outliers and PostMortem pages).
 */

import { Link } from 'react-router-dom'

interface TierSectionHeaderProps {
  /** Eyebrow label, e.g. "Tier 0" or "Insights / Pulse" */
  tier: string
  /** Section heading, e.g. "What's happening right now" */
  title: string
  /** One-line question the section answers */
  question: string
  /** FontAwesome icon class, e.g. "fa-bolt" */
  icon: string
  /** Tailwind background tint utility for the icon chip */
  iconBg: string
  /** Tailwind text-color utility for the icon (also used as the eyebrow accent) */
  iconColor: string
  /**
   * `section` (default) — in-page divider sized for use above a widget grid.
   * `page` — full page header with gradient title + optional back link.
   */
  variant?: 'section' | 'page'
  /** When set, renders a "Back" link above the title. Only honored in `page` variant. */
  backHref?: string
  /** Optional label override for the back link. */
  backLabel?: string
}

export default function TierSectionHeader({
  tier,
  title,
  question,
  icon,
  iconBg,
  iconColor,
  variant = 'section',
  backHref,
  backLabel = 'Back to dashboard',
}: TierSectionHeaderProps) {
  if (variant === 'page') {
    return (
      <header className="mb-6 lg:mb-8">
        {backHref ? (
          <div className="mb-4">
            <Link
              to={backHref}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left text-[10px]" aria-hidden="true" />
              {backLabel}
            </Link>
          </div>
        ) : null}
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={
              'w-12 h-12 sm:w-14 sm:h-14 ' +
              iconBg +
              ' rounded-2xl flex items-center justify-center shrink-0 ' +
              iconColor
            }
          >
            <i className={'fas ' + icon + ' text-base sm:text-lg'} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div
              className={
                'text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 ' +
                iconColor
              }
            >
              {tier}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              <span className="gradient-text font-display">{title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-2 leading-snug max-w-2xl">
              {question}
            </p>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="mb-4 sm:mb-5 flex items-start gap-3 sm:gap-4">
      <div
        className={
          'w-10 h-10 sm:w-11 sm:h-11 ' +
          iconBg +
          ' rounded-2xl flex items-center justify-center shrink-0 ' +
          iconColor
        }
      >
        <i className={'fas ' + icon + ' text-sm sm:text-base'} />
      </div>
      <div className="min-w-0">
        <div
          className={
            'text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 ' +
            iconColor
          }
        >
          {tier}
        </div>
        <h2 className="text-base sm:text-lg lg:text-xl font-bold leading-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 leading-snug">
          {question}
        </p>
      </div>
    </header>
  )
}
