/**
 * Greenlight components — barrel re-export so the page imports
 * the result panels through a single path:
 *
 *   import {
 *     ConceptInputForm,
 *     OutlierPrefillPill,
 *     VerdictBanner,
 *     ScoreBreakdown,
 *     MissingTacticsPanel,
 *     SwapRecommendations,
 *     ComparableWinners,
 *     PredictedRetentionPreview,
 *   } from '../components/greenlight'
 */

export { default as ConceptInputForm, EMPTY_CONCEPT_VALUE, toGreenlightRequest } from './ConceptInputForm'
export type { ConceptFormValue } from './ConceptInputForm'
export { default as OutlierPrefillPill } from './OutlierPrefillPill'
export { default as VerdictBanner } from './VerdictBanner'
export { default as ScoreBreakdown } from './ScoreBreakdown'
export { default as MissingTacticsPanel } from './MissingTacticsPanel'
export { default as SwapRecommendations } from './SwapRecommendations'
export { default as ComparableWinners } from './ComparableWinners'
export { default as PredictedRetentionPreview } from './PredictedRetentionPreview'
