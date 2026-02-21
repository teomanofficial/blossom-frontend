import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

interface SocialAccount {
  id: number
  platform: string
  username: string
  avatar_url: string | null
}

interface SocialPost {
  id: number
  account_id: number
  caption: string | null
  thumbnail_url: string | null
  media_url: string | null
  post_url: string | null
  content_type: string
  status: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  published_at: string | null
  created_at: string
  account_username: string
  account_platform: string
  account_avatar: string | null
}

function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function platformIcon(p: string) {
  return p === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'
}

function platformColor(p: string) {
  return p === 'tiktok' ? 'text-cyan-400' : 'text-pink-400'
}

function statusBadge(status: string) {
  switch (status) {
    case 'published': return 'bg-emerald-500/10 text-emerald-400'
    case 'draft': return 'bg-slate-500/10 text-slate-400'
    case 'scheduled': return 'bg-blue-500/10 text-blue-400'
    case 'failed': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

export default function PlatformPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ account_id: '', status: '', sort: 'published_at' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzingPost, setAnalyzingPost] = useState<number | null>(null)

  const fetchPosts = useCallback(async () => {
    const params = new URLSearchParams({ sort: filter.sort, order: 'desc', limit: '100' })
    if (filter.account_id) params.set('account_id', filter.account_id)
    if (filter.status) params.set('status', filter.status)

    try {
      const [postsRes, accountsRes] = await Promise.all([
        authFetch(`/api/social/posts?${params}`),
        authFetch('/api/social/accounts'),
      ])
      if (postsRes.ok) setPosts(await postsRes.json())
      if (accountsRes.ok) setAccounts(await accountsRes.json())
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleAnalyzePost = async (postId: number) => {
    setAnalyzingPost(postId)
    try {
      const res = await authFetch(`/api/social/posts/${postId}/analyze`, { method: 'POST' })
      if (res.ok) {
        toast.success('Analysis started')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Analysis failed')
      }
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzingPost(null)
    }
  }

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true)
    try {
      const postIds = posts.filter(p => p.status === 'published').map(p => p.id)
      if (postIds.length === 0) {
        toast.error('No published posts to analyze')
        return
      }
      const res = await authFetch('/api/social/posts/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_ids: postIds.slice(0, 20) }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Analyzing ${data.queued} posts`)
      }
    } catch {
      toast.error('Batch analysis failed')
    } finally {
      setAnalyzingAll(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/dashboard/platforms" className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-arrow-left text-xs" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter">All Posts</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium">{posts.length} posts from your connected accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzingAll}
            className="px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {analyzingAll ? <><i className="fas fa-spinner fa-spin mr-1" />Analyzing...</> : <><i className="fas fa-wand-magic-sparkles mr-1" />Analyze All</>}
          </button>
          <Link
            to="/dashboard/platforms/posts/new"
            className="px-3 py-2 bg-gradient-to-r from-pink-500 to-orange-400 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
          >
            <i className="fas fa-plus mr-1" />New Post
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={filter.account_id}
          onChange={(e) => setFilter(f => ({ ...f, account_id: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-pink-500/30"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>@{a.username} ({a.platform})</option>
          ))}
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-pink-500/30"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select
          value={filter.sort}
          onChange={(e) => setFilter(f => ({ ...f, sort: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-pink-500/30"
        >
          <option value="published_at">Recent</option>
          <option value="views">Most Views</option>
          <option value="likes">Most Likes</option>
          <option value="comments">Most Comments</option>
          <option value="engagement_rate">Engagement Rate</option>
        </select>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            <i className="fas fa-grid-2 text-xs" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            <i className="fas fa-list text-xs" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-images text-pink-400 text-xl" />
          </div>
          <p className="text-sm font-bold mb-1">No posts found</p>
          <p className="text-xs text-slate-500 mb-4">Sync your accounts to import posts, or create a new one.</p>
          <Link to="/dashboard/platforms" className="text-xs font-bold text-pink-400 hover:text-pink-300">
            <i className="fas fa-arrow-left mr-1" />Back to Platforms
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {posts.map((post) => (
            <Link key={post.id} to={`/dashboard/platforms/posts/${post.id}`} className="group">
              <div className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all relative">
                {post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-film text-slate-700 text-2xl" />
                  </div>
                )}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm ${statusBadge(post.status)}`}>
                    {post.status}
                  </span>
                  <i className={`${platformIcon(post.account_platform)} text-[10px] text-white/70`} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="text-[10px] font-bold text-white truncate mb-0.5">@{post.account_username}</div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-white/70">
                    <span><i className="fas fa-eye mr-0.5" />{fmt(post.views)}</span>
                    <span><i className="fas fa-heart mr-0.5" />{fmt(post.likes)}</span>
                    <span><i className="fas fa-comment mr-0.5" />{fmt(post.comments)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-1.5 px-0.5">
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  {post.caption ? post.caption.substring(0, 50) : 'No caption'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/dashboard/platforms/posts/${post.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-pink-500/20 transition-all group"
            >
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                {post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-film text-slate-700 text-sm" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <i className={`${platformIcon(post.account_platform)} text-[10px] ${platformColor(post.account_platform)}`} />
                  <span className="text-xs font-bold truncate">@{post.account_username}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge(post.status)}`}>{post.status}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-1">{post.caption || 'No caption'}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                  <span><i className="fas fa-eye mr-0.5" />{fmt(post.views)}</span>
                  <span><i className="fas fa-heart mr-0.5" />{fmt(post.likes)}</span>
                  <span><i className="fas fa-comment mr-0.5" />{fmt(post.comments)}</span>
                  {post.engagement_rate > 0 && <span className="text-emerald-400">{post.engagement_rate.toFixed(1)}%</span>}
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); handleAnalyzePost(post.id) }}
                disabled={analyzingPost === post.id}
                className="px-2.5 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 shrink-0"
              >
                {analyzingPost === post.id ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-wand-magic-sparkles" />}
              </button>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
