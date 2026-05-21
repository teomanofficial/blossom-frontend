/**
 * Blossom Insights Dashboard — API contracts (frontend copy).
 *
 * This file mirrors backend/src/types/insights.ts. Keep them in sync.
 * The frontend cannot import from the backend tree (separate Vite root),
 * so the contracts are duplicated here verbatim.
 *
 * See docs/insights-dashboard-implementation.md §5 for the full plan.
 */

// ============ SHARED ============

export type LifecycleStage = 'emerging' | 'rising' | 'peaking' | 'stable' | 'declining';
export type Platform = 'instagram' | 'tiktok';

export interface NicheFitScore {
  score: number;             // 0–100
  niche: string;
  niche_avg_engagement: number;
  general_avg_engagement: number;
  sample_size: number;
  verdict: 'strong_fit' | 'fit' | 'weak_fit' | 'poor_fit';
  explanation: string;
}

export interface EvidenceItem {
  type: 'transcript' | 'audio_spike' | 'visual_cut' | 'benchmark' | 'tactic_detection';
  timestamp_sec?: number;
  text: string;
  source_video_id?: string;
  confidence: number;        // 0–1
}

export interface EvidenceTrail {
  claim_id: string;
  evidence: EvidenceItem[];
}

// ============ TIER 0: HERO ============

export interface BreakoutItem {
  id: string;
  type: 'hook' | 'format' | 'sound' | 'topic';
  name: string;
  video_count_24h: number;
  video_count_7d_avg: number;
  z_score: number;
  avg_views: number;
  lifecycle: LifecycleStage;
  niche_fit: NicheFitScore;
  example_video_ids: string[];
}

export interface Tier0BreakoutsResponse {
  hooks: BreakoutItem[];
  formats: BreakoutItem[];
  sounds: BreakoutItem[];
  topics: BreakoutItem[];
  generated_at: string;
}

export interface AlgoSignal {
  signal: string;            // e.g. "Saves weighted higher"
  change_pct: number;        // % change vs previous week
  confidence: number;        // 0–1
  evidence_query: string;    // identifier to fetch evidence trail
}

export interface AlgorithmWeatherResponse {
  platform: Platform;
  week_start: string;
  signals: AlgoSignal[];
  summary: string;           // 1-sentence plain English
}

export interface LifecycleDistribution {
  emerging: number;
  rising: number;
  peaking: number;
  stable: number;
  declining: number;
  total: number;
}

export interface JumpOnTodayItem {
  type: 'hook' | 'format' | 'sound';
  id: string;
  name: string;
  niche_fit: NicheFitScore;
  lifecycle: LifecycleStage;
  recommended_action: string;
  saturation_pct: number;    // how saturated already
  days_remaining_estimate: number;
}

// ============ TIER 1: ACTION ============

export interface OutlierVideo {
  video_id: string;
  influencer: {
    id: string;
    username: string;
    follower_count: number;
    tier?: string | null;
    avatar_url?: string | null;
  };
  views: number;
  creator_median_views: number;
  multiple: number;          // views / creator_median (>= 3)
  hook_class: string;
  format_class: string;
  thumbnail_url: string;
  posted_at: string;
  /** Source platform — used by N3's "View on platform" deep link. */
  platform?: Platform | null;
  /** Permalink back to the original post; null when the row has no canonical URL. */
  content_url?: string | null;
  tactic_teardown: TacticTeardownItem[];
  niche_fit: NicheFitScore;
}

export interface TacticTeardownItem {
  tactic_name: string;
  category: string;          // 15 tactic categories
  execution_score: number;
  timestamp_sec: number | null;
  why_it_worked: string;
}

export interface GreenlightRequest {
  niche?: string;
  hook_text?: string;
  concept_description: string;
  planned_format?: string;
  planned_duration_sec?: number;
  draft_video_url?: string;  // optional, for deeper analysis
}

export interface GreenlightResponse {
  verdict: 'green' | 'yellow' | 'red';
  overall_score: number;     // 0–100
  predicted_hook_strength: number;
  niche_fit: NicheFitScore;
  format_fit: { score: number; reasoning: string };
  retention_prediction: {
    curve: Array<{ sec: number; pct: number }>;
    danger_zones: Array<{ sec: number; reason: string }>;
  };
  missing_gold_standard_tactics: Array<{ tactic: string; lift: number; reason: string }>;
  swap_recommendations: Array<{ swap_from: string; swap_to: string; expected_lift: number }>;
  comparable_winners: Array<{ video_id: string; thumbnail_url: string; why_comparable: string }>;
}

export interface WhitespaceKeyword {
  keyword_id: string;
  name: string;
  category: string;
  video_count: number;
  avg_engagement_rate: number;
  niche_engagement_avg: number;
  whitespace_score: number;  // high engagement / low video count
}

// ============ TIER 2: FORENSICS ============

export interface PostMortemRequest {
  video_id: string;
}

export interface PostMortemResponse {
  video: {
    id: string;
    title: string;
    views: number;
    likes: number;
    engagement_rate: number;
    hook_class: string;
    format_class: string;
    thumbnail_url: string;
  };
  diverged_variable: {
    name: string;             // e.g. "scroll_stop_power"
    your_value: number | string;
    your_median: number | string;
    your_top5_median: number | string;
    delta: string;
    confidence: number;
  };
  compared_to_hits: Array<{
    video_id: string;
    metric: string;
    your_value: any;
    hit_value: any;
  }>;
  niche_benchmark: {
    your_percentile: number;
    niche_p50: number;
    niche_p90: number;
  };
  missing_tactics: TacticTeardownItem[];
  retention_curve: {
    yours: Array<{ sec: number; pct: number }>;
    predicted_optimal: Array<{ sec: number; pct: number }>;
  };
  prescriptions: Array<{
    rank: number;
    action: string;
    effort: string;
    expected_lift: string;
    evidence_claim_id: string;
  }>;
}

export interface TacticGap {
  tactic_id: string;
  tactic_name: string;
  category: string;
  niche_adoption_pct: number;   // % of top-decile videos using it
  your_usage_count: number;
  lift: number;                 // performance_lift
  example_video_ids: string[];
}

// ============ TIER 3: ANATOMY ============

export interface CognitiveInterruptionMatrix {
  triggers: string[];           // 7 primal trigger types
  niches: string[];
  values: number[][];           // matrix [niche][trigger] = avg_views_lift
}

export interface RetentionDangerZone {
  timestamp_sec: number;
  drop_pct: number;
  videos_affected: number;
  common_cause: string;
}

export interface TacticCoOccurrence {
  tactic_a: string;
  tactic_b: string;
  co_occurrence_count: number;
  lift_when_combined: number;
}

export interface SoundLifecycleItem {
  music_id: string;
  title: string;
  artist: string;
  platform: Platform;
  is_original: boolean;
  weekly_adoption: Array<{ week: string; video_count: number }>;
  lifecycle: LifecycleStage;
  jump_in_window_remaining_days: number;
  niche_fit: NicheFitScore;
  play_url?: string;
}

// ============ TIER 4: CREATORS ============

export interface NicheCreatorRank {
  influencer_id: string;
  username: string;
  display_name: string;
  follower_count: number;
  avg_engagement_rate: number;
  viral_hit_rate: number;
  consistency_score: number;
  disc_primary?: string;
  audience_archetype?: string;
  avatar_url?: string;
}

// ============ FLAGSHIPS ============
// (Post-mortem & greenlight defined above. Outlier reuses OutlierVideo.)

// ============ EVIDENCE TRAIL ============

export interface EvidenceTrailRequest {
  claim_id: string;
}
// returns EvidenceTrail above
