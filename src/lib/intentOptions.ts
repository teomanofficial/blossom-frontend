// User intent options — mirrors the backend enums in blossom-backend/src/lib/intent.ts.
// account_type = WHO the user is (drives CTA framing + content sourcing).
// primary_goal = WHAT they want (drives AI scoring weights + optimisation target).

export interface IntentOption {
  value: string
  label: string
  description: string
  icon: string // FontAwesome class
}

export const ACCOUNT_TYPE_OPTIONS: IntentOption[] = [
  { value: 'creator', label: 'Creator', description: 'Building my own audience & personal brand', icon: 'fa-user' },
  { value: 'app_founder', label: 'App Founder', description: 'Promoting my own app — drive installs', icon: 'fa-mobile-screen-button' },
  { value: 'business', label: 'Business / Brand', description: 'Growing a business on social', icon: 'fa-store' },
  { value: 'ugc_creator', label: 'UGC Creator', description: 'Making ads for other brands & apps', icon: 'fa-clapperboard' },
  { value: 'agency', label: 'Agency', description: 'Managing content for clients', icon: 'fa-users' },
]

export const PRIMARY_GOAL_OPTIONS: IntentOption[] = [
  { value: 'virality', label: 'Go viral', description: 'Maximize reach & shares', icon: 'fa-fire' },
  { value: 'followers', label: 'Grow followers', description: 'Convert viewers into followers', icon: 'fa-user-plus' },
  { value: 'engagement', label: 'Boost engagement', description: 'More comments, saves & DMs', icon: 'fa-comments' },
  { value: 'monetization', label: 'Monetize / partnerships', description: 'Build brand-deal readiness', icon: 'fa-sack-dollar' },
  { value: 'app_installs', label: 'App installs', description: 'Drive downloads of an app', icon: 'fa-down-to-bracket' },
  { value: 'lead_gen', label: 'Generate leads', description: 'Capture leads & signups', icon: 'fa-filter' },
]

export const DEFAULT_ACCOUNT_TYPE = 'creator'
export const DEFAULT_PRIMARY_GOAL = 'virality'

export function accountTypeLabel(value: string | null | undefined): string {
  return ACCOUNT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? 'Creator'
}
export function primaryGoalLabel(value: string | null | undefined): string {
  return PRIMARY_GOAL_OPTIONS.find((o) => o.value === value)?.label ?? 'Go viral'
}
