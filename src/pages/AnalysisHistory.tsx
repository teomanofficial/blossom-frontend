import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'

interface HistoryItem {
  id: number
  source_type: string
  platform: string
  source_url: string | null
  thumbnail_path: string | null
  caption: string | null
  username: string | null
  views: number
  likes: number
  comments_count: number
  shares: number
  saves: number
  engagement_rate: number
  status: string
  error_message: string | null
  optimization_score: number | null
  created_at: string
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AnalysisHistory() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set())
  const limit = 20

  const fetchHistory = useCallback(async (currentOffset: number, silent = false) => {
    if (!session?.access_token) return
    if (!silent) setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis?limit=${limit}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await resp.json()
      if (resp.ok && data.uploads && Array.isArray(data.uploads)) {
        setHistory(data.uploads)
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    fetchHistory(offset)
  }, [fetchHistory, offset])

  // Auto-refresh when there are processing items
  useEffect(() => {
    const hasProcessing = history.some(h => h.status === 'analyzing' || h.status === 'pending')
    if (!hasProcessing) return
    const interval = setInterval(() => fetchHistory(offset, true), 30000)
    return () => clearInterval(interval)
  }, [history, fetchHistory, offset])

  const handleViewResult = (item: HistoryItem) => {
    navigate(`/dashboard/analyze?id=${item.id}`)
  }

  const handleRetry = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation()
    if (!session?.access_token) return
    setRetryingIds(prev => new Set(prev).add(itemId))
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis/${itemId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (resp.ok) {
        // Update local state to show processing
        setHistory(prev => prev.map(h => h.id === itemId ? { ...h, status: 'analyzing', error_message: null } : h))
      }
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
                History
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">
              Analysis <span className="gradient-text">History</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              View all your past content analyses and results.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/analyze')}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all text-sm"
          >
            <i className="fas fa-plus mr-2"></i>
            New Analysis
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Analyses</div>
          <div className="text-2xl font-black text-white">{total}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Completed</div>
          <div className="text-2xl font-black text-green-400">
            {history.filter(h => h.status === 'completed').length}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Score</div>
          <div className="text-2xl font-black text-pink-400">
            {(() => {
              const scored = history.filter(h => h.optimization_score != null)
              if (scored.length === 0) return '—'
              const avg = scored.reduce((sum, h) => sum + (Number(h.optimization_score) || 0), 0) / scored.length
              return Math.round(avg)
            })()}
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-2xl text-pink-400 mr-3"></i>
          <span className="text-slate-400">Loading history...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <i className="fas fa-inbox text-3xl text-slate-600"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-2">No analyses yet</h3>
          <p className="text-slate-600 text-sm mb-6">Start by analyzing a video to see your history here.</p>
          <button
            onClick={() => navigate('/dashboard/analyze')}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all text-sm"
          >
            <i className="fas fa-wand-magic-sparkles mr-2"></i>
            Analyze Content
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewResult(item)}
              className="w-full text-left glass-card rounded-2xl p-5 hover:bg-white/[0.06] transition-all group border border-transparent hover:border-white/10"
            >
              <div className="flex items-center gap-5">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.thumbnail_path ? (
                    <img
                      src={item.thumbnail_path.startsWith('http') ? item.thumbnail_path : `/media/${item.thumbnail_path.split('/').pop()}`}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <i className={`fab fa-${item.platform === 'tiktok' ? 'tiktok' : item.platform === 'instagram' ? 'instagram' : 'video'} text-xl ${
                      item.platform === 'tiktok' ? 'text-white' : item.platform === 'instagram' ? 'text-pink-400' : 'text-slate-500'
                    }`}></i>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                      item.platform === 'tiktok'
                        ? 'bg-white/10 text-white'
                        : item.platform === 'instagram'
                        ? 'bg-pink-500/10 text-pink-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {item.platform || 'upload'}
                    </span>
                    {item.username && (
                      <span className="text-xs text-slate-500">@{item.username}</span>
                    )}
                    <span className="text-[10px] text-slate-600 ml-auto">{formatDate(item.created_at)}</span>
                  </div>

                  {item.caption && (
                    <p className="text-sm text-slate-300 truncate mb-2">{item.caption}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {item.views > 0 && (
                      <span><i className="fas fa-eye mr-1"></i>{formatNumber(item.views)}</span>
                    )}
                    {item.likes > 0 && (
                      <span><i className="fas fa-heart mr-1"></i>{formatNumber(item.likes)}</span>
                    )}
                    {item.comments_count > 0 && (
                      <span><i className="fas fa-comment mr-1"></i>{formatNumber(item.comments_count)}</span>
                    )}
                    {item.shares > 0 && (
                      <span><i className="fas fa-share mr-1"></i>{formatNumber(item.shares)}</span>
                    )}
                  </div>
                </div>

                {/* Score + Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.optimization_score != null && (
                    <div className={`text-center px-3 py-2 rounded-xl ${
                      item.optimization_score >= 80
                        ? 'bg-green-500/10'
                        : item.optimization_score >= 50
                        ? 'bg-yellow-500/10'
                        : 'bg-red-500/10'
                    }`}>
                      <div className={`text-lg font-black ${
                        item.optimization_score >= 80
                          ? 'text-green-400'
                          : item.optimization_score >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {item.optimization_score}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score</div>
                    </div>
                  )}

                  {item.status === 'error' ? (
                    <button
                      onClick={(e) => handleRetry(e, item.id)}
                      disabled={retryingIds.has(item.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title={item.error_message || 'Analysis failed'}
                    >
                      {retryingIds.has(item.id) ? (
                        <><i className="fas fa-spinner fa-spin mr-1.5"></i>Retrying...</>
                      ) : (
                        <><i className="fas fa-rotate-right mr-1.5"></i>Retry</>
                      )}
                    </button>
                  ) : (
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                      item.status === 'completed'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {item.status === 'completed' ? (
                        <><i className="fas fa-check mr-1.5"></i>Done</>
                      ) : (
                        <><i className="fas fa-spinner fa-spin mr-1.5"></i>Processing</>
                      )}
                    </span>
                  )}

                  <i className="fas fa-chevron-right text-slate-700 group-hover:text-slate-400 transition-colors"></i>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>
          <span className="text-sm text-slate-500 font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      )}
    </>
  )
}
