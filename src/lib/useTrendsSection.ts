import { useState, useEffect, useCallback, useRef } from 'react'
import { authFetch } from './api'

interface TrendsSectionResult<T> {
  data: T[] | null
  total: number
  loading: boolean
  error: string | null
  retry: () => void
}

export function useTrendsSection<T>(section: string, days: number): TrendsSectionResult<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setData(null)
    setError(null)
    setLoading(true)

    authFetch(`/api/trends/overview/${section}?days=${days}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (controller.signal.aborted) return
        if (json.error) throw new Error(json.error)
        setData(json.items)
        setTotal(json.total)
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
  }, [section, days, retryCount])

  return { data, total, loading, error, retry }
}
