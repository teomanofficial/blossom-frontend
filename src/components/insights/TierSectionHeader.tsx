/**
 * TierSectionHeader — shared section header for the 5 dashboard tiers.
 *
 * Renders the eyebrow tier label, the title, the one-line question
 * subtitle, and a colored icon chip. Pulled out of
 * TierSectionPlaceholder so the fleshed-out tier components (Tier0Hero
 * through Tier4Creators) can reuse it while owning their own grid bodies.
 */

interface TierSectionHeaderProps {
  /** Eyebrow label, e.g. "Tier 0" */
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
}

export default function TierSectionHeader({
  tier,
  title,
  question,
  icon,
  iconBg,
  iconColor,
}: TierSectionHeaderProps) {
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
