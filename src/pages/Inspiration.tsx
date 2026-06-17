import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import type { BusinessProfile, InspirationItem } from '../types/business'

function formatCount(n: number | null): string {
  if (n == null) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function Inspiration() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<BusinessProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [items, setItems] = useState<InspirationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adaptingId, setAdaptingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        authFetch('/api/business-profiles'),
        authFetch('/api/business-profiles/inspiration?limit=36'),
      ])
      if (pRes.ok) {
        const pData = await pRes.json()
        const ready: BusinessProfile[] = (pData.profiles || []).filter(
          (p: BusinessProfile) => p.status === 'ready'
        )
        setProfiles(ready)
        const active = ready.find((p) => p.is_active) || ready[0]
        setActiveId(active?.id ?? null)
      }
      if (fRes.ok) {
        const fData = await fRes.json()
        setItems(fData.items || [])
      }
    } catch {
      toast.error('Could not load inspiration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) || null,
    [profiles, activeId]
  )

  const handleAdapt = async (videoId: number) => {
    if (!activeId) {
      toast.error('Add and analyze a business first')
      navigate('/dashboard/business-studio')
      return
    }
    setAdaptingId(videoId)
    try {
      const res = await authFetch(`/api/business-profiles/${activeId}/adapt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceVideoId: videoId }),
      })
      if (res.status === 409) {
        toast.error('This video isn’t analyzed yet — try another one')
        return
      }
      if (res.status === 403) {
        toast.error('Adapting is a Creator-tier feature. Upgrade to use it.')
        return
      }
      if (!res.ok) {
        toast.error('Could not adapt this video')
        return
      }
      const script = await res.json()
      toast.success('Adapting for your business…')
      navigate(`/dashboard/script-studio/${script.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setAdaptingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspiration</h1>
          <p className="text-slate-400 text-sm mt-1">
            What’s breaking out right now across every niche. Pick anything — even something
            unrelated — and we’ll remix it into a script for your business.
          </p>
        </div>

        {profiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Adapt for
            </span>
            <select
              value={activeId ?? ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/50"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0e0e14]">
                  {p.name || p.source_url}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {profiles.length === 0 && !loading && (
        <div className="glass-card rounded-3xl p-6 mb-6 border border-pink-500/30 bg-pink-500/[0.04] flex items-center justify-between gap-4">
          <p className="text-slate-200 text-sm">
            Add your business first so we know what niche to adapt these into.
          </p>
          <button
            onClick={() => navigate('/dashboard/business-studio')}
            className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 whitespace-nowrap"
          >
            Add business
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-white/[0.08]">
          <p className="text-slate-400">No inspiration available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {items.map((it) => (
            <div
              key={it.video_id}
              className="group relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]"
            >
              <div className="aspect-[9/16] relative">
                {it.thumbnail_url ? (
                  <img
                    src={it.thumbnail_url}
                    alt={it.caption || 'inspiration'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/[0.04]" />
                )}

                {/* Outlier multiple badge */}
                {it.multiple != null && (
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-pink-500 text-white text-xs font-black">
                    {it.multiple.toFixed(1)}x
                  </span>
                )}

                {/* Bottom gradient + meta */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  {it.influencer_username && (
                    <p className="text-white text-xs font-semibold truncate">
                      @{it.influencer_username}
                    </p>
                  )}
                  <p className="text-slate-300 text-[10px] truncate">
                    {it.views != null ? `${formatCount(it.views)} views` : ''}
                    {it.platform ? ` · ${it.platform}` : ''}
                  </p>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => handleAdapt(it.video_id)}
                  disabled={adaptingId === it.video_id}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:scale-[1.02] transition disabled:opacity-50 disabled:hover:scale-100"
                >
                  {adaptingId === it.video_id ? (
                    <i className="fas fa-spinner fa-spin" />
                  ) : (
                    <>
                      <i className="fas fa-wand-magic-sparkles mr-1" />
                      Adapt{activeProfile ? ` for ${truncate(activeProfile.name || 'me', 14)}` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
