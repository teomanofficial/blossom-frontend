/**
 * Shared types for the Script Studio feature (Topic → Research → Hook → Script).
 *
 * `status` is the backend source of truth and drives the wizard stepper.
 * Backend endpoints live under /api/analysis/scripts.
 */

/** Lifecycle status returned by the backend for every script. */
export type ScriptStatus =
  | 'topic'
  | 'researching'
  | 'research_ready'
  | 'hooks_ready'
  | 'scripting'
  | 'script_ready'
  | 'error'

/** A "myth vs reality" pairing rendered as a two-column card. */
export interface ContrastMoment {
  common_belief: string
  contrarian_reality: string
}

/** Structured research brief produced during the research step. */
export interface ResearchJson {
  executive_summary?: string | null
  engagement_angles?: string[] | null
  surprising_facts?: string[] | null
  contrast_moments?: ContrastMoment[] | null
}

/**
 * A single outlier-modeled hook candidate.
 * Field names mirror the `script_hooks` table columns returned by the backend.
 */
export interface ScriptHook {
  id: string
  spoken_hook: string
  /** Authority / Contrarian / List / Trap Mistake / etc. */
  archetype?: string | null
  /** The underlying hook formula. */
  formula?: string | null
  /** Handle of the creator the hook was modeled on. */
  source_influencer?: string | null
  /** Outlier multiple of the source video (e.g. 114 → "114x"). */
  source_outlier_multiple?: number | null
  /** View count of the source video. */
  source_views?: number | null
  /** Why this hook works — revealed on hover. */
  rationale?: string | null
}

/**
 * Presentation fields for the Topic-step source-video card. Comes from the
 * backend `source_context.source_video` blob (GET /:id). Pure display.
 */
export interface SourceVideoContext {
  thumbnail_url?: string | null
  title?: string | null
  handle?: string | null
  views?: number | null
  multiple?: number | null
  platform?: string | null
  content_url?: string | null
}

/** Grounding context seeded from an analyzed video (from-video mode). */
export interface SourceContext {
  video_id?: number | null
  topic?: string | null
  source_video?: SourceVideoContext | null
}

/** A single entry in a script's body version history. */
export interface ScriptVersion {
  id: string
  word_count?: number | null
  /** How this version was produced: 'manual' | 'refine' | 'generate'. */
  source?: string | null
  created_at?: string
}

/** Full script record returned by GET /api/analysis/scripts/:id. */
export interface ScriptRecord {
  id: string
  /** Auto-derived display title (backend `scripts.title` column). */
  title?: string | null
  topic?: string | null
  status: ScriptStatus
  category_id?: number | null
  research_json?: ResearchJson | null
  hooks?: ScriptHook[] | null
  selected_hook_id?: string | null
  script_text?: string | null
  word_count?: number | null
  error_message?: string | null
  source_video_id?: number | string | null
  /** Optional user customization (from-video mode). */
  additional_context?: string | null
  /** Grounding context when seeded from an analyzed video. */
  source_context?: SourceContext | null
  created_at?: string
  updated_at?: string
}

/** Lightweight payload returned by GET /api/analysis/scripts/:id/status. */
export interface ScriptStatusResponse {
  status: ScriptStatus
  error_message?: string | null
}

/**
 * Persona settings that personalize research, hooks, and scripts.
 * Field names mirror the `script_personas` table / persona endpoint payload.
 */
export interface ScriptPersona {
  content_description: string
  brand_context: string
  writing_style_sample: string
}

/** Lightweight source-video display info shown before GET /:id resolves. */
export interface SourceVideoChip {
  handle?: string | null
  thumbnailUrl?: string | null
  outlierMultiple?: number | null
  views?: number | null
  title?: string | null
  platform?: string | null
}

/** Navigation state accepted when entering Script Studio from another page. */
export interface ScriptStudioEntryState {
  topic?: string
  /** A library outlier video (content_videos.id) to ground on. */
  sourceVideoId?: string
  /** A user's analyzed upload (content_uploads.id) — the primary entry point. */
  sourceUploadId?: string
  /** Optional metadata for the source-video card before GET /:id returns. */
  sourceVideo?: SourceVideoChip
}
