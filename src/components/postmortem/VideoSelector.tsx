/**
 * VideoSelector — dropdown for picking which of the user's analyzed
 * videos to run a post-mortem on. Reads from `GET /api/content-analysis`
 * (the same endpoint that powers the analysis history list).
 *
 * The selector is intentionally lightweight — no fuzzy search, no
 * pagination cursor — because the list of "your own analyzed videos"
 * is small (tens, not thousands) for normal users.
 *
 * onChange navigates the parent page to `/dashboard/post-mortem/:id`,
 * so this component is self-contained from the page's perspective.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../lib/api'

interface AnalyzedVideo {
  id: number
  title: string | null
  caption: string | null
  username: string | null
  platform: string
  thumbnail_path: string | null
  views: number
  status: string
  created_at: string
}

interface VideoSelectorProps {
  currentVideoId: string
  /** Optional: parent may inject hand-picked video summary copy. */
  className?: string
}

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  if (!Number.isFinite(d)) return ''
  const diff = Date.now() - d
  const day = 86_400_000
  if (diff < day) return 'today'
  const days = Math.floor(diff / day)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function VideoSelector({ currentVideoId, className = '' }: VideoSelectorProps) {
  const navigate = useNavigate()
  const [videos, setVideos] = useState<AnalyzedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch('/api/content-analysis?limit=50&offset=0')
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const items: AnalyzedVideo[] = Array.isArray(data?.uploads) ? data.uploads : []
        setVideos(items.filter((v) => v.status === 'completed'))
      } catch {
        if (!cancelled) setVideos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Close on outside click / ESC.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!popoverRef.current) return
      if (
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = videos.find((v) => String(v.id) === String(currentVideoId)) ?? null
  const triggerLabel = current
    ? current.title || current.caption || `Video #${current.id}`
    : 'Pick one of your videos'

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors max-w-full"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <i className="fas fa-film text-[10px] text-purple-300" aria-hidden="true" />
        <span className="truncate max-w-[200px] sm:max-w-[280px]">{triggerLabel}</span>
        <i
          className={`fas fa-chevron-down text-[9px] text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          role="listbox"
          className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-40 rounded-2xl bg-[#0a0a12] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Your analyzed videos
            </div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              Pick one to autopsy
            </div>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              <i className="fas fa-circle-notch fa-spin mr-2" />
              Loading your videos…
            </div>
          ) : videos.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No analyzed videos yet. Run an analysis first.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto dashboard-scrollbar py-1">
              {videos.map((v) => {
                const isActive = String(v.id) === String(currentVideoId)
                const label = v.title || v.caption || `Video #${v.id}`
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        setOpen(false)
                        navigate(`/dashboard/post-mortem/${v.id}`)
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.06] transition-colors ${
                        isActive ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                        <i
                          className={`fab ${
                            v.platform === 'tiktok' ? 'fa-tiktok' : 'fa-instagram'
                          } text-xs text-slate-300`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-100 truncate">
                          {label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {v.username ? `@${v.username} · ` : ''}
                          {relativeTime(v.created_at)}
                        </div>
                      </div>
                      {isActive ? (
                        <i className="fas fa-circle-check text-pink-400 text-xs shrink-0" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
