import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { hasTier, TIER_DISPLAY_NAMES } from './tierUtils'

interface UpsellTooltipProps {
  requiredTier: 'pro' | 'premium' | 'platin'
  children: ReactNode
  /** Where to anchor the tooltip relative to the trigger. Defaults to `top`. */
  placement?: 'top' | 'bottom'
  className?: string
}

/**
 * Pure-CSS hover tooltip that shows "Upgrade to {Tier} to unlock" only
 * when the user lacks the required tier. When the user has access, the
 * wrapper renders as a transparent pass-through so existing layout is
 * untouched. No tooltip library — keeps the bundle thin and avoids
 * import collisions with whatever ad-hoc tooltips the rest of the app
 * uses.
 */
export default function UpsellTooltip({
  requiredTier,
  children,
  placement = 'top',
  className = '',
}: UpsellTooltipProps) {
  const { planSlug, userType } = useAuth()
  const effectiveSlug =
    userType === 'admin' || userType === 'vip' ? 'platin' : planSlug ?? 'free'
  const unlocked = hasTier(effectiveSlug, requiredTier)

  if (unlocked) {
    return <span className={className}>{children}</span>
  }

  const positionClasses =
    placement === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2'

  return (
    <span className={`relative inline-flex group/upsell ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${positionClasses} z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-[rgba(10,10,15,0.95)] border border-white/10 text-[10px] font-black uppercase tracking-widest text-pink-300 shadow-xl opacity-0 group-hover/upsell:opacity-100 group-focus-within/upsell:opacity-100 transition-opacity`}
      >
        <i className="fas fa-lock text-[8px] mr-1" />
        Upgrade to {TIER_DISPLAY_NAMES[requiredTier]} to unlock
      </span>
    </span>
  )
}
