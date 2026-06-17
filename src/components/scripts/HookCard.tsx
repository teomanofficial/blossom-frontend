import { useState } from 'react'
import type { ScriptHook } from '../../types/scripts'
import { compactCount, formatMultiple } from './format'

interface HookCardProps {
  hook: ScriptHook
  selected: boolean
  onSelect: (id: string) => void
  /** Persist an edited spoken_hook. */
  onEdit: (id: string, spokenHook: string) => void
  /** Delete this hook candidate. */
  onDelete: (id: string) => void
}

/**
 * Signature Script Studio card. Shows the spoken hook, an archetype chip,
 * a provenance line reusing the outlier multiple + views visual treatment
 * from video cards, inline editing, and a rationale revealed on hover.
 */
export default function HookCard({ hook, selected, onSelect, onEdit, onDelete }: HookCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(hook.spoken_hook)

  // Normalize the handle once: backend stores it bare, but guard against a
  // stray leading @ so we never render "@@handle".
  const handle = (hook.source_influencer || '').replace(/^@+/, '')
  // Coerce defensively — these arrive as numbers from the API, but pg can
  // serialize NUMERIC/BIGINT as strings, which would break the badges.
  const multipleNum = hook.source_outlier_multiple != null ? Number(hook.source_outlier_multiple) : null
  const viewsNum = hook.source_views != null ? Number(hook.source_views) : null
  const hasRealMultiple = multipleNum != null && Number.isFinite(multipleNum) && multipleNum > 0
  const hasViews = viewsNum != null && Number.isFinite(viewsNum)
  const hasProvenance = !!handle || hasRealMultiple || hasViews

  const commitEdit = () => {
    const next = draft.trim()
    if (next && next !== hook.spoken_hook) onEdit(hook.id, next)
    setEditing(false)
  }

  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-5 transition-all ${
        selected
          ? 'border-pink-500/50 bg-gradient-to-br from-pink-500/[0.08] to-orange-400/[0.04] ring-1 ring-pink-500/30'
          : 'border-white/[0.06] bg-white/[0.03] hover:border-white/15'
      }`}
    >
      {/* Top row: radio + archetype chip */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(hook.id)}
          aria-pressed={selected}
          aria-label={selected ? 'Selected hook' : 'Select this hook'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
            selected
              ? 'border-pink-500 bg-pink-500'
              : 'border-white/25 bg-transparent hover:border-pink-400'
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </button>

        {hook.archetype && (
          <span className="group/chip relative inline-block">
            <span className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300 backdrop-blur-md">
              <i className="fas fa-fingerprint text-[9px] text-pink-400" />
              {hook.archetype}
            </span>

            {/* Rationale tooltip — revealed only when hovering the chip */}
            {hook.rationale && (
              <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-64 max-w-[80vw] translate-y-1 rounded-2xl border border-white/10 bg-[#0b0b12]/95 p-3 text-left text-[11px] font-medium normal-case leading-relaxed tracking-normal text-slate-300 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover/chip:translate-y-0 group-hover/chip:opacity-100">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-pink-400">
                  Why it works
                </span>
                {hook.rationale}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Spoken hook (primary) */}
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          autoFocus
          rows={3}
          className="glass-input mb-3 w-full resize-none px-3 py-2 text-sm font-semibold leading-snug text-white"
        />
      ) : (
        <button
          type="button"
          onClick={() => onSelect(hook.id)}
          className="mb-3 text-left text-[15px] font-bold leading-snug text-white"
        >
          {hook.spoken_hook}
        </button>
      )}

      {/* Provenance line — reuses outlier multiple + views treatment */}
      {hasProvenance && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {handle && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <i className="fas fa-wand-magic-sparkles text-[10px] text-pink-400" />
              Modeled on{' '}
              <span className="text-slate-200">@{handle}</span>
            </span>
          )}
          {hasRealMultiple && (
            <span className="inline-flex items-center rounded-lg bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 px-2 py-0.5 text-[11px] font-black text-white shadow-lg shadow-pink-500/30">
              {formatMultiple(multipleNum)}
            </span>
          )}
          {hasViews && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-bold text-slate-300">
              <i className="fas fa-eye text-[9px] text-slate-500" />
              {compactCount(viewsNum)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-3">
        <button
          type="button"
          onClick={() => onSelect(hook.id)}
          className={`text-[11px] font-bold transition-colors ${
            selected ? 'text-pink-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className={`fas ${selected ? 'fa-circle-check' : 'fa-circle'} mr-1 text-[10px]`} />
          {selected ? 'Selected' : 'Select'}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(hook.spoken_hook)
            setEditing((v) => !v)
          }}
          className="text-[11px] font-bold text-slate-400 transition-colors hover:text-white"
        >
          <i className="fas fa-pen mr-1 text-[10px]" />
          {editing ? 'Done' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(hook.id)}
          className="ml-auto text-[11px] font-bold text-slate-500 transition-colors hover:text-red-300"
        >
          <i className="fas fa-trash mr-1 text-[10px]" />
          Delete
        </button>
      </div>
    </div>
  )
}
