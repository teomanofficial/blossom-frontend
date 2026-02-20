import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface FormatClass {
  id: number
  name: string
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: any | null
  analysis_video_count: number | null
  created_at: string
}

type SortField = 'video_count' | 'avg_views' | 'avg_engagement_rate' | 'name' | 'created_at'

const PAGE_SIZE = 24

function formatNumber(n: number): string {
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

export default function Formats() {
  const [formats, setFormats] = useState<FormatClass[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState<SortField>('video_count')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchFormats = useCallback(async (offset: number, reset: boolean) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await authFetch(
        `/api/analysis/formats?sort_by=${sortBy}&order=${order}&limit=${PAGE_SIZE}&offset=${offset}`
      )
      const data = await res.json()
      const newFormats: FormatClass[] = data.formats ?? []
      const serverTotal: number = data.total ?? 0

      setTotal(serverTotal)
      setFormats((prev) => reset ? newFormats : [...prev, ...newFormats])
      setHasMore(offset + newFormats.length < serverTotal)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sortBy, order])

  // Reset when sort changes
  useEffect(() => {
    setFormats([])
    setHasMore(true)
    fetchFormats(0, true)
  }, [fetchFormats])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchFormats(formats.length, false)
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, formats.length, fetchFormats])

  const totalVideos = formats.reduce((sum, f) => sum + (f.video_count || 0), 0)
  const globalAvgViews = formats.length > 0
    ? formats.reduce((sum, f) => sum + (f.avg_views || 0) * (f.video_count || 0), 0) / Math.max(totalVideos, 1)
    : 0

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder('desc')
    }
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'video_count', label: 'Videos' },
    { field: 'avg_views', label: 'Avg Views' },
    { field: 'avg_engagement_rate', label: 'Engagement' },
    { field: 'name', label: 'Name' },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
              The Receipts
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-1 md:mb-2">VIRAL FORMATS</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            The most successful content structures currently winning on the global feed.
          </p>
        </div>

        <div className="flex gap-3 md:gap-4">
          <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-2xl md:rounded-[1.5rem] border-white/5 flex-1 md:flex-initial">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Formats</div>
            <div className="text-xl md:text-2xl font-black text-white">{total}</div>
          </div>
          <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-2xl md:rounded-[1.5rem] border-white/5 flex-1 md:flex-initial">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Global Avg Views</div>
            <div className="text-xl md:text-2xl font-black text-white">{formatNumber(globalAvgViews)}</div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-6 md:mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-2 shrink-0">Sort by</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.field}
            onClick={() => toggleSort(opt.field)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              sortBy === opt.field
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}
            {sortBy === opt.field && (
              <i className={`fas fa-chevron-${order === 'desc' ? 'down' : 'up'} ml-1 text-[8px]`}></i>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : formats.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-shapes text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Formats Yet</h3>
          <p className="text-sm text-slate-500">Analyze some videos to start discovering viral format patterns.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {formats.map((format, index) => (
              <Link
                key={format.id}
                to={`/dashboard/formats/${format.id}`}
                className="gradient-border group cursor-pointer md:hover:translate-y-[-4px] active:scale-[0.98] transition-all duration-300"
              >
                <div className="card-inner p-5 md:p-7 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl">
                      {getFormatEmoji(format.name)}
                    </div>
                    <div className="px-3 py-1 bg-teal-400/10 rounded-lg">
                      <div className="text-[10px] font-black text-teal-400 uppercase tracking-tighter">Rank</div>
                      <div className="text-sm font-black text-white text-right">#{index + 1}</div>
                    </div>
                  </div>

                  <h3 className="text-base md:text-xl font-black mb-2 md:mb-3 tracking-tight group-hover:text-pink-400 transition-colors uppercase">
                    {format.name}
                  </h3>
                  {format.description && (
                    <p className="text-xs text-slate-400 font-semibold mb-4 md:mb-8 leading-relaxed line-clamp-2 md:line-clamp-3">
                      {format.description}
                    </p>
                  )}

                  {/* Metrics Grid */}
                  <div className="mt-auto grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4 pt-4 md:pt-6 border-t border-white/5">
                    <div>
                      <div className="metric-label">Engagement</div>
                      <div className="metric-value">
                        {format.avg_engagement_rate
                          ? Number(format.avg_engagement_rate).toFixed(1) + '%'
                          : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="metric-label">Videos</div>
                      <div className="metric-value">{format.video_count}</div>
                    </div>
                    <div>
                      <div className="metric-label">Avg Views</div>
                      <div className="metric-value">{formatNumber(Math.round(format.avg_views || 0))}</div>
                    </div>
                    <div>
                      <div className="metric-label">Status</div>
                      <div className="metric-value">
                        {format.class_analysis ? (
                          <span className="text-teal-400">Analyzed</span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Discover More Card - only show when all loaded */}
            {!hasMore && (
              <div className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-plus text-slate-500"></i>
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
                  {total} Formats Indexed
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-2">
                  Analyze more videos to discover new patterns.
                </p>
              </div>
            )}
          </div>

          {/* Scroll sentinel + loading indicator */}
          <div ref={sentinelRef} className="py-8 flex justify-center">
            {loadingMore && (
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </>
      )}
    </>
  )
}
