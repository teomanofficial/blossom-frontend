import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

// ─── Types ──────────────────────────────────────────

interface CategoryInfo {
  id: number
  title: string
  description: string | null
  icon: string | null
  thumbnail_url: string | null
}

interface Metrics {
  video_count: number
  avg_views: number
  avg_likes: number
  avg_comments: number
  avg_shares: number
  avg_saves: number
  avg_engagement_rate: number
}

interface CategoryVideo {
  id: number
  caption: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  platform: string
  published_at: string | null
  duration_sec: number | null
  username: string | null
  profile_pic_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  format_name: string | null
  hook_name: string | null
  final_viral_probability: number | null
}

interface FormatItem {
  id: number
  name: string
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
}

interface HookItem {
  id: number
  name: string
  hook_technique: string | null
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
}

interface TacticItem {
  id: number
  name: string
  category: string | null
  description: string | null
  why_it_works: string | null
  video_count: number
  avg_execution_score: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// ─── Helpers ────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function thumb(v: { local_thumbnail_path: string | null }): string | null {
  return getStorageUrl(v.local_thumbnail_path)
}

// ─── Collapsible Section ────────────────────────────

function CollapsibleSection({
  title,
  icon,
  iconColor,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: string
  iconColor: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center`}>
            <i className={`fas ${icon} text-sm`}></i>
          </div>
          <div className="text-left">
            <h3 className="font-black text-white text-sm uppercase tracking-wide">{title}</h3>
            <span className="text-[10px] font-bold text-slate-500">{count} found</span>
          </div>
        </div>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'} text-slate-500 text-xs`}></i>
      </button>
      {open && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────

export default function CategoryDetail() {
  const { id } = useParams()
  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [videos, setVideos] = useState<CategoryVideo[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [formats, setFormats] = useState<FormatItem[]>([])
  const [hooks, setHooks] = useState<HookItem[]>([])
  const [tactics, setTactics] = useState<TacticItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    authFetch(`/api/management/categories/${id}/overview?page=1&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error('Category not found')
        return r.json()
      })
      .then((data) => {
        setCategory(data.category)
        setMetrics(data.metrics)
        setVideos(data.videos || [])
        setPagination(data.pagination || null)
        setFormats(data.formats || [])
        setHooks(data.hooks || [])
        setTactics(data.tactics || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const loadMore = useCallback(() => {
    if (loadingMore || !pagination?.hasMore) return
    setLoadingMore(true)
    const nextPage = pagination.page + 1
    authFetch(`/api/management/categories/${id}/overview?page=${nextPage}&limit=${pagination.limit}`)
      .then((r) => r.json())
      .then((data) => {
        setVideos((prev) => [...prev, ...(data.videos || [])])
        setPagination(data.pagination || null)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [id, pagination, loadingMore])

  useEffect(() => { fetchData() }, [fetchData])

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
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center">
        <p className="text-slate-500 text-sm">{error || 'Category not found'}</p>
        <Link to="/dashboard" className="text-pink-400 text-xs font-bold mt-4 inline-block hover:text-pink-300">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const totalVideos = pagination?.total ?? videos.length

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 md:mb-10">
        <Link to="/dashboard" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors shrink-0">
          Dashboard
        </Link>
        <span className="text-slate-600 text-xs shrink-0">/</span>
        <span className="text-white text-xs font-black uppercase tracking-widest truncate">{category.title}</span>
      </div>

      {/* Hero */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-3 mb-3">
          {category.icon && (
            <span className="text-2xl">{category.icon}</span>
          )}
          <span className="badge-glass text-pink-400 font-black">Category</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter mb-3 uppercase">
          {category.title}
        </h1>
        {category.description && (
          <p className="text-slate-400 text-sm md:text-lg font-medium max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          <div className="p-4 md:p-6 glass-card rounded-3xl">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Videos</div>
            <div className="text-xl md:text-2xl font-black text-white">{fmt(metrics.video_count)}</div>
          </div>
          <div className="p-4 md:p-6 glass-card rounded-3xl">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Views</div>
            <div className="text-xl md:text-2xl font-black text-white">{fmt(metrics.avg_views)}</div>
          </div>
          <div className="p-4 md:p-6 glass-card rounded-3xl">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Engagement</div>
            <div className="text-xl md:text-2xl font-black text-teal-400">
              {metrics.avg_engagement_rate > 0 ? metrics.avg_engagement_rate.toFixed(1) + '%' : '--'}
            </div>
          </div>
          <div className="p-4 md:p-6 glass-card rounded-3xl">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Likes</div>
            <div className="text-xl md:text-2xl font-black text-pink-400">{fmt(metrics.avg_likes)}</div>
          </div>
        </div>
      )}

      {/* Collapsible Sections: Formats, Hooks, Tactics */}
      <div className="space-y-4 mb-10 md:mb-16">
        {/* Formats */}
        {formats.length > 0 && (
          <CollapsibleSection
            title="Top Formats"
            icon="fa-layer-group"
            iconColor="bg-purple-500/10 text-purple-400"
            count={formats.length}
          >
            <div className="grid gap-3">
              {formats.map((f) => (
                <Link
                  key={f.id}
                  to={`/dashboard/formats/${f.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {f.name}
                    </h4>
                    {f.description && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{f.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 ml-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Avg Views</div>
                      <div className="text-xs font-black text-white">{fmt(Number(f.avg_views))}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Eng.</div>
                      <div className="text-xs font-black text-teal-400">
                        {Number(f.avg_engagement_rate) > 0 ? Number(f.avg_engagement_rate).toFixed(1) + '%' : '--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Videos</div>
                      <div className="text-xs font-black text-white">{f.video_count}</div>
                    </div>
                    <i className="fas fa-chevron-right text-slate-600 text-[10px]"></i>
                  </div>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Hooks */}
        {hooks.length > 0 && (
          <CollapsibleSection
            title="Top Hooks"
            icon="fa-magnet"
            iconColor="bg-orange-500/10 text-orange-400"
            count={hooks.length}
          >
            <div className="grid gap-3">
              {hooks.map((h) => (
                <Link
                  key={h.id}
                  to={`/dashboard/hooks/${h.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-orange-300 transition-colors">
                      {h.name}
                    </h4>
                    {h.hook_technique && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{h.hook_technique}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 ml-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Avg Views</div>
                      <div className="text-xs font-black text-white">{fmt(Number(h.avg_views))}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Eng.</div>
                      <div className="text-xs font-black text-teal-400">
                        {Number(h.avg_engagement_rate) > 0 ? Number(h.avg_engagement_rate).toFixed(1) + '%' : '--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Videos</div>
                      <div className="text-xs font-black text-white">{h.video_count}</div>
                    </div>
                    <i className="fas fa-chevron-right text-slate-600 text-[10px]"></i>
                  </div>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Tactics */}
        {tactics.length > 0 && (
          <CollapsibleSection
            title="Top Tactics"
            icon="fa-bolt"
            iconColor="bg-indigo-500/10 text-indigo-400"
            count={tactics.length}
          >
            <div className="grid gap-3">
              {tactics.map((t) => (
                <Link
                  key={t.id}
                  to={`/dashboard/tactics/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {t.name}
                      </h4>
                      {t.category && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-white/5 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded">
                          {t.category.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{t.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 ml-3 flex-shrink-0">
                    {t.avg_execution_score > 0 && (
                      <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-black text-slate-600 uppercase">Exec Score</div>
                        <div className={`text-xs font-black ${
                          t.avg_execution_score >= 70 ? 'text-teal-400' :
                          t.avg_execution_score >= 40 ? 'text-yellow-400' : 'text-slate-400'
                        }`}>
                          {t.avg_execution_score}
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-[9px] font-black text-slate-600 uppercase">Videos</div>
                      <div className="text-xs font-black text-white">{t.video_count}</div>
                    </div>
                    <i className="fas fa-chevron-right text-slate-600 text-[10px]"></i>
                  </div>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Videos Grid */}
      {videos.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight uppercase">Videos</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Top performing videos in this category.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {videos.length} of {totalVideos} video{totalVideos === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {videos.map((video, idx) => {
              const src = thumb(video)
              return (
                <div
                  key={video.id}
                  className="relative group cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => {
                    setCarouselData({ videos: videos as unknown as CarouselVideo[], initialIndex: idx })
                  }}
                >
                  <div className="aspect-[9/16] bg-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all">
                    {src ? (
                      <img
                        src={src}
                        alt={video.username ? `@${video.username}` : 'Video'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-film text-slate-700 text-3xl"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 md:p-5">
                      {video.username && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                            <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[10px]`}></i>
                          </div>
                          <span className="text-[10px] font-black text-white">@{video.username}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Views</span>
                          <span className="text-xs font-black">{fmt(video.views)}</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Eng.</span>
                          <span className={`text-xs font-black ${
                            video.engagement_rate >= 5 ? 'text-teal-400' :
                            video.engagement_rate >= 2 ? 'text-yellow-400' : 'text-slate-400'
                          }`}>
                            {video.engagement_rate > 0 ? Number(video.engagement_rate).toFixed(1) + '%' : '--'}
                          </span>
                        </div>
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
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {pagination && !pagination.hasMore && videos.length > 20 && (
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">All {totalVideos} videos loaded</span>
            )}
          </div>
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="glass-card rounded-3xl p-10 text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-video text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Videos Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No videos have been analyzed for this category yet.
          </p>
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
