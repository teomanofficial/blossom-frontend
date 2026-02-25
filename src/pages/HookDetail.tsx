import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface HookVideo {
  id: number
  username: string
  caption: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  platform: string
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  confidence: number
  hook_effectiveness: number | null
  final_viral_probability: number | null
  analysis_json: any | null
}

interface TacticItem {
  name?: string
  tactic?: string
  category?: string
  description?: string
  analysis?: string
  why?: string
  top_freq?: number
  bottom_freq?: number
}

interface ClassAnalysis {
  class_description?: string
  what_defines_this_format?: string
  gold_standard_tactics?: TacticItem[]
  overrated_tactics?: TacticItem[]
  execution_gaps?: TacticItem[]
  blueprint?: any
  video_list?: any[]
  tactic_frequency?: any
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface HookDetail {
  id: number
  name: string
  description: string | null
  hook_technique: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: ClassAnalysis | null
  analysis_updated_at: string | null
  analysis_video_count: number | null
  videos: HookVideo[]
  pagination?: Pagination
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
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

function getThumbnailSrc(video: HookVideo): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'hook_visual': return 'text-purple-400 bg-purple-400/10'
    case 'hook_audio': return 'text-blue-400 bg-blue-400/10'
    case 'hook_text': return 'text-amber-400 bg-amber-400/10'
    case 'hook_structural': return 'text-cyan-400 bg-cyan-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'hook_visual': return 'Visual'
    case 'hook_audio': return 'Audio'
    case 'hook_text': return 'Text'
    case 'hook_structural': return 'Structural'
    default: return category
  }
}

export default function HookDetail() {
  const { id } = useParams()
  const [hook, setHook] = useState<HookDetail | null>(null)
  const [videos, setVideos] = useState<HookVideo[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchHook = () => {
    setLoading(true)
    authFetch(`/api/analysis/hooks/${id}?page=1&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error('Hook not found')
        return r.json()
      })
      .then((data) => {
        setHook(data)
        setVideos(data.videos || [])
        setPagination(data.pagination || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !pagination?.hasMore) return
    setLoadingMore(true)
    const nextPage = pagination.page + 1
    authFetch(`/api/analysis/hooks/${id}?page=${nextPage}&limit=${pagination.limit}`)
      .then((r) => r.json())
      .then((data) => {
        setVideos((prev) => [...prev, ...(data.videos || [])])
        setPagination(data.pagination || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMore(false))
  }, [id, pagination, loadingMore])

  // Infinite scroll observer
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

  useEffect(() => { fetchHook() }, [id])

  const triggerAnalysis = () => {
    setAnalyzing(true)
    authFetch(`/api/analysis/hooks/${id}/analyze`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setHook((prev) => prev ? { ...prev, class_analysis: data.class_analysis, analysis_updated_at: data.analysis_updated_at, analysis_video_count: data.analysis_video_count } : prev)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setAnalyzing(false))
  }

  const analysis = hook?.class_analysis

  const blueprintSteps: { name?: string; text: string }[] = (() => {
    if (!analysis?.blueprint) return []
    const bp = analysis.blueprint
    const parseStep = (s: any): { name?: string; text: string } => {
      if (typeof s === 'string') return { text: s }
      return { name: s.name, text: s.instruction || s.description || s.text || (typeof s.step === 'string' ? s.step : '') }
    }
    if (Array.isArray(bp)) return bp.map(parseStep)
    if (typeof bp === 'string') return bp.split('\n').filter(Boolean).map(s => ({ text: s }))
    if (typeof bp === 'object') {
      if (bp.steps && Array.isArray(bp.steps)) return bp.steps.map(parseStep)
      return Object.values(bp).filter((v: any) => typeof v === 'string').map((v: any) => ({ text: v }))
    }
    return []
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !hook) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center">
        <p className="text-slate-500 text-sm">{error || 'Hook not found'}</p>
        <Link to="/dashboard/hooks" className="text-pink-400 text-xs font-bold mt-4 inline-block hover:text-pink-300">
          Back to Hooks
        </Link>
      </div>
    )
  }

  const totalVideoCount = pagination?.total ?? videos.length
  const avgHookEffectiveness = videos.length > 0
    ? videos.reduce((sum, v) => sum + (v.hook_effectiveness || 0), 0) / Math.max(videos.filter(v => v.hook_effectiveness != null).length, 1)
    : 0

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard/hooks" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors shrink-0">
            Hook Analysis
          </Link>
          <span className="text-slate-600 text-xs shrink-0">/</span>
          <span className="text-white text-xs font-black uppercase tracking-widest truncate">{hook.name}</span>
        </div>
        {!analysis && totalVideoCount >= 3 && (
          <button
            onClick={triggerAnalysis}
            disabled={analyzing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all shrink-0 ml-3"
          >
            {analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
          </button>
        )}
      </div>

      {/* Hook Hero */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <span className="badge-glass text-pink-400 font-black">
            {analysis ? 'Analyzed' : 'Hook Class'}
          </span>
          {hook.analysis_updated_at && (
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
              Updated {timeAgo(hook.analysis_updated_at)}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter mb-3 md:mb-4 uppercase">{hook.name}</h1>
        <p className="text-slate-400 text-sm md:text-lg font-medium max-w-3xl leading-relaxed">
          {analysis?.class_description || hook.hook_technique || hook.description || 'No description yet. Run AI analysis to generate insights.'}
        </p>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Views</div>
          <div className="text-xl md:text-2xl font-black text-white">{formatNumber(Math.round(hook.avg_views || 0))}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Engagement</div>
          <div className="text-xl md:text-2xl font-black text-teal-400">
            {hook.avg_engagement_rate ? Number(hook.avg_engagement_rate).toFixed(1) + '%' : '--'}
          </div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Videos</div>
          <div className="text-xl md:text-2xl font-black text-white">{totalVideoCount}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Hook Power</div>
          <div className="text-xl md:text-2xl font-black text-pink-400">
            {avgHookEffectiveness > 0 ? Math.round(avgHookEffectiveness * 100) + '%' : '--'}
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {analysis && (
        <>
          {/* The Blueprint */}
          {blueprintSteps.length > 0 && (
            <div className="blueprint-box p-5 md:p-8 rounded-3xl mb-10 md:mb-16 relative overflow-hidden glass-card">
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                <i className="fas fa-magnet text-5xl md:text-8xl text-orange-400"></i>
              </div>
              <h2 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-2">
                <i className="fas fa-clipboard-list"></i> The Blueprint
              </h2>
              <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">How to execute:</h3>
                  <ul className="space-y-3">
                    {blueprintSteps.slice(0, 6).map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-black">
                          {i + 1}
                        </span>
                        <div>
                          {step.name && <span className="font-black text-white">{step.name}: </span>}
                          {step.text}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {analysis.what_defines_this_format && (
                  <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">What defines this hook:</h4>
                    <p className="text-xs text-slate-400 font-semibold leading-loose">
                      {analysis.what_defines_this_format}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategic Tactics Grid */}
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
            {/* Gold Standard */}
            {analysis.gold_standard_tactics && analysis.gold_standard_tactics.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-teal-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-check-circle"></i> Gold Standard
                </h3>
                <div className="space-y-4">
                  {analysis.gold_standard_tactics.map((tactic, i) => (
                    <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-teal-500">
                      {tactic.category && (
                        <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                          {getCategoryLabel(tactic.category)}
                        </div>
                      )}
                      <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                      {(tactic.description || tactic.analysis || tactic.why) && (
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                          {tactic.description || tactic.analysis || tactic.why}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Gaps */}
            {analysis.execution_gaps && analysis.execution_gaps.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-orange-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i> Execution Gaps
                </h3>
                <div className="space-y-4">
                  {analysis.execution_gaps.map((tactic, i) => (
                    <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-orange-500">
                      {tactic.category && (
                        <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                          {getCategoryLabel(tactic.category)}
                        </div>
                      )}
                      <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                      {(tactic.description || tactic.analysis || tactic.why) && (
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                          {tactic.description || tactic.analysis || tactic.why}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overrated */}
            {analysis.overrated_tactics && analysis.overrated_tactics.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-times-circle"></i> Overrated
                </h3>
                <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                  {analysis.overrated_tactics.map((tactic, i) => (
                    <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-red-500">
                      {tactic.category && (
                        <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                          {getCategoryLabel(tactic.category)}
                        </div>
                      )}
                      <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                      {(tactic.description || tactic.analysis || tactic.why) && (
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                          {tactic.description || tactic.analysis || tactic.why}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* No analysis prompt */}
      {!analysis && (
        <div className="glass-card rounded-3xl p-6 md:p-10 mb-10 md:mb-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-brain text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No AI Analysis Yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            {totalVideoCount < 3
              ? `Need at least 3 videos to run analysis. Currently ${totalVideoCount} video${totalVideoCount === 1 ? '' : 's'}.`
              : 'Run AI analysis to generate the blueprint, gold standard tactics, and execution gaps.'}
          </p>
          {totalVideoCount >= 3 && (
            <button
              onClick={triggerAnalysis}
              disabled={analyzing}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-black rounded-xl transition-all"
            >
              {analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
            </button>
          )}
        </div>
      )}

      {/* Videos Grid - The Receipts */}
      {videos.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight uppercase">The Receipts</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Real videos using this hook, ranked by views.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {videos.length} of {totalVideoCount} video{totalVideoCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {videos.map((video, idx) => {
              const thumb = getThumbnailSrc(video)
              return (
                <div
                  key={video.id}
                  className="relative group cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => {
                    setCarouselData({ videos: videos as CarouselVideo[], initialIndex: idx })
                  }}
                >
                  <div className="aspect-[9/16] bg-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`@${video.username}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
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
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Views</span>
                          <span className="text-xs font-black">{formatNumber(video.views)}</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">Hook Power</span>
                          <span className={`text-xs font-black ${
                            (video.hook_effectiveness || 0) >= 0.7
                              ? 'text-teal-400'
                              : (video.hook_effectiveness || 0) >= 0.4
                              ? 'text-yellow-400'
                              : 'text-slate-400'
                          }`}>
                            {video.hook_effectiveness != null
                              ? Math.round(Number(video.hook_effectiveness) * 100) + '%'
                              : '--'}
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
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">All {totalVideoCount} videos loaded</span>
            )}
          </div>
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
