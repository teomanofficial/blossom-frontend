/**
 * EvidenceTrail — "Why?" button that opens a modal sourced from
 * `POST /api/insights/evidence/:claim_id`. Every claim returned by
 * the insights backend carries an `evidence_claim_id`; widgets pass
 * that id here so users can audit any data-driven assertion.
 *
 * Network call is lazy: useInsights only fires when the modal opens
 * (`enabled` gate), and the 5-min cache layer means rapid re-opens
 * are free.
 *
 * Pure presentational shell otherwise — the surrounding widget owns
 * layout; this component just slots in via the WidgetCard `actions`
 * prop.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useInsights } from '../../../lib/useInsights'
import type { EvidenceItem, EvidenceTrail as EvidenceTrailPayload } from '../../../types/insights'

interface EvidenceTrailProps {
  claimId: string
  triggerLabel?: string
  className?: string
  /** Render the trigger as an icon-only chip (no text). */
  iconOnly?: boolean
}

const TYPE_META: Record<
  EvidenceItem['type'],
  { icon: string; label: string; chip: string; iconColor: string }
> = {
  transcript: {
    icon: 'fa-closed-captioning',
    label: 'Transcript',
    chip: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    iconColor: 'text-blue-300',
  },
  audio_spike: {
    icon: 'fa-wave-square',
    label: 'Audio spike',
    chip: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    iconColor: 'text-purple-300',
  },
  visual_cut: {
    icon: 'fa-scissors',
    label: 'Visual cut',
    chip: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
    iconColor: 'text-fuchsia-300',
  },
  benchmark: {
    icon: 'fa-chart-line',
    label: 'Benchmark',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    iconColor: 'text-emerald-300',
  },
  tactic_detection: {
    icon: 'fa-bullseye',
    label: 'Tactic',
    chip: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
    iconColor: 'text-pink-300',
  },
}

function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatConfidence(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct)}%`
}

function EvidenceItemRow({ item }: { item: EvidenceItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.benchmark
  return (
    <li className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${meta.chip} flex items-center justify-center shrink-0 border`}
        >
          <i className={`fas ${meta.icon} text-xs ${meta.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {meta.label}
            </span>
            {typeof item.timestamp_sec === 'number' ? (
              <span className="text-[10px] font-bold text-slate-500 inline-flex items-center gap-1">
                <i className="fas fa-clock text-[9px]" />
                {formatTimestamp(item.timestamp_sec)}
              </span>
            ) : null}
            <span className="ml-auto text-[10px] font-bold text-slate-500">
              <i className="fas fa-shield-check text-[9px] mr-1" />
              {formatConfidence(item.confidence)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-snug">{item.text}</p>
          {item.source_video_id ? (
            <Link
              to={`/dashboard/post-mortem/${item.source_video_id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-pink-300 hover:text-pink-200 transition-colors"
            >
              <i className="fas fa-play text-[10px]" />
              View source video
              <i className="fas fa-arrow-right text-[9px]" />
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function ModalBody({ claimId }: { claimId: string }) {
  // POST per the spec: /api/insights/evidence/:claim_id. The hook
  // composes the URL — we pass the path AFTER the `/api/insights/`
  // prefix.
  const { data, loading, error, retry } = useInsights<EvidenceTrailPayload>(
    `evidence/${encodeURIComponent(claimId)}`,
    { method: 'POST' },
  )

  if (loading) {
    return (
      <ul className="space-y-3 animate-pulse" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
          >
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 bg-white/5 rounded" />
                <div className="h-3 w-full bg-white/[0.04] rounded" />
                <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center text-center py-8 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
          <i className="fas fa-triangle-exclamation text-rose-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-200 mb-1">
            Couldn't fetch evidence
          </div>
          <div className="text-xs text-slate-500 max-w-xs">{error}</div>
        </div>
        <button
          onClick={retry}
          className="mt-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-200 transition-colors"
        >
          <i className="fas fa-rotate-right mr-1.5 text-[10px]" />
          Retry
        </button>
      </div>
    )
  }

  if (!data || data.evidence.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
          <i className="fas fa-magnifying-glass text-slate-500" />
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
          No evidence trail is available for this claim yet.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {data.evidence.map((item, idx) => (
        <EvidenceItemRow key={`${item.type}-${idx}`} item={item} />
      ))}
    </ul>
  )
}

export default function EvidenceTrail({
  claimId,
  triggerLabel = 'Why?',
  className = '',
  iconOnly = false,
}: EvidenceTrailProps): ReactNode {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // Close on Escape; restore focus to the trigger when the modal closes.
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    // Focus the close button to make ESC + Enter ergonomic.
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open && triggerRef.current) {
      // Defer focus restore so the click that closed it doesn't reopen.
      const t = window.setTimeout(() => triggerRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open])

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <i className="fas fa-circle-question text-[11px]" aria-hidden="true" />
        {!iconOnly ? <span>{triggerLabel}</span> : <span className="sr-only">{triggerLabel}</span>}
      </button>

      {open ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Evidence trail"
            className="bg-[#0a0a12] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                  <i className="fas fa-magnifying-glass-chart text-pink-400 text-sm" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Evidence trail
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                    Why we surfaced this
                  </h2>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5 dashboard-scrollbar">
              <ModalBody claimId={claimId} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
