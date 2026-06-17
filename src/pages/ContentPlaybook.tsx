import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch, API_URL } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { ContentPlaybook, PlaybookRecord, PlaybookChatMessage } from '../types/business'

export default function ContentPlaybook() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<PlaybookRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await authFetch(`/api/business-profiles/playbook/${id}`)
      if (res.status === 404) {
        toast.error('Playbook not found')
        navigate('/dashboard/inspiration')
        return
      }
      if (!res.ok) throw new Error('load_failed')
      setRecord(await res.json())
    } catch {
      toast.error('Could not load playbook')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  // Poll while generating.
  useEffect(() => {
    const busy = record?.status === 'scripting' || record?.status === 'topic'
    if (busy && !pollRef.current) {
      pollRef.current = setInterval(load, 2500)
    } else if (!busy && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [record?.status, load])

  const regenerate = async () => {
    if (!id) return
    const res = await authFetch(`/api/business-profiles/playbook/${id}/regenerate`, { method: 'POST' })
    if (res.ok) {
      setRecord((r) => (r ? { ...r, status: 'scripting' } : r))
      toast.success('Rebuilding your playbook…')
    }
  }

  if (loading) {
    return <div className="glass-card rounded-3xl p-8 animate-pulse h-64 max-w-5xl mx-auto" />
  }

  if (!record) return null

  if (record.status === 'scripting' || record.status === 'topic') {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-3xl p-10 text-center border border-white/[0.08]">
        <i className="fas fa-wand-magic-sparkles text-3xl text-pink-400 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Building your content playbook…</h2>
        <p className="text-slate-400 text-sm mt-2">
          Reverse-engineering the winning video and directing your version. This takes ~15 seconds.
        </p>
      </div>
    )
  }

  if (record.status === 'error' || !record.guidance_json) {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-3xl p-10 text-center border border-red-500/30">
        <i className="fas fa-triangle-exclamation text-3xl text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white">Couldn’t build the playbook</h2>
        <p className="text-slate-400 text-sm mt-2">{record.error_message || 'Something went wrong.'}</p>
        <button
          onClick={regenerate}
          className="mt-5 px-5 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <PlaybookView
      scriptId={id!}
      businessName={record.business_name}
      g={record.guidance_json}
      script={record.script_text || ''}
      onRegenerate={regenerate}
    />
  )
}

/* ────────────────────────────────────────────────────────── */

function PlaybookView({
  scriptId,
  businessName,
  g,
  script,
  onRegenerate,
}: {
  scriptId: string
  businessName: string | null
  g: ContentPlaybook
  script: string
  onRegenerate: () => void
}) {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Header / concept */}
        <div className="glass-card rounded-3xl p-6 border border-white/[0.08]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                Content Playbook{businessName ? ` · ${businessName}` : ''}
              </span>
              <h1 className="text-xl font-bold text-white mt-1">{g.one_line_concept}</h1>
            </div>
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition whitespace-nowrap"
            >
              <i className="fas fa-rotate mr-1" />
              Regenerate
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Pill icon="fa-clapperboard">{g.video_type}</Pill>
            <Pill icon="fa-shapes">{g.format}</Pill>
            {g.estimated_duration_seconds > 0 && (
              <Pill icon="fa-clock">{g.estimated_duration_seconds}s</Pill>
            )}
            <Pill icon="fa-bullhorn">{g.cta.type === 'lead' ? 'Lead CTA' : 'Follow CTA'}</Pill>
          </div>
          {g.why_this_works_for_you && (
            <p className="text-sm text-slate-300 leading-relaxed mt-4">
              <span className="text-slate-500 font-semibold">Why this works for you: </span>
              {g.why_this_works_for_you}
            </p>
          )}
          {g.format_rationale && (
            <p className="text-xs text-slate-400 mt-2">{g.format_rationale}</p>
          )}
        </div>

        {/* Hook */}
        <Card icon="fa-bolt" title="The Hook">
          {g.hook.spoken && <Line label="Say">{g.hook.spoken}</Line>}
          {g.hook.on_screen_text && <Line label="On-screen text">{g.hook.on_screen_text}</Line>}
          {g.hook.visual && <Line label="Open on">{g.hook.visual}</Line>}
          {g.hook.why_it_works && <Line label="Why it stops the scroll">{g.hook.why_it_works}</Line>}
          {g.hook.scroll_stop_drivers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {g.hook.scroll_stop_drivers.map((d, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 text-[11px] font-medium">
                  {d}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Beats — the core guidance */}
        <Card icon="fa-list-ol" title="Beat-by-beat: what to say & how">
          <div className="space-y-3">
            {g.beats.map((b, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-white font-bold text-sm">
                    {b.label}
                    {b.time && <span className="text-slate-500 font-normal ml-2">{b.time}</span>}
                  </span>
                  {b.dopamine_trigger && (
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 text-[10px] font-bold uppercase tracking-wide">
                      {b.dopamine_trigger}
                    </span>
                  )}
                </div>
                {b.goal && <p className="text-xs text-slate-400 mb-2">{b.goal}</p>}
                {b.what_to_say.length > 0 && (
                  <div className="rounded-xl bg-black/30 p-3 mb-2">
                    {b.what_to_say.map((line, j) => (
                      <p key={j} className="text-sm text-slate-100 leading-relaxed">
                        “{line}”
                      </p>
                    ))}
                  </div>
                )}
                {b.how_to_say_it && <Line label="How to deliver">{b.how_to_say_it}</Line>}
                {b.on_screen_text && <Line label="On-screen text">{b.on_screen_text}</Line>}
                {b.visual_direction && <Line label="Show">{b.visual_direction}</Line>}
                {b.retention_cue && <Line label="Keeps them watching">{b.retention_cue}</Line>}
              </div>
            ))}
          </div>
        </Card>

        {/* Pacing + dopamine + payoff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card icon="fa-gauge-high" title="Pacing">
            <Line label="Style">{g.pacing.style}</Line>
            <Line label="Shot length">{g.pacing.shot_length}</Line>
            <Line label="Cut frequency">{g.pacing.cut_frequency}</Line>
            <Line label="Energy curve">{g.pacing.energy_curve}</Line>
          </Card>
          <Card icon="fa-trophy" title="The Payoff">
            <Line label="What">{g.payoff.what}</Line>
            <Line label="When">{g.payoff.when}</Line>
            <Line label="Loop back">{g.payoff.loop_back}</Line>
            <Line label="CTA">{g.cta.line}</Line>
          </Card>
        </div>

        {g.dopamine_triggers.length > 0 && (
          <Card icon="fa-brain" title="Dopamine triggers">
            <div className="space-y-2">
              {g.dopamine_triggers.map((d, i) => (
                <div key={i} className="text-sm text-slate-300">
                  <span className="text-violet-300 font-semibold">{d.trigger}</span>
                  {d.where && <span className="text-slate-500"> · {d.where}</span>}
                  {d.how && <p className="text-xs text-slate-400 mt-0.5">{d.how}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Production lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {g.shot_list.length > 0 && (
            <Card icon="fa-video" title="Shot list">
              <Bullets items={g.shot_list} />
            </Card>
          )}
          {g.on_screen_text_plan.length > 0 && (
            <Card icon="fa-closed-captioning" title="On-screen text plan">
              <Bullets items={g.on_screen_text_plan} />
            </Card>
          )}
          {g.recording_tips.length > 0 && (
            <Card icon="fa-circle-check" title="Recording tips">
              <Bullets items={g.recording_tips} />
            </Card>
          )}
          {g.common_mistakes.length > 0 && (
            <Card icon="fa-triangle-exclamation" title="Avoid these mistakes" tone="warn">
              <Bullets items={g.common_mistakes} />
            </Card>
          )}
        </div>

        {/* Full script */}
        {script && <ScriptCard script={script} />}
      </div>

      {/* Mentor chat sidebar */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4">
          <IdeaMentorChat scriptId={scriptId} />
        </div>
      </div>
    </div>
  )
}

/* ── small presentational helpers ── */

function Card({
  icon,
  title,
  tone,
  children,
}: {
  icon: string
  title: string
  tone?: 'warn'
  children: React.ReactNode
}) {
  return (
    <div
      className={`glass-card rounded-3xl p-5 border ${
        tone === 'warn' ? 'border-amber-500/20' : 'border-white/[0.08]'
      }`}
    >
      <h3 className="text-base font-bold text-white mb-3">
        <i className={`fas ${icon} mr-2 ${tone === 'warn' ? 'text-amber-400' : 'text-pink-400'} text-sm`} />
        {title}
      </h3>
      {children}
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null
  return (
    <p className="text-sm text-slate-300 leading-relaxed mt-1">
      <span className="text-slate-500">{label}: </span>
      {children}
    </p>
  )
}

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  if (!children) return null
  return (
    <span className="px-3 py-1 rounded-full bg-white/[0.06] text-slate-200 text-xs font-bold">
      <i className={`fas ${icon} mr-1.5 text-slate-400`} />
      {children}
    </span>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="text-sm text-slate-300 flex gap-2">
          <span className="text-pink-400 mt-0.5">→</span>
          {it}
        </li>
      ))}
    </ul>
  )
}

function ScriptCard({ script }: { script: string }) {
  const copy = () => {
    navigator.clipboard.writeText(script).then(
      () => toast.success('Script copied'),
      () => toast.error('Copy failed')
    )
  }
  return (
    <Card icon="fa-file-lines" title="Full script">
      <button
        onClick={copy}
        className="float-right -mt-9 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition"
      >
        <i className="fas fa-copy mr-1" />
        Copy
      </button>
      <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-sans mt-1">
        {script}
      </pre>
    </Card>
  )
}

/* ── Mentor chat (SSE) ── */

function IdeaMentorChat({ scriptId }: { scriptId: string }) {
  const [messages, setMessages] = useState<PlaybookChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await authFetch(`/api/business-profiles/playbook/${scriptId}/chat`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    })()
  }, [scriptId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'model', content: '' }])
    setStreaming(true)

    try {
      // Manual fetch (not authFetch) so we can attach the bearer token and read
      // the SSE stream body directly.
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/business-profiles/playbook/${scriptId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok || !res.body) {
        throw new Error('chat_failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          try {
            const payload = JSON.parse(line.slice(5).trim())
            if (payload.chunk) {
              setMessages((m) => {
                const copy = [...m]
                const last = copy[copy.length - 1]
                if (last && last.role === 'model') last.content += payload.chunk
                return copy
              })
            } else if (payload.error) {
              throw new Error(payload.error)
            }
          } catch {
            /* ignore non-JSON keepalives */
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m]
        const last = copy[copy.length - 1]
        if (last && last.role === 'model' && !last.content) {
          last.content = '⚠️ Could not reach the mentor. Try again.'
        }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="glass-card rounded-3xl border border-white/[0.08] flex flex-col h-[600px]">
      <div className="p-4 border-b border-white/[0.08]">
        <h3 className="text-base font-bold text-white">
          <i className="fas fa-seedling mr-2 text-emerald-400 text-sm" />
          Talk to your mentor
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Ask about this idea — angles, hooks, what to shoot, how to make it hit.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 dashboard-scrollbar">
        {messages.length === 0 && (
          <div className="text-sm text-slate-500">
            Try: “Make the hook punchier”, “What B-roll should I shoot?”, or “Give me 3 alternative
            openers.”
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-pink-500/20 text-white'
                : 'bg-white/[0.05] text-slate-200'
            }`}
          >
            {m.content || (streaming && i === messages.length - 1 ? <i className="fas fa-spinner fa-spin text-slate-400" /> : '')}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/[0.08]">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="Ask your mentor…"
            className="flex-1 resize-none px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 disabled:opacity-40"
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>
    </div>
  )
}
