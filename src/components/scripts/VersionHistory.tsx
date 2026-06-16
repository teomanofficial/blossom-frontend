import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../../lib/api'
import type { ScriptRecord, ScriptVersion } from '../../types/scripts'

interface VersionHistoryProps {
  scriptId: string
  open: boolean
  onClose: () => void
  /** Called with the refreshed script after a successful restore. */
  onRestored: (script: ScriptRecord) => void
}

const SOURCE_META: Record<string, { label: string; icon: string; cls: string }> = {
  manual: { label: 'Manual edit', icon: 'fa-pen', cls: 'text-sky-300' },
  refine: { label: 'Refine', icon: 'fa-wand-magic-sparkles', cls: 'text-pink-300' },
  generate: { label: 'Generated', icon: 'fa-bolt', cls: 'text-orange-300' },
}

function formatWhen(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Slide-over listing a script's body version history with restore. */
export default function VersionHistory({ scriptId, open, onClose, onRestored }: VersionHistoryProps) {
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<ScriptVersion[]>([])
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    authFetch(`/api/analysis/scripts/${scriptId}/versions`)
      .then((res) => (res.ok ? (res.json() as Promise<{ versions: ScriptVersion[] }>) : null))
      .then((data) => {
        if (!cancelled && data) setVersions(data.versions ?? [])
      })
      .catch((err) => console.error('Failed to load versions:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, scriptId])

  const restore = async (versionId: string) => {
    setRestoringId(versionId)
    try {
      const res = await authFetch(`/api/analysis/scripts/${scriptId}/versions/${versionId}/restore`, {
        method: 'POST',
      })
      if (!res.ok) {
        toast.error('Could not restore this version')
        return
      }
      const script = (await res.json()) as ScriptRecord
      onRestored(script)
      toast.success('Version restored')
      onClose()
    } catch (err) {
      console.error('Restore error:', err)
      toast.error('Could not restore this version')
    } finally {
      setRestoringId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/[0.06] bg-[#0b0b12]/95 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-black tracking-wide text-white">
            <i className="fas fa-clock-rotate-left text-pink-400" />
            Version history
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No previous versions yet.</p>
          ) : (
            <ul className="space-y-3">
              {versions.map((v, idx) => {
                const meta = SOURCE_META[v.source || ''] ?? {
                  label: v.source || 'Version',
                  icon: 'fa-file-lines',
                  cls: 'text-slate-300',
                }
                return (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ${meta.cls}`}>
                      <i className={`fas ${meta.icon} text-xs`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        {meta.label}
                        {idx === 0 && (
                          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                            Latest
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {formatWhen(v.created_at)}
                        {v.word_count != null && ` · ${v.word_count} words`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restore(v.id)}
                      disabled={restoringId != null}
                      className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                    >
                      {restoringId === v.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
