import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { API_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { GENERAL_MENTOR_BASE, MENTOR_LABEL, type MentorPersistedMessage } from '../lib/mentor'

interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'model',
  content:
    "Hey! I'm your Blossom content mentor — think of me as a strategist with a combined billion views of experience across TikTok, Reels, and YouTube. I can help with hooks, script structure, niche positioning, finding your unique angle, growing from zero, or breaking through a plateau. What are you working on?",
}

const SUGGESTED_QUESTIONS = [
  "I'm a complete beginner — where do I start?",
  'Help me write a hook for my [niche] content',
  "Why aren't my videos getting views?",
  'How do I find my unique angle as a creator?',
  'Write me a 30-second script for my product',
  'What format should I use for my niche?',
]

function makeId() {
  return `${performance.now()}-${Math.floor(Math.random() * 1e9)}`
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return (navigator.maxTouchPoints ?? 0) > 0
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(s: string): string {
  let out = escapeHtml(s)
  out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-pink-300 font-mono text-[0.85em]">$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-white">$1</strong>')
  // Single-asterisk emphasis -> italic. Runs after ** so it only sees genuine
  // single pairs. Disallows whitespace adjacent to the asterisks and forbids
  // a "*" inside, so it won't re-consume bold or match stray markers.
  out = out.replace(/(^|[^*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, '$1<em class="italic">$2</em>')
  out = out.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
  return out
}

function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n')
  const blocks: JSX.Element[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const numMatch = /^\s*\d+\.\s+(.*)$/.exec(line)
    const bulMatch = /^\s*[-•*]\s+(.*)$/.exec(line)
    if (numMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const m = /^\s*\d+\.\s+(.*)$/.exec(lines[i] ?? '')
        if (!m) break
        items.push(m[1] ?? '')
        i++
      }
      blocks.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-1">
          {items.map((it, k) => (
            <li key={k} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />
          ))}
        </ol>,
      )
      continue
    }
    if (bulMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const m = /^\s*[-•*]\s+(.*)$/.exec(lines[i] ?? '')
        if (!m) break
        items.push(m[1] ?? '')
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-1">
          {items.map((it, k) => (
            <li key={k} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />
          ))}
        </ul>,
      )
      continue
    }
    if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-2" />)
      i++
      continue
    }
    blocks.push(
      <p key={key++} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />,
    )
    i++
  }
  return <div className="space-y-1">{blocks}</div>
}

/** Gradient mentor avatar dot, aligned to model bubbles + heroes. */
function MentorAvatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-7 h-7 text-xs'
  return (
    <div
      className={`${dim} shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/25`}
    >
      <i className="fa-solid fa-seedling text-white" />
    </div>
  )
}

export interface CoachChatPanelProps {
  /** Active general-mentor session id, or null in draft mode (no thread yet). */
  threadId: number | null
  /** Called after the first user message lands in a brand-new session so the
   *  sidebar can refresh its auto-generated title. */
  onFirstMessage?: () => void
  /** Mobile: open the sessions slide-over. */
  onOpenSessions?: () => void
  /** Start a new (draft) session. */
  onNewSession?: () => void
  /** Draft mode: lazily create the real DB thread on the first message.
   *  Resolves to the new threadId, or null on failure. */
  ensureThread?: () => Promise<number | null>
  /** Draft mode: notify the parent of the freshly-created threadId so it can
   *  reflect it in the URL. Called after the panel records the self-created id,
   *  so the resulting threadId change does not reset the live conversation. */
  onThreadCreated?: (id: number) => void
}

export default function CoachChatPanel({
  threadId,
  onFirstMessage,
  onOpenSessions,
  onNewSession,
  ensureThread,
  onThreadCreated,
}: CoachChatPanelProps) {
  const { session } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isMobile = useMemo(() => isMobileDevice(), [])
  // Tracks whether this session already had a user message (controls the
  // one-shot onFirstMessage callback that refreshes the sidebar title).
  const sentFirstRef = useRef(false)
  // When the panel creates a thread from draft mode it records the new id here.
  // The history-load effect uses it to skip exactly one reset/fetch so the
  // in-flight stream survives the null → newId threadId change.
  const selfCreatedIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(t)
  }, [error])

  // Load history when the active session changes. Carefully avoids clobbering an
  // in-flight stream: in draft mode (null) it just shows the fresh greeting, and
  // for the panel's own freshly-created thread it skips one reset so the live
  // messages survive the null → newId transition.
  useEffect(() => {
    const token = session?.access_token
    if (!token) return

    // Draft mode — no thread yet. Show the hero + greeting; never fetch.
    if (threadId === null) {
      abortRef.current?.abort()
      setIsStreaming(false)
      setMessages([INITIAL_GREETING])
      sentFirstRef.current = false
      setHistoryLoading(false)
      return
    }

    // This panel just created `threadId` from a draft send — it already holds
    // the live (streaming) messages. Skip the reset/fetch exactly once, then
    // fall back to normal behavior for any later visit to this id.
    if (selfCreatedIdRef.current === threadId) {
      selfCreatedIdRef.current = null
      return
    }

    // A different existing session was selected — load its persisted history.
    let cancelled = false
    const activeThreadId = threadId

    setMessages([INITIAL_GREETING])
    sentFirstRef.current = false
    abortRef.current?.abort()
    setIsStreaming(false)

    async function run() {
      setHistoryLoading(true)
      try {
        const resp = await fetch(`${API_URL}${GENERAL_MENTOR_BASE}/threads/${activeThreadId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        const list: MentorPersistedMessage[] = Array.isArray(data) ? data : data?.messages ?? []
        if (cancelled) return
        if (list.length > 0) {
          sentFirstRef.current = true
          setMessages([
            INITIAL_GREETING,
            ...list.map((m) => ({
              id: String(m.id),
              role: m.role,
              content: m.content,
            })),
          ])
        }
      } catch {
        // silent fallback — keep default greeting
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [threadId, session?.access_token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    // Reset so scrollHeight reflects current content, and hide the scrollbar
    // while measuring/growing so it never flashes.
    el.style.height = 'auto'
    el.style.overflowY = 'hidden'
    const cs = getComputedStyle(el)
    const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const lineHeight = 22
    const maxLines = 5
    const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const maxHeight = lineHeight * maxLines + paddingY + borderY
    // scrollHeight = content + padding (no border). For border-box we must add
    // the border so the content fits exactly with no spurious overflow.
    const fullHeight = el.scrollHeight + borderY
    if (fullHeight > maxHeight) {
      el.style.height = maxHeight + 'px'
      el.style.overflowY = 'auto'   // only now is scrolling allowed
    } else {
      el.style.height = fullHeight + 'px'
      // overflowY stays 'hidden'
    }
  }, [inputValue])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || !session?.access_token) return

    setError(null)
    const isFirst = !sentFirstRef.current
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: trimmed }
    const placeholder: ChatMessage = { id: makeId(), role: 'model', content: '' }
    const historyForApi = [...messages, userMsg]
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg, placeholder])
    setInputValue('')
    setIsStreaming(true)

    // Resolve the thread we're posting to. In draft mode (no thread yet) create
    // the real one now — before the first POST — then reflect it in the URL.
    // The user bubble + typing dots are already on screen, so this stays live.
    let targetThreadId = threadId
    if (targetThreadId === null) {
      const created = ensureThread ? await ensureThread() : null
      if (created === null) {
        setError("Couldn't start a new session. Please try again.")
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last && last.role === 'model' && last.content === '') copy.pop()
          return copy
        })
        setIsStreaming(false)
        return
      }
      // Record before navigation so the threadId change skips the history reset.
      selfCreatedIdRef.current = created
      targetThreadId = created
      onThreadCreated?.(created)
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch(`${API_URL}${GENERAL_MENTOR_BASE}/threads/${targetThreadId}/message`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: historyForApi }),
      })

      if (!resp.ok) {
        if (resp.status === 429) throw new Error('Too many messages. Please wait before sending more.')
        throw new Error(`Couldn't reach your mentor (${resp.status}). Please try again.`)
      }
      if (!resp.body) throw new Error('No response stream received.')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let done = false

      const processBlock = (block: string): boolean => {
        const lines = block.split('\n')
        const dataLine = lines.find((ln) => ln.startsWith('data:'))
        if (!dataLine) return false
        const payload = dataLine.slice(5).trim()
        if (!payload || payload === '[DONE]') return false
        let parsed: any
        try {
          parsed = JSON.parse(payload)
        } catch {
          return false
        }
        if (parsed.error) {
          throw new Error(typeof parsed.error === 'string' ? parsed.error : 'Stream error')
        }
        if (parsed.done) {
          return true
        }
        if (typeof parsed.chunk === 'string' && parsed.chunk.length > 0) {
          const chunk = parsed.chunk
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last && last.role === 'model') {
              copy[copy.length - 1] = { ...last, content: last.content + chunk }
            }
            return copy
          })
        }
        return false
      }

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })

        let sepIdx: number
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sepIdx)
          buffer = buffer.slice(sepIdx + 2)
          if (processBlock(block)) {
            done = true
            break
          }
        }
      }

      if (buffer.length > 0) {
        const blocks = buffer.split('\n\n')
        for (const block of blocks) {
          if (!block.trim()) continue
          if (processBlock(block)) break
        }
      }

      setIsStreaming(false)
      if (isFirst) {
        sentFirstRef.current = true
        onFirstMessage?.()
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setIsStreaming(false)
        return
      }
      const msg = err?.message || 'Something went wrong.'
      setError(msg)
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last && last.role === 'model' && last.content === '') copy.pop()
        return copy
      })
      setIsStreaming(false)
    }
  }

  // Suggestions populate the composer (caret at the end) so the user can edit
  // or append before sending — they never auto-send.
  function fillInput(text: string) {
    setInputValue(text)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return
    if (e.shiftKey) return
    if (isMobile) return
    e.preventDefault()
    sendMessage(inputValue)
  }

  const lastMessage = messages[messages.length - 1]
  const isLastEmptyStreaming = isStreaming && lastMessage?.role === 'model' && lastMessage.content === ''
  const isFresh = messages.length === 1 && !isStreaming && !historyLoading

  return (
    <div className="flex flex-col h-full min-h-0 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden">
      {/* Zone 1 — Identity bar */}
      <div className="flex-shrink-0 h-14 border-b border-white/[0.06] flex items-center gap-3 px-4 sm:px-5">
        {onOpenSessions && (
          <button
            type="button"
            onClick={onOpenSessions}
            aria-label="Open sessions"
            className="lg:hidden -ml-1 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
          >
            <i className="fa-solid fa-bars-staggered text-sm" />
          </button>
        )}
        <MentorAvatar />
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-black uppercase tracking-widest text-white leading-tight">
            {MENTOR_LABEL}
          </span>
          <span className="text-[10px] text-slate-400 font-medium leading-tight truncate">
            Content strategy · Virality · Personal branding
          </span>
        </div>
        {onNewSession && (
          <button
            type="button"
            onClick={onNewSession}
            aria-label={`New ${MENTOR_LABEL} session`}
            className="lg:hidden ml-auto w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-pink-500/20 active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-plus text-sm" />
          </button>
        )}
      </div>

      {/* Zone 2 — Message log */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-5 sm:py-7 dashboard-scrollbar"
      >
        {historyLoading && (
          <div className="mx-auto w-full max-w-[720px] space-y-2 mb-4">
            <div className="h-3 w-2/3 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
          </div>
        )}

        {isFresh ? (
          /* Centered new-session hero */
          <div className="h-full flex flex-col items-center justify-center text-center px-2 py-6">
            <MentorAvatar size="lg" />
            <h2 className="mt-4 text-xl sm:text-2xl font-black font-display tracking-tighter text-white">
              What are you working on?
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md">
              Your personal content strategist — ask about hooks, scripts, formats, niche
              positioning, or growing on any platform.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => fillInput(q)}
                  className="text-left px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/[0.07] hover:border-pink-500/30 hover:-translate-y-0.5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[720px] space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user'
              const isLast = idx === messages.length - 1
              const showTypingDots = isLast && isStreaming && m.role === 'model' && m.content === ''
              const showCursor = isLast && isStreaming && m.role === 'model' && m.content !== ''
              return (
                <div key={m.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="mt-0.5">
                      <MentorAvatar />
                    </div>
                  )}
                  <div
                    className={
                      isUser
                        ? 'max-w-[82%] rounded-3xl rounded-br-md px-4 py-2.5 bg-gradient-to-br from-pink-500 to-orange-400 text-white text-[15px] font-medium leading-relaxed shadow-lg shadow-pink-500/20'
                        : 'max-w-[88%] rounded-3xl rounded-tl-md px-4 py-3 bg-white/[0.05] border border-white/[0.08] text-slate-100 text-[15px] leading-relaxed'
                    }
                  >
                    {showTypingDots ? (
                      <div className="flex items-center gap-1 py-1" aria-label="Mentor is thinking">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : isUser ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <div>
                        {renderMarkdown(m.content)}
                        {showCursor && <span className="inline-block w-1.5 h-4 align-middle bg-pink-400 ml-0.5 animate-pulse" />}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Zone 3 — Composer */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-3 sm:px-5 py-3.5 bg-slate-950/80">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={textareaRef}
              aria-label="Message your mentor"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about hooks, scripts, formats, growth strategy..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/40 focus:shadow-[0_0_0_4px_rgba(244,114,182,0.08)] disabled:opacity-50 leading-[22px] transition-shadow"
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={() => sendMessage(inputValue)}
              disabled={isStreaming || inputValue.trim() === ''}
              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:from-slate-700 disabled:to-slate-700"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
          <div className="mt-1.5 min-h-[16px] flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {isStreaming && !isLastEmptyStreaming ? 'Mentor is replying…' : isLastEmptyStreaming ? 'Mentor is thinking…' : ''}
            </span>
            {error && <span className="text-[11px] text-red-400 font-bold">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
