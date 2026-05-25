/**
 * Shared tier helpers for the upsell primitives.
 *
 * Slug values are the canonical, backend-aligned plan identifiers
 * (`free`, `pro`, `premium`, `platin`). Display names below are the
 * user-facing labels we present in marketing/upsell surfaces.
 */

/** Plan slug ordering — higher number = more access. */
export const TIER_ORDER: Record<string, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  platin: 3,
}

/** Human-friendly names shown to users in badges, CTAs, and tooltips. */
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: 'Free',
  pro: 'Creator',
  premium: 'Pro',
  platin: 'Agency',
}

/** Tier-themed color tokens used by <UpsellBadge> and friends. */
export const TIER_COLORS: Record<
  string,
  { bg: string; text: string; border: string; ring: string }
> = {
  pro: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-400/30',
    ring: 'ring-blue-400/40',
  },
  premium: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-400/30',
    ring: 'ring-purple-400/40',
  },
  platin: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-400/30',
    ring: 'ring-amber-400/40',
  },
}

/**
 * True when the user's current plan slug already satisfies the gate.
 * Admins / VIPs / unknown high tiers should be granted via `currentSlug`
 * resolution at the caller (e.g. treat admin as platin upstream).
 */
export function hasTier(
  currentSlug: string | null | undefined,
  requiredSlug: 'pro' | 'premium' | 'platin',
): boolean {
  const current = TIER_ORDER[currentSlug ?? 'free'] ?? 0
  const required = TIER_ORDER[requiredSlug] ?? 0
  return current >= required
}

/** Display label for a tier slug — falls back to the slug itself. */
export function tierLabel(slug: string): string {
  return TIER_DISPLAY_NAMES[slug] ?? slug
}
