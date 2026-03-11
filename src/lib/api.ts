import { supabase } from './supabase'

export const API_URL = import.meta.env.VITE_API_URL || ''

// ── Impersonation state ──────────────────────────────────────────
const IMPERSONATION_KEY = 'blossom_impersonation'

let impersonatedUserId: string | null = null

// Initialize from sessionStorage before any React components mount
try {
  const stored = sessionStorage.getItem(IMPERSONATION_KEY)
  if (stored) {
    const parsed = JSON.parse(stored)
    impersonatedUserId = parsed.userId || null
  }
} catch {
  // ignore parse errors
}

export function setImpersonatedUserId(userId: string | null) {
  impersonatedUserId = userId
}

export function getImpersonatedUserId(): string | null {
  return impersonatedUserId
}

/**
 * Fetch wrapper that automatically injects the Supabase JWT token
 * into the Authorization header and prepends the API base URL.
 * When impersonating, also injects the X-Impersonate-User-Id header.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  if (impersonatedUserId) {
    headers.set('X-Impersonate-User-Id', impersonatedUserId)
  }
  const url = typeof input === 'string' ? `${API_URL}${input}` : input
  return fetch(url, { ...init, headers })
}

/**
 * Fetch wrapper that prepends the API base URL (no auth).
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? `${API_URL}${input}` : input
  return fetch(url, init)
}
