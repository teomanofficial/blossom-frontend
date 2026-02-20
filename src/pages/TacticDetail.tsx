import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface TacticVideo {
  video_id: number
  platform: string
  username: string
  caption: string | null
  views: number
  likes: number
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  execution_score: number
  timestamp_start: number | null
  timestamp_end: number | null
  specific_observation: string | null
  viewer_effect_note: string | null
}

interface FormatDist {
  id: number
  name: string
  usage_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface TacticData {
  id: number
  name: string
  category: string
  description: string | null
  why_it_works: string | null
  viewer_effect: string | null
  video_count: number
  avg_views_when_present: number
  avg_execution_score: number
  is_verified: boolean
  created_at: string
  updated_at: string
  videos: TacticVideo[]
  format_distribution: FormatDist[]
  pagination?: Pagination
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function formatTimestamp(sec: number | null): string {
  if (sec == null) return '--'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const categoryColors: Record<string, string> = {
  audio_design: 'bg-violet-500/20 text-violet-400',
  text_overlay: 'bg-cyan-500/20 text-cyan-400',
  framing_angle: 'bg-emerald-500/20 text-emerald-400',
  content_structure: 'bg-sky-500/20 text-sky-400',
  shareability: 'bg-orange-500/20 text-orange-400',
  engagement_bait: 'bg-yellow-500/20 text-yellow-400',
  trend_leverage: 'bg-lime-500/20 text-lime-400',
  identity_signal: 'bg-fuchsia-500/20 text-fuchsia-400',
  visual_storytelling: 'bg-rose-500/20 text-rose-400',
  pacing: 'bg-indigo-500/20 text-indigo-400',
  hook_technique: 'bg-pink-500/20 text-pink-400',
  emotional_trigger: 'bg-red-500/20 text-red-400',
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || 'bg-slate-500/20 text-slate-400'
}

function getCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ')
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-teal-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-slate-400'
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-teal-400'
  if (score >= 40) return 'bg-yellow-400'
  return 'bg-slate-500'
}

function getThumbnailSrc(video: TacticVideo): string | null {
  if (video.local_thumbnail_path) {
    if (video.local_thumbnail_path.startsWith('http')) return video.local_thumbnail_path
    return `/media/${video.local_thumbnail_path.split('/').pop()}`
  }
  return video.thumbnail_url
}

export default function TacticDetail() {
  const { id } = useParams()
  const [tactic, setTactic] = useState<TacticData | null>(null)
  const [videos, setVideos] = useState<TacticVideo[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/analysis/tactics/${id}?page=1&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error('Tactic not found')
        return r.json()
      })
      .then((data) => {
        setTactic(data)
        setVideos(data.videos || [])
        setPagination(data.pagination || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const loadMore = useCallback(() => {
    if (loadingMore || !pagination?.hasMore) return
    setLoadingMore(true)
    const nextPage = pagination.page + 1
    authFetch(`/api/analysis/tactics/${id}?page=${nextPage}&limit=${pagination.limit}`)
      .then((r) => r.json())
      .then((data) => {
        setVideos((prev) => [...prev, ...(data.videos || [])])
        setPagination(data.pagination || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMore(false))
  }, [id, pagination, loadingMore])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !tactic) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-slate-500 text-sm">{error || 'Tactic not found'}</p>
        <Link to="/dashboard/tactics" className="text-amber-400 text-xs font-bold mt-4 inline-block hover:text-amber-300">
          Back to Tactics
        </Link>
      </div>
    )
  }

  const totalVideoCount = pagination?.total ?? videos.length
  const score = Number(tactic.avg_execution_score) || 0
  const avgViews = Number(tactic.avg_views_when_present) || 0

  // Score distribution from loaded videos
  const scoreRanges = { high: 0, mid: 0, low: 0 }
  videos.forEach((v) => {
    const s = Number(v.execution_score) || 0
    if (s >= 70) scoreRanges.high++
    else if (s >= 40) scoreRanges.mid++
    else scoreRanges.low++
  })

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard/tactics" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors shrink-0">
            Viral Tactics
          </Link>
          <span className="text-slate-600 text-xs shrink-0">/</span>
          <span className="text-white text-xs font-black uppercase tracking-widest truncate">{tactic.name}</span>
        </div>
      </div>

      {/* Tactic Hero */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getCategoryColor(tactic.category)}`}>
            {getCategoryLabel(tactic.category)}
          </span>
          {tactic.is_verified && (
            <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded">
              Verified
            </span>
          )}
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
            Indexed {timeAgo(tactic.created_at)}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 uppercase">{tactic.name}</h1>
        {tactic.description && (
          <p className="text-slate-400 text-sm md:text-lg font-medium max-w-3xl leading-relaxed">{tactic.description}</p>
        )}
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
        <div className="p-4 md:p-6 glass-card rounded-2xl md:rounded-3xl border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Exec Score</div>
          <div className={`text-xl md:text-2xl font-black ${getScoreColor(score)}`}>
            {score > 0 ? Math.round(score) : '--'}
          </div>
          {score > 0 && (
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full ${getScoreBg(score)}`} style={{ width: `${Math.min(score, 100)}%` }} />
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 glass-card rounded-2xl md:rounded-3xl border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Views</div>
          <div className="text-xl md:text-2xl font-black text-white">{formatNumber(Math.round(avgViews))}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-2xl md:rounded-3xl border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Videos Using</div>
          <div className="text-xl md:text-2xl font-black text-white">{totalVideoCount}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-2xl md:rounded-3xl border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Score Dist</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-teal-400 text-xs font-black">{scoreRanges.high}</span>
            <span className="text-slate-600 text-[10px]">/</span>
            <span className="text-yellow-400 text-xs font-black">{scoreRanges.mid}</span>
            <span className="text-slate-600 text-[10px]">/</span>
            <span className="text-slate-400 text-xs font-black">{scoreRanges.low}</span>
          </div>
          <div className="text-[9px] text-slate-600 mt-1">high / mid / low</div>
        </div>
      </div>

      {/* Why It Works + Viewer Effect */}
      {(tactic.why_it_works || tactic.viewer_effect) && (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          {tactic.why_it_works && (
            <div className="p-5 md:p-8 glass-card rounded-[1.5rem] md:rounded-[2rem] border-l-4 border-l-amber-500">
              <h3 className="text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 md:mb-4">
                <i className="fas fa-lightbulb"></i> Why It Works
              </h3>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">{tactic.why_it_works}</p>
            </div>
          )}
          {tactic.viewer_effect && (
            <div className="p-5 md:p-8 glass-card rounded-[1.5rem] md:rounded-[2rem] border-l-4 border-l-purple-500">
              <h3 className="text-purple-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 md:mb-4">
                <i className="fas fa-brain"></i> Viewer Effect
              </h3>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">{tactic.viewer_effect}</p>
            </div>
          )}
        </div>
      )}

      {/* Format Distribution */}
      {tactic.format_distribution && tactic.format_distribution.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 md:mb-6 flex items-center gap-2">
            <i className="fas fa-shapes text-slate-500"></i> Most Used In Formats
          </h2>
          <div className="flex flex-wrap gap-3">
            {tactic.format_distribution.map((fd) => (
              <Link
                key={fd.id}
                to={`/dashboard/formats/${fd.id}`}
                className="px-4 py-2.5 glass-card rounded-xl border-white/5 hover:border-white/20 transition-all group"
              >
                <span className="text-xs font-black text-white group-hover:text-amber-400 transition-colors uppercase">
                  {fd.name}
                </span>
                <span className="text-[10px] text-slate-500 font-bold ml-2">{fd.usage_count} videos</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {videos.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">The Receipts</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Videos using this tactic, ranked by execution score.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {videos.length} of {totalVideoCount} video{totalVideoCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {videos.map((video, idx) => {
              const thumb = getThumbnailSrc(video)
              const execScore = Number(video.execution_score) || 0
              return (
                <div
                  key={video.video_id}
                  className="relative group cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => {
                    const vids = videos.map(v => ({
                      ...v,
                      id: v.video_id,
                    })) as CarouselVideo[]
                    setCarouselData({ videos: vids, initialIndex: idx })
                  }}
                >
                  <div className="aspect-[9/16] bg-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-amber-500/30 transition-all">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`@${video.username}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (video.thumbnail_url && target.src !== video.thumbnail_url) {
                            target.src = video.thumbnail_url
                          } else {
                            target.style.display = 'none'
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-film text-slate-700 text-3xl"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 md:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[10px]`}></i>
                        </div>
                        <span className="text-[10px] font-black text-white">@{video.username}</span>
                      </div>
                      {video.specific_observation && (
                        <p className="text-[10px] text-slate-300 font-medium mb-2 line-clamp-2 leading-relaxed">
                          {video.specific_observation}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Views</span>
                          <span className="text-xs font-black">{formatNumber(video.views)}</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Exec Score</span>
                          <span className={`text-xs font-black ${getScoreColor(execScore)}`}>
                            {execScore > 0 ? Math.round(execScore) : '--'}
                          </span>
                        </div>
                        {(video.timestamp_start != null || video.timestamp_end != null) && (
                          <div className="col-span-2 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">Timestamp</span>
                            <span className="text-xs font-black">
                              {formatTimestamp(video.timestamp_start)} - {formatTimestamp(video.timestamp_end)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="flex justify-center py-10">
            {loadingMore && (
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {pagination && !pagination.hasMore && videos.length > 20 && (
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">All {totalVideoCount} videos loaded</span>
            )}
          </div>
        </div>
      )}

      {/* No videos */}
      {videos.length === 0 && !loading && (
        <div className="glass-card rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 mb-10 md:mb-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-film text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Videos Linked</h3>
          <p className="text-sm text-slate-500">This tactic hasn't been detected in any analyzed videos yet.</p>
        </div>
      )}

      {carouselData && (
        <VideoStoryCarousel
          videos={carouselData.videos}
          initialIndex={carouselData.initialIndex}
          onClose={() => setCarouselData(null)}
        />
      )}
    </>
  )
}
