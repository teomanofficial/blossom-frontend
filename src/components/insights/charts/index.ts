/**
 * Insights chart-component barrel.
 *
 * Stage 4 widget agents import from here, e.g.:
 *   import { HeatGrid, Quadrant, TrendLineChart } from '@/components/insights/charts'
 *
 * Type re-exports keep widget code free from chart-component internals.
 */

export { default as HeatGrid } from './HeatGrid'
export { default as Quadrant } from './Quadrant'
export type { QuadrantPoint } from './Quadrant'
export { default as TrendLineChart } from './TrendLineChart'
export type { TrendSeries } from './TrendLineChart'
export { default as RetentionCurve } from './RetentionCurve'
export type { RetentionPoint, RetentionDangerZone } from './RetentionCurve'
export { default as PostingTimeHeatmap } from './PostingTimeHeatmap'
export { default as SankeyMini } from './SankeyMini'
export type { SankeyNodeInput, SankeyLinkInput } from './SankeyMini'
export { default as TacticNetwork } from './TacticNetwork'
export type { TacticNetworkNode, TacticNetworkEdge } from './TacticNetwork'
