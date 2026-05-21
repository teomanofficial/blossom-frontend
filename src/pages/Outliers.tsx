/**
 * Outliers — the Outlier Hunter wedge page at `/dashboard/outliers`.
 *
 * Surfaces creators getting 3×+ their median views and lets users reverse-
 * engineer the tactics behind each hit. The page is the Stage 5 N3 vertical
 * built on top of BE2's `GET /api/insights/tier1/outliers` (which already
 * embeds the per-row tactic teardown so we don't have to fan out N+1).
 *
 * Layout (top → bottom):
 *   1. Page header — gradient title + back link.
 *   2. Saved Outliers strip (only when bookmarks exist).
 *   3. Filter bar (niche search + tier + platform + window).
 *   4. Card grid (1 col mobile / 2 sm / 3 lg) of OutlierCards.
 *
 * Save state lives in localStorage via `useSavedOutliers`; filters live in
 * URL search params so a URL fully restores the view (`?niche=fitness&tier=micro`).
 */

import { useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInsights } from '../lib/useInsights'
import { useAuth } from '../context/AuthContext'
import type { OutlierVideo } from '../types/insights'
import OutlierCard from '../components/outliers/OutlierCard'
import FilterBar, { type OutlierFilters } from '../components/outliers/FilterBar'
import SavedOutliers, { useSavedOutliers } from '../components/outliers/SavedOutliers'

interface OutliersResponse {
  outliers: OutlierVideo[]
}

/**
 * Read filter state from the URL so a deep-link restores the view. Default
 * window is 30d (only window currently materialized).
 */
function filtersFromSearch(search: URLSearchParams): OutlierFilters {
  const windowParam = search.get('window')
  const allowedWindows: Array<OutlierFilters['window']> = ['24h', '7d', '30d']
  const window: OutlierFilters['window'] =
    allowedWindows.includes(windowParam as OutlierFilters['window'])
      ? (windowParam as OutlierFilters['window'])
      : '30d'
  return {
    niche: (search.get('niche') || '').trim(),
    tier: (search.get('tier') || '').trim(),
    platform: (search.get('platform') || '').trim(),
    window,
  }
}

/**
 * Push filter state back to the URL bar. Empty values are stripped so
 * `/dashboard/outliers` is the canonical empty state.
 */
function filtersToSearch(filters: OutlierFilters): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.niche.trim()) next.set('niche', filters.niche.trim())
  if (filters.tier) next.set('tier', filters.tier)
  if (filters.platform) next.set('platform', filters.platform)
  if (filters.window && filters.window !== '30d') next.set('window', filters.window)
  return next
}

/**
 * Build the relative query string for useInsights. We always send `limit=50`
 * and add filter params only when they have values, so the cache key is
 * deterministic per filter combo (the 5-min cache keys on the full URL).
 */
function buildQuery(filters: OutlierFilters): string {
  const qs = new URLSearchParams()
  qs.set('limit', '50')
  if (filters.niche.trim()) qs.set('niche', filters.niche.trim())
  if (filters.tier) qs.set('tier', filters.tier)
  if (filters.platform) qs.set('platform', filters.platform)
  return `tier1/outliers?${qs.toString()}`
}

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left text-[10px]" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            <span className="gradient-text font-display">Outlier Hunter</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase mt-1">
            Find creators going 700× their median. Reverse-engineer the tactics.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="glass-card rounded-3xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[9/16] sm:aspect-[3/4] bg-white/[0.04]" />
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-2.5 bg-white/[0.04] rounded w-1/3" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-20 bg-white/5 rounded-full" />
              <div className="h-5 w-16 bg-white/5 rounded-full" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-14 bg-white/5 rounded-full" />
              <div className="h-5 w-18 bg-white/5 rounded-full" />
              <div className="h-5 w-12 bg-white/5 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-triangle-exclamation text-rose-400 text-xl" />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">
        Couldn't load outliers
      </h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
        {error}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500/90 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-widest transition-colors"
      >
        <i className="fas fa-rotate-right text-[10px]" />
        Try again
      </button>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean
  onReset: () => void
}) {
  if (hasFilters) {
    return (
      <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-filter-circle-xmark text-amber-300 text-xl" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">
          No outliers match these filters yet
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
          Try widening your search — drop the niche, swap platforms, or relax the
          creator tier.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors"
        >
          <i className="fas fa-xmark text-[10px]" />
          Reset filters
        </button>
      </div>
    )
  }
  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-satellite-dish text-blue-300 text-xl" />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">
        We're still indexing
      </h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        Check back in a few hours — fresh outliers from the last 30 days will land
        as the discovery pipeline catches up.
      </p>
    </div>
  )
}

export default function Outliers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const savedHook = useSavedOutliers()

  const filters = useMemo(() => filtersFromSearch(searchParams), [searchParams])

  const queryPath = useMemo(() => buildQuery(filters), [filters])
  const { data, loading, error, retry } = useInsights<OutliersResponse>(queryPath)

  const outliers = data?.outliers ?? []

  const hasActiveFilters = Boolean(
    filters.niche.trim() || filters.tier || filters.platform,
  )

  // Some accounts haven't set a niche — when that happens NicheFitBadge has
  // nothing meaningful to show, so suppress it on the cards. We treat
  // niche as set when the profile-level niche field exists OR when the
  // first outlier carries a niche-fit with a non-default verdict.
  // (Profile shape varies; access defensively.)
  const profileNiche = (profile as { niche?: string } | null)?.niche
  const hideNicheFit = !profileNiche && !filters.niche.trim()

  const onFiltersChange = useCallback(
    (next: OutlierFilters) => {
      setSearchParams(filtersToSearch(next), { replace: false })
    },
    [setSearchParams],
  )

  const onReset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: false })
  }, [setSearchParams])

  return (
    <div>
      <PageHeader />

      <SavedOutliers
        outliers={outliers}
        savedIds={savedHook.saved}
        onRemove={savedHook.removeSave}
      />

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        resultCount={loading ? undefined : outliers.length}
      />

      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : outliers.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onReset={onReset} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {outliers.map((outlier) => (
            <OutlierCard
              key={outlier.video_id}
              outlier={outlier}
              saved={savedHook.isSaved(outlier.video_id)}
              onToggleSave={savedHook.toggleSave}
              hideNicheFit={hideNicheFit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
