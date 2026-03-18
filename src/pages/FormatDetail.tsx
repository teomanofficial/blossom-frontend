import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import { parseBlueprint, parseDefiningTraits } from '../lib/blueprint'
import type { TraitWeight } from '../lib/blueprint'
import { useAudioPlayer, getAudioUrl } from '../lib/useAudioPlayer'
import { useAuth } from '../context/AuthContext'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'
import FineTunePanel from '../components/FineTunePanel'

interface FormatSong {
  id: number
  title: string
  artist: string | null
  album: string | null
  cover_url: string | null
  local_cover_path: string | null
  play_url: string | null
  local_audio_path: string | null
  platform: string
  is_original: boolean
  duration_sec: number | null
  total_video_count: number
  total_views: number
  avg_views: number
  recent_video_count: number
  recent_avg_views: number
  trending_score: number
  count_3h: number
  count_24h: number
  count_72h: number
  count_7d: number
  views_72h: number
  velocity: number
}

interface FormatVideo {
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
  final_viral_probability: number | null
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
  gold_standard_tactics?: (TacticItem | string)[]
  overrated_tactics?: (TacticItem | string)[]
  harmful_tactics?: (TacticItem | string)[]
  execution_gaps?: (TacticItem | string)[]
  blueprint?: any
  video_list?: any[]
  tactic_frequency?: any
}

function normalizeTactic(tactic: TacticItem | string): TacticItem {
  if (typeof tactic === 'string') {
    const colonIdx = tactic.indexOf(':')
    if (colonIdx > 0 && colonIdx < 60) {
      return { name: tactic.slice(0, colonIdx).trim(), description: tactic.slice(colonIdx + 1).trim() }
    }
    return { name: tactic }
  }
  return tactic
}

interface TacticVideo {
  id: number
  username: string
  caption: string | null
  views: number
  likes: number
  platform: string
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  engagement_rate: number
  execution_score: number | null
  final_viral_probability: number | null
}

interface FormatTactic {
  id: number
  name: string
  category: string
  description: string | null
  why_it_works: string | null
  video_count: number
  total_video_count: number
  avg_execution_score: number | null
  videos: TacticVideo[]
}

interface FormatHook {
  id: number
  name: string
  description: string | null
  video_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface FormatDetail {
  id: number
  name: string
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: ClassAnalysis | null
  analysis_updated_at: string | null
  analysis_video_count: number | null
  total_platform_videos: number
  videos: FormatVideo[]
  top_hooks?: FormatHook[]
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

function getThumbnailSrc(video: FormatVideo): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

function getTacticVideoThumb(video: TacticVideo): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

export default function FormatDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [format, setFormat] = useState<FormatDetail | null>(null)
  const [videos, setVideos] = useState<FormatVideo[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const [formatTactics, setFormatTactics] = useState<FormatTactic[]>([])
  const [tacticsLoading, setTacticsLoading] = useState(false)
  const [expandedTactic, setExpandedTactic] = useState<number | null>(null)
  const [tacticVideosLoading, setTacticVideosLoading] = useState<Record<number, boolean>>({})
  const [formatSongs, setFormatSongs] = useState<FormatSong[]>([])
  const [songsLoading, setSongsLoading] = useState(false)
  const audio = useAudioPlayer()
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchFormat = useCallback(() => {
    setLoading(true)
    authFetch(`/api/analysis/formats/${id}?page=1&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error('Format not found')
        return r.json()
      })
      .then((data) => {
        setFormat(data)
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
    authFetch(`/api/analysis/formats/${id}?page=${nextPage}&limit=${pagination.limit}`)
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

  const fetchTactics = useCallback(() => {
    setTacticsLoading(true)
    authFetch(`/api/analysis/formats/${id}/tactics?limit=20&video_limit=10`)
      .then((r) => r.json())
      .then((data) => setFormatTactics(data.tactics || []))
      .catch(() => {})
      .finally(() => setTacticsLoading(false))
  }, [id])

  const loadMoreTacticVideos = useCallback((tacticId: number, currentCount: number) => {
    setTacticVideosLoading((prev) => ({ ...prev, [tacticId]: true }))
    authFetch(`/api/analysis/formats/${id}/tactics/${tacticId}/videos?limit=10&offset=${currentCount}`)
      .then((r) => r.json())
      .then((data) => {
        const newVideos = data.videos || []
        setFormatTactics((prev) =>
          prev.map((t) =>
            t.id === tacticId ? { ...t, videos: [...t.videos, ...newVideos] } : t
          )
        )
      })
      .catch(() => {})
      .finally(() => setTacticVideosLoading((prev) => ({ ...prev, [tacticId]: false })))
  }, [id])

  const fetchSongs = useCallback(() => {
    setSongsLoading(true)
    setFormatSongs([])
    authFetch(`/api/analysis/formats/${id}/songs?limit=10&days=30`)
      .then((r) => r.json())
      .then((data) => setFormatSongs(data.songs || []))
      .catch(() => {})
      .finally(() => setSongsLoading(false))
  }, [id])

  useEffect(() => { fetchFormat(); fetchTactics(); fetchSongs() }, [fetchFormat, fetchTactics, fetchSongs])

  const triggerAnalysis = () => {
    setAnalyzing(true)
    authFetch(`/api/analysis/formats/${id}/analyze`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setFormat((prev) => prev ? { ...prev, class_analysis: data.class_analysis, analysis_updated_at: data.analysis_updated_at, analysis_video_count: data.analysis_video_count } : prev)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setAnalyzing(false))
  }

  const analysis = format?.class_analysis

  const blueprint = parseBlueprint(analysis?.blueprint)
  const definingTraits = parseDefiningTraits(analysis?.what_defines_this_format)

  const weightConfig: Record<TraitWeight, { label: string; bg: string; text: string; border: string }> = {
    core: { label: 'Core', bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    important: { label: 'Important', bg: 'bg-teal-500/5', text: 'text-teal-400/70', border: 'border-teal-500/10' },
    supporting: { label: 'Supporting', bg: 'bg-white/[0.02]', text: 'text-slate-500', border: 'border-white/5' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !format) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center">
        <p className="text-slate-500 text-sm">{error || 'Format not found'}</p>
        <Link to="/dashboard/formats" className="text-pink-400 text-xs font-bold mt-4 inline-block hover:text-pink-300">
          Back to Formats
        </Link>
      </div>
    )
  }

  const totalVideoCount = pagination?.total ?? videos.length

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard/formats" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors shrink-0">
            Format Analysis
          </Link>
          <span className="text-slate-600 text-xs shrink-0">/</span>
          <span className="text-white text-xs font-black uppercase tracking-widest truncate">{format.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {!analysis && totalVideoCount >= 3 && (
            <button
              onClick={triggerAnalysis}
              disabled={analyzing}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all"
            >
              {analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
            </button>
          )}
          {profile?.user_type === 'admin' && (
            <button
              onClick={triggerAnalysis}
              disabled={analyzing}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <i className="fas fa-sync-alt text-[9px]"></i>
              {analyzing ? 'RETRAINING...' : 'RETRAIN'}
            </button>
          )}
        </div>
      </div>

      {/* Format Hero */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <span className="badge-glass text-pink-400 font-black">
            {analysis ? 'Analyzed' : 'Format Class'}
          </span>
          {format.analysis_updated_at && (
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
              Updated {timeAgo(format.analysis_updated_at)}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display tracking-tighter mb-3 md:mb-4 uppercase">{format.name}</h1>
        <p className="text-slate-400 text-sm md:text-lg font-medium max-w-3xl leading-relaxed">
          {analysis?.class_description || format.description || 'No description yet. Run AI analysis to generate insights.'}
        </p>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Views</div>
          <div className="text-xl md:text-2xl font-black text-white">{formatNumber(Math.round(format.avg_views || 0))}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Engagement</div>
          <div className="text-xl md:text-2xl font-black text-teal-400">
            {format.avg_engagement_rate ? Number(format.avg_engagement_rate).toFixed(1) + '%' : '--'}
          </div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Videos</div>
          <div className="text-xl md:text-2xl font-black text-white">{totalVideoCount}</div>
        </div>
        <div className="p-4 md:p-6 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Usage</div>
          <div className="text-xl md:text-2xl font-black text-pink-400">
            {format.total_platform_videos > 0 ? ((totalVideoCount / format.total_platform_videos) * 100).toFixed(1) + '%' : '--'}
          </div>
        </div>
      </div>

      {/* Fine-Tune Panel */}
      <FineTunePanel itemType="format" itemId={Number(id)} itemName={format.name} />

      {/* Top Hooks in this Format */}
      {format.top_hooks && format.top_hooks.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <i className="fas fa-fishing text-pink-400 text-[10px]"></i> Most Used Hooks
          </h3>
          <div className="flex flex-wrap gap-2">
            {format.top_hooks.map((hook) => (
              <Link
                key={hook.id}
                to={`/dashboard/hooks/${hook.id}`}
                className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 hover:border-pink-500/30 transition-all group"
              >
                <span className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">{hook.name}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{hook.video_count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      {analysis && (
        <>
          {/* The Blueprint */}
          {blueprint && (
            <div className="blueprint-box p-5 md:p-8 rounded-3xl mb-10 md:mb-16 relative overflow-hidden glass-card">
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                <i className="fas fa-pencil-ruler text-5xl md:text-8xl text-orange-400"></i>
              </div>
              <h2 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-2">
                <i className="fas fa-clipboard-list"></i> The Blueprint
              </h2>
              <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {blueprint.title || 'How to execute:'}
                  </h3>
                  {blueprint.phases.map((phase) => (
                    <div key={phase.phase_number}>
                      {phase.phase_title && (
                        <h4 className="text-[11px] font-black text-orange-300/70 uppercase tracking-widest mb-2 mt-4 first:mt-0">
                          {phase.phase_title}
                        </h4>
                      )}
                      <ul className="space-y-3">
                        {phase.steps.map((step) => (
                          <li key={step.step_number} className="flex items-start gap-3 text-sm text-slate-300 font-medium leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-black">
                              {step.step_number}
                            </span>
                            <div>
                              {step.name && <span className="font-black text-white">{step.name}: </span>}
                              {step.instruction}
                              {step.tip && (
                                <span className="block text-[11px] text-orange-400/60 mt-1 italic">{step.tip}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {definingTraits && definingTraits.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3">What defines this format</h4>
                    {definingTraits.map((trait, i) => {
                      const cfg = weightConfig[trait.weight]
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">{trait.text}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategic Tactics Grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-20">
            {/* Gold Standard */}
            {analysis.gold_standard_tactics && analysis.gold_standard_tactics.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-teal-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-check-circle"></i> Gold Standard
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Tactics that top-performing videos use significantly more than underperformers.</p>
                </div>
                <div className="space-y-4">
                  {analysis.gold_standard_tactics.map((raw, i) => {
                    const tactic = normalizeTactic(raw)
                    return (
                      <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-teal-500">
                        {tactic.category && (
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{tactic.category}</div>
                        )}
                        <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                        {(tactic.description || tactic.analysis || tactic.why) && (
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            {tactic.description || tactic.analysis || tactic.why}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Execution Gaps */}
            {analysis.execution_gaps && analysis.execution_gaps.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-orange-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i> Execution Gaps
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Tactics where top creators execute much better than the rest. Quality matters more than quantity here.</p>
                </div>
                <div className="space-y-4">
                  {analysis.execution_gaps.map((raw, i) => {
                    const tactic = normalizeTactic(raw)
                    return (
                      <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-orange-500">
                        {tactic.category && (
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{tactic.category}</div>
                        )}
                        <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                        {(tactic.description || tactic.analysis || tactic.why) && (
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            {tactic.description || tactic.analysis || tactic.why}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Overrated */}
            {analysis.overrated_tactics && analysis.overrated_tactics.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-times-circle"></i> Overrated
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Tactics that underperforming videos use more often. Using these won't help your content stand out.</p>
                </div>
                <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                  {analysis.overrated_tactics.map((raw, i) => {
                    const tactic = normalizeTactic(raw)
                    return (
                      <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-red-500">
                        {tactic.category && (
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{tactic.category}</div>
                        )}
                        <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                        {(tactic.description || tactic.analysis || tactic.why) && (
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            {tactic.description || tactic.analysis || tactic.why}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Harmful */}
            {analysis.harmful_tactics && analysis.harmful_tactics.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-rose-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-skull-crossbones"></i> Harmful
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Tactics that actively damage performance. Almost exclusively found in the worst-performing videos — avoid these.</p>
                </div>
                <div className="space-y-4">
                  {analysis.harmful_tactics.map((raw, i) => {
                    const tactic = normalizeTactic(raw)
                    return (
                      <div key={i} className="p-4 md:p-5 glass-card rounded-2xl border-l-4 border-l-rose-600 bg-rose-500/5">
                        {tactic.category && (
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{tactic.category}</div>
                        )}
                        <h4 className="font-bold text-white mb-2">{tactic.name || tactic.tactic}</h4>
                        {(tactic.description || tactic.analysis || tactic.why) && (
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            {tactic.description || tactic.analysis || tactic.why}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Most Used Tactics */}
      {formatTactics.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight uppercase">Most Used Tactics</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Tactics most frequently used in this format, with example videos.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {formatTactics.length} tactic{formatTactics.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-6">
            {formatTactics.map((tactic) => {
              const isExpanded = expandedTactic === tactic.id
              return (
                <div key={tactic.id} className="glass-card rounded-2xl overflow-hidden">
                  {/* Tactic Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedTactic(isExpanded ? null : tactic.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <i className="fas fa-bolt text-indigo-400 text-sm"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-white text-sm truncate">{tactic.name}</h4>
                            {tactic.category && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded">
                                {tactic.category.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {tactic.description && (
                            <p className="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-xl">
                              {tactic.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-3 md:ml-4">
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Videos</div>
                          <div className="text-sm font-black text-white">
                            {tactic.total_video_count}
                          </div>
                        </div>
                        {tactic.avg_execution_score != null && (
                          <div className="text-right">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Exec Score</div>
                            <div className={`text-sm font-black ${
                              tactic.avg_execution_score >= 70 ? 'text-teal-400' :
                              tactic.avg_execution_score >= 40 ? 'text-yellow-400' : 'text-slate-400'
                            }`}>
                              {tactic.avg_execution_score}
                            </div>
                          </div>
                        )}
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-xs`}></i>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Videos */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      {tactic.why_it_works && (
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4 max-w-2xl">
                          <span className="text-slate-300 font-bold">Why it works: </span>
                          {tactic.why_it_works}
                        </p>
                      )}
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {tactic.videos.map((video) => {
                          const thumb = getTacticVideoThumb(video)
                          return (
                            <div
                              key={video.id}
                              className="flex-shrink-0 w-28 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCarouselData({
                                  videos: tactic.videos as unknown as CarouselVideo[],
                                  initialIndex: tactic.videos.indexOf(video),
                                })
                              }}
                            >
                              <div className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden border border-white/5 group-hover:border-indigo-500/30 transition-all relative">
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
                                    <i className="fas fa-film text-slate-700 text-lg"></i>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                                  <span className="text-[8px] font-black text-white truncate">@{video.username}</span>
                                  <span className="text-[8px] font-black text-slate-400">{formatNumber(video.views)} views</span>
                                </div>
                              </div>
                              {video.execution_score != null && (
                                <div className="mt-1 flex items-center gap-1">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        video.execution_score >= 70 ? 'bg-teal-400' :
                                        video.execution_score >= 40 ? 'bg-yellow-400' : 'bg-slate-500'
                                      }`}
                                      style={{ width: `${video.execution_score}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-black text-slate-500">{video.execution_score}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* Load more videos */}
                        {tactic.total_video_count > tactic.videos.length && (
                          <button
                            className="flex-shrink-0 w-28 aspect-[9/16] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center hover:border-indigo-500/30 transition-colors disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              loadMoreTacticVideos(tactic.id, tactic.videos.length)
                            }}
                            disabled={tacticVideosLoading[tactic.id]}
                          >
                            {tacticVideosLoading[tactic.id] ? (
                              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <div className="text-lg font-black text-slate-400 mb-1">+{tactic.total_video_count - tactic.videos.length}</div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Load more</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tacticsLoading && (
        <div className="flex items-center justify-center py-8 mb-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs font-bold ml-3">Loading tactics...</span>
        </div>
      )}

      {/* Trending Songs for this Format */}
      {formatSongs.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight uppercase">Trending Songs</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Songs most used in this format, ranked by trending score.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {formatSongs.length} song{formatSongs.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-1.5">
            {formatSongs.map((song, idx) => {
              const coverSrc = getStorageUrl(song.local_cover_path)
              const hasAudio = !!getAudioUrl(song)
              const isPlaying = audio.playingId === song.id
              const isLoading = audio.loadingId === song.id
              const vel = song.velocity >= 3
                ? { icon: 'fa-fire', color: 'text-orange-400' }
                : song.velocity >= 1.5
                ? { icon: 'fa-arrow-trend-up', color: 'text-green-400' }
                : null
              return (
                <div
                  key={song.id}
                  className={`glass-card rounded-xl flex items-center gap-3 px-3 py-2.5 transition-all group ${
                    hasAudio ? 'cursor-pointer' : ''
                  } ${isPlaying ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'border-white/5 hover:border-cyan-500/30'}`}
                  onClick={hasAudio ? () => audio.toggle(song) : undefined}
                >
                  {/* Rank */}
                  <span className="text-[10px] font-black text-slate-600 w-4 text-center shrink-0">{idx + 1}</span>

                  {/* Cover */}
                  <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative">
                    {coverSrc ? (
                      <img src={coverSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-pink-500/10">
                        <i className="fas fa-music text-cyan-400/30 text-sm" />
                      </div>
                    )}
                    {hasAudio && (isPlaying || isLoading) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <i className="fas fa-pause text-white text-[9px]" />
                        )}
                      </div>
                    )}
                    {isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
                        <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${audio.duration > 0 ? (audio.progress / audio.duration) * 100 : 0}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-black truncate transition-colors ${isPlaying ? 'text-cyan-300' : 'text-white'}`}>{song.title}</div>
                    {song.artist && <div className="text-[10px] text-slate-500 font-bold truncate">{song.artist}</div>}
                  </div>

                  {/* Badges */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {vel && (
                      <span className={`text-[9px] font-black ${vel.color}`}>
                        <i className={`fas ${vel.icon} text-[8px]`} />
                      </span>
                    )}
                    <i className={`fab fa-${song.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[10px] text-white/40`} />
                  </div>

                  {/* Stats — last 72h */}
                  <div className="hidden md:flex items-center gap-4 shrink-0 text-[10px] font-bold text-slate-500">
                    <span className="w-16 text-right"><i className="fas fa-eye mr-0.5 text-[8px]" />{formatNumber(song.views_72h)}</span>
                    <span className="w-14 text-right text-cyan-400/80">{song.count_72h} vid{song.count_72h === 1 ? '' : 's'}</span>
                    <span className="w-10 text-right text-slate-600">72h</span>
                  </div>

                  {/* Mobile stats */}
                  <div className="flex md:hidden items-center gap-2 shrink-0 text-[10px] font-bold text-slate-500">
                    <span className="text-cyan-400/80">{song.recent_video_count}</span>
                  </div>

                  {/* Download */}
                  {hasAudio && (
                    <a
                      href={`/api/analysis/music/${song.id}/stream`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-cyan-500/20 flex items-center justify-center transition-colors shrink-0"
                      title="Download audio"
                    >
                      <i className="fas fa-download text-[9px] text-slate-400 hover:text-cyan-400" />
                    </a>
                  )}
                  {!hasAudio && (
                    <div className="w-7 h-7 shrink-0" title="Audio not available — metadata only" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {songsLoading && (
        <div className="flex items-center justify-center py-8 mb-12">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs font-bold ml-3">Loading trending songs...</span>
        </div>
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

      {/* Videos Grid - Example Viral Videos */}
      {videos.length > 0 && (
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight uppercase">Example Viral Videos</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium">Real videos using this format, ranked by views.</p>
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
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
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
                          <span className="text-[8px] font-black text-slate-500 uppercase">Viral Prob.</span>
                          <span className={`text-xs font-black ${
                            (video.final_viral_probability || 0) >= 0.7
                              ? 'text-teal-400'
                              : (video.final_viral_probability || 0) >= 0.4
                              ? 'text-yellow-400'
                              : 'text-slate-400'
                          }`}>
                            {video.final_viral_probability != null
                              ? Math.round(video.final_viral_probability * 100) + '%'
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
