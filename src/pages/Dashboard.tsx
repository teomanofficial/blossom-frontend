import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

/* ── Types ── */
interface Format { id: number; name: string; video_count: number; avg_views: number; avg_engagement_rate: number }
interface Hook { id: number; name: string; video_count: number; avg_views: number }
interface MusicTrack {
  id: number; title: string; artist: string; cover_url: string; local_cover_path: string
  video_count: number; total_views: number; avg_views: number; platform: string
}
interface Tactic {
  id: number; name: string; category: string; why_it_works: string
  video_count: number; avg_views_when_present: number; avg_execution_score: number
}
interface Suggestion {
  id: number; title: string; description: string; suggested_hook: string
  suggested_hashtags: string[]; difficulty: string; estimated_duration: string
  trend_strength: number; avg_views: number; platform_hint: string
  source_video_count: number; upvote_count: number; format_name: string
}
interface TrendingHashtag { tag: string; video_count: number; avg_views: number; total_views: number }
interface TrendingKeyword {
  id: number; name: string; category: string; video_count: number
  avg_views: number; avg_engagement: number
}
interface ConnectedAccounts { total: number; active: number; total_followers: number }

interface Stats {
  platform_breakdown: Record<string, number>
  top_formats: Format[]; top_hooks: Hook[]
  top_viral_videos: CarouselVideo[]; trending_music: MusicTrack[]
  top_tactics: Tactic[]; featured_suggestion: Suggestion | null
  trending_hashtags: TrendingHashtag[]; trending_keywords: TrendingKeyword[]
  connected_accounts: ConnectedAccounts
}

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function difficultyColor(d: string) {
  if (d === 'easy') return 'bg-emerald-500/10 text-emerald-400'
  if (d === 'medium') return 'bg-yellow-500/10 text-yellow-400'
  return 'bg-red-500/10 text-red-400'
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
  if (v.local_thumbnail_path) {
    if (v.local_thumbnail_path.startsWith('http')) return v.local_thumbnail_path
    return `/media/${v.local_thumbnail_path.split('/').pop()}`
  }
  return v.thumbnail_url
}

const CATEGORY_COLORS: Record<string, string> = {
  topic: 'text-blue-400',
  style: 'text-purple-400',
  aesthetic: 'text-pink-400',
  audience: 'text-amber-400',
  niche: 'text-emerald-400',
  format: 'text-orange-400',
  trend: 'text-cyan-400',
  product: 'text-rose-400',
  emotion: 'text-yellow-400',
}

/* ── Keyword Cloud Component ── */
function KeywordCloud({ keywords }: { keywords: TrendingKeyword[] }) {
  if (keywords.length === 0) {
    return <p className="text-xs text-slate-600 text-center py-6">Keywords appear after video analysis</p>
  }

  const maxCount = Math.max(...keywords.map(k => k.video_count))
  const minCount = Math.min(...keywords.map(k => k.video_count))
  const range = maxCount - minCount || 1

  const shuffled = useMemo(() => {
    const arr = [...keywords]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor((i * 7 + 3) % (i + 1))
      const tmp = arr[i]!
      arr[i] = arr[j]!
      arr[j] = tmp
    }
    return arr
  }, [keywords])

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-2">
      {shuffled.map((k) => {
        const ratio = (k.video_count - minCount) / range
        const fontSize = 11 + ratio * 13
        const opacity = 0.5 + ratio * 0.5
        const color = CATEGORY_COLORS[k.category] || 'text-slate-300'

        return (
          <span
            key={k.id}
            className={`${color} font-bold hover:opacity-100 transition-opacity cursor-default capitalize`}
            style={{ fontSize: `${fontSize}px`, opacity }}
            title={`${k.name} — ${k.video_count} videos, ${fmt(k.avg_views)} avg views (${k.category})`}
          >
            {k.name}
          </span>
        )
      })}
    </div>
  )
}

/* ── Post Card Component for Carousel ── */
function PostCard({
  video,
  onClick,
}: {
  video: CarouselVideo
  onClick: () => void
}) {
  const src = getThumbnailSrc(video)

  return (
    <div
      onClick={onClick}
      className="shrink-0 w-[130px] sm:w-[160px] cursor-pointer group"
    >
      <div className="aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all relative">
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-film text-slate-700 text-2xl" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {video.final_viral_probability != null && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm ${viralBadge(video.final_viral_probability)}`}>
              {Math.round(video.final_viral_probability * 100)}%
            </span>
          )}
          <i className={`${platformIcon(video.platform)} text-[10px] text-white/70`} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5">
          <div className="text-[10px] sm:text-[11px] font-bold text-white truncate">@{video.username}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] sm:text-[10px] font-black text-white/80">
              <i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(video.views)}
            </span>
            {video.likes != null && (
              <span className="text-[9px] sm:text-[10px] font-bold text-white/60">
                <i className="fas fa-heart mr-0.5 text-[8px]" />{fmt(video.likes)}
              </span>
            )}
          </div>
        </div>
      </div>
      {video.format_class_name && (
        <div className="text-[9px] text-slate-500 font-bold mt-1.5 truncate capitalize px-1">
          {video.format_class_name}
        </div>
      )}
    </div>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    authFetch('/api/analysis/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`Stats API returned ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 340
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-1 lg:mb-2">
          Welcome, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-medium">Your viral intelligence hub. Study what works, create what's next.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 lg:mb-8">
            {[
              { to: '/dashboard/analyze', icon: 'fa-bolt', label: 'Analyze Content', desc: 'Check viral potential' },
              { to: '/dashboard/suggestions', icon: 'fa-lightbulb', label: 'Get Ideas', desc: 'AI content suggestions' },
              { to: '/dashboard/formats', icon: 'fa-fire', label: 'Viral Formats', desc: 'Browse winning formats' },
              { to: '/dashboard/influencers', icon: 'fa-user-secret', label: 'Study Creators', desc: 'Track top performers' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 hover:bg-white/[0.04] transition-all group border border-transparent hover:border-pink-500/20 active:scale-[0.97]"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <i className={`fas ${a.icon} text-pink-400 text-xs sm:text-sm`} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold group-hover:text-pink-400 transition-colors leading-tight">{a.label}</div>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">{a.desc}</div>
              </Link>
            ))}
          </div>

          {/* ── Featured Content Idea ── */}
          {stats.featured_suggestion && (
            <Link
              to={`/dashboard/suggestions/${stats.featured_suggestion.id}`}
              className="block glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8 border border-pink-500/10 hover:border-pink-500/30 transition-all group relative overflow-hidden active:scale-[0.99]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <i className="fas fa-sparkles text-pink-400 text-xs" />
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Today's Top Content Idea</span>
                </div>
                <h2 className="text-base sm:text-xl font-black mb-1.5 sm:mb-2 group-hover:text-pink-400 transition-colors leading-snug">
                  {stats.featured_suggestion.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 line-clamp-2">{stats.featured_suggestion.description}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {stats.featured_suggestion.difficulty && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${difficultyColor(stats.featured_suggestion.difficulty)}`}>
                      {stats.featured_suggestion.difficulty}
                    </span>
                  )}
                  {stats.featured_suggestion.format_name && (
                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded capitalize">
                      <i className="fas fa-shapes mr-1" />{stats.featured_suggestion.format_name}
                    </span>
                  )}
                  {stats.featured_suggestion.platform_hint && (
                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                      <i className={`${platformIcon(stats.featured_suggestion.platform_hint)} mr-1`} />
                      {stats.featured_suggestion.platform_hint}
                    </span>
                  )}
                  {stats.featured_suggestion.trend_strength > 0 && (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <i className="fas fa-arrow-trend-up mr-1" />
                      {Math.round(stats.featured_suggestion.trend_strength * 100)}% trend
                    </span>
                  )}
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider ml-auto group-hover:translate-x-1 transition-transform hidden sm:inline">
                    View Blueprint <i className="fas fa-arrow-right ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* ── Top Performing Content (Horizontal Carousel) ── */}
          {stats.top_viral_videos.length > 0 && (
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <i className="fas fa-crown text-yellow-400 text-xs" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Top Content</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="hidden sm:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center transition-colors"
                  >
                    <i className="fas fa-chevron-left text-[10px] text-slate-400" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="hidden sm:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center transition-colors"
                  >
                    <i className="fas fa-chevron-right text-[10px] text-slate-400" />
                  </button>
                  <Link to="/dashboard/trends" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors sm:ml-2">
                    View All
                  </Link>
                </div>
              </div>
              <div
                ref={scrollRef}
                className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {stats.top_viral_videos.map((v, idx) => (
                  <PostCard
                    key={v.id}
                    video={v}
                    onClick={() => setCarouselData({ videos: stats.top_viral_videos, initialIndex: idx })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Viral Formats + Winning Hooks ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Viral Formats */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <i className="fas fa-fire text-orange-400 text-xs" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Viral Formats</h2>
                </div>
                <Link to="/dashboard/formats" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors">
                  View All
                </Link>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {stats.top_formats.length > 0 ? stats.top_formats.map((f, i) => (
                  <Link
                    key={f.id}
                    to="/dashboard/formats"
                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-[10px] font-black text-slate-600 w-5 shrink-0">#{i + 1}</span>
                      <span className="text-xs sm:text-sm font-bold group-hover:text-pink-400 transition-colors capitalize truncate">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs shrink-0 ml-2 sm:ml-3">
                      <span className="text-emerald-400 font-black">{f.video_count} <span className="hidden sm:inline">vids</span></span>
                      <span className="text-slate-500 font-bold">{fmt(Math.round(f.avg_views))}</span>
                    </div>
                  </Link>
                )) : (
                  <p className="text-xs text-slate-600 text-center py-6">Analyze videos to discover viral formats</p>
                )}
              </div>
            </div>

            {/* Winning Hooks */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <i className="fas fa-magnet text-purple-400 text-xs" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Winning Hooks</h2>
                </div>
                <Link to="/dashboard/hooks" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors">
                  View All
                </Link>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {stats.top_hooks.length > 0 ? stats.top_hooks.map((h, i) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-[10px] font-black text-slate-600 w-5 shrink-0">#{i + 1}</span>
                      <span className="text-xs sm:text-sm font-bold group-hover:text-pink-400 transition-colors capitalize truncate">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs shrink-0 ml-2 sm:ml-3">
                      <span className="text-emerald-400 font-black">{h.video_count} <span className="hidden sm:inline">vids</span></span>
                      <span className="text-slate-500 font-bold">{fmt(Math.round(h.avg_views))}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-600 text-center py-6">Analyze videos to discover winning hooks</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Trending Sounds + Top Tactics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Trending Sounds */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <i className="fas fa-music text-cyan-400 text-xs" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Trending Sounds</h2>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {stats.trending_music.length > 0 ? stats.trending_music.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors">
                    {(m.local_cover_path || m.cover_url) ? (
                      <img src={m.local_cover_path || m.cover_url} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <i className="fas fa-music text-slate-600 text-xs" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold truncate">{m.title || 'Unknown Track'}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">{m.artist || 'Unknown Artist'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] sm:text-xs font-black text-emerald-400">{m.video_count} <span className="hidden sm:inline">vids</span></div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold">{fmt(m.total_views)}</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-600 text-center py-6">Sounds will appear after video analysis</p>
                )}
              </div>
            </div>

            {/* Top Tactics */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <i className="fas fa-bullseye text-amber-400 text-xs" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Proven Tactics</h2>
                </div>
                <Link to="/dashboard/tactics" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors">
                  View All
                </Link>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {stats.top_tactics.length > 0 ? stats.top_tactics.map((t) => (
                  <Link
                    key={t.id}
                    to="/dashboard/tactics"
                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold group-hover:text-pink-400 transition-colors capitalize truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium capitalize">{t.category}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-3">
                      <span className="text-[10px] sm:text-xs text-emerald-400 font-black">{t.video_count} <span className="hidden sm:inline">vids</span></span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-bold">{fmt(Math.round(t.avg_views_when_present))}</span>
                    </div>
                  </Link>
                )) : (
                  <p className="text-xs text-slate-600 text-center py-6">Tactics appear after video analysis</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Trending Keywords Cloud + Your Accounts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Trending Keywords Cloud */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <i className="fas fa-cloud text-violet-400 text-xs" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Trending Topics</h2>
              </div>
              <KeywordCloud keywords={stats.trending_keywords} />
              {stats.trending_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5 justify-center">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                    const hasAny = stats.trending_keywords.some(k => k.category === cat)
                    if (!hasAny) return null
                    return (
                      <span key={cat} className={`text-[9px] font-bold ${color} opacity-60 capitalize`}>
                        {cat}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Your Accounts */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <i className="fas fa-chart-line text-pink-400 text-xs" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Your Accounts</h2>
              </div>
              {stats.connected_accounts.active > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Connected</div>
                      <div className="text-xl sm:text-2xl font-black">{stats.connected_accounts.active}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Followers</div>
                      <div className="text-xl sm:text-2xl font-black">{fmt(stats.connected_accounts.total_followers)}</div>
                    </div>
                  </div>
                  <Link
                    to="/dashboard/platforms"
                    className="block text-center text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors py-2"
                  >
                    View platforms <i className="fas fa-arrow-right ml-1" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-link text-pink-400" />
                  </div>
                  <p className="text-sm font-bold mb-1">Connect Your Accounts</p>
                  <p className="text-xs text-slate-500 mb-4">Link Instagram or TikTok to track your growth</p>
                  <Link
                    to="/dashboard/platforms"
                    className="inline-flex items-center gap-2 text-xs font-black text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    Connect Now <i className="fas fa-arrow-right" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Trending Hashtags (Full Width) ── */}
          {stats.trending_hashtags.length > 0 && (
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <i className="fas fa-hashtag text-blue-400 text-xs" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Top Hashtags</h2>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {stats.trending_hashtags.map((h) => (
                  <div
                    key={h.tag}
                    className="bg-white/5 hover:bg-white/[0.08] active:bg-white/[0.08] rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-default"
                  >
                    <div className="text-xs sm:text-sm font-bold text-blue-400">#{h.tag}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5">
                      {fmt(h.avg_views)} avg &middot; {h.video_count} vids
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <p className="text-slate-500 text-sm">Failed to load stats. Make sure the backend is running.</p>
        </div>
      )}

      {/* ── Video Story Carousel (Full-screen viewer) ── */}
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
