import { supabase } from './supabase'

export const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Fetch wrapper that automatically injects the Supabase JWT token
 * into the Authorization header and prepends the API base URL.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
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
