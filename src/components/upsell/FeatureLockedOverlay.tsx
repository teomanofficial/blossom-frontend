import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUpgrade } from '../../context/UpgradeContext'
import { hasTier, TIER_DISPLAY_NAMES, TIER_COLORS } from './tierUtils'
import UpsellBadge from './UpsellBadge'

interface FeatureLockedOverlayProps {
  requiredTier: 'pro' | 'premium' | 'platin'
  featureName: string
  description?: string
  children: ReactNode
  /**
   * `blur`  → child renders behind a blurred, non-interactive layer.
   * `hide`  → child is not rendered at all (lighter weight).
   * default → `blur`.
   */
  preview?: 'blur' | 'hide'
  /** Optional analytics source forwarded to the upgrade overlay. */
  upgradeSource?: string
  className?: string
}

/**
 * Wraps arbitrary content with a tier check. If the user has the
 * required tier (or admin/vip), the children render as-is — zero
 * runtime cost. If not, the children render blurred (or hidden) with
 * a centered upsell card on top.
 *
 * The card is intentionally compact so it fits inside small widget
 * tiles as well as full-page sections.
 */
export default function FeatureLockedOverlay({
  requiredTier,
  featureName,
  description,
  children,
  preview = 'blur',
  upgradeSource,
  className = '',
}: FeatureLockedOverlayProps) {
  const { planSlug, userType } = useAuth()
  const { openUpgrade } = useUpgrade()

  const effectiveSlug =
    userType === 'admin' || userType === 'vip' ? 'platin' : planSlug ?? 'free'
  const unlocked = hasTier(effectiveSlug, requiredTier)
  const colors = TIER_COLORS[requiredTier]

  if (unlocked) {
    return <>{children}</>
  }

  const handleUpgrade = () =>
    openUpgrade(upgradeSource ?? `feature-locked:${requiredTier}:${featureName}`)

  return (
    <div className={`relative ${className}`}>
      {preview === 'blur' ? (
        <div
          aria-hidden="true"
          className="filter blur-sm pointer-events-none select-none opacity-60"
        >
          {children}
        </div>
      ) : null}

      <div
        className={`${
          preview === 'blur' ? 'absolute inset-0' : ''
        } flex items-center justify-center p-6 z-10`}
      >
        <div
          className={`relative max-w-sm w-full rounded-2xl border ${colors?.border ?? 'border-white/10'} bg-[rgba(10,10,15,0.92)] backdrop-blur-xl p-6 text-center shadow-2xl`}
        >
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-2xl ${colors?.bg ?? 'bg-white/5'} flex items-center justify-center`}
          >
            <i className={`fas fa-lock text-lg ${colors?.text ?? 'text-pink-400'}`} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <UpsellBadge tier={requiredTier} />
          </div>

          <h3 className="text-base font-black tracking-tight text-white mb-1">
            {featureName}
          </h3>
          {description ? (
            <p className="text-xs text-slate-400 font-medium mb-5 leading-relaxed">
              {description}
            </p>
          ) : (
            <div className="mb-5" />
          )}

          <button
            type="button"
            onClick={handleUpgrade}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-pink-500/25"
          >
            <i className="fas fa-bolt text-[10px]" />
            Upgrade to {TIER_DISPLAY_NAMES[requiredTier]}
          </button>
        </div>
      </div>
    </div>
  )
}
