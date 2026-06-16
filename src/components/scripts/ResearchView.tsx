import { useState } from 'react'
import type { ContrastMoment, ResearchJson } from '../../types/scripts'

interface ResearchViewProps {
  research: ResearchJson
  /** When provided, an "Edit research" toggle is shown; Save calls this. */
  onSave?: (next: ResearchJson) => Promise<void> | void
  saving?: boolean
}

function ListCard({
  icon,
  iconColor,
  title,
  items,
}: {
  icon: string
  iconColor: string
  title: string
  items: string[]
}) {
  if (!items.length) return null
  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wide text-white">
        <i className={`fas ${icon} ${iconColor}`} />
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-500/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Split a textarea value into trimmed, non-empty lines. */
function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Renders the research brief as Blossom glass cards. Contrast moments are
 * rendered as myth-vs-reality two-column cards. When `onSave` is provided the
 * brief becomes editable in place via an "Edit research" toggle.
 */
export default function ResearchView({ research, onSave, saving = false }: ResearchViewProps) {
  const [editing, setEditing] = useState(false)
  const [summary, setSummary] = useState(research.executive_summary ?? '')
  const [angles, setAngles] = useState((research.engagement_angles ?? []).join('\n'))
  const [facts, setFacts] = useState((research.surprising_facts ?? []).join('\n'))
  const [contrasts, setContrasts] = useState<ContrastMoment[]>(research.contrast_moments ?? [])

  const beginEdit = () => {
    setSummary(research.executive_summary ?? '')
    setAngles((research.engagement_angles ?? []).join('\n'))
    setFacts((research.surprising_facts ?? []).join('\n'))
    setContrasts(research.contrast_moments ?? [])
    setEditing(true)
  }

  const save = async () => {
    const next: ResearchJson = {
      executive_summary: summary.trim() || null,
      engagement_angles: toLines(angles),
      surprising_facts: toLines(facts),
      contrast_moments: contrasts.filter((c) => c.common_belief.trim() || c.contrarian_reality.trim()),
    }
    await onSave?.(next)
    setEditing(false)
  }

  const angleList = research.engagement_angles ?? []
  const factList = research.surprising_facts ?? []
  const contrastList = research.contrast_moments ?? []

  // ── Edit mode ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-5">
        <div className="glass-card rounded-3xl p-5 sm:p-6">
          <label className="mb-2 block text-sm font-black tracking-wide text-white">Executive Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="glass-input w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <label className="mb-2 block text-sm font-black tracking-wide text-white">Engagement Angles</label>
            <p className="mb-2 text-[11px] text-slate-500">One per line.</p>
            <textarea
              value={angles}
              onChange={(e) => setAngles(e.target.value)}
              rows={5}
              className="glass-input w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <label className="mb-2 block text-sm font-black tracking-wide text-white">Surprising Facts</label>
            <p className="mb-2 text-[11px] text-slate-500">One per line.</p>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={5}
              className="glass-input w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-black tracking-wide text-white">Contrast Moments</label>
            <button
              type="button"
              onClick={() => setContrasts((c) => [...c, { common_belief: '', contrarian_reality: '' }])}
              className="text-[11px] font-bold text-pink-300 transition-colors hover:text-pink-200"
            >
              <i className="fas fa-plus mr-1 text-[10px]" />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {contrasts.map((c, i) => (
              <div key={i} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={c.common_belief}
                  onChange={(e) =>
                    setContrasts((arr) => arr.map((x, j) => (j === i ? { ...x, common_belief: e.target.value } : x)))
                  }
                  placeholder="Common belief"
                  className="glass-input w-full px-3 py-2 text-sm text-white placeholder-slate-500"
                />
                <input
                  value={c.contrarian_reality}
                  onChange={(e) =>
                    setContrasts((arr) =>
                      arr.map((x, j) => (j === i ? { ...x, contrarian_reality: e.target.value } : x)),
                    )
                  }
                  placeholder="Contrarian reality"
                  className="glass-input w-full px-3 py-2 text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setContrasts((arr) => arr.filter((_, j) => j !== i))}
                  aria-label="Remove contrast moment"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition-colors hover:border-red-500/30 hover:text-red-300"
                >
                  <i className="fas fa-trash text-[11px]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save research'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="text-sm font-bold text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Read-only mode ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {onSave && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={beginEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <i className="fas fa-pen text-[11px]" />
            Edit research
          </button>
        </div>
      )}

      {/* Executive summary */}
      {research.executive_summary && (
        <div className="glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black tracking-wide text-white">
            <i className="fas fa-file-lines text-pink-400" />
            Executive Summary
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">{research.executive_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ListCard icon="fa-bullseye" iconColor="text-orange-400" title="Engagement Angles" items={angleList} />
        <ListCard icon="fa-lightbulb" iconColor="text-amber-400" title="Surprising Facts" items={factList} />
      </div>

      {/* Contrast moments — myth vs reality */}
      {contrastList.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wide text-white">
            <i className="fas fa-scale-balanced text-purple-400" />
            Contrast Moments
          </h3>
          <div className="space-y-4">
            {contrastList.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]"
              >
                {/* Common belief */}
                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <i className="fas fa-comments mr-1.5" />
                    Common belief
                  </span>
                  <p className="text-sm leading-relaxed text-slate-400 line-through decoration-white/20">
                    {c.common_belief}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-orange-400/10 text-pink-400">
                    <i className="fas fa-arrow-right text-xs sm:rotate-0 rotate-90" />
                  </span>
                </div>

                {/* Contrarian reality */}
                <div className="rounded-3xl border border-pink-500/25 bg-gradient-to-br from-pink-500/[0.08] to-orange-400/[0.04] p-5">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-pink-400">
                    <i className="fas fa-bolt mr-1.5" />
                    Contrarian reality
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-white">
                    {c.contrarian_reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
