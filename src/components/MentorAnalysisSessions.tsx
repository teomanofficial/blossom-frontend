import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { formatRelativeTime, truncate, MENTOR_SESSION_LABEL } from '../lib/mentor'

interface AnalysisThread {
  threadId: number
  uploadId: number
  thumbnail_path: string | null
  caption: string | null
  platform: string | null
  last_message: string | null
  last_message_role: 'user' | 'model' | null
  message_count: number
  updated_at: string
}

function platformIcon(p: string | null): string {
  switch ((p || '').toLowerCase()) {
    case 'tiktok':
      return 'fa-brands fa-tiktok'
    case 'instagram':
      return 'fa-brands fa-instagram'
    case 'youtube':
      return 'fa-brands fa-youtube'
    case 'facebook':
      return 'fa-brands fa-facebook'
    default:
      return 'fa-solid fa-video'
  }
}

function platformLabel(p: string | null): string {
  if (!p) return 'upload'
  const lower = p.toLowerCase()
  if (lower === 'tiktok') return 'TikTok'
  if (lower === 'instagram') return 'Instagram'
  if (lower === 'youtube') return 'YouTube'
  if (lower === 'facebook') return 'Facebook'
  return p
}

function ThreadCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-4 sm:p-5 animate-pulse">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-16 h-16 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 w-3/4 rounded bg-white/5" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
          <div className="h-3 w-2/3 rounded bg-white/5" />
        </div>
      </div>
    </div>
  )
}

/**
 * Per-video Analysis Mentor sessions. Each card links into the analyze detail
 * view's Mentor tab. Hovering reveals an inline-confirm delete that removes the
 * conversation via DELETE /api/analysis-chat/threads/:id.
 */
export default function MentorAnalysisSessions() {
  const [threads, setThreads] = useState<AnalysisThread[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const resp = await authFetch('/api/analysis-chat/threads')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        const list: AnalysisThread[] = Array.isArray(data) ? data : data?.threads ?? []
        if (!cancelled) setThreads(list)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || `Failed to load ${MENTOR_SESSION_LABEL}s.`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDelete(threadId: number) {
    setDeletingId(threadId)
    try {
      const resp = await authFetch(`/api/analysis-chat/threads/${threadId}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      setThreads((prev) => (prev ? prev.filter((t) => t.threadId !== threadId) : prev))
      setConfirmingId(null)
    } catch (err: any) {
      setError(err?.message || `Couldn't delete that ${MENTOR_SESSION_LABEL}.`)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          <ThreadCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-6 sm:p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
          <i className="fas fa-exclamation-circle text-slate-400 text-lg" />
        </div>
        <p className="text-sm text-slate-400 font-medium">{error}</p>
      </div>
    )
  }

  if (threads && threads.length === 0) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-6 sm:p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
          <i className="fas fa-film text-slate-400 text-lg" />
        </div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">No analysis sessions yet</h3>
        <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
          Run a Virality Check and open its Mentor tab to start a conversation about a specific video.
        </p>
        <Link
          to="/dashboard/analyze"
          className="inline-flex items-center gap-2 mt-5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black text-sm px-6 py-2.5 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-pink-500/30"
        >
          <i className="fas fa-chart-simple text-xs" />
          New Virality Check
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {threads?.map((t) => {
        const caption = t.caption ? truncate(t.caption, 100) : 'Untitled video'
        const lastRaw = t.last_message ? truncate(t.last_message, 120) : ''
        const lastLine = lastRaw && t.last_message_role === 'user' ? `You: ${lastRaw}` : lastRaw
        const isConfirming = confirmingId === t.threadId
        const isDeleting = deletingId === t.threadId
        return (
          <div
            key={t.threadId}
            className="group relative glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] hover:border-pink-500/30 hover:bg-white/[0.02] transition-all"
          >
            <Link to={`/dashboard/analyze/${t.uploadId}?tab=chat`} className="block p-4 sm:p-5">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                  {t.thumbnail_path ? (
                    <img
                      src={t.thumbnail_path}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <i className={`${platformIcon(t.platform)} text-slate-500 text-xl`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3
                      className="text-sm font-bold text-white leading-snug line-clamp-2 pr-8"
                      title={t.caption || undefined}
                    >
                      {caption}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap shrink-0">
                      {formatRelativeTime(t.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      <i className={`${platformIcon(t.platform)} text-[9px]`} />
                      {platformLabel(t.platform)}
                    </span>
                  </div>

                  {lastLine && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{lastLine}</p>
                  )}
                </div>
              </div>
            </Link>

            {/* Inline-confirm delete — reveals on hover, never shifts layout. */}
            <div className="absolute top-3 right-3">
              {isConfirming ? (
                <div className="flex items-center gap-1 rounded-xl bg-slate-900/90 border border-white/10 p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleDelete(t.threadId)}
                    disabled={isDeleting}
                    aria-label="Confirm delete"
                    className="w-7 h-7 rounded-lg bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 disabled:opacity-50"
                  >
                    <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-check'} text-[11px]`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={isDeleting}
                    aria-label="Cancel delete"
                    className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center hover:bg-white/20"
                  >
                    <i className="fas fa-xmark text-[11px]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(t.threadId)}
                  aria-label="Delete session"
                  className="w-7 h-7 rounded-lg bg-slate-900/80 border border-white/10 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/40 transition-all"
                >
                  <i className="fas fa-trash text-[11px]" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
