import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function viralBadge(prob: number) {
  if (prob >= 0.7) return 'bg-emerald-500/10 text-emerald-400'
  if (prob >= 0.4) return 'bg-yellow-500/10 text-yellow-400'
  return 'bg-slate-500/10 text-slate-400'
}

function platformIcon(p: string) {
  return p === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'
}

function getThumbnailSrc(v: CarouselVideo): string | null {
  return getStorageUrl(v.local_thumbnail_path)
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

interface TrendingVideo extends CarouselVideo {
  analyzed_at?: string | null
}

/* ── Post Card ── */
function PostCard({ video, onClick }: { video: TrendingVideo; onClick: () => void }) {
  const src = getThumbnailSrc(video)

  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div className="aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all relative">
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-film text-slate-700 text-2xl" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Video indicator */}
        {video.local_video_path && (
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm bg-emerald-500/20 text-emerald-300">
              <i className="fas fa-play text-[7px] mr-0.5" /> Video
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {video.final_viral_probability != null && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm ${viralBadge(video.final_viral_probability)}`}>
              {Math.round(video.final_viral_probability * 100)}%
            </span>
          )}
          <i className={`${platformIcon(video.platform)} text-[10px] text-white/70`} />
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="text-[11px] font-bold text-white truncate">@{video.username}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-black text-white/80">
              <i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(video.views)}
            </span>
            {video.likes != null && (
              <span className="text-[10px] font-bold text-white/60">
                <i className="fas fa-heart mr-0.5 text-[8px]" />{fmt(video.likes)}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Analysis date + format tag below card */}
      <div className="mt-1.5 px-1">
        {video.analyzed_at && (
          <div className="text-[9px] text-slate-600 font-bold">
            <i className="fas fa-clock text-[7px] mr-0.5" /> {formatDate(video.analyzed_at)}
          </div>
        )}
        {video.format_class_name && (
          <div className="text-[9px] text-slate-500 font-bold truncate capitalize">
            {video.format_class_name}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton Card ── */
function PostCardSkeleton() {
  return (
    <div>
      <div className="aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 animate-pulse">
        <div className="w-full h-full bg-white/5" />
      </div>
      <div className="mt-1.5 px-1 animate-pulse">
        <div className="h-2 bg-white/5 rounded w-16 mb-1.5" />
        <div className="h-2 bg-white/5 rounded w-24" />
      </div>
    </div>
  )
}

/* ── Main Page ── */
const PAGE_SIZE = 30

export default function TrendingPosts() {
  const { userType } = useAuth()
  const isAdmin = userType === 'admin'
  const [videos, setVideos] = useState<TrendingVideo[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [platform, setPlatform] = useState<string>('')
  const [, setPage] = useState(0)
  const [days, setDays] = useState(1)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchVideos = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageNum * PAGE_SIZE),
        days: String(days),
        sort: 'views',
      })
      if (platform) params.set('platform', platform)

      const res = await authFetch(`/api/trends/posts?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const newVideos = data.videos || []
      setVideos(prev => append ? [...prev, ...newVideos] : newVideos)
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load trending posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [platform, days])

  // Initial load
  useEffect(() => {
    setPage(0)
    fetchVideos(0, false)
  }, [fetchVideos])

  // Infinite scroll observer
  const hasMore = videos.length < total

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => {
            const next = prev + 1
            fetchVideos(next, true)
            return next
          })
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, fetchVideos])

  return (
    <>
      {/* Back link */}
      <Link to="/dashboard/trends" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-pink-400 transition-colors mb-4">
        <i className="fas fa-arrow-left text-[9px]" /> Back to Trends
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-glass text-pink-400 font-black">
            Trends
          </span>
        </div>
        <h1 className="text-3xl font-black font-display tracking-tighter mb-2">Top Viral Content</h1>
        <p className="text-slate-500 text-sm font-medium">
          Most viewed content sorted by views. {total > 0 && <span className="text-slate-400">{total} posts</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {[
            { value: '', label: 'All' },
            { value: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
            { value: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPlatform(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                platform === opt.value
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.icon && <i className={`${opt.icon} text-[10px]`} />}
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {([
            { value: 1, label: 'Daily' },
            { value: 7, label: 'Weekly' },
            { value: 30, label: 'Monthly' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === opt.value
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[10px] text-slate-600 font-bold">
          <i className="fas fa-sort-amount-down mr-1" /> Most Views
        </div>
      </div>

      {/* Content */}
      {loading && videos.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <PostCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-chart-line text-pink-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Trending Posts Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Analyze some videos first to see them appear here. Trending posts show recently analyzed content sorted by analysis date.
          </p>
        </div>
      ) : (
        <>
          {/* Video Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {videos.map((v, idx) => (
              <PostCard
                key={v.id}
                video={v}
                onClick={() => setCarouselData({ videos, initialIndex: idx })}
              />
            ))}
            {loadingMore && Array.from({ length: 6 }, (_, i) => (
              <PostCardSkeleton key={`skeleton-more-${i}`} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}

      {/* Carousel viewer */}
      {carouselData && (
        <VideoStoryCarousel
          videos={carouselData.videos}
          initialIndex={carouselData.initialIndex}
          onClose={() => setCarouselData(null)}
          renderMeta={(video) => {
            if (!isAdmin) return null
            const tv = video as TrendingVideo
            return tv.analyzed_at ? (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Analyzed</p>
                <p className="text-sm font-bold text-white">{formatDateTime(tv.analyzed_at)}</p>
              </div>
            ) : null
          }}
        />
      )}
    </>
  )
}
