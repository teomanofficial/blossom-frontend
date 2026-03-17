import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

interface OrphanVideo {
  id: number
  platform: string
  platform_id: string
  username: string
  caption: string | null
  views: number | null
  likes: number | null
  comments: number | null
  engagement_rate: number | null
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  status: string
  error_message: string | null
  created_at: string
  has_analysis: boolean
}

const PAGE_SIZE = 50

export default function OrphanVideos() {
  const [videos, setVideos] = useState<OrphanVideo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Keyword backfill state
  const [backfillStatus, setBackfillStatus] = useState<{ running: boolean; total: number; completed: number; failed: number } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)

      const res = await authFetch(`/api/analysis/videos/orphans?${params}`)
      const data = await res.json()
      setVideos(data.videos ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchVideos() }, [fetchVideos])
  useEffect(() => { setPage(0) }, [search])

  const fetchBackfillStatus = useCallback(async () => {
    try {
      const res = await authFetch('/api/analysis/videos/backfill-keywords/status')
      const data = await res.json()
      setBackfillStatus(data)
      return data.running
    } catch { return false }
  }, [])

  useEffect(() => {
    fetchBackfillStatus()
    const interval = setInterval(async () => {
      const running = await fetchBackfillStatus()
      if (!running) {
        clearInterval(interval)
        fetchVideos()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchBackfillStatus, fetchVideos])

  const startBackfill = async () => {
    try {
      const res = await authFetch('/api/analysis/videos/backfill-keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Backfill started' })
        fetchBackfillStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start backfill' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to start backfill' })
    }
  }

  const cancelBackfill = async () => {
    try {
      await authFetch('/api/analysis/videos/backfill-keywords/cancel', { method: 'POST' })
      setMessage({ type: 'success', text: 'Backfill cancelling...' })
    } catch { /* ignore */ }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const formatViews = (v: number | null) => {
    if (v == null) return '—'
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return String(v)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link to="/dashboard/categories" className="text-slate-500 hover:text-white transition-colors text-xs font-bold">
              <i className="fas fa-arrow-left mr-1"></i> Categories
            </Link>
            <span className="text-slate-600">/</span>
            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded">
              Orphans
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tighter mb-2">ORPHAN VIDEOS</h1>
          <p className="text-slate-500 text-sm font-medium">
            Videos without keyword links — invisible to the category system. Run keyword backfill to fix.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-yellow-400/70 uppercase mb-1 tracking-widest">Orphans</div>
            <div className="text-2xl font-black text-yellow-400">{total.toLocaleString()}</div>
          </div>
          {!backfillStatus?.running ? (
            <button
              onClick={startBackfill}
              disabled={total === 0}
              className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group disabled:opacity-30"
            >
              <div className="text-[10px] font-black text-red-400/70 uppercase mb-1 tracking-widest">Backfill Keywords</div>
              <div className="text-2xl font-black text-red-400 group-hover:text-red-300 transition-colors">
                <i className="fas fa-key"></i>
              </div>
            </button>
          ) : (
            <button
              onClick={cancelBackfill}
              className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group relative"
            >
              <div className="text-[10px] font-black text-red-400/70 uppercase mb-1 tracking-widest">Cancel</div>
              <div className="flex items-center gap-2">
                <i className="fas fa-spinner fa-spin text-red-400"></i>
                <span className="text-xs font-bold text-slate-400">
                  {backfillStatus.completed}/{backfillStatus.total}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Backfill Progress Banner */}
      {backfillStatus?.running && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin text-red-400"></i>
              <span className="text-sm font-bold text-red-400">Keyword Backfill Running</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {backfillStatus.completed.toLocaleString()} / {backfillStatus.total.toLocaleString()}
              {backfillStatus.failed > 0 && <span className="text-red-400 ml-1">({backfillStatus.failed} failed)</span>}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-500"
              style={{ width: `${backfillStatus.total > 0 ? (backfillStatus.completed / backfillStatus.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-3 glass-input px-4 py-2.5 rounded-xl">
          <i className="fas fa-search text-slate-500 text-sm"></i>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username, caption, or platform..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/15 transition-colors">
          Search
        </button>
      </form>

      {/* Video List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-500/10 rounded-full flex items-center justify-center">
            <i className="fas fa-check text-teal-400 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Orphan Videos</h3>
          <p className="text-sm text-slate-500">
            {search ? 'No matches found.' : 'All videos are linked to categories via keywords.'}
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Video</th>
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Creator</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Views</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Eng.</th>
                  <th className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Status</th>
                  <th className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Analysis</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          {getStorageUrl(v.local_thumbnail_path || v.thumbnail_url) ? (
                            <img src={getStorageUrl(v.local_thumbnail_path || v.thumbnail_url)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <i className="fas fa-video"></i>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-300 font-medium truncate max-w-[250px]">
                            {v.caption ? v.caption.substring(0, 80) : 'No caption'}
                          </p>
                          <span className="text-[10px] text-slate-600 font-bold">{v.platform} | ID: {v.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-400">@{v.username || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-black text-white">{formatViews(v.views)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-slate-400">
                        {v.engagement_rate != null ? `${Number(v.engagement_rate).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        v.status === 'analyzed' ? 'bg-teal-500/10 text-teal-400' :
                        v.status === 'error' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/5 text-slate-500'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.has_analysis ? (
                        <i className="fas fa-check text-teal-400 text-xs"></i>
                      ) : (
                        <i className="fas fa-times text-red-400 text-xs"></i>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="px-4 py-2 text-sm font-bold text-slate-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
