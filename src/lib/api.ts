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

// ── Cached access token ──────────────────────────────────────────
// Avoids calling supabase.auth.getSession() on every request, which
// acquires a lock that can deadlock when the browser tab regains focus
// while a token refresh is in progress.
let cachedAccessToken: string | null = null

export function setAccessToken(token: string | null) {
  cachedAccessToken = token
}

/**
 * Fetch wrapper that automatically injects the Supabase JWT token
 * into the Authorization header and prepends the API base URL.
 * When impersonating, also injects the X-Impersonate-User-Id header.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = cachedAccessToken

  // Fallback: if AuthContext hasn't pushed a token yet (e.g. first load),
  // read from getSession() once. This only happens during initial bootstrap.
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token ?? null
  }

  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (impersonatedUserId) {
    headers.set('X-Impersonate-User-Id', impersonatedUserId)
  }
  const url = typeof input === 'string' ? `${API_URL}${input}` : input
  const res = await fetch(url, { ...init, headers })

  // If we get a 401, the cached token may be stale. Try refreshing once.
  if (res.status === 401 && token) {
    const { data } = await supabase.auth.refreshSession()
    const newToken = data.session?.access_token ?? null
    if (newToken && newToken !== token) {
      cachedAccessToken = newToken
      headers.set('Authorization', `Bearer ${newToken}`)
      return fetch(url, { ...init, headers })
    }
  }

  return res
}

/**
 * Fetch wrapper that prepends the API base URL (no auth).
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? `${API_URL}${input}` : input
  return fetch(url, init)
}
