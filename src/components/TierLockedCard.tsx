import { type ReactNode } from 'react'
import { useUpgrade } from '../context/UpgradeContext'

interface TierLockedCardProps {
  children: ReactNode
  /**
   * Identifier passed to openUpgrade for analytics, e.g.
   * 'dashboard:pulse' / 'virality-check'.
   */
  source: string
  /** Defaults to "PRO". Pass a different label for tier-specific gates. */
  badge?: string
  /** Optional className for the outer wrapper. */
  className?: string
}

/**
 * Visually disables a card/section for Free-tier users: dims content,
 * stamps a "PRO" badge in the corner, and intercepts clicks to open the
 * full-screen upgrade overlay. The wrapped children render normally so
 * the layout and structure stay intact — only interaction is gated.
 *
 * Render only when `isFreeTier` is true; the caller decides whether to
 * wrap at all.
 */
export default function TierLockedCard({
  children,
  source,
  badge = 'PRO',
  className,
}: TierLockedCardProps) {
  const { openUpgrade } = useUpgrade()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openUpgrade(source)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openUpgrade(source)
        }
      }}
      aria-label="Upgrade required — click to view plans"
      className={`relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-3xl ${className || ''}`}
    >
      <div className="pointer-events-none opacity-50 select-none">{children}</div>
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-pink-500/30">
        {badge}
      </div>
      <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors rounded-3xl pointer-events-none" />
    </div>
  )
}
