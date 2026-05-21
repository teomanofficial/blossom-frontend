/**
 * ConceptInputForm — the single textarea + optional fields that the
 * Greenlight Studio user submits.
 *
 * The textarea is the focal point; everything else is folded into a
 * collapsible "Tune the inputs" panel so the page doesn't feel like a
 * form. We deliberately do NOT validate niche/format dropdowns against
 * known classes — the backend accepts free text and Gemini classifies
 * fuzzy matches.
 *
 * Used by Greenlight.tsx in three modes:
 *   - empty state (initial render)
 *   - prefilled from ?fromOutlier=<id> (outlier handoff)
 *   - re-roll mode (the page mutates concept_description and resubmits)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GreenlightRequest } from '../../types/insights'

export interface ConceptFormValue {
  concept_description: string
  hook_text: string
  niche: string
  planned_format: string
  planned_duration_sec: number | ''
}

const EMPTY_VALUE: ConceptFormValue = {
  concept_description: '',
  hook_text: '',
  niche: '',
  planned_format: '',
  planned_duration_sec: '',
}

interface ConceptInputFormProps {
  /** Controlled value — Greenlight.tsx owns the state. */
  value: ConceptFormValue
  onChange: (next: ConceptFormValue) => void
  onSubmit: () => void
  /** Whether a submission is currently in flight. */
  loading: boolean
  /** When true, the textarea grows a "Reverse-engineering" placeholder. */
  prefillingFromOutlier?: boolean
  /** Optional template username for the placeholder text. */
  outlierUsername?: string
  /** Optional list of recent niches surfaced as quick-pick chips. */
  recentNiches?: string[]
  /** Quota text shown next to the submit button (e.g. "3 of 5 left this month"). */
  quotaLabel?: string
  /** Disable the submit button regardless of length (e.g. quota exhausted). */
  disabledReason?: string | null
}

/**
 * 12 popular format-class names — surfaced as a datalist so users get
 * autocomplete without forcing a dropdown. Backend treats them as free text.
 */
const FORMAT_SUGGESTIONS = [
  'Dance Trend',
  'Travel Vlog',
  'Recipe Demo',
  'Outfit Showcase',
  'Comedy Sketch',
  'Talking Head',
  'Aesthetic Showcase',
  'Motivational Monologue',
  'Tutorial',
  'Story Time',
  'Day in the Life',
  'Product Review',
]

const MIN_CHARS = 20

export const EMPTY_CONCEPT_VALUE: ConceptFormValue = EMPTY_VALUE

/**
 * Map a ConceptFormValue + optional source_outlier_id into a GreenlightRequest
 * the backend accepts. Empty-string fields are dropped so the JSON body
 * stays clean.
 */
export function toGreenlightRequest(
  value: ConceptFormValue,
  sourceOutlierId: string | null,
): GreenlightRequest {
  const req: GreenlightRequest = {
    concept_description: value.concept_description.trim(),
  }
  if (value.hook_text.trim()) req.hook_text = value.hook_text.trim()
  if (value.niche.trim()) req.niche = value.niche.trim()
  if (value.planned_format.trim()) req.planned_format = value.planned_format.trim()
  if (typeof value.planned_duration_sec === 'number' && value.planned_duration_sec > 0) {
    req.planned_duration_sec = value.planned_duration_sec
  }
  if (sourceOutlierId) req.source_outlier_id = sourceOutlierId
  return req
}

export default function ConceptInputForm({
  value,
  onChange,
  onSubmit,
  loading,
  prefillingFromOutlier = false,
  outlierUsername,
  recentNiches = [],
  quotaLabel,
  disabledReason,
}: ConceptInputFormProps) {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(
    Boolean(value.hook_text || value.niche || value.planned_format),
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow on content change so the textarea reflects the concept length.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 460)}px`
  }, [value.concept_description])

  // Focus the textarea on mount so the user can just start typing.
  useEffect(() => {
    if (!prefillingFromOutlier) textareaRef.current?.focus()
  }, [prefillingFromOutlier])

  const charCount = value.concept_description.trim().length
  const isTooShort = charCount > 0 && charCount < MIN_CHARS
  const isEmpty = charCount === 0
  const canSubmit =
    !loading && !disabledReason && charCount >= MIN_CHARS

  const placeholder = useMemo(() => {
    if (prefillingFromOutlier && outlierUsername) {
      return `Reverse-engineering @${outlierUsername}'s hit — your version of this concept. Describe the cold open, what happens in the first 5 seconds, the payoff, and where you'd film it.`
    }
    return "Describe your idea — the hook, what happens, where you'd film it. The more specific you are about the first 5 seconds, the sharper the verdict."
  }, [prefillingFromOutlier, outlierUsername])

  const update = useCallback(
    <K extends keyof ConceptFormValue>(key: K, val: ConceptFormValue[K]) => {
      onChange({ ...value, [key]: val })
    },
    [value, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <form
      className="glass-card rounded-3xl p-5 sm:p-6 lg:p-7"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <label
        htmlFor="greenlight-concept"
        className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2"
      >
        Your concept
      </label>
      <textarea
        ref={textareaRef}
        id="greenlight-concept"
        name="concept_description"
        value={value.concept_description}
        onChange={(e) => update('concept_description', e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-white/[0.03] border border-white/10 focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/30 rounded-2xl px-4 py-3.5 text-sm sm:text-[15px] leading-relaxed text-white placeholder:text-slate-500 resize-none transition-colors outline-none"
        disabled={loading}
      />

      <div className="mt-1 flex items-center justify-between flex-wrap gap-2 text-[10px] font-bold tracking-wide">
        <div className="text-slate-500">
          {isEmpty ? (
            <span>{MIN_CHARS} chars minimum · Cmd/Ctrl + Enter to submit</span>
          ) : isTooShort ? (
            <span className="text-amber-300">
              {charCount}/{MIN_CHARS} — add more detail before submitting
            </span>
          ) : (
            <span className="text-emerald-300">
              {charCount} chars · ready
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
        >
          <i className={`fas ${showAdvanced ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px] mr-1.5`} />
          Tune the inputs
        </button>
      </div>

      {showAdvanced ? (
        <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="greenlight-hook" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Hook text <span className="text-slate-600 normal-case font-medium">(optional)</span>
            </label>
            <input
              id="greenlight-hook"
              type="text"
              value={value.hook_text}
              onChange={(e) => update('hook_text', e.target.value)}
              placeholder="One-liner that opens the video"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-pink-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              maxLength={200}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="greenlight-niche" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Niche <span className="text-slate-600 normal-case font-medium">(optional)</span>
            </label>
            <input
              id="greenlight-niche"
              type="text"
              value={value.niche}
              onChange={(e) => update('niche', e.target.value)}
              placeholder="e.g. fashion, finance, travel"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-pink-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              maxLength={50}
              disabled={loading}
              list="greenlight-niche-suggestions"
            />
            {recentNiches.length > 0 ? (
              <datalist id="greenlight-niche-suggestions">
                {recentNiches.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            ) : null}
            {recentNiches.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recentNiches.slice(0, 5).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('niche', n)}
                    className="px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label htmlFor="greenlight-format" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Planned format <span className="text-slate-600 normal-case font-medium">(optional)</span>
            </label>
            <input
              id="greenlight-format"
              type="text"
              value={value.planned_format}
              onChange={(e) => update('planned_format', e.target.value)}
              placeholder="e.g. Dance Trend, Travel Vlog"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-pink-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              maxLength={80}
              disabled={loading}
              list="greenlight-format-suggestions"
            />
            <datalist id="greenlight-format-suggestions">
              {FORMAT_SUGGESTIONS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="greenlight-duration" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Planned duration (sec) <span className="text-slate-600 normal-case font-medium">(optional)</span>
            </label>
            <input
              id="greenlight-duration"
              type="number"
              min={1}
              max={600}
              value={value.planned_duration_sec === '' ? '' : value.planned_duration_sec}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') update('planned_duration_sec', '')
                else {
                  const n = Number(v)
                  update('planned_duration_sec', Number.isFinite(n) ? n : '')
                }
              }}
              placeholder="e.g. 22"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-pink-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
              disabled={loading}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
          {quotaLabel ? <span>{quotaLabel}</span> : null}
          {disabledReason ? (
            <span className="text-rose-300 ml-2">· {disabledReason}</span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest transition-all shrink-0 ${
            canSubmit
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-px'
              : 'bg-white/[0.04] border border-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <i className="fas fa-circle-notch fa-spin text-[10px]" />
              Evaluating…
            </>
          ) : (
            <>
              <i className="fas fa-rocket text-[10px]" />
              Get verdict
            </>
          )}
        </button>
      </div>
    </form>
  )
}
