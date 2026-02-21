import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function getThumbnailSrc(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `/media/${path.split('/').pop()}`
}

interface TrendingContent {
  id: number
  name: string
  category: string
  description: string | null
  icon: string | null
  total_video_count: number
  recent_video_count: number
  recent_avg_views: number
  recent_avg_engagement: number
  sample_thumbnails: string[] | null
}

const PAGE_SIZE = 24

export default function TrendingContents() {
  const [contents, setContents] = useState<TrendingContent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [page, setPage] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        days: String(days),
      })
      const res = await authFetch(`/api/trends/contents?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setContents(data.contents || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load trending contents')
    } finally {
      setLoading(false)
    }
  }, [days, page])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(0) }, [days])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Link to="/dashboard/trends" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-pink-400 transition-colors mb-4">
        <i className="fas fa-arrow-left text-[9px]" /> Back to Trends
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded">
            Contents
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Trending Contents</h1>
            <p className="text-slate-500 text-sm font-medium">
              Content topics and trends ranked by recent usage. {total > 0 && <span className="text-slate-400">{total} topics</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === d ? 'bg-pink-500/20 text-pink-400' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >{d}d</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-hashtag text-blue-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Trending Contents</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">No content topics found in the last {days} days.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contents.map((c) => {
              const thumbs = (c.sample_thumbnails || []).map(getThumbnailSrc).filter(Boolean)

              return (
                <div
                  key={c.id}
                  className="glass-card rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all group"
                >
                  {/* Thumbnail collage */}
                  <div className="h-[120px] bg-slate-900 relative overflow-hidden">
                    {thumbs.length > 0 ? (
                      <div className="flex h-full">
                        {thumbs.slice(0, 3).map((t, i) => (
                          <img key={i} src={t!} alt="" className="h-full flex-1 object-cover" style={{ minWidth: 0 }} />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <i className="fas fa-hashtag text-blue-400/30 text-3xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 backdrop-blur-sm uppercase">
                        {c.category}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white/80 backdrop-blur-sm">
                        {c.recent_video_count} videos
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm font-black text-white capitalize mb-1 group-hover:text-blue-300 transition-colors">
                      {c.name}
                    </div>
                    {c.description && (
                      <div className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-2">{c.description}</div>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                      <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(c.recent_avg_views)} avg</span>
                      <span><i className="fas fa-chart-line mr-0.5 text-[8px]" />{c.recent_avg_engagement}% eng</span>
                      <span><i className="fas fa-film mr-0.5 text-[8px]" />{c.total_video_count} total</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-left text-[10px] text-slate-400" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) pageNum = i
                  else if (page < 3) pageNum = i
                  else if (page > totalPages - 4) pageNum = totalPages - 7 + i
                  else pageNum = page - 3 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        page === pageNum ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                      }`}
                    >{pageNum + 1}</button>
                  )
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-right text-[10px] text-slate-400" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
