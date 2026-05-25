/**
 * Barrel for the upsell primitives. Keeps consumer import lines tidy:
 *   import { UpsellBadge, FeatureLockedOverlay } from '../components/upsell'
 */
export { default as UpsellBadge } from './UpsellBadge'
export { default as DisabledUpsellButton } from './DisabledUpsellButton'
export { default as FeatureLockedOverlay } from './FeatureLockedOverlay'
export { default as UpsellTooltip } from './UpsellTooltip'
export {
  TIER_ORDER,
  TIER_DISPLAY_NAMES,
  TIER_COLORS,
  hasTier,
  tierLabel,
} from './tierUtils'
