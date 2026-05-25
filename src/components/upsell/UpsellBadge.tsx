import { TIER_COLORS, TIER_DISPLAY_NAMES } from './tierUtils'

interface UpsellBadgeProps {
  tier: 'pro' | 'premium' | 'platin'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Small inline tier pill. Used inline next to feature labels, nav
 * items, and gated buttons to telegraph the upgrade required.
 *
 * Visual rules:
 *   - Creator (pro)    → blue
 *   - Pro (premium)    → purple
 *   - Agency (platin)  → amber
 *
 * Sizes:
 *   - sm  → tightly padded micro-pill (nav rows, table cells)
 *   - md  → default size (next to controls, headers)
 */
export default function UpsellBadge({
  tier,
  size = 'md',
  className = '',
}: UpsellBadgeProps) {
  const colors = TIER_COLORS[tier]
  if (!colors) return null

  const sizing =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[9px] tracking-widest gap-1'
      : 'px-2 py-0.5 text-[10px] tracking-widest gap-1'

  return (
    <span
      className={`inline-flex items-center font-black uppercase rounded ${colors.bg} ${colors.text} border ${colors.border} ${sizing} ${className}`}
    >
      <i className="fas fa-lock text-[8px] opacity-80" />
      {TIER_DISPLAY_NAMES[tier]}
    </span>
  )
}
