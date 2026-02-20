import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface SourceVideo {
  id: number
  platform: string
  username: string
  caption: string | null
  content: string | null
  views: number
  likes: number
  engagement_rate: number
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  relevance_score: number | null
}

interface Suggestion {
  id: number
  title: string
  description: string
  script_outline: string | null
  suggested_hook: string | null
  suggested_tactics: string[] | null
  suggested_hashtags: string[] | null
  primary_keyword_id: number | null
  format_class_id: number | null
  keyword_name: string | null
  keyword_category: string | null
  format_name: string | null
  fingerprint: string
  source_video_count: number
  avg_views: number
  avg_engagement_rate: number
  trend_strength: number
  platform_hint: string | null
  difficulty: string | null
  equipment_needed: string[] | null
  estimated_duration: string | null
  upvote_count: number
  save_count: number
  approved_count: number
  generation_date: string
  created_at: string
  has_voted: boolean
  has_saved: boolean
  has_approved: boolean
  source_videos: SourceVideo[]
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function difficultyColor(d: string | null): string {
  switch (d) {
    case 'easy': return 'bg-teal-500/10 text-teal-400'
    case 'medium': return 'bg-amber-500/10 text-amber-400'
    case 'hard': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

function getThumbnailSrc(video: SourceVideo): string | null {
  if (video.local_thumbnail_path) {
    if (video.local_thumbnail_path.startsWith('http')) return video.local_thumbnail_path
    return `/media/${video.local_thumbnail_path.split('/').pop()}`
  }
  return video.thumbnail_url
}

export default function SuggestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const [tacticMap, setTacticMap] = useState<Record<string, number>>({})

  useEffect(() => {
    loadSuggestion()
  }, [id])

  async function loadSuggestion() {
    try {
      setLoading(true)
      const data = await authFetch(`/api/analysis/suggestions/${id}`).then(r => r.json())
      setSuggestion(data)
      if (data.suggested_tactics?.length) {
        loadTacticIds(data.suggested_tactics)
      }
    } catch (error) {
      console.error('Failed to load suggestion:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTacticIds(tacticNames: string[]) {
    try {
      const res = await authFetch('/api/analysis/tactics?limit=500').then(r => r.json())
      const allTactics: { id: number; name: string; name_normalized: string }[] = res.tactics || []
      const map: Record<string, number> = {}
      for (const name of tacticNames) {
        const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')
        const match = allTactics.find(t =>
          (t.name_normalized || t.name.toLowerCase().trim().replace(/\s+/g, ' ')) === normalized
        )
        if (match) map[name] = match.id
      }
      setTacticMap(map)
    } catch (error) {
      console.error('Failed to load tactic IDs:', error)
    }
  }

  async function toggleVote() {
    if (!suggestion) return
    try {
      const res = await authFetch(`/api/analysis/suggestions/${suggestion.id}/vote`, { method: 'POST' })
      const data = await res.json()
      setSuggestion(prev => prev ? { ...prev, upvote_count: data.upvote_count, has_voted: data.voted } : prev)
    } catch (error) {
      console.error('Failed to toggle vote:', error)
    }
  }

  async function toggleSave() {
    if (!suggestion) return
    try {
      const res = await authFetch(`/api/analysis/suggestions/${suggestion.id}/save`, { method: 'POST' })
      const data = await res.json()
      setSuggestion(prev => prev ? { ...prev, save_count: data.save_count, has_saved: data.saved } : prev)
    } catch (error) {
      console.error('Failed to toggle save:', error)
    }
  }

  async function toggleApprove() {
    if (!suggestion) return
    try {
      const res = await authFetch(`/api/analysis/suggestions/${suggestion.id}/approve`, { method: 'POST' })
      const data = await res.json()
      setSuggestion(prev => prev ? { ...prev, approved_count: data.approved_count, has_approved: data.approved } : prev)
    } catch (error) {
      console.error('Failed to toggle approve:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-black text-white mb-2">Suggestion not found</h2>
        <button onClick={() => navigate('/dashboard/suggestions')} className="text-pink-400 text-sm font-bold hover:underline">
          Back to Suggestions
        </button>
      </div>
    )
  }

  const s = suggestion

  return (
    <>
      {/* Back nav */}
      <button
        onClick={() => navigate('/dashboard/suggestions')}
        className="flex items-center gap-2 text-slate-500 text-xs font-bold hover:text-white transition-colors mb-6"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Suggestions
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-8">
        {/* Main content - left 2 cols */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Header card */}
          <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-8">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {s.keyword_name && (
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 tracking-wider">
                  {s.keyword_name}
                </span>
              )}
              {s.format_name && (
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 tracking-wider">
                  {s.format_name}
                </span>
              )}
              {s.difficulty && (
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider ${difficultyColor(s.difficulty)}`}>
                  {s.difficulty}
                </span>
              )}
              {s.platform_hint && s.platform_hint !== 'both' && (
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                  s.platform_hint === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {s.platform_hint}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">{s.title}</h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{s.description}</p>

            {/* Meta row */}
            <div className="flex items-center gap-3 md:gap-6 text-[10px] font-bold text-slate-500 flex-wrap">
              {s.equipment_needed && s.equipment_needed.length > 0 && (
                <span>
                  <i className="fas fa-camera mr-1 text-slate-600"></i>
                  {s.equipment_needed.join(', ')}
                </span>
              )}
              {s.estimated_duration && (
                <span>
                  <i className="fas fa-clock mr-1 text-slate-600"></i>
                  {s.estimated_duration}
                </span>
              )}
              <span>
                <i className="fas fa-chart-line mr-1 text-slate-600"></i>
                Trend score: {Math.round(s.trend_strength)}
              </span>
              <span>{timeAgo(s.created_at)}</span>
            </div>
          </div>

          {/* Hook */}
          {s.suggested_hook && (
            <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-8">
              <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-3">
                <i className="fas fa-bolt mr-1"></i> Hook (First 3 Seconds)
              </div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
                "{s.suggested_hook}"
              </p>
            </div>
          )}

          {/* Script Outline */}
          {s.script_outline && (
            <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-8">
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">
                <i className="fas fa-film mr-1"></i> Script Outline
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed whitespace-pre-line">
                {s.script_outline}
              </p>
            </div>
          )}

          {/* Tactics + Hashtags */}
          {((s.suggested_tactics && s.suggested_tactics.length > 0) || (s.suggested_hashtags && s.suggested_hashtags.length > 0)) && (
            <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-8">
              {s.suggested_tactics && s.suggested_tactics.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tactics</div>
                  <div className="flex flex-wrap gap-2">
                    {s.suggested_tactics.map((t, i) => tacticMap[t] ? (
                      <Link
                        key={i}
                        to={`/dashboard/tactics/${tacticMap[t]}`}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                      >
                        {t}
                      </Link>
                    ) : (
                      <span key={i} className="text-xs font-bold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {s.suggested_hashtags && s.suggested_hashtags.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {s.suggested_hashtags.map((h, i) => (
                      <span key={i} className="text-xs font-bold px-3 py-1 rounded-lg bg-white/5 text-slate-400">
                        #{h.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source Videos */}
          {s.source_videos && s.source_videos.length > 0 && (
            <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-8">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Source Videos ({s.source_videos.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {s.source_videos.map((v, idx) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-pink-500/20 transition-colors"
                    onClick={() => setCarouselData({
                      videos: s.source_videos as CarouselVideo[],
                      initialIndex: idx,
                    })}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {getThumbnailSrc(v) ? (
                        <img src={getThumbnailSrc(v)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-[8px] font-bold">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          v.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {v.platform}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">@{v.username}</span>
                      </div>
                      {v.caption && (
                        <p className="text-[10px] text-slate-500 font-medium truncate mb-1">{v.caption}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                        <span>{formatNumber(v.views)} views</span>
                        <span>{formatNumber(v.likes)} likes</span>
                        <span>{Number(v.engagement_rate).toFixed(1)}% eng</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - right col */}
        <div className="space-y-4">
          {/* Actions card */}
          <div className="glass-card rounded-[1.5rem] border-white/5 p-5 md:p-6 xl:sticky xl:top-6">
            <div className="space-y-3">
              {/* Upvote */}
              <button
                onClick={toggleVote}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  s.has_voted
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <i className="fas fa-arrow-up"></i>
                Upvote {s.upvote_count > 0 ? `(${s.upvote_count})` : ''}
              </button>

              {/* Save */}
              <button
                onClick={toggleSave}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  s.has_saved
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <i className="fas fa-bookmark"></i>
                {s.has_saved ? 'Saved' : 'Save'}
              </button>

              {/* Approve */}
              <button
                onClick={toggleApprove}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  s.has_approved
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <i className="fas fa-check-circle"></i>
                {s.has_approved ? 'Will Create' : 'Mark as Will Create'}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Trend Score</span>
                <span className={`font-black ${
                  s.trend_strength >= 70 ? 'text-teal-400' :
                  s.trend_strength >= 40 ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {Math.round(s.trend_strength)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Source Videos</span>
                <span className="text-white font-black">{s.source_video_count}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Avg Views</span>
                <span className="text-white font-black">{formatNumber(s.avg_views)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Avg Engagement</span>
                <span className="text-white font-black">{s.avg_engagement_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Upvotes</span>
                <span className="text-white font-black">{s.upvote_count}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Saves</span>
                <span className="text-white font-black">{s.save_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
