import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useUpgrade } from '../context/UpgradeContext'

interface BlurredLockedTileProps {
  /** When true, render as a click-to-upgrade locked tile with blur. When false, render a normal Link. */
  locked: boolean
  /** Destination route when unlocked. Ignored when locked. */
  to: string
  /** Analytics source passed to openUpgrade — e.g. 'formats-list', 'hooks-list'. */
  source: string
  /** Tile content. Rendered identically locked or unlocked so the layout stays stable. */
  children: ReactNode
  /** Class names forwarded to the outer wrapper (e.g. the per-tile `gradient-border group …`). */
  className?: string
}

/**
 * Wraps a list tile: renders a Link normally, or a blurred, click-to-upgrade
 * shell for free-tier users on items past the unlock limit. Visual style
 * mirrors TierLockedCard but is sized for a small grid tile rather than a
 * full dashboard card.
 */
export default function BlurredLockedTile({
  locked,
  to,
  source,
  children,
  className,
}: BlurredLockedTileProps) {
  const { openUpgrade } = useUpgrade()

  if (!locked) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

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
      className={`relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-[1.5rem] ${className || ''}`}
    >
      <div className="pointer-events-none blur-sm opacity-60 select-none">
        {children}
      </div>
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-pink-500/30">
        PRO
      </div>
      <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors rounded-[1.5rem] pointer-events-none" />
    </div>
  )
}
