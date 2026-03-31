import { useState, useEffect, useCallback, useRef } from 'react'
import { authFetch } from './api'

interface DashboardSectionResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useDashboardSection<T>(section: string): DashboardSectionResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setData(null)
    setError(null)
    setLoading(true)

    authFetch(`/api/analysis/stats/${section}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (controller.signal.aborted) return
        if (json.error) throw new Error(json.error)
        // Backend returns { items: T[] } or { item: T | null } or { data: T }
        const value = json.items ?? json.item ?? json.data ?? null
        setData(value as T)
        setError(null)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.message || 'Failed to load')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [section, retryCount])

  return { data, loading, error, retry }
}
