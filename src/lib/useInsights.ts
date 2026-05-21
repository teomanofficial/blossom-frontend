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
 *
 * Unlike useDashboardSection, this hook returns the raw JSON body —
 * the insights API returns the typed payload directly (no `items` /
 * `item` envelope).
 *
 * Usage:
 *   const { data, loading, error, retry } = useInsights<Tier0BreakoutsResponse>(
 *     'tier0/breakouts'
 *   )
 *
 * For POST endpoints (post-mortem, greenlight), pass `{ method: 'POST', body }`.
 */

interface UseInsightsOptions {
  /** HTTP method. Defaults to 'GET'. */
  method?: 'GET' | 'POST'
  /** Body for POST requests. Will be JSON-stringified. */
  body?: unknown
  /** When false, the hook is inert (useful for conditional fetches). */
  enabled?: boolean
}

interface UseInsightsResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
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
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setData(null)
    setError(null)
    setLoading(true)

    const init: RequestInit = {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }

    authFetch(`/api/insights/${path}`, init)
      .then(async (res) => {
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
      .then((json) => {
        if (controller.signal.aborted) return
        cache.set(key, { data: json, expiresAt: Date.now() + CACHE_TTL_MS })
        setData(json as T)
        setError(null)
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

  return { data, loading, error, retry }
}
