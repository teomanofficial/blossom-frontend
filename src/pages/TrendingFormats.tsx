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

function getFormatEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('tutorial') || lower.includes('how')) return '📚'
  if (lower.includes('reaction')) return '😱'
  if (lower.includes('comparison') || lower.includes('vs')) return '📸'
  if (lower.includes('story') || lower.includes('arc') || lower.includes('journey')) return '✨'
  if (lower.includes('review') || lower.includes('unbox')) return '📦'
  if (lower.includes('challenge')) return '🏆'
  if (lower.includes('comedy') || lower.includes('skit') || lower.includes('funny')) return '😂'
  if (lower.includes('dance') || lower.includes('trend')) return '💃'
  if (lower.includes('asmr') || lower.includes('satisf')) return '🎧'
  if (lower.includes('cook') || lower.includes('food') || lower.includes('recipe')) return '🍳'
  if (lower.includes('fitness') || lower.includes('workout')) return '💪'
  if (lower.includes('beauty') || lower.includes('makeup') || lower.includes('glow')) return '💄'
  if (lower.includes('hook') || lower.includes('curiosity')) return '💡'
  if (lower.includes('pov')) return '🎬'
  if (lower.includes('vlog') || lower.includes('day')) return '📹'
  if (lower.includes('tip') || lower.includes('hack') || lower.includes('trick')) return '🔥'
  return '🎯'
}

interface TrendingFormat {
  id: number
  name: string
  description: string | null
  avg_views: number
  avg_engagement_rate: number
  total_video_count: number
  recent_video_count: number
  recent_avg_views: number
  recent_avg_engagement: number
}

const PAGE_SIZE = 24

export default function TrendingFormats() {
  const [formats, setFormats] = useState<TrendingFormat[]>([])
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
      const res = await authFetch(`/api/trends/formats?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFormats(data.formats || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load trending formats')
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
          <span className="badge-glass text-orange-400 font-black">
            Formats
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black font-display tracking-tighter mb-2">Trending Formats</h1>
            <p className="text-slate-500 text-sm font-medium">
              Content formats ranked by recent usage. {total > 0 && <span className="text-slate-400">{total} formats</span>}
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
      ) : formats.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shapes text-orange-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Trending Formats</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">No formats found in the last {days} days.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {formats.map((f) => (
              <Link
                key={f.id}
                to={`/dashboard/formats/${f.id}`}
                className="glass-card rounded-2xl p-5 hover:border-orange-500/30 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getFormatEmoji(f.name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-white capitalize truncate group-hover:text-orange-300 transition-colors">
                      {f.name}
                    </div>
                    {f.description && (
                      <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{f.description}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 shrink-0">
                    {f.recent_video_count} recent
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                  <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(f.recent_avg_views)} avg views</span>
                  <span><i className="fas fa-chart-line mr-0.5 text-[8px]" />{f.recent_avg_engagement}% eng</span>
                  <span><i className="fas fa-film mr-0.5 text-[8px]" />{f.total_video_count} total</span>
                </div>
              </Link>
            ))}
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
