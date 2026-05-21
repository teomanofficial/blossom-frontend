/**
 * Shared local types for the /tier2/best-vs-worst endpoint.
 *
 * Lives next to the widgets (rather than in `types/insights.ts`) because
 * the backend's `BestVsWorstSummary` is not part of the canonical
 * implementation-plan §5 contract — it was added by BE3 as part of
 * Stage 2. When N1 promotes this to the central insights types file we
 * can delete these.
 *
 * Response envelope: BE3's route returns either
 *   - `{ data: null, reason: 'insufficient_data' }` when the user has < 2
 *     videos in either bucket, or
 *   - the full BestVsWorstSummary object otherwise.
 *
 * We model the union as a discriminated type via the `data` field.
 */

export interface BestVsWorstBucket {
  sample_size: number
  avg_views: number
  avg_engagement_rate: number
  median_scroll_stop_power: number | null
  median_hook_seconds: number | null
  primal_trigger_mix: Record<string, number>
  primary_emotion_mix: Record<string, number>
}

export interface BestVsWorstDeltas {
  avg_views_lift_x: number
  scroll_stop_power_delta: number | null
  hook_seconds_delta: number | null
  top_primal_trigger_best: string | null
  top_primal_trigger_worst: string | null
  top_primary_emotion_best: string | null
  top_primary_emotion_worst: string | null
}

export interface BestVsWorstSummary {
  best: BestVsWorstBucket
  worst: BestVsWorstBucket
  deltas: BestVsWorstDeltas
  /** Present so the discriminated union resolves; backend doesn't emit it. */
  data?: undefined
}

export interface BestVsWorstSparse {
  data: null
  reason: 'insufficient_data'
}

export type BestVsWorstResponse = BestVsWorstSummary | BestVsWorstSparse

/** Narrowing helper — true when the response carries a real summary. */
export function isBestVsWorstSummary(
  resp: BestVsWorstResponse | null | undefined,
): resp is BestVsWorstSummary {
  return !!resp && (resp as BestVsWorstSparse).data !== null && 'best' in resp
}
