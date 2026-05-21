/**
 * Insights shared primitives — the "design system" of the insights
 * dashboard. Every widget in Tier 0-4 and every flagship feature
 * composes these.
 *
 * Import shape (preferred):
 *   import {
 *     WidgetCard,
 *     NicheFitBadge,
 *     EvidenceTrail,
 *     LifecycleDial,
 *     VelocitySparkline,
 *     TacticChip,
 *     HookHoldGauge,
 *   } from '../../insights/shared'
 */

export { default as NicheFitBadge } from './NicheFitBadge'
export { default as EvidenceTrail } from './EvidenceTrail'
export { default as WidgetCard } from './WidgetCard'
export { default as LifecycleDial } from './LifecycleDial'
export { default as VelocitySparkline } from './VelocitySparkline'
export { default as TacticChip } from './TacticChip'
export { default as HookHoldGauge } from './HookHoldGauge'
export { default as LockedWidget } from './LockedWidget'
export type { LockTier } from './LockedWidget'
