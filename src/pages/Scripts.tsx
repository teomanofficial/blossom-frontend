import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'
import type { ScriptRecord, ScriptStatus } from '../types/scripts'

const STATUS_META: Record<ScriptStatus, { label: string; cls: string }> = {
  topic: { label: 'Draft', cls: 'bg-white/[0.06] text-slate-400 border-white/10' },
  researching: { label: 'Researching', cls: 'bg-pink-500/10 text-pink-300 border-pink-500/25' },
  research_ready: { label: 'Research ready', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
  hooks_ready: { label: 'Hooks ready', cls: 'bg-orange-500/10 text-orange-300 border-orange-500/25' },
  scripting: { label: 'Writing', cls: 'bg-pink-500/10 text-pink-300 border-pink-500/25' },
  script_ready: { label: 'Ready', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
  error: { label: 'Error', cls: 'bg-red-500/10 text-red-300 border-red-500/25' },
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Scripts() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scripts, setScripts] = useState<ScriptRecord[]>([])

  useEffect(() => {
    let cancelled = false
    authFetch('/api/analysis/scripts')
      .then((res) => (res.ok ? (res.json() as Promise<ScriptRecord[] | { scripts: ScriptRecord[] }>) : null))
      .then((data) => {
        if (cancelled || !data) return
        setScripts(Array.isArray(data) ? data : data.scripts ?? [])
      })
      .catch((err) => console.error('Failed to load scripts:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">My Scripts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your script drafts and finished spoken-word scripts.
          </p>
        </div>
        <Link
          to="/dashboard/script-studio"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500"
        >
          <i className="fas fa-wand-magic-sparkles text-xs" />
          New Script
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
            <i className="fas fa-wand-magic-sparkles text-2xl text-slate-600" />
          </div>
          <h3 className="mb-2 text-lg font-bold">No scripts yet</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500">
            Turn any topic into a research-backed, outlier-modeled spoken-word script.
          </p>
          <Link
            to="/dashboard/script-studio"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500"
          >
            <i className="fas fa-plus text-xs" />
            Create your first script
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-3xl">
          {/* Column header (desktop) */}
          <div className="hidden grid-cols-[1fr_140px_140px] gap-4 border-b border-white/[0.06] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid">
            <span>Name</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {scripts.map((s) => {
              const meta = STATUS_META[s.status] ?? STATUS_META.topic
              const title = s.title || s.topic || 'Untitled script'
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/script-studio/${s.id}`)}
                    className="grid w-full grid-cols-1 items-center gap-2 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:grid-cols-[1fr_140px_140px] sm:gap-4"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-white">{title}</span>
                    <span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{formatDate(s.created_at)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
