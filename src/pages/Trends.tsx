import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
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

function getHookEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('question') || lower.includes('ask')) return '❓'
  if (lower.includes('shock') || lower.includes('surprise') || lower.includes('unexpected')) return '😱'
  if (lower.includes('curiosity') || lower.includes('mystery') || lower.includes('secret')) return '🔍'
  if (lower.includes('controversy') || lower.includes('debate') || lower.includes('hot take')) return '🔥'
  if (lower.includes('story') || lower.includes('storytime') || lower.includes('narrative')) return '📖'
  if (lower.includes('before') || lower.includes('after') || lower.includes('transformation')) return '✨'
  if (lower.includes('list') || lower.includes('ranking') || lower.includes('top')) return '📋'
  if (lower.includes('challenge') || lower.includes('dare')) return '🏆'
  if (lower.includes('hack') || lower.includes('tip') || lower.includes('trick')) return '💡'
  if (lower.includes('fail') || lower.includes('wrong') || lower.includes('mistake')) return '⚠️'
  if (lower.includes('money') || lower.includes('cost') || lower.includes('price')) return '💰'
  if (lower.includes('wait') || lower.includes('watch') || lower.includes('end')) return '👀'
  if (lower.includes('pov') || lower.includes('relatable')) return '🎭'
  if (lower.includes('text') || lower.includes('caption') || lower.includes('overlay')) return '💬'
  if (lower.includes('sound') || lower.includes('audio') || lower.includes('music')) return '🎵'
  if (lower.includes('visual') || lower.includes('aesthetic') || lower.includes('cinematic')) return '🎬'
  return '🧲'
}

/* ── Interfaces ── */
interface TrendingPost extends CarouselVideo {
  analyzed_at?: string | null
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
}

interface TrendingHook {
  id: number
  name: string
  description: string | null
  hook_technique: string | null
  avg_views: number
  avg_engagement_rate: number
  total_video_count: number
  recent_video_count: number
  recent_avg_views: number
}

interface TrendingContent {
  id: number
  name: string
  category: string
  description: string | null
  icon: string | null
  total_video_count: number
  recent_video_count: number
  recent_avg_views: number
  recent_avg_engagement: number
  sample_thumbnails: string[] | null
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

interface OverviewData {
  posts: { items: TrendingPost[]; total: number }
  formats: { items: TrendingFormat[]; total: number }
  hooks: { items: TrendingHook[]; total: number }
  contents: { items: TrendingContent[]; total: number }
  songs: { items: TrendingSong[]; total: number }
  days: number
}

/* ── Scroll Hook ── */
function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return
    const amount = ref.current.clientWidth * 0.6
    ref.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }
  return { ref, scroll }
}

/* ── Section Header ── */
function SectionHeader({
  icon,
  iconColor,
  title,
  viewAllTo,
  onScrollLeft,
  onScrollRight,
}: {
  icon: string
  iconColor: string
  title: string
  viewAllTo: string
  onScrollLeft: () => void
  onScrollRight: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-5">
      <div className="flex items-center gap-2">
        <i className={`fas ${icon} ${iconColor} text-xs`} />
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onScrollLeft}
          className="hidden sm:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center transition-colors"
        >
          <i className="fas fa-chevron-left text-[10px] text-slate-400" />
        </button>
        <button
          onClick={onScrollRight}
          className="hidden sm:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center transition-colors"
        >
          <i className="fas fa-chevron-right text-[10px] text-slate-400" />
        </button>
        <Link
          to={viewAllTo}
          className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors sm:ml-2"
        >
          View All
        </Link>
      </div>
    </div>
  )
}

/* ── Card Components ── */

function PostCard({ video, onClick }: { video: TrendingPost; onClick: () => void }) {
  const src = getThumbnailSrc(video)
  return (
    <div onClick={onClick} className="shrink-0 w-[130px] sm:w-[160px] cursor-pointer group">
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

function FormatCard({ format }: { format: TrendingFormat }) {
  return (
    <Link
      to={`/dashboard/formats/${format.id}`}
      className="shrink-0 w-[200px] sm:w-[220px] glass-card rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{getFormatEmoji(format.name)}</span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
          {format.recent_video_count} recent
        </span>
      </div>
      <div className="text-sm font-black text-white capitalize truncate mb-1 group-hover:text-orange-300 transition-colors">
        {format.name}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
        <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(format.recent_avg_views)} avg</span>
        <span><i className="fas fa-film mr-0.5 text-[8px]" />{format.total_video_count} total</span>
      </div>
    </Link>
  )
}

function HookCard({ hook }: { hook: TrendingHook }) {
  return (
    <Link
      to={`/dashboard/hooks/${hook.id}`}
      className="shrink-0 w-[200px] sm:w-[220px] glass-card rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{getHookEmoji(hook.name)}</span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
          {hook.recent_video_count} recent
        </span>
      </div>
      <div className="text-sm font-black text-white capitalize truncate mb-1 group-hover:text-purple-300 transition-colors">
        {hook.name}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
        <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(hook.recent_avg_views)} avg</span>
        <span><i className="fas fa-film mr-0.5 text-[8px]" />{hook.total_video_count} total</span>
      </div>
    </Link>
  )
}

function ContentCard({ content }: { content: TrendingContent }) {
  const thumbs = (content.sample_thumbnails || []).map((t) => {
    if (!t) return null
    if (t.startsWith('http')) return t
    return `/media/${t.split('/').pop()}`
  }).filter(Boolean)

  return (
    <div className="shrink-0 w-[180px] sm:w-[200px] glass-card rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer">
      {/* Thumbnail collage */}
      <div className="h-[100px] bg-slate-900 relative overflow-hidden">
        {thumbs.length > 0 ? (
          <div className="flex h-full">
            {thumbs.slice(0, 3).map((t, i) => (
              <img key={i} src={t!} alt="" className="h-full flex-1 object-cover" style={{ minWidth: 0 }} />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <i className="fas fa-hashtag text-blue-400/30 text-3xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 backdrop-blur-sm uppercase">
            {content.category}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-black text-white capitalize truncate mb-1 group-hover:text-blue-300 transition-colors">
          {content.name}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
          <span><i className="fas fa-video mr-0.5 text-[8px]" />{content.recent_video_count} videos</span>
          <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(content.recent_avg_views)}</span>
        </div>
      </div>
    </div>
  )
}

function SongCard({ song }: { song: TrendingSong }) {
  const coverSrc = getStorageUrl(song.local_cover_path)

  return (
    <div className="shrink-0 w-[170px] sm:w-[190px] glass-card rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer">
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
          <i className={`${platformIcon(song.platform)} text-[10px] text-white/70`} />
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 backdrop-blur-sm">
            {song.recent_video_count} videos
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-black text-white truncate mb-0.5 group-hover:text-cyan-300 transition-colors">
          {song.title}
        </div>
        {song.artist && (
          <div className="text-[10px] text-slate-500 font-bold truncate">
            {song.artist}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Empty State ── */
function EmptySection({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 py-8 px-4 text-slate-600">
      <i className={`fas ${icon} text-lg`} />
      <span className="text-sm font-bold">No {label} found in this time period</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════ */
export default function Trends() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)

  const postsScroll = useHorizontalScroll()
  const formatsScroll = useHorizontalScroll()
  const hooksScroll = useHorizontalScroll()
  const contentsScroll = useHorizontalScroll()
  const songsScroll = useHorizontalScroll()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/trends/overview?days=${days}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch {
      toast.error('Failed to load trends data')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-arrow-trend-up text-pink-400 text-xl" />
        </div>
        <h3 className="text-lg font-black mb-2">No Trends Data</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Analyze some videos first to see trends appear here.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
            Trends
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Trends</h1>
            <p className="text-slate-500 text-sm font-medium">
              What's trending across posts, formats, hooks, content topics, and songs.
            </p>
          </div>
          {/* Time window selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === d
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 1: Trending Posts ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
        <SectionHeader
          icon="fa-fire"
          iconColor="text-emerald-400"
          title="Trending Posts"
          viewAllTo="/dashboard/trends/posts"
          onScrollLeft={() => postsScroll.scroll('left')}
          onScrollRight={() => postsScroll.scroll('right')}
        />
        {data.posts.items.length > 0 ? (
          <div
            ref={postsScroll.ref}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.posts.items.map((v, idx) => (
              <PostCard
                key={v.id}
                video={v}
                onClick={() => setCarouselData({ videos: data.posts.items, initialIndex: idx })}
              />
            ))}
          </div>
        ) : (
          <EmptySection icon="fa-fire" label="trending posts" />
        )}
      </div>

      {/* ── Section 2: Trending Formats ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
        <SectionHeader
          icon="fa-shapes"
          iconColor="text-orange-400"
          title="Trending Formats"
          viewAllTo="/dashboard/trends/formats"
          onScrollLeft={() => formatsScroll.scroll('left')}
          onScrollRight={() => formatsScroll.scroll('right')}
        />
        {data.formats.items.length > 0 ? (
          <div
            ref={formatsScroll.ref}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.formats.items.map((f) => (
              <FormatCard key={f.id} format={f} />
            ))}
          </div>
        ) : (
          <EmptySection icon="fa-shapes" label="trending formats" />
        )}
      </div>

      {/* ── Section 3: Trending Hooks ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
        <SectionHeader
          icon="fa-magnet"
          iconColor="text-purple-400"
          title="Trending Hooks"
          viewAllTo="/dashboard/trends/hooks"
          onScrollLeft={() => hooksScroll.scroll('left')}
          onScrollRight={() => hooksScroll.scroll('right')}
        />
        {data.hooks.items.length > 0 ? (
          <div
            ref={hooksScroll.ref}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.hooks.items.map((h) => (
              <HookCard key={h.id} hook={h} />
            ))}
          </div>
        ) : (
          <EmptySection icon="fa-magnet" label="trending hooks" />
        )}
      </div>

      {/* ── Section 4: Trending Contents ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
        <SectionHeader
          icon="fa-hashtag"
          iconColor="text-blue-400"
          title="Trending Contents"
          viewAllTo="/dashboard/trends/contents"
          onScrollLeft={() => contentsScroll.scroll('left')}
          onScrollRight={() => contentsScroll.scroll('right')}
        />
        {data.contents.items.length > 0 ? (
          <div
            ref={contentsScroll.ref}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.contents.items.map((c) => (
              <ContentCard key={c.id} content={c} />
            ))}
          </div>
        ) : (
          <EmptySection icon="fa-hashtag" label="trending contents" />
        )}
      </div>

      {/* ── Section 5: Trending Songs ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-6 lg:mb-8">
        <SectionHeader
          icon="fa-music"
          iconColor="text-cyan-400"
          title="Trending Songs"
          viewAllTo="/dashboard/trends/songs"
          onScrollLeft={() => songsScroll.scroll('left')}
          onScrollRight={() => songsScroll.scroll('right')}
        />
        {data.songs.items.length > 0 ? (
          <div
            ref={songsScroll.ref}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.songs.items.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        ) : (
          <EmptySection icon="fa-music" label="trending songs" />
        )}
      </div>

      {/* Carousel viewer */}
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
