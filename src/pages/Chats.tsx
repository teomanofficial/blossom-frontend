import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface ChatThread {
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

function formatRelativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const diffWk = Math.floor(diffDay / 7)
  return `${diffWk} week${diffWk === 1 ? '' : 's'} ago`
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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
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

export default function Chats() {
  const [threads, setThreads] = useState<ChatThread[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const resp = await authFetch('/api/analysis-chat/threads')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        const list: ChatThread[] = Array.isArray(data) ? data : data?.threads ?? []
        if (!cancelled) setThreads(list)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load chats.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tighter">
          Your <span className="gradient-text">Chats</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Continue any conversation about your video analyses.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {Array.from({ length: 4 }, (_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-6 sm:p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
            <i className="fas fa-exclamation-circle text-slate-400 text-lg" />
          </div>
          <p className="text-sm text-slate-400 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && threads && threads.length === 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-6 sm:p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
            <i className="fas fa-comment-dots text-slate-400 text-lg" />
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">No chats yet</h3>
          <p className="text-sm text-slate-400 font-medium mb-5 max-w-md mx-auto">
            Open any analyzed video and click the Chat tab to start.
          </p>
          <Link
            to="/dashboard/analyze"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black text-sm px-8 py-3 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-pink-500/30"
          >
            <i className="fas fa-chart-simple text-xs" />
            Go to Virality Check
          </Link>
        </div>
      )}

      {!loading && !error && threads && threads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {threads.map((t) => {
            const caption = t.caption ? truncate(t.caption, 100) : 'Untitled video'
            const lastRaw = t.last_message ? truncate(t.last_message, 120) : ''
            const lastLine =
              lastRaw && t.last_message_role === 'user' ? `You: ${lastRaw}` : lastRaw
            return (
              <Link
                key={t.threadId}
                to={`/dashboard/analyze/${t.uploadId}?tab=chat`}
                className="glass-card rounded-2xl sm:rounded-3xl border border-white/[0.06] p-4 sm:p-5 hover:border-pink-500/30 hover:bg-white/[0.02] transition-all block"
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Thumbnail */}
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

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3
                        className="text-sm font-bold text-white leading-snug line-clamp-2"
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
                      <span className="text-[10px] text-slate-500 font-bold">
                        {t.message_count} {t.message_count === 1 ? 'message' : 'messages'}
                      </span>
                    </div>

                    {lastLine && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {lastLine}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
