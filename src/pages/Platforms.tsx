import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import CreatorScoreGauge from '../components/charts/CreatorScoreGauge'
import FollowerGrowthChart from '../components/charts/FollowerGrowthChart'
import EngagementChart from '../components/charts/EngagementChart'
import BestTimesHeatmap from '../components/charts/BestTimesHeatmap'
import MetricsCard from '../components/charts/MetricsCard'

/* ── Types ── */
interface Account {
  id: number
  platform: string
  username: string
  display_name: string | null
  avatar_url: string | null
  follower_count: number
  post_count: number
  status: string
  last_synced_at: string | null
  has_oauth: boolean
}

interface DashboardStats {
  accounts: { total: number; active: number; list: Account[] }
  followers: { total: number; growth_7d: number; growth_30d: number }
  posts: { total: number; published: number; drafts: number; scheduled: number; last_7d: number }
  engagement: { total_views: number; total_likes: number; total_comments: number; total_shares: number }
  topPosts: any[]
  recentPosts: any[]
  followerTrend: Array<{ date: string; account_id: number; platform: string; username: string; follower_count: number }>
  engagementTrend: Array<{ date: string; posts: number; views: number; likes: number; comments: number }>
}

interface CreatorScore {
  score: number | null
  message?: string
  components: {
    engagement: {
      score: number
      weight: number
      sub: {
        engagement_rate: { score: number; value: number; weight: number }
        growth: { score: number; value: number; weight: number }
        reach: { score: number; value: number; weight: number }
        consistency: { score: number; value: number; weight: number }
      }
    }
    ai: { score: number; weight: number; analyzed_count: number } | null
  } | null
  stats: {
    total_followers: number
    total_posts: number
    total_views: number
    avg_engagement_rate: number
    posts_last_week: number
    growth_30d_percent: number
    analyzed_posts: number
  }
}

interface BestTime {
  day_of_week: number
  hour: number
  post_count: number
  avg_views: number
  avg_likes: number
  avg_engagement: number
}

interface SocialPost {
  id: number
  account_id: number
  caption: string | null
  thumbnail_url: string | null
  media_url: string | null
  post_url: string | null
  platform_post_id: string | null
  content_type: string
  status: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  published_at: string | null
  account_username: string
  account_platform: string
  account_avatar: string | null
}

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function platformIcon(p: string) {
  return p === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'
}

function platformColor(p: string) {
  return p === 'tiktok' ? 'text-cyan-400' : 'text-pink-400'
}

function platformGradient(p: string) {
  return p === 'tiktok' ? 'from-cyan-400 to-pink-500' : 'from-purple-500 via-pink-500 to-orange-400'
}

/* ── Main Page ── */
export default function Platforms() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [creatorScore, setCreatorScore] = useState<CreatorScore | null>(null)
  const [bestTimes, setBestTimes] = useState<BestTime[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, scoreRes, timesRes, postsRes] = await Promise.all([
        authFetch('/api/social/dashboard/stats'),
        authFetch('/api/social/creator-score'),
        authFetch('/api/social/analytics/best-times'),
        authFetch('/api/social/posts?limit=12&sort=published_at&order=desc'),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (scoreRes.ok) setCreatorScore(await scoreRes.json())
      if (timesRes.ok) setBestTimes(await timesRes.json())
      if (postsRes.ok) setRecentPosts(await postsRes.json())
    } catch {
      toast.error('Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleConnect = async (platform: 'instagram' | 'tiktok') => {
    setConnecting(platform)
    try {
      const res = await authFetch(`/api/social/${platform}/auth-url`)
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to get authorization URL')
        return
      }
      const { url } = await res.json()
      const width = 600, height = 700
      const left = window.screenX + (window.innerWidth - width) / 2
      const top = window.screenY + (window.innerHeight - height) / 2
      const popup = window.open(url, `${platform}_oauth`, `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`)
      const pollTimer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(pollTimer)
          setConnecting(null)
          fetchData()
        }
      }, 500)
    } catch {
      toast.error('Failed to initiate connection')
      setConnecting(null)
    }
  }

  const handleSync = async (accountId: number) => {
    setSyncing(accountId)
    try {
      const [profileRes, postsRes] = await Promise.all([
        authFetch(`/api/social/accounts/${accountId}/sync-profile`, { method: 'POST' }),
        authFetch(`/api/social/accounts/${accountId}/sync-posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 50 }) }),
      ])
      if (profileRes.ok && postsRes.ok) {
        toast.success('Synced successfully')
        fetchData()
      } else {
        toast.error('Sync partially failed')
      }
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const handleAnalyzeAll = async () => {
    if (!stats?.accounts.list.length) return
    setAnalyzingAll(true)
    try {
      let totalQueued = 0
      for (const account of stats.accounts.list) {
        const res = await authFetch('/api/social/posts/analyze-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: account.id, limit: 20 }),
        })
        if (res.ok) {
          const data = await res.json()
          totalQueued += data.queued
        }
      }
      if (totalQueued > 0) {
        toast.success(`Analyzing ${totalQueued} posts. This may take a few minutes.`)
      } else {
        toast.success('All posts already analyzed')
      }
    } catch {
      toast.error('Failed to start batch analysis')
    } finally {
      setAnalyzingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const accounts = stats?.accounts.list || []
  const hasAccounts = accounts.length > 0

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-1 lg:mb-2">
          Your <span className="gradient-text">Platforms</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-medium">
          Track your content performance, analyze your posts, and grow your audience.
        </p>
      </div>

      {/* ── Connected Accounts Strip ── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-link text-pink-400 text-xs" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">Connected Accounts</h2>
          </div>
          <Link to="/dashboard/account/integrations" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors">
            Manage
          </Link>
        </div>

        {hasAccounts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 shrink-0">
                  {account.avatar_url ? (
                    <img src={account.avatar_url} alt={account.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${platformGradient(account.platform)} flex items-center justify-center text-sm font-bold text-white`}>
                      {account.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <i className={`${platformIcon(account.platform)} text-[10px] ${platformColor(account.platform)}`} />
                    <span className="text-sm font-bold truncate">@{account.username}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {fmt(account.follower_count)} followers &middot; {fmt(account.post_count)} posts
                  </div>
                </div>
                <button
                  onClick={() => handleSync(account.id)}
                  disabled={syncing === account.id}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition-all disabled:opacity-50 shrink-0"
                >
                  {syncing === account.id ? (
                    <i className="fas fa-spinner fa-spin" />
                  ) : (
                    <><i className="fas fa-arrows-rotate mr-1" />Sync</>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-plug text-pink-400 text-xl" />
            </div>
            <p className="text-sm font-bold mb-1">Connect Your Accounts</p>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Link your Instagram or TikTok to sync posts, track metrics, and get AI-powered analysis.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleConnect('instagram')}
                disabled={connecting === 'instagram'}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {connecting === 'instagram' ? <i className="fas fa-spinner fa-spin" /> : <i className="fab fa-instagram" />}
                Instagram
              </button>
              <button
                onClick={() => handleConnect('tiktok')}
                disabled={connecting === 'tiktok'}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-500 hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {connecting === 'tiktok' ? <i className="fas fa-spinner fa-spin" /> : <i className="fab fa-tiktok" />}
                TikTok
              </button>
            </div>
          </div>
        )}
      </div>

      {hasAccounts && (
        <>
          {/* ── Creator Score + Key Metrics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Creator Score */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-4 self-start">
                <i className="fas fa-trophy text-yellow-400 text-xs" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Creator Score</h2>
              </div>
              <CreatorScoreGauge score={creatorScore?.score ?? null} />
              {creatorScore?.components && (
                <div className="w-full mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Engagement</span>
                    <span className="font-bold">{creatorScore.components.engagement.score}<span className="text-slate-500 font-normal">/100</span></span>
                  </div>
                  {creatorScore.components.ai ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">AI Viral Score</span>
                      <span className="font-bold">{creatorScore.components.ai.score}<span className="text-slate-500 font-normal">/100</span></span>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnalyzeAll}
                      disabled={analyzingAll}
                      className="w-full text-[10px] font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 rounded-lg py-1.5 transition-all disabled:opacity-50"
                    >
                      {analyzingAll ? (
                        <><i className="fas fa-spinner fa-spin mr-1" />Analyzing...</>
                      ) : (
                        <><i className="fas fa-wand-magic-sparkles mr-1" />Analyze posts to unlock AI score</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
              <MetricsCard
                label="Total Followers"
                value={fmt(creatorScore?.stats?.total_followers || stats?.followers.total || 0)}
                delta={stats?.followers.growth_30d ? Math.round((stats.followers.growth_30d / Math.max(1, (stats.followers.total - stats.followers.growth_30d))) * 100) : undefined}
                icon="fa-users"
                iconColor="text-blue-400"
              />
              <MetricsCard
                label="Total Views"
                value={fmt(creatorScore?.stats?.total_views || stats?.engagement.total_views || 0)}
                icon="fa-eye"
                iconColor="text-purple-400"
              />
              <MetricsCard
                label="Avg Engagement"
                value={`${(creatorScore?.stats?.avg_engagement_rate || 0).toFixed(1)}%`}
                icon="fa-heart"
                iconColor="text-pink-400"
              />
              <MetricsCard
                label="Posts This Week"
                value={creatorScore?.stats?.posts_last_week?.toString() || stats?.posts.last_7d?.toString() || '0'}
                icon="fa-paper-plane"
                iconColor="text-emerald-400"
              />
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Follower Growth */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-chart-line text-emerald-400 text-xs" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Follower Growth</h2>
              </div>
              <FollowerGrowthChart data={stats?.followerTrend || []} />
            </div>

            {/* Engagement Over Time */}
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-chart-area text-pink-400 text-xs" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Engagement</h2>
              </div>
              <EngagementChart data={stats?.engagementTrend || []} />
            </div>
          </div>

          {/* ── Recent Posts ── */}
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-images text-orange-400 text-xs" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Posts</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAnalyzeAll}
                  disabled={analyzingAll}
                  className="text-[10px] font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
                >
                  {analyzingAll ? <><i className="fas fa-spinner fa-spin mr-1" />Analyzing...</> : <><i className="fas fa-wand-magic-sparkles mr-1" />Analyze All</>}
                </button>
                <Link to="/dashboard/platforms/posts" className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors">
                  View All
                </Link>
              </div>
            </div>

            {recentPosts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/dashboard/platforms/posts/${post.id}`}
                    className="group"
                  >
                    <div className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all relative">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-film text-slate-700 text-2xl" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                        <i className={`${platformIcon(post.account_platform)} text-[10px] text-white/70`} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-white/80">
                          <span><i className="fas fa-eye mr-0.5 text-[8px]" />{fmt(post.views)}</span>
                          <span><i className="fas fa-heart mr-0.5 text-[8px]" />{fmt(post.likes)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {post.caption ? post.caption.substring(0, 40) : 'No caption'}
                      </div>
                      <div className="text-[9px] text-slate-600">
                        {post.published_at ? formatDate(post.published_at) : 'Draft'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-600 mb-3">No posts synced yet</p>
                <button
                  onClick={() => {
                    if (accounts[0]) handleSync(accounts[0].id)
                  }}
                  className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                >
                  <i className="fas fa-arrows-rotate mr-1" />Sync your posts
                </button>
              </div>
            )}
          </div>

          {/* ── Best Posting Times ── */}
          {bestTimes.length > 0 && (
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 lg:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-clock text-violet-400 text-xs" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Best Posting Times</h2>
              </div>
              <BestTimesHeatmap data={bestTimes} />
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {accounts[0] && (
              <button
                onClick={() => { const first = accounts[0]; if (first) handleSync(first.id) }}
                disabled={syncing !== null}
                className="glass-card rounded-xl p-3.5 sm:p-5 hover:bg-white/[0.04] transition-all group border border-transparent hover:border-pink-500/20 active:scale-[0.97] text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <i className="fas fa-arrows-rotate text-emerald-400 text-xs" />
                  </div>
                  <div className="text-xs font-bold group-hover:text-pink-400 transition-colors">Sync Posts</div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium hidden sm:block">Pull latest content</div>
              </button>
            )}
            <Link
              to="/dashboard/platforms/posts/new"
              className="glass-card rounded-xl p-3.5 sm:p-5 hover:bg-white/[0.04] transition-all group border border-transparent hover:border-pink-500/20 active:scale-[0.97]"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <i className="fas fa-plus text-blue-400 text-xs" />
                </div>
                <div className="text-xs font-bold group-hover:text-pink-400 transition-colors">Create Post</div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium hidden sm:block">Draft or schedule</div>
            </Link>
            <Link
              to="/dashboard/platforms/posts"
              className="glass-card rounded-xl p-3.5 sm:p-5 hover:bg-white/[0.04] transition-all group border border-transparent hover:border-pink-500/20 active:scale-[0.97]"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <i className="fas fa-table-cells text-purple-400 text-xs" />
                </div>
                <div className="text-xs font-bold group-hover:text-pink-400 transition-colors">All Posts</div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium hidden sm:block">Browse & manage</div>
            </Link>
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="glass-card rounded-xl p-3.5 sm:p-5 hover:bg-white/[0.04] transition-all group border border-transparent hover:border-pink-500/20 active:scale-[0.97] text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <i className="fas fa-wand-magic-sparkles text-orange-400 text-xs" />
                </div>
                <div className="text-xs font-bold group-hover:text-pink-400 transition-colors">
                  {analyzingAll ? 'Analyzing...' : 'AI Analysis'}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium hidden sm:block">Score all posts</div>
            </button>
          </div>
        </>
      )}
    </>
  )
}
