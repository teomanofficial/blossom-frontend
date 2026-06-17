/** Business Studio — shared frontend types (mirror of the backend brief). */

export type BusinessSourceType = 'website' | 'app_store' | 'play_store'

export type BusinessStatus = 'pending' | 'scraping' | 'analyzing' | 'ready' | 'error'

export interface BusinessAudience {
  label: string
  identity: string
  behavior: string
}

export interface BusinessBuyer {
  label: string
  who: string
  why_they_pay: string
  willingness_to_pay: string
}

export interface BusinessAnalysis {
  name: string
  one_liner: string
  category: string
  what_they_do: string
  product_summary: string
  value_proposition: string
  target_audiences: BusinessAudience[]
  buyer_personas: BusinessBuyer[]
  content_angles: string[]
  suggested_industries: string[]
  suggested_formats: string[]
  niche_summary: string
}

export interface BusinessProfile {
  id: string
  source_url: string
  source_type: BusinessSourceType
  name: string | null
  status: BusinessStatus
  is_active: boolean
  error_message: string | null
  analysis_json: BusinessAnalysis | null
  created_at: string
  updated_at: string
}

export interface InspirationItem {
  video_id: number
  multiple: number | null
  views: number | null
  influencer_username: string | null
  platform: string | null
  /** Stored thumbnail path — resolve with getStorageUrl. */
  thumbnail_path: string | null
  caption: string | null
  content_url: string | null
  format_class: string | null
  hook_class: string | null
  niche: string | null
  duration_sec: number | null
  posted_at: string | null
}

export type InspirationSort = 'top' | 'views' | 'recent' | 'shuffle'

export interface InspirationFilters {
  formats: { name: string; count: number }[]
  platforms: string[]
}

// ---- Content Playbook (guidance brief) ----

export interface PlaybookBeat {
  label: string
  time: string
  goal: string
  what_to_say: string[]
  how_to_say_it: string
  on_screen_text: string | null
  visual_direction: string | null
  dopamine_trigger: string | null
  retention_cue: string | null
}

export interface ContentPlaybook {
  one_line_concept: string
  video_type: string
  format: string
  format_rationale: string
  why_this_works_for_you: string
  hook: {
    spoken: string
    on_screen_text: string
    visual: string
    why_it_works: string
    scroll_stop_drivers: string[]
  }
  beats: PlaybookBeat[]
  pacing: { style: string; shot_length: string; cut_frequency: string; energy_curve: string }
  dopamine_triggers: { trigger: string; where: string; how: string }[]
  payoff: { what: string; when: string; loop_back: string }
  cta: { type: 'follow' | 'lead'; line: string }
  shot_list: string[]
  on_screen_text_plan: string[]
  common_mistakes: string[]
  recording_tips: string[]
  estimated_duration_seconds: number
  full_script: string
}

export type PlaybookStatus =
  | 'topic'
  | 'scripting'
  | 'script_ready'
  | 'error'
  | string

export interface PlaybookRecord {
  id: string
  status: PlaybookStatus
  topic: string | null
  guidance_json: ContentPlaybook | null
  script_text: string | null
  word_count: number | null
  business_profile_id: string | null
  business_name: string | null
  error_message: string | null
}

export interface PlaybookChatMessage {
  role: 'user' | 'model'
  content: string
  created_at?: string
}
