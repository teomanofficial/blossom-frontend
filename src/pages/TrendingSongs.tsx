import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function platformIcon(p: string) {
  return p === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'
}

interface TrendingSong {
  id: number
  title: string
  artist: string | null
  album: string | null
  cover_url: string | null
  local_cover_path: string | null
  platform: string
  is_original: boolean
  total_video_count: number
  total_views: number
  avg_views: number
  recent_video_count: number
  recent_avg_views: number
}

const PAGE_SIZE = 24

export default function TrendingSongs() {
  const [songs, setSongs] = useState<TrendingSong[]>([])
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
      const res = await authFetch(`/api/trends/songs?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSongs(data.songs || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load trending songs')
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
          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded">
            Songs
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Trending Songs</h1>
            <p className="text-slate-500 text-sm font-medium">
              Songs and audio used in recent posts. {total > 0 && <span className="text-slate-400">{total} songs</span>}
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
      ) : songs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-music text-cyan-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Trending Songs</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">No songs found in the last {days} days.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((s) => {
              const coverSrc = getStorageUrl(s.local_cover_path)

              return (
                <div
                  key={s.id}
                  className="glass-card rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer"
                >
                  <div className="aspect-square bg-slate-900 relative overflow-hidden">
                    {coverSrc ? (
                      <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-pink-500/10">
                        <i className="fas fa-music text-cyan-400/30 text-3xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <i className={`${platformIcon(s.platform)} text-[10px] text-white/70`} />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 backdrop-blur-sm">
                        {s.recent_video_count} videos
                      </span>
                      {s.is_original && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 backdrop-blur-sm">
                          Original
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-black text-white truncate mb-0.5 group-hover:text-cyan-300 transition-colors">
                      {s.title}
                    </div>
                    {s.artist && (
                      <div className="text-[10px] text-slate-500 font-bold truncate mb-1.5">
                        {s.artist}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold">
                      <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(s.recent_avg_views)}</span>
                      <span><i className="fas fa-film mr-0.5 text-[8px]" />{s.total_video_count} total</span>
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
