/**
 * TierSectionPlaceholder — shared "Coming soon" shell rendered by each
 * Tier 0–4 placeholder in Stage 0. Stage 3 FE1 replaces each tier's
 * placeholder with its real widget grid (Tier0Hero, Tier1Actions, …).
 *
 * Visual hierarchy matches the plan: tier label (small/uppercase),
 * section title (display font), one-line question subtitle, and a
 * single glass-card "Coming soon" tile that downstream agents will
 * swap with real widget content.
 */

import type { ReactNode } from 'react'

interface TierSectionPlaceholderProps {
  /** Eyebrow label, e.g. "Tier 0" */
  tier: string
  /** Section heading, e.g. "What's happening right now" */
  title: string
  /** One-line question the section answers, e.g. "Am I behind on what's breaking out?" */
  question: string
  /** FontAwesome icon class, e.g. "fa-bolt" */
  icon: string
  /** Tailwind background tint utility for the icon chip */
  iconBg: string
  /** Tailwind text-color utility for the icon */
  iconColor: string
  /** Optional override of the placeholder body for downstream agents */
  children?: ReactNode
}

export default function TierSectionPlaceholder({
  tier,
  title,
  question,
  icon,
  iconBg,
  iconColor,
  children,
}: TierSectionPlaceholderProps) {
  return (
    <section className="mb-8 lg:mb-12">
      <header className="mb-4 sm:mb-5 flex items-start gap-3 sm:gap-4">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 ${iconBg} rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}
        >
          <i className={`fas ${icon} text-sm sm:text-base`} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">
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

      {children ?? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Coming soon
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            Widgets for this tier are being wired up. The insights team is
            shipping it in stages — check back shortly.
          </p>
        </div>
      )}
    </section>
  )
}
