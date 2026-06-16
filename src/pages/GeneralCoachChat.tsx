import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CoachChatPanel from '../components/CoachChatPanel'
import MentorAnalysisSessions from '../components/MentorAnalysisSessions'
import { API_URL } from '../lib/api'
import {
  GENERAL_MENTOR_BASE,
  MENTOR_LABEL,
  MENTOR_SESSION_LABEL,
  formatRelativeTime,
  truncate,
  type MentorSession,
} from '../lib/mentor'

type HubTab = 'mentor' | 'analysis'

/* ── Session list (shared by desktop sidebar + mobile sheet) ── */
function SessionList({
  sessions,
  loading,
  activeId,
  onSelect,
  onDelete,
  deletingId,
}: {
  sessions: MentorSession[]
  loading: boolean
  activeId: number | null
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  deletingId: number | null
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-slate-400 font-medium">
          No {MENTOR_SESSION_LABEL}s yet. Start a new one to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2 min-w-0">
      {sessions.map((s) => {
        const isActive = s.threadId === activeId
        const title = s.title?.trim() || `New ${MENTOR_SESSION_LABEL}`
        const preview = s.lastMessage ? truncate(s.lastMessage, 60) : 'No messages yet'
        const isConfirming = confirmingId === s.threadId
        const isDeleting = deletingId === s.threadId
        return (
          <div
            key={s.threadId}
            className={`group relative rounded-2xl border transition-all ${
              isActive
                ? 'nav-link-active bg-white/[0.07] border-pink-500/30'
                : 'border-transparent hover:bg-white/[0.04] hover:border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(s.threadId)}
              className="w-full text-left px-3.5 py-3 pr-9"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-white truncate" title={title}>
                  {title}
                </span>
                <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap shrink-0">
                  {formatRelativeTime(s.updatedAt)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5" title={s.lastMessage || undefined}>
                {preview}
              </p>
            </button>

            {/* Inline-confirm delete — reveals on hover, fixed slot avoids reflow. */}
            <div className="absolute top-2.5 right-2.5">
              {isConfirming ? (
                <div className="flex items-center gap-1 rounded-lg bg-slate-900/95 border border-white/10 p-0.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => onDelete(s.threadId)}
                    disabled={isDeleting}
                    aria-label="Confirm delete"
                    className="w-6 h-6 rounded-md bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 disabled:opacity-50"
                  >
                    <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-check'} text-[10px]`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={isDeleting}
                    aria-label="Cancel delete"
                    className="w-6 h-6 rounded-md bg-white/10 text-slate-300 flex items-center justify-center hover:bg-white/20"
                  >
                    <i className="fas fa-xmark text-[10px]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(s.threadId)}
                  aria-label="Delete session"
                  className="w-6 h-6 rounded-md text-slate-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <i className="fas fa-trash text-[10px]" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function GeneralCoachChat() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ threadId?: string }>()
  const routeThreadId = params.threadId ? Number(params.threadId) : null

  const [tab, setTab] = useState<HubTab>('mentor')
  const [sessions, setSessions] = useState<MentorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Draft mode: an empty conversation surface with a composer but no DB thread
  // yet. Entered via "New session" (even when other sessions exist) so the real
  // thread can be created lazily on the first message.
  const [draft, setDraft] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)
  const token = session?.access_token

  const fetchSessions = useCallback(async (): Promise<MentorSession[]> => {
    if (!token) return []
    const resp = await fetch(`${API_URL}${GENERAL_MENTOR_BASE}/threads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const list: MentorSession[] = Array.isArray(data) ? data : data?.threads ?? []
    return list
  }, [token])

  // Fetch sessions when the token becomes available. No didInit ref — under
  // StrictMode the cancelled mount no-ops while the live mount completes the
  // fetch and clears `loading`.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const list = await fetchSessions()
        if (cancelled) return
        setSessions(list)
      } catch {
        if (!cancelled) {
          setSessions([])
          setError('Could not load your sessions. Please retry.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, fetchSessions, reloadNonce])

  // Auto-open the newest session when landing on the bare /dashboard/mentor hub
  // so returning users resume their latest thread. Skipped while in draft mode
  // (the user explicitly asked for a fresh, empty surface).
  useEffect(() => {
    if (loading || routeThreadId || draft) return
    const newest = sessions[0]
    if (newest) navigate(`/dashboard/mentor/${newest.threadId}`, { replace: true })
  }, [loading, routeThreadId, draft, sessions, navigate])

  const refreshSessions = useCallback(async () => {
    try {
      const list = await fetchSessions()
      setSessions(list)
    } catch {
      // keep existing list on transient failure
    }
  }, [fetchSessions])

  // "New session" — drop into draft mode rather than creating a DB thread up
  // front. The thread is created lazily when the user sends the first message,
  // so nothing appears in the sidebar until it actually has a message.
  const startDraft = useCallback(() => {
    setDraft(true)
    setSheetOpen(false)
    navigate('/dashboard/mentor')
  }, [navigate])

  // Create the real thread on the first message from draft mode. Returns the new
  // threadId (or null on failure). Does NOT optimistically insert into the list
  // — refreshSessions (onFirstMessage) surfaces it once it has a message.
  const ensureThread = useCallback(async (): Promise<number | null> => {
    if (!token) return null
    try {
      const resp = await fetch(`${API_URL}${GENERAL_MENTOR_BASE}/threads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      const newId = Number(data.threadId)
      return Number.isFinite(newId) ? newId : null
    } catch {
      return null
    }
  }, [token])

  // Reflect the freshly-created thread in the URL and leave draft mode. The
  // panel sets its self-created ref before calling this, so the resulting
  // threadId change does NOT reset the in-flight conversation.
  const handleThreadCreated = useCallback(
    (id: number) => {
      setDraft(false)
      navigate(`/dashboard/mentor/${id}`)
    },
    [navigate],
  )

  const deleteSession = useCallback(
    async (threadId: number) => {
      if (!token) return
      setDeletingId(threadId)
      try {
        const resp = await fetch(`${API_URL}${GENERAL_MENTOR_BASE}/threads/${threadId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const remaining = sessions.filter((s) => s.threadId !== threadId)
        setSessions(remaining)
        if (routeThreadId === threadId) {
          const nextSession = remaining[0]
          if (nextSession) {
            navigate(`/dashboard/mentor/${nextSession.threadId}`, { replace: true })
          } else {
            // Last session gone — fall back to the draft surface (composer
            // present), not an empty-state block.
            setDraft(false)
            navigate('/dashboard/mentor', { replace: true })
          }
        }
      } catch {
        // leave list unchanged on failure
      } finally {
        setDeletingId(null)
      }
    },
    [token, sessions, routeThreadId, navigate],
  )

  const selectSession = useCallback(
    (id: number) => {
      setDraft(false)
      setSheetOpen(false)
      navigate(`/dashboard/mentor/${id}`)
    },
    [navigate],
  )

  const activeId = routeThreadId
  // In draft mode there is no thread yet; otherwise the panel tracks the route.
  const panelThreadId = draft ? null : activeId

  // ── Sidebar header (New session) ──
  const newSessionButton = (
    <button
      type="button"
      onClick={startDraft}
      className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-white text-[12px] font-black uppercase tracking-wide px-3 py-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-transform"
    >
      <i className="fa-solid fa-plus text-[11px]" />
      New {MENTOR_SESSION_LABEL}
    </button>
  )

  const sidebar = (
    <div className="flex flex-col h-full min-h-0 w-full min-w-0">
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/[0.06] shrink-0 min-w-0">
        <span className="text-sm font-black font-display tracking-tight text-white truncate min-w-0">{MENTOR_LABEL}</span>
        {newSessionButton}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto dashboard-scrollbar">
        <SessionList
          sessions={sessions}
          loading={loading}
          activeId={activeId}
          onSelect={selectSession}
          onDelete={deleteSession}
          deletingId={deletingId}
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-9rem)] lg:h-[calc(100vh-9rem)] min-h-[480px]">
      {/* Hub tabs */}
      <div className="flex items-center gap-1.5 mb-4 shrink-0">
        {([
          { id: 'mentor' as const, label: `${MENTOR_LABEL} ${MENTOR_SESSION_LABEL}s`, icon: 'fa-seedling' },
          { id: 'analysis' as const, label: 'Analysis sessions', icon: 'fa-film' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-bold transition-all ${
              tab === t.id
                ? 'bg-white/[0.08] text-white border border-white/15'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <i className={`fa-solid ${t.icon} text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mentor' ? (
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Desktop session sidebar */}
          <aside className="hidden lg:flex w-[300px] shrink-0 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl overflow-hidden">
            {sidebar}
          </aside>

          {/* Conversation surface — always error, initial spinner, or the panel
              (which carries the composer, even in draft mode with no thread). */}
          <div className="flex-1 min-w-0 min-h-0">
            {error ? (
              <div className="h-full rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center text-center px-6 py-10">
                <div className="w-12 h-12 mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-exclamation-circle text-slate-400 text-lg" />
                </div>
                <p className="text-sm text-slate-400 font-medium max-w-md">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="inline-flex items-center gap-2 mt-5 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black text-sm px-6 py-2.5 shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <i className="fa-solid fa-rotate-right text-xs" />
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="h-full rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-slate-500 text-xl" />
              </div>
            ) : (
              <CoachChatPanel
                threadId={panelThreadId}
                onFirstMessage={refreshSessions}
                onOpenSessions={() => setSheetOpen(true)}
                onNewSession={startDraft}
                ensureThread={ensureThread}
                onThreadCreated={handleThreadCreated}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto dashboard-scrollbar pr-0.5">
          <MentorAnalysisSessions />
        </div>
      )}

      {/* Mobile session slide-over */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-[#0a0a0f] border-r border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {sidebar}
          </div>
        </div>
      )}
    </div>
  )
}
