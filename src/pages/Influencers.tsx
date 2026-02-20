import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Influencer {
  id: number
  platform: string
  username: string
  display_name: string | null
  avatar_url: string | null
  local_avatar_path: string | null
  bio: string | null
  follower_count: number | null
  following_count: number | null
  post_count: number | null
  is_verified: boolean
  total_views: number | null
  avg_views: number | null
  total_videos_fetched: number | null
  viral_video_count: number | null
  avg_engagement_rate: number | null
  tier: string | null
  partnership_status: string | null
  deep_scan_at: string | null
  status: string | null
  created_at: string
}

type SortField = 'follower_count' | 'total_views' | 'avg_views' | 'viral_video_count' | 'avg_engagement_rate' | 'total_videos_fetched' | 'created_at'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function getAvatarSrc(influencer: Influencer): string | null {
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

function getPartnershipColor(status: string | null): string {
  switch (status) {
    case 'contracted': return 'text-teal-400 bg-teal-400/10'
    case 'negotiating': return 'text-orange-400 bg-orange-400/10'
    case 'contacted': return 'text-yellow-400 bg-yellow-400/10'
    case 'candidate': return 'text-blue-400 bg-blue-400/10'
    case 'rejected': return 'text-red-400 bg-red-400/10'
    default: return 'text-slate-500 bg-slate-500/10'
  }
}

export default function Influencers() {
  const { userType } = useAuth()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortField>('follower_count')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [refetching, setRefetching] = useState(false)
  const limit = 30

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      sort_by: sortBy,
      order,
      limit: String(limit),
      offset: String(page * limit),
    })
    if (search) params.set('search', search)
    if (platformFilter) params.set('platform', platformFilter)

    authFetch(`/api/analysis/influencers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInfluencers(data.influencers || [])
        setTotal(data.total || 0)
      })
      .catch(() => toast.error('Failed to load influencers'))
      .finally(() => setLoading(false))
  }, [sortBy, order, search, platformFilter, page])

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder('desc')
    }
    setPage(0)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleRefetchProfiles = async () => {
    setRefetching(true)
    try {
      const res = await authFetch('/api/analysis/influencers/refetch-profiles', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to start refetch'); return }
      toast.success(data.message || `Refetching ${data.total} profiles in background`)
    } catch {
      toast.error('Failed to start profile refetch')
    } finally {
      setRefetching(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'follower_count', label: 'Followers' },
    { field: 'total_views', label: 'Total Views' },
    { field: 'avg_views', label: 'Avg Views' },
    { field: 'avg_engagement_rate', label: 'Engagement' },
    { field: 'viral_video_count', label: 'Viral Videos' },
    { field: 'total_videos_fetched', label: 'Videos' },
  ]

  const totalFollowers = influencers.reduce((sum, i) => sum + (i.follower_count || 0), 0)
  const avgEngagement = influencers.length > 0
    ? influencers.reduce((sum, i) => sum + (i.avg_engagement_rate || 0), 0) / influencers.filter(i => i.avg_engagement_rate).length || 0
    : 0

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
              Creator Network
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">INFLUENCERS</h1>
          <p className="text-slate-500 text-sm font-medium">
            Track and analyze creators across platforms. Discover partnership opportunities.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {userType === 'admin' && (
            <button
              onClick={handleRefetchProfiles}
              disabled={refetching}
              className="px-4 py-3 rounded-[1.5rem] bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className={`fas fa-${refetching ? 'spinner fa-spin' : 'sync-alt'} text-[10px]`}></i>
              {refetching ? 'Refetching...' : 'Refetch Missing Followers'}
            </button>
          )}
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Creators</div>
            <div className="text-2xl font-black text-white">{formatNumber(total)}</div>
          </div>
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Combined Reach</div>
            <div className="text-2xl font-black text-white">{formatNumber(totalFollowers)}</div>
          </div>
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Engagement</div>
            <div className="text-2xl font-black text-teal-400">
              {avgEngagement > 0 ? (avgEngagement * 100).toFixed(1) + '%' : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl w-full md:w-auto md:min-w-[280px] focus-within:border-white/20 transition-all">
          <i className="fas fa-search text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search creators..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
              className="text-slate-500 hover:text-white text-xs"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </form>

        {/* Platform Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1">Platform</span>
          {['', 'instagram', 'tiktok'].map((p) => (
            <button
              key={p}
              onClick={() => { setPlatformFilter(p); setPage(0) }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                platformFilter === p
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {p === '' ? 'All' : (
                <span className="flex items-center gap-1.5">
                  <i className={`fab fa-${p === 'tiktok' ? 'tiktok' : 'instagram'} text-xs`}></i>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1">Sort</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.field}
              onClick={() => toggleSort(opt.field)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                sortBy === opt.field
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {opt.label}
              {sortBy === opt.field && (
                <i className={`fas fa-chevron-${order === 'desc' ? 'down' : 'up'} ml-1 text-[8px]`}></i>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : influencers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-users text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Influencers Found</h3>
          <p className="text-sm text-slate-500">
            {search ? 'No creators match your search. Try different keywords.' : 'Scan some videos to start discovering creators.'}
          </p>
        </div>
      ) : (
        <>
          {/* Influencer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {influencers.map((influencer) => {
              const avatar = getAvatarSrc(influencer)
              return (
                <Link
                  key={influencer.id}
                  to={`/dashboard/influencers/${influencer.id}`}
                  className="gradient-border group cursor-pointer hover:translate-y-[-4px] transition-all duration-300"
                >
                  <div className="card-inner p-7 flex flex-col h-full">
                    {/* Profile Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={`@${influencer.username}`}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 flex items-center justify-center border border-white/10">
                            <span className="text-xl font-black text-white/60">
                              {(influencer.display_name || influencer.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                          <i className={`fab fa-${influencer.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[9px] ${influencer.platform === 'tiktok' ? 'text-white' : 'text-pink-400'}`}></i>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-base font-black tracking-tight group-hover:text-pink-400 transition-colors truncate">
                            {influencer.display_name || influencer.username}
                          </h3>
                          {influencer.is_verified && (
                            <i className="fas fa-check-circle text-blue-400 text-xs flex-shrink-0"></i>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-bold">@{influencer.username}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {influencer.tier && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getTierColor(influencer.tier)}`}>
                              {influencer.tier}
                            </span>
                          )}
                          {influencer.partnership_status && influencer.partnership_status !== 'none' && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getPartnershipColor(influencer.partnership_status)}`}>
                              {influencer.partnership_status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {influencer.bio && (
                      <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed line-clamp-2">
                        {influencer.bio}
                      </p>
                    )}

                    {/* Metrics Grid */}
                    <div className="mt-auto grid grid-cols-3 gap-x-4 gap-y-3 pt-5 border-t border-white/5">
                      <div>
                        <div className="metric-label">Followers</div>
                        <div className="metric-value">{influencer.follower_count ? formatNumber(influencer.follower_count) : '--'}</div>
                      </div>
                      <div>
                        <div className="metric-label">Avg Views</div>
                        <div className="metric-value">{influencer.avg_views ? formatNumber(Math.round(influencer.avg_views)) : '--'}</div>
                      </div>
                      <div>
                        <div className="metric-label">Engagement</div>
                        <div className="metric-value text-teal-400">
                          {influencer.avg_engagement_rate ? Number(influencer.avg_engagement_rate).toFixed(1) + '%' : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="metric-label">Total Views</div>
                        <div className="metric-value">{influencer.total_views ? formatNumber(influencer.total_views) : '--'}</div>
                      </div>
                      <div>
                        <div className="metric-label">Viral Videos</div>
                        <div className="metric-value text-pink-400">{influencer.viral_video_count ?? '--'}</div>
                      </div>
                      <div>
                        <div className="metric-label">Videos</div>
                        <div className="metric-value">{influencer.total_videos_fetched ?? '--'}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-left mr-1 text-[8px]"></i> Prev
              </button>
              <span className="text-xs font-bold text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <i className="fas fa-chevron-right ml-1 text-[8px]"></i>
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
