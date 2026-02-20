import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface InfluencerVideo {
  id: number
  platform: string
  username: string
  caption: string | null
  content_url: string | null
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  published_at: string | null
  status: string
  duration_sec: number | null
  content_type: string | null
  final_viral_probability: number | null
  format_class_name: string | null
}

interface DeepScanData {
  scanned_at: string
  videos_analyzed: number
  engagement: {
    avg_views: number
    avg_likes: number
    avg_comments: number
    avg_shares: number
    total_saves: number
    engagement_ratio: number
  }
  performance: {
    viral_hit_rate: number
    consistency_score: number
    audience_quality_score: number
    posting_frequency: number
  }
  content: {
    top_formats: { name: string; count: number }[]
    top_hooks: { name: string; count: number }[]
    top_videos: any[]
  }
  ai_analysis: {
    content_niche: string
    content_style: string
    audience_type: string
    brand_safety: string
    partnership_potential: string
    content_categories: string[]
    suggested_brands: string[]
  }
}

interface InfluencerData {
  id: number
  platform: string
  username: string
  display_name: string | null
  avatar_url: string | null
  local_avatar_path: string | null
  bio: string | null
  profile_url: string | null
  follower_count: number | null
  following_count: number | null
  post_count: number | null
  is_verified: boolean
  total_views: number | null
  avg_views: number | null
  total_videos_fetched: number | null
  viral_video_count: number | null
  avg_engagement_rate: number | null
  avg_likes: number | null
  avg_comments: number | null
  avg_shares: number | null
  top_hashtags: any | null
  tier: string | null
  partnership_status: string | null
  partnership_notes: string | null
  contact_email: string | null
  deep_scan_at: string | null
  deep_scan_data: DeepScanData | null
  content_categories: string[] | null
  last_fetched_at: string | null
  status: string | null
  created_at: string
  videos: InfluencerVideo[]
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

function getThumbnailSrc(video: InfluencerVideo): string | null {
  if (video.local_thumbnail_path) {
    if (video.local_thumbnail_path.startsWith('http')) return video.local_thumbnail_path
    return `/media/${video.local_thumbnail_path.split('/').pop()}`
  }
  return video.thumbnail_url
}

function getAvatarSrc(influencer: InfluencerData): string | null {
  if (influencer.local_avatar_path) {
    if (influencer.local_avatar_path.startsWith('http')) return influencer.local_avatar_path
    return `/media/${influencer.local_avatar_path.split('/').pop()}`
  }
  return influencer.avatar_url
}

function getTierColor(tier: string | null): string {
  switch (tier) {
    case 'mega': return 'text-pink-400 bg-pink-400/10'
    case 'macro': return 'text-orange-400 bg-orange-400/10'
    case 'mid': return 'text-yellow-400 bg-yellow-400/10'
    case 'micro': return 'text-teal-400 bg-teal-400/10'
    case 'nano': return 'text-blue-400 bg-blue-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

function getBrandSafetyColor(safety: string): string {
  switch (safety) {
    case 'safe': return 'text-teal-400 bg-teal-400/10'
    case 'moderate': return 'text-yellow-400 bg-yellow-400/10'
    case 'risky': return 'text-red-400 bg-red-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

function getPartnershipPotentialColor(potential: string): string {
  switch (potential) {
    case 'high': return 'text-teal-400 bg-teal-400/10'
    case 'medium': return 'text-yellow-400 bg-yellow-400/10'
    case 'low': return 'text-red-400 bg-red-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export default function InfluencerDetail() {
  const { id } = useParams()
  const [influencer, setInfluencer] = useState<InfluencerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchInfluencer = () => {
    setLoading(true)
    authFetch(`/api/analysis/influencers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Influencer not found')
        return r.json()
      })
      .then(setInfluencer)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInfluencer() }, [id])

  const handleRefresh = () => {
    setRefreshing(true)
    setActionMessage(null)
    authFetch(`/api/analysis/influencers/${id}/refresh`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setActionMessage(data.error)
        } else {
          setInfluencer((prev) => prev ? { ...prev, ...data, videos: prev.videos } : prev)
          setActionMessage('Profile refreshed successfully')
        }
      })
      .catch((e) => setActionMessage(e.message))
      .finally(() => setRefreshing(false))
  }

  const handleFetchContent = () => {
    setFetching(true)
    setActionMessage(null)
    authFetch(`/api/analysis/influencers/${id}/fetch-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 30 }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setActionMessage(data.error)
        } else {
          setActionMessage(`Fetched ${data.total_fetched} videos (${data.created} new, ${data.updated} updated)`)
          fetchInfluencer()
        }
      })
      .catch((e) => setActionMessage(e.message))
      .finally(() => setFetching(false))
  }

  const handleDeepScan = () => {
    setScanning(true)
    setActionMessage(null)
    authFetch(`/api/analysis/influencers/${id}/deep-scan`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setActionMessage(data.error)
        } else {
          setInfluencer((prev) => prev ? { ...prev, ...data, videos: prev.videos } : prev)
          setActionMessage('Deep scan completed')
        }
      })
      .catch((e) => setActionMessage(e.message))
      .finally(() => setScanning(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !influencer) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-slate-500 text-sm">{error || 'Influencer not found'}</p>
        <Link to="/dashboard/influencers" className="text-pink-400 text-xs font-bold mt-4 inline-block hover:text-pink-300">
          Back to Influencers
        </Link>
      </div>
    )
  }

  const avatar = getAvatarSrc(influencer)
  const ds = influencer.deep_scan_data
  const hashtags: string[] = Array.isArray(influencer.top_hashtags)
    ? influencer.top_hashtags
    : (influencer.top_hashtags && typeof influencer.top_hashtags === 'object')
    ? Object.keys(influencer.top_hashtags)
    : []

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/influencers" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors">
            Influencers
          </Link>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-white text-xs font-black uppercase tracking-widest">@{influencer.username}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition-all border border-white/5"
          >
            <i className={`fas fa-sync-alt mr-1.5 text-[9px] ${refreshing ? 'animate-spin' : ''}`}></i>
            {refreshing ? 'REFRESHING...' : 'REFRESH'}
          </button>
          <button
            onClick={handleFetchContent}
            disabled={fetching}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition-all border border-white/5"
          >
            <i className={`fas fa-download mr-1.5 text-[9px]`}></i>
            {fetching ? 'FETCHING...' : 'FETCH VIDEOS'}
          </button>
          <button
            onClick={handleDeepScan}
            disabled={scanning || (influencer.videos?.length || 0) < 3}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition-all"
          >
            <i className="fas fa-brain mr-1.5 text-[9px]"></i>
            {scanning ? 'SCANNING...' : 'DEEP SCAN'}
          </button>
        </div>
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-500 hover:text-white text-xs ml-4">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Profile Hero */}
      <div className="glass-card rounded-[2rem] p-8 mb-10">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={`@${influencer.username}`}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 flex items-center justify-center border-2 border-white/10">
                <span className="text-3xl font-black text-white/60">
                  {(influencer.display_name || influencer.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white/10">
              <i className={`fab fa-${influencer.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-sm ${influencer.platform === 'tiktok' ? 'text-white' : 'text-pink-400'}`}></i>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tighter">
                {influencer.display_name || influencer.username}
              </h1>
              {influencer.is_verified && (
                <i className="fas fa-check-circle text-blue-400 text-lg"></i>
              )}
            </div>
            <div className="text-sm text-slate-500 font-bold mb-3">@{influencer.username}</div>
            <div className="flex items-center gap-2 mb-4">
              {influencer.tier && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getTierColor(influencer.tier)}`}>
                  {influencer.tier} tier
                </span>
              )}
              {influencer.partnership_status && influencer.partnership_status !== 'none' && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-400/10 text-blue-400">
                  {influencer.partnership_status}
                </span>
              )}
              {influencer.status === 'error' && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-400/10 text-red-400">
                  Error
                </span>
              )}
            </div>
            {influencer.bio && (
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">{influencer.bio}</p>
            )}
          </div>

          {/* Follower Stats */}
          <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black">{influencer.follower_count ? formatNumber(influencer.follower_count) : '--'}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{influencer.following_count ? formatNumber(influencer.following_count) : '--'}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{influencer.post_count ? formatNumber(influencer.post_count) : '--'}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Posts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-eye text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Views</div>
          </div>
          <div className="text-2xl font-black">{influencer.total_views ? formatNumber(influencer.total_views) : '--'}</div>
        </div>
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-chart-line text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Views</div>
          </div>
          <div className="text-2xl font-black">{influencer.avg_views ? formatNumber(Math.round(influencer.avg_views)) : '--'}</div>
        </div>
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-percentage text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engagement</div>
          </div>
          <div className="text-2xl font-black text-teal-400">
            {influencer.avg_engagement_rate ? Number(influencer.avg_engagement_rate).toFixed(1) + '%' : '--'}
          </div>
        </div>
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-fire text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Viral Videos</div>
          </div>
          <div className="text-2xl font-black text-pink-400">{influencer.viral_video_count ?? '--'}</div>
        </div>
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-heart text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Likes</div>
          </div>
          <div className="text-2xl font-black">{influencer.avg_likes ? formatNumber(Math.round(influencer.avg_likes)) : '--'}</div>
        </div>
        <div className="p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-comment text-slate-500 text-xs"></i>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Comments</div>
          </div>
          <div className="text-2xl font-black">{influencer.avg_comments ? formatNumber(Math.round(influencer.avg_comments)) : '--'}</div>
        </div>
      </div>

      {/* Deep Scan Results */}
      {ds && (
        <>
          {/* AI Analysis Section */}
          {ds.ai_analysis && (
            <div className="glass-card rounded-[2rem] p-8 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fas fa-brain text-8xl text-pink-400"></i>
              </div>
              <h2 className="text-sm font-black text-pink-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <i className="fas fa-robot"></i> AI Analysis
              </h2>
              {ds.scanned_at && (
                <span className="text-[10px] font-bold text-slate-500 italic">Scanned {timeAgo(ds.scanned_at)} ({ds.videos_analyzed} videos analyzed)</span>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Content Niche</div>
                  <div className="text-sm font-bold text-white">{ds.ai_analysis.content_niche}</div>
                </div>
                <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Content Style</div>
                  <div className="text-sm font-bold text-white">{ds.ai_analysis.content_style}</div>
                </div>
                <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audience Type</div>
                  <div className="text-sm font-bold text-white">{ds.ai_analysis.audience_type}</div>
                </div>
                <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brand Safety</div>
                  <span className={`text-sm font-black uppercase px-2 py-0.5 rounded ${getBrandSafetyColor(ds.ai_analysis.brand_safety)}`}>
                    {ds.ai_analysis.brand_safety}
                  </span>
                </div>
                <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Partnership Potential</div>
                  <span className={`text-sm font-black uppercase px-2 py-0.5 rounded ${getPartnershipPotentialColor(ds.ai_analysis.partnership_potential)}`}>
                    {ds.ai_analysis.partnership_potential}
                  </span>
                </div>
                {ds.ai_analysis.content_categories && ds.ai_analysis.content_categories.length > 0 && (
                  <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Categories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {ds.ai_analysis.content_categories.map((cat, i) => (
                        <span key={i} className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Brands */}
              {ds.ai_analysis.suggested_brands && ds.ai_analysis.suggested_brands.length > 0 && (
                <div className="mt-6 p-5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Suggested Brand Partnerships</div>
                  <div className="flex flex-wrap gap-2">
                    {ds.ai_analysis.suggested_brands.map((brand, i) => (
                      <span key={i} className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-lg">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Metrics */}
          {ds.performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="p-6 glass-card rounded-3xl border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Viral Hit Rate</div>
                <div className="text-2xl font-black text-pink-400">
                  {(ds.performance.viral_hit_rate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-6 glass-card rounded-3xl border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Consistency</div>
                <div className="text-2xl font-black text-teal-400">
                  {(ds.performance.consistency_score * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-6 glass-card rounded-3xl border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Audience Quality</div>
                <div className="text-2xl font-black text-orange-400">
                  {(ds.performance.audience_quality_score * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-6 glass-card rounded-3xl border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Posts / Week</div>
                <div className="text-2xl font-black text-white">
                  {ds.performance.posting_frequency.toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {/* Top Formats & Hooks from Deep Scan */}
          {ds.content && (ds.content.top_formats?.length > 0 || ds.content.top_hooks?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {ds.content.top_formats && ds.content.top_formats.length > 0 && (
                <div className="glass-card rounded-2xl p-7">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-5">Top Formats Used</h3>
                  <div className="space-y-3">
                    {ds.content.top_formats.slice(0, 8).map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-600 w-5">#{i + 1}</span>
                          <span className="text-sm font-bold capitalize">{f.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{f.count} videos</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ds.content.top_hooks && ds.content.top_hooks.length > 0 && (
                <div className="glass-card rounded-2xl p-7">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-5">Top Hooks Used</h3>
                  <div className="space-y-3">
                    {ds.content.top_hooks.slice(0, 8).map((h, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-600 w-5">#{i + 1}</span>
                          <span className="text-sm font-bold capitalize">{h.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{h.count} videos</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* No deep scan prompt */}
      {!ds && (
        <div className="glass-card rounded-[2rem] p-10 mb-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-brain text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Deep Scan Yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            {(influencer.videos?.length || 0) < 3
              ? `Need at least 3 videos to run a deep scan. Currently ${influencer.videos?.length || 0} video${(influencer.videos?.length || 0) === 1 ? '' : 's'}. Fetch videos first.`
              : 'Run a deep scan to get AI-powered insights on content style, audience, and brand partnership potential.'}
          </p>
          {(influencer.videos?.length || 0) >= 3 && (
            <button
              onClick={handleDeepScan}
              disabled={scanning}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-black rounded-xl transition-all"
            >
              {scanning ? 'SCANNING...' : 'RUN DEEP SCAN'}
            </button>
          )}
        </div>
      )}

      {/* Top Hashtags */}
      {hashtags.length > 0 && (
        <div className="glass-card rounded-2xl p-7 mb-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-5">Top Hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {hashtags.slice(0, 20).map((tag, i) => (
              <span key={i} className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                #{typeof tag === 'string' ? tag : (tag as any).tag || (tag as any).name || String(tag)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {influencer.videos && influencer.videos.length > 0 && (
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase">Content</h2>
              <p className="text-slate-500 text-sm font-medium">Videos from @{influencer.username}, sorted by views.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {influencer.videos.length} video{influencer.videos.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {influencer.videos
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 20)
              .map((video, idx, arr) => {
                const thumb = getThumbnailSrc(video)
                return (
                  <div
                    key={video.id}
                    className="relative group cursor-pointer"
                    onClick={() => setCarouselData({ videos: arr as CarouselVideo[], initialIndex: idx })}
                  >
                    <div className="aspect-[9/16] bg-slate-900 rounded-[1.5rem] overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`@${video.username}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-film text-slate-700 text-2xl"></i>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                        {video.format_class_name && (
                          <span className="text-[9px] font-black text-pink-400 uppercase tracking-wider mb-2 truncate">
                            {video.format_class_name}
                          </span>
                        )}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">Views</span>
                            <span className="text-[11px] font-black">{formatNumber(video.views)}</span>
                          </div>
                          <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">Likes</span>
                            <span className="text-[11px] font-black">{formatNumber(video.likes)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

            {influencer.videos.length > 20 && (
              <div className="aspect-[9/16] border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center text-center p-4">
                <div className="text-2xl font-black text-slate-400 mb-2">+{influencer.videos.length - 20}</div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">More Videos</h4>
              </div>
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
