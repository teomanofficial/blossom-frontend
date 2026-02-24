import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch, API_URL } from '../lib/api'
import { supabase } from '../lib/supabase'

interface TrackedHashtag {
  id: number
  platform: string
  hashtag: string
  is_active: boolean
  max_videos_per_run: number
  total_runs: number
  total_videos: number
  last_run_status: string | null
  last_run_at: string | null
  created_at: string
}

interface DiscoveryProgress {
  type: 'manual' | 'scheduler'
  schedulerId?: number
  phase: 'fetching' | 'analyzing' | 'downloading' | 'completed' | 'error'
  totalHashtags: number
  completedHashtags: number
  currentHashtag?: string
  currentHashtagPlatform?: string
  currentHashtagVideosFetched: number
  currentHashtagMaxVideos: number
  currentHashtagNewVideos: number
  currentHashtagVideosAnalyzed: number
  currentHashtagVideosDownloaded: number
  currentHashtagTotalToProcess: number
  totalVideosFetched: number
  totalNewVideos: number
  totalVideosAnalyzed: number
  totalVideosDownloaded: number
  errors: Array<{ hashtag: string; error: string }>
  startedAt: string
  message?: string
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-teal-500/10 text-teal-400'
    case 'partial': return 'bg-amber-500/10 text-amber-400'
    case 'running': return 'bg-blue-500/10 text-blue-400'
    case 'analyzing': return 'bg-amber-500/10 text-amber-400'
    case 'fetching': return 'bg-blue-500/10 text-blue-400'
    case 'error': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

export default function TrackedHashtags() {
  const navigate = useNavigate()

  const [hashtags, setHashtags] = useState<TrackedHashtag[]>([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState<'' | 'tiktok' | 'instagram'>('')
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHashtag, setNewHashtag] = useState({ platform: 'tiktok', hashtag: '', max_videos_per_run: 30 })
  const [editingMaxVideos, setEditingMaxVideos] = useState<number | null>(null)
  const [editMaxValue, setEditMaxValue] = useState(30)

  // SSE progress
  const [manualProgress, setManualProgress] = useState<DiscoveryProgress | null>(null)
  const [schedulerProgress, setSchedulerProgress] = useState<Map<number, DiscoveryProgress>>(new Map())
  const eventSourceRef = useRef<EventSource | null>(null)

  const connectSSE = useCallback(async () => {
    if (eventSourceRef.current) eventSourceRef.current.close()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    const url = `${API_URL}/api/analysis/trending/progress?token=${encodeURIComponent(session.access_token)}`
    const es = new EventSource(url)
    eventSourceRef.current = es
    es.onmessage = (event) => {
      try {
        const data: DiscoveryProgress = JSON.parse(event.data)
        if (data.type === 'manual') {
          if (data.phase === 'completed') {
            setManualProgress(null)
            loadHashtags()
          } else {
            setManualProgress(data)
          }
        } else if (data.type === 'scheduler' && data.schedulerId) {
          if (data.phase === 'completed') {
            setSchedulerProgress(prev => { const next = new Map(prev); next.delete(data.schedulerId!); return next })
            loadHashtags()
          } else {
            setSchedulerProgress(prev => { const next = new Map(prev); next.set(data.schedulerId!, data); return next })
          }
        }
      } catch { /* heartbeat */ }
    }
    es.onerror = () => { /* auto-reconnects */ }
  }, [])

  useEffect(() => {
    connectSSE()
    return () => { eventSourceRef.current?.close() }
  }, [connectSSE])

  useEffect(() => { loadHashtags() }, [])

  async function loadHashtags() {
    try {
      setLoading(true)
      const res = await authFetch('/api/analysis/trending/hashtags')
      const data = await res.json()
      setHashtags(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load hashtags:', error)
    } finally {
      setLoading(false)
    }
  }

  function getActiveProgress(h: TrackedHashtag): DiscoveryProgress | undefined {
    return [manualProgress, ...Array.from(schedulerProgress.values())].find(
      p => p && p.currentHashtag === h.hashtag && p.currentHashtagPlatform === h.platform && p.phase !== 'completed'
    ) as DiscoveryProgress | undefined
  }

  async function handleAddHashtag(e: React.FormEvent) {
    e.preventDefault()
    if (!newHashtag.hashtag.trim()) return
    try {
      await authFetch('/api/analysis/trending/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHashtag),
      })
      setNewHashtag({ platform: 'tiktok', hashtag: '', max_videos_per_run: 30 })
      setShowAddForm(false)
      loadHashtags()
    } catch (error) {
      console.error('Failed to add hashtag:', error)
    }
  }

  async function toggleActive(h: TrackedHashtag) {
    try {
      await authFetch(`/api/analysis/trending/hashtags/${h.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !h.is_active }),
      })
      loadHashtags()
    } catch (error) {
      console.error('Failed to toggle hashtag:', error)
    }
  }

  async function deleteHashtag(id: number) {
    if (!confirm('Remove this hashtag? It will also be removed from all schedulers.')) return
    try {
      await authFetch(`/api/analysis/trending/hashtags/${id}`, { method: 'DELETE' })
      loadHashtags()
    } catch (error) {
      console.error('Failed to delete hashtag:', error)
    }
  }

  async function saveMaxVideos(hashtagId: number) {
    try {
      await authFetch(`/api/analysis/trending/hashtags/${hashtagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_videos_per_run: editMaxValue }),
      })
      setEditingMaxVideos(null)
      loadHashtags()
    } catch (error) {
      console.error('Failed to update max videos:', error)
    }
  }

  // Filter
  const filtered = hashtags.filter(h => {
    if (platform && h.platform !== platform) return false
    if (search && !h.hashtag.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const ttCount = hashtags.filter(h => h.platform === 'tiktok').length
  const igCount = hashtags.filter(h => h.platform === 'instagram').length
  const activeCount = hashtags.filter(h => h.is_active).length

  // Collect all currently running hashtags
  const allProgress = [manualProgress, ...Array.from(schedulerProgress.values())].filter(Boolean) as DiscoveryProgress[]
  const hasRunningJobs = allProgress.some(p => p.phase !== 'completed')

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/dashboard/discovery')}
            className="px-2 py-0.5 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <i className="fas fa-arrow-left text-[8px] mr-1.5"></i>Discovery
          </button>
          <span className="text-slate-700">/</span>
          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
            Tracked Hashtags
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Tracked Hashtags</h1>
            <p className="text-slate-500 text-sm font-medium">
              {hashtags.length} hashtags tracked
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="text-teal-400">{activeCount} active</span>
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="text-pink-400">TT {ttCount}</span>
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="text-orange-400">IG {igCount}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {([
                { value: '' as const, label: 'All' },
                { value: 'tiktok' as const, label: 'TikTok' },
                { value: 'instagram' as const, label: 'Instagram' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    platform === opt.value
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search hashtags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 w-56"
              />
            </div>
            {/* Add button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                showAddForm
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90'
              }`}
            >
              <i className="fas fa-plus text-[9px] mr-1.5"></i>Add
            </button>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <form onSubmit={handleAddHashtag} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Platform</label>
              <select
                value={newHashtag.platform}
                onChange={(e) => setNewHashtag({ ...newHashtag, platform: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500/50"
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Hashtag</label>
              <input
                type="text"
                placeholder="#hashtag"
                value={newHashtag.hashtag}
                onChange={(e) => setNewHashtag({ ...newHashtag, hashtag: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500/50 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Max Videos</label>
              <input
                type="number"
                min="5"
                max="100"
                value={newHashtag.max_videos_per_run}
                onChange={(e) => setNewHashtag({ ...newHashtag, max_videos_per_run: parseInt(e.target.value) || 30 })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white w-20 focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Add Hashtag
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-500 hover:text-slate-300 px-3 py-2 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </form>
        </div>
      )}

      {/* Running Jobs Banner */}
      {hasRunningJobs && (
        <div className="glass-card rounded-2xl p-4 mb-6 border border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Jobs Running</span>
          </div>
          <div className="space-y-1.5">
            {allProgress.filter(p => p.phase !== 'completed' && p.currentHashtag).map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  p.currentHashtagPlatform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                }`}>{p.currentHashtagPlatform === 'tiktok' ? 'TT' : 'IG'}</span>
                <span className="font-bold text-white">#{p.currentHashtag}</span>
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${statusColor(p.phase)}`}>{p.phase}</span>
                <span className="text-slate-500 font-bold">
                  {p.phase === 'fetching' && p.currentHashtagVideosFetched > 0 && `${p.currentHashtagVideosFetched} fetched`}
                  {p.phase === 'analyzing' && `${p.currentHashtagVideosAnalyzed}/${p.currentHashtagTotalToProcess}`}
                  {p.phase === 'downloading' && `${p.currentHashtagVideosDownloaded}/${p.currentHashtagTotalToProcess}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-hashtag text-pink-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Hashtags Found</h3>
          <p className="text-sm text-slate-500">
            {search || platform ? 'Try a different filter.' : 'Add hashtags to start tracking trending content.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hashtag</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Videos</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Max/Run</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Run</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const activeForThis = getActiveProgress(h)
                return (
                  <tr
                    key={h.id}
                    className={`border-b border-white/5 transition-colors ${
                      activeForThis
                        ? 'bg-blue-500/[0.03]'
                        : !h.is_active
                          ? 'opacity-40'
                          : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* # */}
                    <td className="px-5 py-3 text-slate-500 font-bold">{i + 1}</td>

                    {/* Platform */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        h.platform === 'tiktok'
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        <i className={h.platform === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'} />
                        {h.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                      </span>
                    </td>

                    {/* Hashtag */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {activeForThis && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0"></span>
                        )}
                        <span className="font-bold text-white">#{h.hashtag}</span>
                      </div>
                    </td>

                    {/* Videos */}
                    <td className="px-5 py-3 text-right font-black text-white">{h.total_videos || 0}</td>

                    {/* Max/Run */}
                    <td className="px-5 py-3 text-right">
                      {editingMaxVideos === h.id ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="number" min="5" max="100" value={editMaxValue}
                            onChange={(e) => setEditMaxValue(parseInt(e.target.value) || 5)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveMaxVideos(h.id)
                              if (e.key === 'Escape') setEditingMaxVideos(null)
                            }}
                            autoFocus
                            className="bg-white/10 border border-pink-500/50 rounded px-2 py-0.5 text-xs font-bold text-white w-14 focus:outline-none text-right"
                          />
                          <button onClick={() => saveMaxVideos(h.id)} className="text-xs text-teal-400 hover:text-teal-300"><i className="fas fa-check"></i></button>
                          <button onClick={() => setEditingMaxVideos(null)} className="text-xs text-slate-500 hover:text-slate-400"><i className="fas fa-times"></i></button>
                        </span>
                      ) : (
                        <span
                          className="font-bold text-slate-400 cursor-pointer hover:text-white transition-colors"
                          onClick={() => { setEditingMaxVideos(h.id); setEditMaxValue(h.max_videos_per_run) }}
                          title="Click to edit"
                        >
                          {h.max_videos_per_run}
                        </span>
                      )}
                    </td>

                    {/* Last Run */}
                    <td className="px-5 py-3 text-slate-500 text-xs font-bold">
                      {activeForThis ? (
                        <span className="text-blue-400">
                          {activeForThis.phase === 'fetching' && activeForThis.currentHashtagVideosFetched > 0
                            ? `${activeForThis.currentHashtagVideosFetched} fetched`
                            : activeForThis.phase === 'fetching'
                              ? 'Fetching...'
                              : activeForThis.phase === 'analyzing'
                                ? `${activeForThis.currentHashtagVideosAnalyzed}/${activeForThis.currentHashtagTotalToProcess} analyzed`
                                : activeForThis.phase === 'downloading'
                                  ? `${activeForThis.currentHashtagVideosDownloaded}/${activeForThis.currentHashtagTotalToProcess} downloaded`
                                  : activeForThis.phase
                          }
                        </span>
                      ) : (
                        timeAgo(h.last_run_at)
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      {activeForThis ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(activeForThis.phase)}`}>
                          {activeForThis.phase}
                        </span>
                      ) : h.last_run_status ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(h.last_run_status)}`}>
                          {h.last_run_status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(h)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
                            h.is_active
                              ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                              : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                          }`}
                        >
                          {h.is_active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => deleteHashtag(h.id)}
                          className="text-[10px] font-bold text-red-400/50 hover:text-red-400 px-2 py-1 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
