/**
 * Mock PostMortemResponse — dev-only fallback used when BE3
 * (`POST /api/insights/tier2/post-mortem`) is still returning 501.
 *
 * The shape matches `PostMortemResponse` in `src/types/insights.ts`
 * verbatim. When the backend lands, `PostMortem.tsx` will prefer the
 * real response automatically — this file becomes unused.
 *
 * Numbers and copy were chosen to feel like a real "your hook
 * didn't grab" finding for a fitness creator. Keep them grounded:
 * users will see this banner during development.
 */

import type { PostMortemResponse, NicheFitScore } from '../types/insights'

function nicheFit(score: number, niche: string, sample: number): NicheFitScore {
  let verdict: NicheFitScore['verdict'] = 'fit'
  if (score >= 80) verdict = 'strong_fit'
  else if (score >= 60) verdict = 'fit'
  else if (score >= 40) verdict = 'weak_fit'
  else verdict = 'poor_fit'
  return {
    score,
    niche,
    niche_avg_engagement: 0.062,
    general_avg_engagement: 0.041,
    sample_size: sample,
    verdict,
    explanation:
      score >= 60
        ? `This tactic over-performs in ${niche} vs. the general baseline.`
        : `This tactic under-indexes for ${niche} — fit is below baseline.`,
  }
}

/**
 * Build a mock retention curve. The "yours" track drops sharply at 2s
 * (a classic scroll-stop failure) then again at 9s; the optimal curve
 * holds 70%+ through the hook window.
 */
function mockYoursCurve(): Array<{ sec: number; pct: number }> {
  return [
    { sec: 0, pct: 100 },
    { sec: 1, pct: 78 },
    { sec: 2, pct: 52 },
    { sec: 3, pct: 41 },
    { sec: 4, pct: 36 },
    { sec: 5, pct: 33 },
    { sec: 6, pct: 30 },
    { sec: 7, pct: 28 },
    { sec: 8, pct: 26 },
    { sec: 9, pct: 18 },
    { sec: 10, pct: 14 },
    { sec: 12, pct: 11 },
    { sec: 15, pct: 9 },
    { sec: 20, pct: 7 },
    { sec: 25, pct: 5 },
    { sec: 30, pct: 4 },
  ]
}

function mockOptimalCurve(): Array<{ sec: number; pct: number }> {
  return [
    { sec: 0, pct: 100 },
    { sec: 1, pct: 92 },
    { sec: 2, pct: 84 },
    { sec: 3, pct: 78 },
    { sec: 4, pct: 72 },
    { sec: 5, pct: 68 },
    { sec: 6, pct: 64 },
    { sec: 7, pct: 60 },
    { sec: 8, pct: 56 },
    { sec: 9, pct: 53 },
    { sec: 10, pct: 50 },
    { sec: 12, pct: 45 },
    { sec: 15, pct: 39 },
    { sec: 20, pct: 32 },
    { sec: 25, pct: 27 },
    { sec: 30, pct: 24 },
  ]
}

export function buildMockPostMortem(videoId: string): PostMortemResponse {
  return {
    video: {
      id: videoId,
      title: '5 things I wish I knew before my first gym session',
      views: 2_847,
      likes: 132,
      engagement_rate: 0.046,
      hook_class: 'Listicle Setup',
      format_class: 'Talking-head Listicle',
      thumbnail_url: '',
    },
    diverged_variable: {
      name: 'scroll_stop_power',
      your_value: 38,
      your_median: 54,
      your_top5_median: 71,
      delta: '-33 vs your hits',
      confidence: 0.86,
    },
    compared_to_hits: [
      {
        video_id: 'mock_hit_1',
        metric: 'scroll_stop_power',
        your_value: 38,
        hit_value: 74,
      },
      {
        video_id: 'mock_hit_1',
        metric: 'hook_seconds',
        your_value: 5.8,
        hit_value: 2.4,
      },
      {
        video_id: 'mock_hit_1',
        metric: 'primal_trigger',
        your_value: 'curiosity',
        hit_value: 'fear_of_missing_out',
      },
      {
        video_id: 'mock_hit_2',
        metric: 'scroll_stop_power',
        your_value: 38,
        hit_value: 69,
      },
      {
        video_id: 'mock_hit_2',
        metric: 'hook_seconds',
        your_value: 5.8,
        hit_value: 1.9,
      },
      {
        video_id: 'mock_hit_2',
        metric: 'primary_emotion',
        your_value: 'informational',
        hit_value: 'shock',
      },
      {
        video_id: 'mock_hit_3',
        metric: 'scroll_stop_power',
        your_value: 38,
        hit_value: 70,
      },
      {
        video_id: 'mock_hit_3',
        metric: 'cliffhanger_strength',
        your_value: 2,
        hit_value: 8,
      },
      {
        video_id: 'mock_hit_3',
        metric: 'primal_trigger',
        your_value: 'curiosity',
        hit_value: 'identity_signal',
      },
    ],
    niche_benchmark: {
      your_percentile: 23,
      niche_p50: 54,
      niche_p90: 82,
    },
    missing_tactics: [
      {
        tactic_name: 'Pattern interrupt at 0.5s',
        category: 'hook_visual',
        execution_score: 0,
        timestamp_sec: 0,
        why_it_worked:
          'Top-decile fitness videos open with a hard visual cut or zoom inside the first half-second. Yours opens on a static medium shot.',
      },
      {
        tactic_name: 'Subtitle hook in first frame',
        category: 'text_overlay',
        execution_score: 0,
        timestamp_sec: 0,
        why_it_worked:
          'Captions reading "Don\'t do this" or "Wish I knew" appear in 78% of viral fitness listicles. You have none in the first 2 seconds.',
      },
      {
        tactic_name: 'Counter-intuitive claim',
        category: 'hook_text',
        execution_score: 0,
        timestamp_sec: null,
        why_it_worked:
          'Hits in your niche pair the listicle setup with a contrarian opener ("most people do this wrong"). You went informational.',
      },
      {
        tactic_name: 'Energetic music drop on first cut',
        category: 'audio_design',
        execution_score: 0,
        timestamp_sec: 1,
        why_it_worked:
          'Your audio is steady; comparable winners hit a percussive drop at the first cut to pull viewer attention through the 2-second valley.',
      },
      {
        tactic_name: 'Cliffhanger at item 1',
        category: 'content_structure',
        execution_score: 0,
        timestamp_sec: 8,
        why_it_worked:
          'Listicle hits tease the last item up front ("the #1 thing nobody tells you"). Your structure is linear — viewers don\'t feel a reason to stay.',
      },
    ],
    retention_curve: {
      yours: mockYoursCurve(),
      predicted_optimal: mockOptimalCurve(),
    },
    prescriptions: [
      {
        rank: 1,
        action:
          'Cut the first 4 seconds. Re-shoot a hard pattern-interrupt opener — close-up of a single barbell plate hitting the floor, or a quick zoom into your face mid-sentence.',
        effort: '~15 min',
        expected_lift: '+30-40 scroll_stop_power',
        evidence_claim_id: 'claim_mock_1',
      },
      {
        rank: 2,
        action:
          'Add a big, bold subtitle in the first frame: "5 things I wish I knew (before I wasted 6 months)". The number + regret promise is what your hits all have.',
        effort: '~5 min',
        expected_lift: '+12-18% 3s retention',
        evidence_claim_id: 'claim_mock_2',
      },
      {
        rank: 3,
        action:
          'Re-record your VO so the first sentence is contrarian: "Everyone\'s lying about leg day." Beat the curiosity-only opener with a stance.',
        effort: '~20 min',
        expected_lift: '+8-12% engagement_rate',
        evidence_claim_id: 'claim_mock_3',
      },
      {
        rank: 4,
        action:
          'Drop a percussive sound effect or beat hit on your first hard cut. Top-decile creators use a Boom or DJ snap at 1.0-1.5s; you have continuous ambient.',
        effort: '~10 min',
        expected_lift: '+5-8% completion rate',
        evidence_claim_id: 'claim_mock_4',
      },
      {
        rank: 5,
        action:
          'Re-structure as a cliffhanger listicle: tease item #5 at the top, then count down 5 → 4 → 3 → 2 → 1. Linear listicles under-perform 2.4× in your niche.',
        effort: '~30 min',
        expected_lift: '+15-25% watch time',
        evidence_claim_id: 'claim_mock_5',
      },
    ],
  }
}

/**
 * Mock niche fit for the percentile ring (used to decorate the
 * niche_benchmark widget in dev mode).
 */
export const mockNicheFit = nicheFit(38, 'fitness', 184)
