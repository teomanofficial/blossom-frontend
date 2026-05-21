/**
 * OutlierPrefillPill — small banner that surfaces the "I'm reverse-engineering
 * @username's hit" hand-off from the Outlier Hunter page (?fromOutlier=<id>).
 *
 * Renders above the ConceptInputForm. Clicking the × clears the prefill state
 * AND drops the query param so the URL stays canonical.
 */

import type { OutlierVideo } from '../../types/insights'

interface OutlierPrefillPillProps {
  outlier: Pick<
    OutlierVideo,
    'video_id' | 'multiple' | 'hook_class' | 'format_class' | 'thumbnail_url'
  > & {
    username: string
  }
  onClear: () => void
}

function formatMultiple(multiple: number): string {
  if (!Number.isFinite(multiple) || multiple <= 0) return '—×'
  if (multiple >= 100) return `${Math.round(multiple)}×`
  if (multiple >= 10) return `${multiple.toFixed(1).replace(/\.0$/, '')}×`
  return `${multiple.toFixed(1)}×`
}

export default function OutlierPrefillPill({
  outlier,
  onClear,
}: OutlierPrefillPillProps) {
  const username = outlier.username || 'creator'
  const multiple = formatMultiple(outlier.multiple)
  const hookLabel = outlier.hook_class || 'unknown hook'
  const formatLabel = outlier.format_class || 'unknown format'

  return (
    <div
      className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border border-orange-500/25 flex items-center gap-3"
      role="status"
      aria-live="polite"
    >
      {outlier.thumbnail_url ? (
        <img
          src={outlier.thumbnail_url}
          alt=""
          loading="lazy"
          className="w-10 h-14 rounded-lg object-cover shrink-0 border border-white/10"
        />
      ) : (
        <div className="w-10 h-14 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
          <i className="fas fa-meteor text-orange-300 text-sm" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-200">
            Reverse-engineering
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-200/80">
            ·
          </span>
          <span className="text-xs sm:text-sm font-bold text-white truncate">
            @{username}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-orange-500/25 text-orange-100 text-[10px] font-black tabular-nums">
            {multiple}
          </span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
          {hookLabel} <span className="text-slate-600">·</span> {formatLabel}
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
        aria-label="Clear reverse-engineering target"
        title="Clear reverse-engineering target"
      >
        <i className="fas fa-xmark text-xs" />
      </button>
    </div>
  )
}
