import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import type { BusinessProfile, BusinessStatus } from '../types/business'

const STATUS_LABEL: Record<BusinessStatus, string> = {
  pending: 'Queued',
  scraping: 'Reading your page…',
  analyzing: 'Understanding your business…',
  ready: 'Ready',
  error: 'Failed',
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'Website',
  app_store: 'App Store',
  play_store: 'Google Play',
}

const TABS = ['Product', 'Audience', 'Industries', 'Formats'] as const
type Tab = (typeof TABS)[number]

export default function BusinessStudio() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Product')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/business-profiles')
      if (!res.ok) throw new Error('load_failed')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch {
      toast.error('Could not load your businesses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Poll while any profile is mid-analysis.
  useEffect(() => {
    const anyPending = profiles.some(
      (p) => p.status === 'pending' || p.status === 'scraping' || p.status === 'analyzing'
    )
    if (anyPending && !pollRef.current) {
      pollRef.current = setInterval(load, 2500)
    } else if (!anyPending && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [profiles, load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/business-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      if (res.status === 403) {
        toast.error('Business Studio is a Creator-tier feature. Upgrade to use it.')
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error === 'invalid_url' ? 'That doesn’t look like a valid URL' : 'Could not add business')
        return
      }
      const created: BusinessProfile = await res.json()
      setUrl('')
      setProfiles((prev) => [created, ...prev])
      toast.success('Analyzing your business…')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (id: string) => {
    const res = await authFetch(`/api/business-profiles/${id}/activate`, { method: 'POST' })
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => ({ ...p, is_active: p.id === id })))
      toast.success('Active business updated')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await authFetch(`/api/business-profiles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      if (openId === id) setOpenId(null)
    }
  }

  const handleReanalyze = async (id: string) => {
    const res = await authFetch(`/api/business-profiles/${id}/reanalyze`, { method: 'POST' })
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'scraping' } : p)))
    }
  }

  const openProfile = profiles.find((p) => p.id === openId) || null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Business Studio</h1>
        <p className="text-slate-400 text-sm mt-1">
          Drop in your website or app-store listing. We read it, figure out what you do, who your
          audience is, and who actually pays — then make every script you write speak to them.
        </p>
      </div>

      {/* Add business */}
      <form onSubmit={handleAdd} className="glass-card rounded-3xl p-5 mb-6 border border-white/[0.08]">
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
          Add a business
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yoursite.com  ·  apps.apple.com/…  ·  play.google.com/…"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
          />
          <button
            type="submit"
            disabled={submitting || !url.trim()}
            className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 hover:scale-[1.02] transition disabled:opacity-40 disabled:hover:scale-100"
          >
            {submitting ? 'Adding…' : 'Analyze'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Works for any website — SaaS, mobile apps, restaurants, ecommerce, local businesses.
        </p>
      </form>

      {/* List */}
      {loading ? (
        <div className="glass-card rounded-3xl p-8 animate-pulse h-32" />
      ) : profiles.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-white/[0.08]">
          <i className="fas fa-store text-3xl text-slate-600 mb-3" />
          <p className="text-slate-400">No businesses yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((p) => {
            const busy = p.status === 'pending' || p.status === 'scraping' || p.status === 'analyzing'
            return (
              <div
                key={p.id}
                className={`glass-card rounded-3xl p-5 border transition ${
                  p.is_active ? 'border-pink-500/40 bg-pink-500/[0.04]' : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold truncate">{p.name || p.source_url}</h3>
                      {p.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black uppercase tracking-widest">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {SOURCE_LABEL[p.source_type] || 'Website'} · {p.source_url}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs">
                  {busy && (
                    <i className="fas fa-spinner fa-spin text-pink-400" aria-hidden />
                  )}
                  <span
                    className={
                      p.status === 'ready'
                        ? 'text-emerald-400'
                        : p.status === 'error'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                  {p.status === 'error' && p.error_message && (
                    <span className="text-slate-500 truncate">— {p.error_message}</span>
                  )}
                </div>

                {p.status === 'ready' && p.analysis_json?.one_liner && (
                  <p className="mt-3 text-sm text-slate-300 line-clamp-2">
                    {p.analysis_json.one_liner}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.status === 'ready' && (
                    <button
                      onClick={() => {
                        setOpenId(p.id)
                        setTab('Product')
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] text-white hover:bg-white/[0.1] transition"
                    >
                      View brief
                    </button>
                  )}
                  {!p.is_active && (
                    <button
                      onClick={() => handleActivate(p.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition"
                    >
                      Set active
                    </button>
                  )}
                  {p.status === 'error' && (
                    <button
                      onClick={() => handleReanalyze(p.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {profiles.some((p) => p.status === 'ready') && (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard/inspiration')}
            className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:scale-[1.02] transition"
          >
            <i className="fas fa-wand-magic-sparkles mr-2" />
            Find inspiration to adapt
          </button>
        </div>
      )}

      {/* Brief modal */}
      {openProfile && openProfile.analysis_json && (
        <BriefModal
          name={openProfile.name || openProfile.analysis_json.name}
          analysis={openProfile.analysis_json}
          tab={tab}
          setTab={setTab}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

function BriefModal({
  name,
  analysis,
  tab,
  setTab,
  onClose,
}: {
  name: string
  analysis: NonNullable<BusinessProfile['analysis_json']>
  tab: Tab
  setTab: (t: Tab) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-[rgba(14,14,20,0.98)] border border-white/[0.1] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/[0.08] flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{name}</h2>
            <p className="text-xs text-slate-400 truncate">{analysis.category || analysis.one_liner}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-white/[0.08] flex gap-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-bold transition border-b-2 ${
                tab === t
                  ? 'text-white border-pink-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto dashboard-scrollbar">
          {tab === 'Product' && (
            <div className="space-y-4">
              <Field label="One-liner" value={analysis.one_liner} />
              <Field label="What they do" value={analysis.what_they_do} />
              <Field label="Product" value={analysis.product_summary} />
              <Field label="Value proposition" value={analysis.value_proposition} />
            </div>
          )}

          {tab === 'Audience' && (
            <div className="space-y-5">
              <div>
                <SectionLabel>Target audiences</SectionLabel>
                <div className="space-y-3 mt-2">
                  {analysis.target_audiences.map((a, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
                      <h4 className="text-white font-bold">{a.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="text-slate-500">Who: </span>
                        {a.identity}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="text-slate-500">Behavior: </span>
                        {a.behavior}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Who pays</SectionLabel>
                <div className="space-y-3 mt-2">
                  {analysis.buyer_personas.map((b, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-white font-bold">{b.label}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                          {b.willingness_to_pay}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{b.who}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="text-slate-500">Why: </span>
                        {b.why_they_pay}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Industries' && (
            <div>
              <SectionLabel>Industries to watch for inspiration</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-3">
                {analysis.suggested_industries.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-200 text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <SectionLabel>Content angles</SectionLabel>
              <ul className="mt-3 space-y-2">
                {analysis.content_angles.map((a, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-pink-400">→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'Formats' && (
            <div>
              <SectionLabel>Formats that fit this business</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {analysis.suggested_formats.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 text-center text-white font-bold text-sm"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-sm text-slate-200 leading-relaxed mt-1">{value}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
      {children}
    </span>
  )
}
