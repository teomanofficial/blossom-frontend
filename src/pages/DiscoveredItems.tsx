import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface DiscoveredVideo {
  id: number
  platform: string
  platform_id: string
  username: string
  caption: string | null
  content_url: string | null
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  local_video_path: string | null
  status: string
  class_name: string | null
  final_viral_probability: number | null
  published_at: string | null
  created_at: string
}

interface TrackedHashtag {
  id: number
  platform: string
  hashtag: string
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

function statusColor(status: string): string {
  switch (status) {
    case 'analyzed': return 'bg-teal-500/10 text-teal-400'
    case 'fetched': return 'bg-blue-500/10 text-blue-400'
    case 'error': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

function getThumbnailSrc(video: DiscoveredVideo): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

export default function DiscoveredItems() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [videos, setVideos] = useState<DiscoveredVideo[]>([])
  const [total, setTotal] = useState(0)
  const [hashtags, setHashtags] = useState<TrackedHashtag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<{ total: number; completed: number; status: string } | null>(null)
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({
    platform: '',
    hashtag: '',
    status: '',
    sort_by: 'newest',
    date_from: '',
    date_to: '',
  })

  // Check for run_id param from discovery page links
  const runId = searchParams.get('run_id')

  useEffect(() => {
    loadHashtags()
  }, [])

  useEffect(() => {
    loadVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters])

  async function loadHashtags() {
    try {
      const data = await authFetch('/api/analysis/trending/hashtags').then(r => r.json())
      setHashtags(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load hashtags:', error)
    }
  }

  async function loadVideos() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        offset: String(page * 50),
        sort_by: filters.sort_by,
      })
      if (filters.platform) params.set('platform', filters.platform)
      if (filters.hashtag) params.set('hashtag', filters.hashtag)
      if (filters.status) params.set('status', filters.status)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (runId) params.set('run_id', runId)

      const data = await authFetch(`/api/analysis/trending/videos?${params.toString()}`).then(r => r.json())
      setVideos(Array.isArray(data.videos) ? data.videos : [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkAnalyze() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await authFetch('/api/analysis/videos/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: Array.from(selectedIds), analysis_types: ['full', 'hook'] }),
      })
      // Poll status
      const poll = setInterval(async () => {
        const data = await authFetch('/api/analysis/videos/bulk-analyze-status').then(r => r.json())
        setBulkStatus({ total: data.total || 0, completed: data.completed || 0, status: data.status || 'processing' })
        if (data.status === 'idle' || data.status === 'completed' || !data.status) {
          clearInterval(poll)
          setBulkLoading(false)
          setBulkStatus(null)
          setSelectedIds(new Set())
          loadVideos()
        }
      }, 2000)
    } catch (error) {
      console.error('Bulk analyze failed:', error)
      setBulkLoading(false)
    }
  }

  async function handleBulkDownload() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await authFetch('/api/analysis/videos/backfill-downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: Array.from(selectedIds) }),
      })
      setBulkLoading(false)
      setSelectedIds(new Set())
      setTimeout(loadVideos, 3000) // Refresh after some downloads complete
    } catch (error) {
      console.error('Bulk download failed:', error)
      setBulkLoading(false)
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(videos.map(v => v.id)))
    }
  }

  function openCarousel(index: number) {
    const carouselVideos: CarouselVideo[] = videos.map(v => ({
      id: v.id,
      platform: v.platform,
      username: v.username,
      content_url: v.content_url,
      thumbnail_url: v.thumbnail_url,
      local_thumbnail_path: v.local_thumbnail_path,
      local_video_path: v.local_video_path,
      caption: v.caption,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      engagement_rate: v.engagement_rate,
      published_at: v.published_at,
      status: v.status,
      format_class_name: v.class_name,
      final_viral_probability: v.final_viral_probability,
    }))
    setCarouselData({ videos: carouselVideos, initialIndex: index })
  }

  function updateFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      {/* Header with back link */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard/discovery')} className="text-slate-500 hover:text-white transition-colors">
          <i className="fas fa-arrow-left mr-2"></i>Back to Discovery
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded">
            Discovered Content
          </span>
          <h1 className="text-4xl font-black tracking-tighter mb-2 mt-3">DISCOVERED ITEMS</h1>
          <p className="text-slate-500 text-sm font-medium">Browse, filter, and manage all content discovered through hashtag tracking.</p>
        </div>
        <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest">
          <div className="px-4 py-2 bg-white/5 rounded-xl"><span className="text-purple-400">{total}</span> Total</div>
          <div className="px-4 py-2 bg-white/5 rounded-xl"><span className="text-teal-400">{videos.filter(v => v.status === 'analyzed').length}</span> Analyzed</div>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
          <span className="text-xs font-black text-violet-400">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkAnalyze}
            disabled={bulkLoading}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {bulkLoading ? 'Processing...' : 'Analyze Selected'}
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={bulkLoading}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-50"
          >
            Download Videos
          </button>
          {bulkStatus && (
            <span className="text-[10px] font-bold text-amber-400">
              {bulkStatus.completed}/{bulkStatus.total} processed
            </span>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="text-[10px] font-bold text-slate-500 hover:text-white ml-auto">
            Deselect All
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-6 mb-8">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Platform */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Platform</label>
            <select
              value={filters.platform}
              onChange={(e) => updateFilter('platform', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            >
              <option value="">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Hashtag */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Hashtag</label>
            <select
              value={filters.hashtag}
              onChange={(e) => updateFilter('hashtag', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            >
              <option value="">All Hashtags</option>
              {hashtags.map(h => (
                <option key={h.id} value={h.hashtag}>#{h.hashtag} ({h.platform})</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="fetched">Fetched</option>
              <option value="analyzed">Analyzed</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Sort By</label>
            <select
              value={filters.sort_by}
              onChange={(e) => updateFilter('sort_by', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="views">Most Views</option>
              <option value="likes">Most Likes</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Select All header */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={videos.length > 0 && selectedIds.size === videos.length}
            onChange={toggleSelectAll}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select All</span>
        </label>
        {loading && (
          <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {/* Video grid */}
      {videos.length === 0 && !loading ? (
        <div className="glass-card rounded-[1.5rem] border-white/5 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-full flex items-center justify-center">
            <i className="fas fa-search text-pink-400 text-xl"></i>
          </div>
          <p className="text-slate-500 text-sm font-bold">No discovered items found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map((video, index) => {
            const thumb = getThumbnailSrc(video)
            const isSelected = selectedIds.has(video.id)
            return (
              <div
                key={video.id}
                className={`glass-card rounded-[1.5rem] border-white/5 p-4 hover:bg-white/[0.04] transition-colors cursor-pointer relative ${
                  isSelected ? 'ring-1 ring-violet-500/40 bg-violet-500/[0.03]' : ''
                }`}
                onClick={() => openCarousel(index)}
              >
                {/* Checkbox */}
                <div
                  className="absolute top-4 left-4 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(video.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50 cursor-pointer"
                  />
                </div>

                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-film text-slate-700 text-lg"></i>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Platform badge */}
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                        video.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {video.platform}
                      </span>
                      {/* Username */}
                      <span className="text-xs font-bold text-white truncate">@{video.username}</span>
                      {/* Download indicator */}
                      {video.local_video_path && (
                        <i className="fas fa-download text-[10px] text-teal-400/60" title="Video downloaded"></i>
                      )}
                    </div>

                    {/* Caption */}
                    {video.caption && (
                      <p className="text-[11px] text-slate-400 font-medium truncate mb-1.5">{video.caption}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      <span><i className="fas fa-eye mr-1 text-cyan-400/60"></i>{formatNumber(video.views)}</span>
                      <span><i className="fas fa-heart mr-1 text-pink-400/60"></i>{formatNumber(video.likes)}</span>
                      <span className="text-slate-600">{Number(video.engagement_rate).toFixed(1)}% eng</span>
                    </div>

                    {/* Status + analysis badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(video.status)}`}>
                        {video.status}
                      </span>
                      {video.class_name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                          {video.class_name}
                        </span>
                      )}
                      {video.final_viral_probability != null && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          video.final_viral_probability >= 0.7 ? 'bg-teal-500/10 text-teal-400' :
                          video.final_viral_probability >= 0.4 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {Math.round(video.final_viral_probability * 100)}% viral
                        </span>
                      )}
                      {video.published_at && (
                        <span className="text-[10px] font-bold text-slate-600 ml-auto">{timeAgo(video.published_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-8">
          <span className="text-xs font-bold text-slate-500">
            Showing {page * 50 + 1}-{Math.min((page + 1) * 50, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Prev
            </button>
            <button
              disabled={(page + 1) * 50 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* VideoStoryCarousel overlay */}
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
