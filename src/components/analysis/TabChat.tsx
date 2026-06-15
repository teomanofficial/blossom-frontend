import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../../lib/api'
import { hasTier } from '../upsell'

export interface TabChatProps {
  uploadId: number
  session: { access_token: string } | null
  analysisReady: boolean
  planSlug: string | null
  userType: string | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
}

interface PersistedMessage {
  id: number | string
  role: 'user' | 'model'
  content: string
}

interface ThreadListItem {
  threadId: number
  uploadId: number
  message_count?: number
  updated_at?: string
}

interface AnalysisContext {
  niche?: string | null
  formatClass?: string | null
  hookClass?: string | null
  platform?: string | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  durationSec?: number | null
  caption?: string | null
  hasFull?: boolean
  hasHook?: boolean
  hasVirality?: boolean
  hasImprovement?: boolean
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'model',
  content:
    "I've read the full analysis for this video — tactics, hook breakdown, virality scores, and improvement suggestions. What would you like to explore? You can ask about specific tactics, why a score is what it is, or how to adapt this format to a completely different niche or business.",
}

const SUGGESTED_QUESTIONS = [
  'Why is my hook score low?',
  'How would this format work for a SaaS product?',
  "What's the one change that would have the biggest impact?",
  'Apply the best tactic here to a fitness niche',
]

function makeId() {
  return `${performance.now()}-${Math.floor(Math.random() * 1e9)}`
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return (navigator.maxTouchPoints ?? 0) > 0
}

function platformIcon(p?: string | null): string {
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
  out = out.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
  return out
}

function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n')
  const blocks: JSX.Element[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    const numMatch = /^\s*\d+\.\s+(.*)$/.exec(line)
    const bulMatch = /^\s*[-•]\s+(.*)$/.exec(line)
    if (numMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const m = /^\s*\d+\.\s+(.*)$/.exec(lines[i])
        if (!m) break
        items.push(m[1])
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
        const m = /^\s*[-•]\s+(.*)$/.exec(lines[i])
        if (!m) break
        items.push(m[1])
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

export default function TabChat({ uploadId, session, analysisReady, planSlug, userType }: TabChatProps) {
  const effectiveSlug = userType === 'admin' || userType === 'vip' ? 'platin' : planSlug ?? 'free'
  const hasCreatorTier = hasTier(effectiveSlug, 'pro')

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contextData, setContextData] = useState<AnalysisContext | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [threadId, setThreadId] = useState<number | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isMobile = useMemo(() => isMobileDevice(), [])

  // Auto-clear error after 6s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(t)
  }, [error])

  // Load persisted thread + messages on mount
  useEffect(() => {
    if (!hasCreatorTier || !analysisReady || !session?.access_token) return
    let cancelled = false
    const token = session.access_token

    async function loadMessages(tid: number) {
      const resp = await fetch(`${API_URL}/api/analysis-chat/threads/${tid}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      const list: PersistedMessage[] = Array.isArray(data) ? data : data?.messages ?? []
      return list
    }

    async function run() {
      setHistoryLoading(true)
      try {
        let tid = threadId
        if (!tid) {
          const listResp = await fetch(`${API_URL}/api/analysis-chat/threads`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!listResp.ok) throw new Error(`HTTP ${listResp.status}`)
          const listData = await listResp.json()
          const threads: ThreadListItem[] = Array.isArray(listData) ? listData : listData?.threads ?? []
          const match = threads.find((t) => Number(t.uploadId) === Number(uploadId))
          if (!match) {
            if (!cancelled) setHistoryLoading(false)
            return
          }
          tid = match.threadId
          if (!cancelled) setThreadId(tid)
        }
        const loaded = await loadMessages(tid)
        if (cancelled) return
        if (loaded.length > 0) {
          setMessages([
            INITIAL_GREETING,
            ...loaded.map((m) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, session?.access_token, analysisReady, hasCreatorTier])

  // Fetch context pills when analysis is ready and user has access
  useEffect(() => {
    if (!hasCreatorTier || !analysisReady || !session?.access_token) return
    let cancelled = false
    setContextLoading(true)
    fetch(`${API_URL}/api/analysis-chat/${uploadId}/context`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setContextData(data ?? {})
      })
      .catch(() => {
        if (cancelled) return
        setContextData({})
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [uploadId, session?.access_token, analysisReady, hasCreatorTier])

  // Auto-scroll to bottom on new message / streamed chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea up to 3 lines
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 3 + 16
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
  }, [inputValue])

  // Cleanup any in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // ─── Gate: Plan ───
  if (!hasCreatorTier) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
          <i className="fas fa-comment-dots text-pink-400 text-lg" />
        </div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">Chat with your analysis</h3>
        <p className="text-sm text-slate-400 font-medium mb-5 max-w-md mx-auto">
          Analysis Chat is available on the Creator plan and above.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black text-sm px-8 py-3 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-pink-500/30"
        >
          <i className="fas fa-crown text-xs" />
          See plans
        </Link>
      </div>
    )
  }

  // ─── Gate: Analysis ready ───
  if (!analysisReady) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-white/10">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
          <i className="fas fa-hourglass-half text-slate-400 text-lg" />
        </div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">Almost there</h3>
        <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
          Analysis must complete before you can chat.
        </p>
      </div>
    )
  }

  // ─── Send message ───
  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || !session?.access_token) return

    setError(null)
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: trimmed }
    const placeholder: ChatMessage = { id: makeId(), role: 'model', content: '' }
    const historyForApi = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg, placeholder])
    setInputValue('')
    setIsStreaming(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch(`${API_URL}/api/analysis-chat/${uploadId}/message`, {
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
        if (resp.status === 403) throw new Error('Analysis Chat is available on the Creator plan and above.')
        throw new Error(`Chat failed (${resp.status}). Please try again.`)
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
          if (parsed.threadId) setThreadId(Number(parsed.threadId))
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

      // Flush any remaining buffered content
      if (buffer.length > 0) {
        const tail = buffer + (buffer.endsWith('\n') ? '' : '')
        const blocks = tail.split('\n\n')
        for (const block of blocks) {
          if (!block.trim()) continue
          if (processBlock(block)) break
        }
      }

      setIsStreaming(false)
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return
    if (e.shiftKey) return
    if (isMobile) return
    e.preventDefault()
    sendMessage(inputValue)
  }

  const pills: { label: string; icon?: string }[] = contextData
    ? [
        { label: contextData.formatClass ? `Format: ${contextData.formatClass}` : 'Format: Unknown format' },
        { label: contextData.hookClass ? `Hook: ${contextData.hookClass}` : 'Hook: Unknown hook' },
        { label: contextData.niche ? `Niche: ${contextData.niche}` : 'Niche: Unknown niche' },
        {
          label: contextData.platform ? `Platform: ${contextData.platform}` : 'Platform: Unknown',
          icon: platformIcon(contextData.platform),
        },
      ]
    : []

  const mobilePillText = contextData
    ? `Analyzing: ${contextData.niche || 'Unknown niche'} • ${contextData.platform || 'Unknown'}`
    : ''

  const lastMessage = messages[messages.length - 1]
  const isLastEmptyStreaming = isStreaming && lastMessage?.role === 'model' && lastMessage.content === ''

  return (
    <div
      className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden"
      style={{ height: 'calc(100vh - 280px)', minHeight: 500 }}
    >
      {/* Zone 1 — Context pill bar */}
      <div className="flex-shrink-0 h-12 border-b border-white/[0.06] flex items-center px-3 sm:px-4 overflow-x-auto scrollbar-hide">
        {contextLoading ? (
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-6 w-24 rounded-full bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile collapsed pill */}
            <div className="md:hidden">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 whitespace-nowrap">
                {mobilePillText}
              </span>
            </div>
            {/* Desktop pills */}
            <div className="hidden md:flex gap-2 min-w-max">
              {pills.map((p, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 whitespace-nowrap uppercase tracking-wider"
                >
                  {p.icon && <i className={`${p.icon} text-[10px]`} />}
                  {p.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Zone 2 — Message list */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-3"
      >
        {historyLoading && (
          <div className="space-y-2 mb-4">
            <div className="h-3 w-2/3 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
          </div>
        )}
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          const isLast = idx === messages.length - 1
          const showTypingDots = isLast && isStreaming && m.role === 'model' && m.content === ''
          const showCursor = isLast && isStreaming && m.role === 'model' && m.content !== ''
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={
                  isUser
                    ? 'max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-gradient-to-br from-pink-500 to-orange-400 text-white text-sm font-medium shadow-lg shadow-pink-500/20'
                    : 'max-w-[90%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] text-slate-100 text-sm'
                }
              >
                {showTypingDots ? (
                  <div className="flex items-center gap-1 py-1" aria-label="AI is typing">
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

        {/* Suggestion chips after initial greeting */}
        {messages.length === 1 && !isStreaming && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-pink-500/30 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone 3 — Input bar */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-3 sm:px-4 py-3 bg-slate-950/80">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            aria-label="Chat message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about tactics, scores, cross-niche ideas..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/40 disabled:opacity-50 leading-5"
            style={{ maxHeight: 76 }}
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={() => sendMessage(inputValue)}
            disabled={isStreaming || inputValue.trim() === ''}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:from-slate-700 disabled:to-slate-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 min-h-[16px] flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {isStreaming && !isLastEmptyStreaming ? 'AI is typing...' : isLastEmptyStreaming ? 'AI is thinking...' : ''}
          </span>
          {error && <span className="text-[11px] text-red-400 font-bold">{error}</span>}
        </div>
      </div>
    </div>
  )
}
