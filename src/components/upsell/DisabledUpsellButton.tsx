import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUpgrade } from '../../context/UpgradeContext'
import { hasTier, TIER_DISPLAY_NAMES } from './tierUtils'
import UpsellBadge from './UpsellBadge'

interface DisabledUpsellButtonProps {
  requiredTier: 'pro' | 'premium' | 'platin'
  onClick?: () => void
  children: ReactNode
  className?: string
  /** Optional analytics source forwarded to <UpgradeOverlay>. */
  upgradeSource?: string
  /** Native button type — defaults to `button` to avoid accidental form submits. */
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

/**
 * Replacement for a normal action button when the surface needs to gate
 * behind a paid tier. If the user already has the required tier (or
 * higher), it renders as a plain button with the caller's onClick. If
 * not, it renders a visually-disabled button that prepends a tier badge
 * and, on click, opens the upgrade overlay instead.
 *
 * Stays a single component (rather than two siblings) so the consuming
 * page never needs to branch on `planSlug` itself.
 */
export default function DisabledUpsellButton({
  requiredTier,
  onClick,
  children,
  className = '',
  upgradeSource,
  type = 'button',
  disabled = false,
}: DisabledUpsellButtonProps) {
  const { planSlug, userType } = useAuth()
  const { openUpgrade } = useUpgrade()

  // Admins and VIPs are treated as platin/unbounded for gating purposes.
  const effectiveSlug =
    userType === 'admin' || userType === 'vip' ? 'platin' : planSlug ?? 'free'
  const unlocked = hasTier(effectiveSlug, requiredTier)

  if (unlocked) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openUpgrade(upgradeSource ?? `disabled-upsell:${requiredTier}`)}
      aria-label={`Upgrade to ${TIER_DISPLAY_NAMES[requiredTier]} to unlock`}
      title={`Upgrade to ${TIER_DISPLAY_NAMES[requiredTier]} to unlock`}
      className={`relative inline-flex items-center gap-2 opacity-60 cursor-not-allowed hover:opacity-80 transition-opacity ${className}`}
    >
      <UpsellBadge tier={requiredTier} size="sm" />
      <span className="line-through decoration-white/30">{children}</span>
    </button>
  )
}
