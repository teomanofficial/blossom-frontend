import { useCallback, useEffect, useRef, useState } from 'react'
import { authFetch } from './api'

/**
 * useInsights — typed hook for /api/insights/<path> endpoints.
 *
 * Mirrors useDashboardSection's lifecycle (load + abort + retry) but
 * targets the insights namespace and exposes a generic for the
 * response shape (e.g. Tier0BreakoutsResponse, OutlierVideo[], etc.).
 *
 * 5-minute in-memory cache shared across hook instances so multiple
 * widgets pulling the same path do not refetch on every mount. The
 * cache key is `${method}:${path}:${body}`; retry() bypasses it.
 * 403 (tier-locked) responses are NOT cached — they should resolve
 * immediately on upgrade without waiting out the TTL.
 *
 * Unlike useDashboardSection, this hook returns the raw JSON body —
 * the insights API returns the typed payload directly (no `items` /
 * `item` envelope).
 *
 * Usage:
 *   const { data, loading, error, retry, locked } = useInsights<Tier0BreakoutsResponse>(
 *     'tier0/breakouts'
 *   )
 *
 * For POST endpoints (post-mortem, greenlight), pass `{ method: 'POST', body }`.
 *
 * Tier gating:
 *   When the backend responds with HTTP 403 and a body shaped like
 *   `{ error: 'tier_required', requiredPlan: 'premium' | 'platin' | 'pro' }`,
 *   the hook returns `locked: { requiredPlan }` (with `data`/`error` null).
 *   Consumers thread this into <WidgetCard locked={...}> which renders
 *   the in-card upgrade CTA via <LockedWidget>.
 */

interface UseInsightsOptions {
  /** HTTP method. Defaults to 'GET'. */
  method?: 'GET' | 'POST'
  /** Body for POST requests. Will be JSON-stringified. */
  body?: unknown
  /** When false, the hook is inert (useful for conditional fetches). */
  enabled?: boolean
}

/**
 * Tier-locked state surfaced when the backend returns 403 with a
 * `tier_required` body. `requiredPlan` is the slug the user needs to
 * upgrade to (`premium`, `platin`, etc.) — used by LockedWidget to
 * render the upgrade CTA copy.
 */
export type LockedState = { requiredPlan: string } | null

interface UseInsightsResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
  locked: LockedState
}

interface CacheEntry<T = unknown> {
  data: T
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

function cacheKey(method: string, path: string, body: unknown): string {
  return `${method}:${path}:${body ? JSON.stringify(body) : ''}`
}

export function useInsights<T>(
  path: string,
  options: UseInsightsOptions = {},
): UseInsightsResult<T> {
  const { method = 'GET', body, enabled = true } = options
  const bodyKey = body ? JSON.stringify(body) : ''

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState<LockedState>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const retry = useCallback(() => {
    cache.delete(cacheKey(method, path, body))
    setRetryCount((c) => c + 1)
  }, [method, path, bodyKey])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const key = cacheKey(method, path, body)
    const cached = cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      setData(cached.data as T)
      setLoading(false)
      setError(null)
      setLocked(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setData(null)
    setError(null)
    setLocked(null)
    setLoading(true)

    const init: RequestInit = {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }

    authFetch(`/api/insights/${path}`, init)
      .then(async (res) => {
        // Tier-gating path: backend emits 403 with
        //   { error: 'tier_required', message, requiredPlan }
        // We surface this as a separate `locked` state (NOT an error)
        // so the UI can render the upgrade CTA instead of a "Failed to
        // load" message. 403s are not cached — they resolve on upgrade.
        if (res.status === 403) {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await res.json().catch(() => null)
            if (j && (j.error === 'tier_required' || j.requiredPlan)) {
              const requiredPlan =
                typeof j.requiredPlan === 'string' && j.requiredPlan.length > 0
                  ? j.requiredPlan
                  : 'premium'
              return { __locked: { requiredPlan } as { requiredPlan: string } }
            }
          }
          // Generic 403 — not the tier shape. Treat as a normal error.
          throw new Error('Access denied')
        }
        if (!res.ok) {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await res.json().catch(() => null)
            throw new Error(j?.error || `API returned ${res.status}`)
          }
          throw new Error(`API returned ${res.status}`)
        }
        return res.json()
      })
      .then((json: unknown) => {
        if (controller.signal.aborted) return
        // Tier-locked sentinel — set locked state and skip the cache.
        if (
          json &&
          typeof json === 'object' &&
          '__locked' in (json as Record<string, unknown>)
        ) {
          const lockedPayload = (json as { __locked: { requiredPlan: string } }).__locked
          setLocked(lockedPayload)
          setError(null)
          setData(null)
          return
        }
        cache.set(key, { data: json, expiresAt: Date.now() + CACHE_TTL_MS })
        setData(json as T)
        setError(null)
        setLocked(null)
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setError(err.message || 'Failed to load')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => {
      controller.abort()
    }
    // body deps: bodyKey is the stable string form of `body`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, method, bodyKey, enabled, retryCount])

  return { data, loading, error, retry, locked }
}
