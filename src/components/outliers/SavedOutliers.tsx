/**
 * SavedOutliers — compact bookmarked-outliers strip rendered at the top
 * of the Outliers page.
 *
 * v1 uses localStorage (no new DB table) per the plan. Storage key is
 * `blossom:saved_outliers`, an array of `video_id` strings.
 *
 * The hook is exported separately so OutlierCard + the main page share a
 * single source of truth without prop-drilling — both subscribe to
 * `storage` events so save toggles in one card refresh the list strip
 * immediately on the same tab and across tabs.
 */

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { OutlierVideo } from '../../types/insights'

const STORAGE_KEY = 'blossom:saved_outliers'
const STORAGE_EVENT = 'blossom:saved_outliers_changed'

/**
 * Defensive read — localStorage can be unavailable (SSR / privacy mode /
 * disabled), corrupt, or contain non-array data after a manual edit. Any
 * of those degrade silently to an empty list rather than throwing.
 */
function readSaved(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

function writeSaved(ids: string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    // Same-tab subscribers don't get the native `storage` event, so we fire
    // a CustomEvent on the window for them. Cross-tab subscribers still hear
    // it via the native `storage` event.
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  } catch {
    // Quota exceeded or private mode — silently swallow; the next read will
    // surface the previous state.
  }
}

/**
 * Subscribe to the saved-outliers localStorage slot. Returns the current
 * list of saved video ids plus a stable Set for O(1) membership checks and
 * a toggle function used by OutlierCard.
 */
export function useSavedOutliers(): {
  saved: string[]
  savedSet: Set<string>
  toggleSave: (videoId: string) => void
  removeSave: (videoId: string) => void
  isSaved: (videoId: string) => boolean
} {
  const [saved, setSaved] = useState<string[]>(() => readSaved())

  useEffect(() => {
    const refresh = () => setSaved(readSaved())
    window.addEventListener('storage', refresh)
    window.addEventListener(STORAGE_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(STORAGE_EVENT, refresh)
    }
  }, [])

  const toggleSave = useCallback((videoId: string) => {
    const next = readSaved()
    const idx = next.indexOf(videoId)
    if (idx >= 0) {
      next.splice(idx, 1)
    } else {
      next.unshift(videoId)
    }
    writeSaved(next)
    setSaved(next)
  }, [])

  const removeSave = useCallback((videoId: string) => {
    const next = readSaved().filter((id) => id !== videoId)
    writeSaved(next)
    setSaved(next)
  }, [])

  const isSaved = useCallback((videoId: string) => saved.includes(videoId), [saved])

  return {
    saved,
    savedSet: new Set(saved),
    toggleSave,
    removeSave,
    isSaved,
  }
}

interface SavedOutliersProps {
  /** All loaded outliers from the API — we filter to the saved subset for display. */
  outliers: OutlierVideo[]
  savedIds: string[]
  onRemove: (videoId: string) => void
  className?: string
}

function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

function formatMultiple(multiple: number): string {
  if (!Number.isFinite(multiple) || multiple <= 0) return '0x'
  if (multiple >= 100) return `${Math.round(multiple)}x`
  return `${multiple.toFixed(1).replace(/\.0$/, '')}x`
}

export default function SavedOutliers({
  outliers,
  savedIds,
  onRemove,
  className = '',
}: SavedOutliersProps) {
  // Render only saved outliers that are present in the current result set.
  // (Saved ids that got filtered out by current filters won't show — that's
  // intentional; the user can clear filters to see them.)
  const savedOutliers = outliers.filter((o) => savedIds.includes(o.video_id))

  if (savedIds.length === 0) {
    // No saved items at all — don't render the section.
    return null
  }

  const hiddenCount = savedIds.length - savedOutliers.length

  return (
    <section
      className={`glass-card rounded-3xl p-4 sm:p-5 mb-5 ${className}`}
      aria-label="Saved outliers"
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
            <i className="fas fa-bookmark text-pink-300 text-xs" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-100">
              Saved outliers
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {savedIds.length} bookmark{savedIds.length === 1 ? '' : 's'}
              {hiddenCount > 0 ? (
                <span className="text-slate-600"> · {hiddenCount} hidden by filters</span>
              ) : null}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            // Clear all saves at once. Confirm via toast so accidental clicks
            // remain recoverable in the user's memory ("oh no I clicked it").
            if (savedIds.length === 0) return
            const ok = window.confirm(
              `Remove all ${savedIds.length} saved outlier${savedIds.length === 1 ? '' : 's'}?`,
            )
            if (!ok) return
            for (const id of savedIds) onRemove(id)
            toast.success('Cleared saved outliers', {
              icon: '🧹',
              duration: 1800,
              style: {
                background: '#0a0a12',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            })
          }}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-300 transition-colors"
        >
          <i className="fas fa-trash text-[9px] mr-1" />
          Clear all
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 dashboard-scrollbar -mx-1 px-1">
        {savedOutliers.map((outlier) => (
          <div
            key={outlier.video_id}
            className="shrink-0 w-[200px] sm:w-[220px] rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[16/10] bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-slate-900">
              {outlier.thumbnail_url ? (
                <img
                  src={outlier.thumbnail_url}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-image text-slate-700 text-xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-black tabular-nums shadow-md shadow-pink-500/30">
                  {formatMultiple(outlier.multiple)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(outlier.video_id)}
                aria-label="Remove from saved"
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 hover:bg-rose-500/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white border border-white/10 transition-colors"
              >
                <i className="fas fa-xmark text-[10px]" />
              </button>
            </div>
            <div className="p-2.5">
              <div className="text-[11px] font-bold text-slate-100 truncate">
                @{outlier.influencer.username || 'unknown'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate">
                {compact(outlier.views)} views
              </div>
            </div>
          </div>
        ))}

        {hiddenCount > 0 && savedOutliers.length === 0 ? (
          <div className="shrink-0 w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">
              All {hiddenCount} saved outlier{hiddenCount === 1 ? '' : 's'} are hidden by the
              current filters. Clear filters to see them.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
