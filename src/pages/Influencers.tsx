import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getStorageUrl } from '../lib/media'
import InfluencerAnalyzeProgress from '../components/InfluencerAnalyzeProgress'

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

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function getAvatarSrc(inf: Influencer): string | null {
  return getStorageUrl(inf.local_avatar_path)
}

function getTierColor(tier: string | null): string {
  switch (tier) {
    case 'mega': return 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    case 'macro': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'mid': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    case 'micro': return 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    case 'nano': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20'
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
  const [tierFilter, setTierFilter] = useState<string>('')
  const [tierOpen, setTierOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [refetching, setRefetching] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [pollNow, setPollNow] = useState(0)
  const tierRef = useRef<HTMLDivElement>(null)
  const limit = 30

  const tierOptions = [
    { value: '', label: 'All Tiers' },
    { value: 'mega', label: 'Mega', color: 'text-pink-400' },
    { value: 'macro', label: 'Macro', color: 'text-orange-400' },
    { value: 'mid', label: 'Mid', color: 'text-yellow-400' },
    { value: 'micro', label: 'Micro', color: 'text-teal-400' },
    { value: 'nano', label: 'Nano', color: 'text-blue-400' },
  ]

  // Close tier dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tierRef.current && !tierRef.current.contains(e.target as Node)) setTierOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    if (tierFilter) params.set('tier', tierFilter)

    authFetch(`/api/analysis/influencers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInfluencers(data.influencers || [])
        setTotal(data.total || 0)
      })
      .catch(() => toast.error('Failed to load influencers'))
      .finally(() => setLoading(false))
  }, [sortBy, order, search, platformFilter, tierFilter, page])

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

  const handleAnalyzeInfluencer = async (e: React.MouseEvent, infId: number, username: string) => {
    e.preventDefault()
    e.stopPropagation()
    setAnalyzingId(infId)
    try {
      const res = await authFetch(`/api/analysis/influencers/${infId}/full-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to start analysis')
      } else {
        toast.success(`Started full analysis for @${username}`)
        setPollNow(Date.now())
      }
    } catch {
      toast.error('Failed to start analysis')
    } finally {
      setAnalyzingId(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const columns: { field: SortField; label: string; short: string }[] = [
    { field: 'follower_count', label: 'Followers', short: 'Flw' },
    { field: 'avg_views', label: 'Avg Views', short: 'Avg' },
    { field: 'avg_engagement_rate', label: 'Eng %', short: 'Eng' },
    { field: 'total_views', label: 'Total Views', short: 'Total' },
    { field: 'viral_video_count', label: 'Viral', short: 'Viral' },
    { field: 'total_videos_fetched', label: 'Videos', short: 'Vids' },
  ]

  const totalFollowers = influencers.reduce((sum, i) => sum + (i.follower_count || 0), 0)
  const engArr = influencers.filter(i => i.avg_engagement_rate)
  const avgEngagement = engArr.length > 0
    ? engArr.reduce((sum, i) => sum + (i.avg_engagement_rate || 0), 0) / engArr.length
    : 0

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold font-display tracking-tight">Creators</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span><span className="text-white font-semibold">{total}</span> creators</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline"><span className="text-white font-semibold">{fmt(totalFollowers)}</span> reach</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline"><span className="text-teal-400 font-semibold">{avgEngagement > 0 ? (avgEngagement * 100).toFixed(1) + '%' : '--'}</span> avg eng</span>
          </div>
        </div>
        {userType === 'admin' && (
          <button
            onClick={handleRefetchProfiles}
            disabled={refetching}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 self-start sm:self-auto"
          >
            <i className={`fas fa-${refetching ? 'spinner fa-spin' : 'sync-alt'} mr-1.5 text-[10px]`}></i>
            {refetching ? 'Refetching...' : 'Refetch Profiles'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex items-center glass-input px-3 py-1.5 w-full sm:w-56">
          <i className="fas fa-search text-slate-600 text-[10px] mr-2"></i>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-600"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }} className="text-slate-500 hover:text-white ml-1">
              <i className="fas fa-times text-[10px]"></i>
            </button>
          )}
        </form>

        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {(['', 'instagram', 'tiktok'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPlatformFilter(p); setPage(0) }}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                platformFilter === p ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p === '' ? 'All' : <i className={`fab fa-${p} ${p === 'instagram' ? 'text-pink-400' : ''}`}></i>}
            </button>
          ))}
        </div>

        {/* Tier Filter Dropdown */}
        <div className="relative" ref={tierRef}>
          <button
            onClick={() => setTierOpen(!tierOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
              tierFilter
                ? 'bg-white/10 border-white/15 text-white'
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className="fas fa-layer-group text-[9px]"></i>
            {tierFilter ? tierOptions.find(t => t.value === tierFilter)?.label : 'Tier'}
            <i className={`fas fa-chevron-down text-[8px] ml-0.5 transition-transform ${tierOpen ? 'rotate-180' : ''}`}></i>
          </button>
          {tierOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-white/10 rounded-lg shadow-xl shadow-black/40 py-1 min-w-[140px]">
              {tierOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTierFilter(opt.value); setTierOpen(false); setPage(0) }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium flex items-center gap-2 transition-colors ${
                    tierFilter === opt.value ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  {opt.value && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      opt.value === 'mega' ? 'bg-pink-400' :
                      opt.value === 'macro' ? 'bg-orange-400' :
                      opt.value === 'mid' ? 'bg-yellow-400' :
                      opt.value === 'micro' ? 'bg-teal-400' :
                      'bg-blue-400'
                    }`}></span>
                  )}
                  {opt.label}
                  {tierFilter === opt.value && <i className="fas fa-check text-[9px] ml-auto"></i>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              <i className="fas fa-chevron-left text-[10px]"></i>
            </button>
            <span className="font-medium px-1">{page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              <i className="fas fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        )}
      </div>

      {/* Influencer Analyze Progress */}
      {userType === 'admin' && (
        <div className="mb-4">
          <InfluencerAnalyzeProgress compact pollNow={pollNow} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : influencers.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-users text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Creators Found</h3>
          <p className="text-sm text-slate-500 font-medium">{search ? 'No creators match your search.' : 'No influencers found. Scan some videos first.'}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block glass-card rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid items-center gap-3 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
              style={{ gridTemplateColumns: '2.5fr repeat(6, 1fr)' }}
            >
              <div>Creator</div>
              {columns.map((col) => (
                <button
                  key={col.field}
                  onClick={() => toggleSort(col.field)}
                  className={`text-right flex items-center justify-end gap-1 transition-colors hover:text-slate-300 ${sortBy === col.field ? 'text-white' : ''}`}
                >
                  {col.label}
                  {sortBy === col.field && (
                    <i className={`fas fa-caret-${order === 'desc' ? 'down' : 'up'} text-[9px]`}></i>
                  )}
                </button>
              ))}
            </div>

            {/* Rows */}
            {influencers.map((inf, idx) => {
              const avatar = getAvatarSrc(inf)
              return (
                <Link
                  key={inf.id}
                  to={`/dashboard/influencers/${inf.id}`}
                  className={`grid items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] group ${
                    idx !== influencers.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                  style={{ gridTemplateColumns: '2.5fr repeat(6, 1fr)' }}
                >
                  {/* Creator Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={inf.username}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-500">
                            {(inf.display_name || inf.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center ring-1 ring-slate-800">
                        <i className={`fab fa-${inf.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[8px] ${inf.platform === 'tiktok' ? 'text-slate-400' : 'text-pink-400'}`}></i>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate group-hover:text-pink-400 transition-colors">
                          {inf.display_name || inf.username}
                        </span>
                        {inf.is_verified && <i className="fas fa-check-circle text-blue-400 text-[10px] flex-shrink-0"></i>}
                        {inf.tier && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded border ${getTierColor(inf.tier)}`}>
                            {inf.tier}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">@{inf.username}</div>
                    </div>
                    {userType === 'admin' && inf.platform === 'instagram' && (
                      <button
                        onClick={(e) => handleAnalyzeInfluencer(e, inf.id, inf.username)}
                        disabled={analyzingId === inf.id}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 transition-all disabled:opacity-50"
                        title="Analyze: fetch 100 videos, download & analyze all"
                      >
                        <i className={`fas ${analyzingId === inf.id ? 'fa-spinner fa-spin' : 'fa-microscope'} mr-1`}></i>
                        ANALYZE
                      </button>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="text-right text-sm font-medium text-slate-200">
                    {inf.follower_count ? fmt(inf.follower_count) : <span className="text-slate-600">--</span>}
                  </div>
                  <div className="text-right text-sm font-medium text-slate-200">
                    {inf.avg_views ? fmt(Math.round(inf.avg_views)) : <span className="text-slate-600">--</span>}
                  </div>
                  <div className={`text-right text-sm font-medium ${inf.avg_engagement_rate ? 'text-teal-400' : 'text-slate-600'}`}>
                    {inf.avg_engagement_rate ? Number(inf.avg_engagement_rate).toFixed(1) + '%' : '--'}
                  </div>
                  <div className="text-right text-sm font-medium text-slate-200">
                    {inf.total_views ? fmt(inf.total_views) : <span className="text-slate-600">--</span>}
                  </div>
                  <div className={`text-right text-sm font-medium ${inf.viral_video_count ? 'text-pink-400' : 'text-slate-600'}`}>
                    {inf.viral_video_count ?? '--'}
                  </div>
                  <div className="text-right text-sm font-medium text-slate-400">
                    {inf.total_videos_fetched ?? <span className="text-slate-600">--</span>}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden flex flex-col gap-2.5">
            {influencers.map((inf) => {
              const avatar = getAvatarSrc(inf)
              return (
                <Link
                  key={inf.id}
                  to={`/dashboard/influencers/${inf.id}`}
                  className="block glass-card rounded-2xl p-3.5 active:bg-white/[0.06] transition-colors"
                >
                  {/* Top: Avatar + Name + Followers */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={inf.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-500">
                            {(inf.display_name || inf.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center ring-1 ring-slate-800">
                        <i className={`fab fa-${inf.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[8px] ${inf.platform === 'tiktok' ? 'text-slate-400' : 'text-pink-400'}`}></i>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">
                          {inf.display_name || inf.username}
                        </span>
                        {inf.is_verified && <i className="fas fa-check-circle text-blue-400 text-[10px] flex-shrink-0"></i>}
                        {inf.tier && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded border ${getTierColor(inf.tier)}`}>
                            {inf.tier}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">@{inf.username}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-slate-200">
                        {inf.follower_count ? fmt(inf.follower_count) : '--'}
                      </div>
                      <div className="text-[10px] text-slate-500">followers</div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Avg Views</div>
                      <div className="text-xs font-semibold text-slate-200">
                        {inf.avg_views ? fmt(Math.round(inf.avg_views)) : '--'}
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Eng %</div>
                      <div className={`text-xs font-semibold ${inf.avg_engagement_rate ? 'text-teal-400' : 'text-slate-600'}`}>
                        {inf.avg_engagement_rate ? Number(inf.avg_engagement_rate).toFixed(1) + '%' : '--'}
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Viral</div>
                      <div className={`text-xs font-semibold ${inf.viral_video_count ? 'text-pink-400' : 'text-slate-600'}`}>
                        {inf.viral_video_count ?? '--'}
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Videos</div>
                      <div className="text-xs font-semibold text-slate-400">
                        {inf.total_videos_fetched ?? '--'}
                      </div>
                    </div>
                  </div>
                  {userType === 'admin' && inf.platform === 'instagram' && (
                    <button
                      onClick={(e) => handleAnalyzeInfluencer(e, inf.id, inf.username)}
                      disabled={analyzingId === inf.id}
                      className="mt-2.5 w-full py-2 rounded-lg text-[10px] font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 transition-all disabled:opacity-50"
                    >
                      <i className={`fas ${analyzingId === inf.id ? 'fa-spinner fa-spin' : 'fa-microscope'} mr-1.5`}></i>
                      {analyzingId === inf.id ? 'STARTING...' : 'ANALYZE INFLUENCER'}
                    </button>
                  )}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Bottom Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 font-medium transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
