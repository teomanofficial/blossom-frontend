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
  thumbnail_url: string | null
  caption: string | null
  content_url: string | null
}
