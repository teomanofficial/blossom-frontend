import { useEffect, useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getStorageUrl } from '../lib/media'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

interface Video {
  id: number
  platform: string
  platform_id: string
  username: string
  content_type: string
  content_url: string
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  caption: string | null
  duration_sec: number | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  published_at: string | null
  search_source: string
  search_query: string
  status: string
  error_message: string | null
  format_class_name: string | null
  hook_class_name: string | null
  top_tactic_names: string[]
  full_analysis_id: number | null
  hook_analysis_id: number | null
  created_at: string
  raw_data?: any
}

interface VideoStatus {
  id: number
  username: string
  thumbnail_url: string | null
  status: 'pending' | 'analyzing' | 'done' | 'error'
  error?: string
}

interface BulkStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  startedAt: string | null
  cancelled: boolean
  videos: Record<string, VideoStatus>
}

interface VideoStats {
  total: number
  pending: number
  analyzed: number
  analyzing: number
  error: number
}

type SortField = 'views' | 'likes' | 'engagement_rate' | 'published_at' | 'created_at'
type StatusFilter = '' | 'fetched' | 'analyzed' | 'error'
type PlatformFilter = '' | 'instagram' | 'tiktok'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function getThumbnailSrc(video: Video): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

function elapsedSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ${secs % 60}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const SCAN_PREFS_KEY = 'blossom_scan_preferences'

function loadScanPrefs() {
  try {
    const raw = localStorage.getItem(SCAN_PREFS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveScanPrefs(prefs: { platform: string; searchType: string; amount: number }) {
  try {
    localStorage.setItem(SCAN_PREFS_KEY, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

export default function Videos() {
  const { userType } = useAuth()
  const isAdmin = userType === 'admin'

  // Fetch form state — restore last preferences
  const savedPrefs = useRef(loadScanPrefs())
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>(
    savedPrefs.current?.platform === 'instagram' ? 'instagram' : 'tiktok'
  )
  const [searchType, setSearchType] = useState<'username' | 'hashtag'>(
    savedPrefs.current?.searchType === 'hashtag' ? 'hashtag' : 'username'
  )
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState(savedPrefs.current?.amount ?? 30)

  // Persist preferences on change
  useEffect(() => {
    saveScanPrefs({ platform, searchType, amount })
  }, [platform, searchType, amount])
  const [fetching, setFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Video list state
  const [videos, setVideos] = useState<Video[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortField>('created_at')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('')
  const [offset, setOffset] = useState(0)
  const limit = 48

  // Selection state
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  // Carousel state
  const [carouselData, setCarouselData] = useState<{ videos: CarouselVideo[]; initialIndex: number } | null>(null)

  // Bulk analysis state (legacy display only — bulk-analyze trigger is removed)
  const [bulkStatus, setBulkStatus] = useState<BulkStatus | null>(null)
  const [showVideoDetail, setShowVideoDetail] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasRunningRef = useRef(false)

  // Video stats from DB
  const [stats, setStats] = useState<VideoStats | null>(null)

  const fetchStats = useCallback(() => {
    authFetch('/api/analysis/videos/stats')
      .then((r) => r.json())
      .then((data: VideoStats) => setStats(data))
      .catch(() => {})
  }, [])

  // Fetch stats on mount and when videos change
  useEffect(() => { fetchStats() }, [fetchStats])

  // ── Fetch videos list ──
  const fetchVideos = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      sort_by: sortBy,
      order,
      limit: String(limit),
      offset: String(offset),
    })
    if (statusFilter) params.set('status', statusFilter)
    if (platformFilter) params.set('platform', platformFilter)

    authFetch(`/api/analysis/videos?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos || [])
        setTotal(data.total || 0)
      })
      .catch(() => toast.error('Failed to load videos'))
      .finally(() => setLoading(false))
  }, [sortBy, order, offset, statusFilter, platformFilter])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  // ── Fetch from social media ──
  const handleFetch = () => {
    if (!query.trim()) return
    setFetching(true)
    setFetchResult(null)
    setFetchError(null)

    authFetch('/api/analysis/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        search_type: searchType,
        query: searchType === 'hashtag' ? query.trim().replace(/^#/, '') : query.trim(),
        amount,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFetchError(data.error)
        } else {
          setFetchResult(data.message || `Imported ${data.created} new videos, updated ${data.updated} existing.`)
          fetchVideos()
          fetchStats()
        }
      })
      .catch((e) => setFetchError(e.message))
      .finally(() => setFetching(false))
  }

  // ── Poll bulk status — always running on mount ──
  const checkBulkStatus = useCallback(() => {
    authFetch('/api/analysis/videos/bulk-analyze-status')
      .then((r) => r.json())
      .then((data: BulkStatus) => {
        setBulkStatus(data)

        if (data.running) {
          wasRunningRef.current = true
          // Make sure polling is active
          if (!pollRef.current) {
            pollRef.current = setInterval(() => {
              authFetch('/api/analysis/videos/bulk-analyze-status')
                .then((r) => r.json())
                .then((d: BulkStatus) => {
                  setBulkStatus(d)
                  fetchStats()
                  if (!d.running && pollRef.current) {
                    clearInterval(pollRef.current)
                    pollRef.current = null
                    fetchVideos()
                    setSelected(new Set())
                    setSelectMode(false)
                  }
                })
                .catch(() => toast.error('Failed to check analysis status'))
            }, 1500)
          }
        } else if (wasRunningRef.current) {
          // Was running, now stopped — refresh once
          wasRunningRef.current = false
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          fetchVideos()
          fetchStats()
          setSelected(new Set())
          setSelectMode(false)
        }
      })
      .catch(() => toast.error('Failed to check analysis status'))
  }, [fetchVideos, fetchStats])

  // On mount: check status immediately and start polling if running
  useEffect(() => {
    checkBulkStatus()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived video status lists ──
  const videoStatuses = bulkStatus?.videos ? Object.values(bulkStatus.videos) : []
  const analyzingNow = videoStatuses.filter((v) => v.status === 'analyzing')
  const doneVideos = videoStatuses.filter((v) => v.status === 'done')
  const errorVideos = videoStatuses.filter((v) => v.status === 'error')
  const pendingVideos = videoStatuses.filter((v) => v.status === 'pending')

  // ── Selection helpers ──
  const toggleSelect = (id: number) => {
    if (downloadingVideoIds.has(id)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(videos.filter((v) => !downloadingVideoIds.has(v.id)).map((v) => v.id)))
  }

  const selectUnanalyzed = () => {
    setSelected(new Set(videos.filter((v) => v.status === 'fetched' && !downloadingVideoIds.has(v.id)).map((v) => v.id)))
  }

  const clearSelection = () => {
    setSelected(new Set())
    setSelectMode(false)
  }

  // ── Sort toggle ──
  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder('desc')
    }
    setOffset(0)
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'views', label: 'Views' },
    { field: 'likes', label: 'Likes' },
    { field: 'engagement_rate', label: 'Engagement' },
    { field: 'published_at', label: 'Published' },
    { field: 'created_at', label: 'Added' },
  ]

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'fetched', label: 'Pending' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'error', label: 'Error' },
  ]

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  // Discovered videos are no longer downloaded; this set is empty by design.
  const downloadingVideoIds = new Set<number>()

  const isRunning = bulkStatus?.running ?? false
  const progressPct = bulkStatus && bulkStatus.total > 0
    ? ((bulkStatus.completed + bulkStatus.failed) / bulkStatus.total) * 100
    : 0

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
              Content Lab
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tighter mb-2">SCAN & ANALYZE</h1>
          <p className="text-slate-500 text-sm font-medium">
            Fetch videos from social media and run AI analysis to uncover viral patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 glass-card rounded-2xl border-white/5 text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</div>
            <div className="text-xl font-black text-white">{formatNumber(stats?.total ?? total)}</div>
          </div>
          <div className="px-5 py-3 glass-card rounded-2xl border-white/5 text-center">
            <div className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">Analyzed</div>
            <div className="text-xl font-black text-emerald-400">{stats?.analyzed ?? '–'}</div>
          </div>
          <div className="px-5 py-3 glass-card rounded-2xl border-white/5 text-center">
            <div className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest">Pending</div>
            <div className="text-xl font-black text-orange-400">{stats?.pending ?? '–'}</div>
          </div>
          {(stats?.analyzing ?? 0) > 0 && (
            <div className="px-5 py-3 glass-card rounded-2xl border-white/5 text-center">
              <div className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest">Analyzing</div>
              <div className="text-xl font-black text-blue-400">{stats!.analyzing}</div>
            </div>
          )}
          {(stats?.error ?? 0) > 0 && (
            <div className="px-5 py-3 glass-card rounded-2xl border-white/5 text-center">
              <div className="text-[9px] font-black text-red-400/70 uppercase tracking-widest">Failed</div>
              <div className="text-xl font-black text-red-400">{stats!.error}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fetch Section ── */}
      <div className="glass-card rounded-[2rem] p-8 mb-10">
        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
          <i className="fas fa-satellite-dish text-pink-400"></i> Fetch Videos
        </h2>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Platform Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setPlatform('tiktok')}
              className={`px-5 py-3 text-[11px] font-black flex items-center gap-2 transition-colors ${
                platform === 'tiktok' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className="fab fa-tiktok"></i> TikTok
            </button>
            <button
              onClick={() => setPlatform('instagram')}
              className={`px-5 py-3 text-[11px] font-black flex items-center gap-2 transition-colors ${
                platform === 'instagram' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className="fab fa-instagram"></i> Instagram
            </button>
          </div>

          {/* Search Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setSearchType('username')}
              className={`px-5 py-3 text-[11px] font-black transition-colors ${
                searchType === 'username' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className="fas fa-user mr-1.5"></i> Username
            </button>
            <button
              onClick={() => setSearchType('hashtag')}
              className={`px-5 py-3 text-[11px] font-black transition-colors ${
                searchType === 'hashtag' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className="fas fa-hashtag mr-1.5"></i> Hashtag
            </button>
          </div>

          {/* Query Input */}
          <div className="flex-1 flex gap-3">
            <div className="flex-1 flex items-center gap-3 glass-input px-5 py-3 rounded-xl focus-within:border-white/20 transition-all">
              <i className={`fas fa-${searchType === 'username' ? 'at' : 'hashtag'} text-slate-500 text-xs`}></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder={searchType === 'username' ? 'Enter username...' : 'Enter hashtag...'}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
              />
            </div>
            <div className="flex items-center gap-2 glass-input px-4 rounded-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase">Qty</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="bg-transparent border-none outline-none text-sm font-bold w-12 text-center"
                min={1}
                max={200}
              />
            </div>
          </div>

          {/* Fetch Button */}
          <button
            onClick={handleFetch}
            disabled={fetching || !query.trim()}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-400 hover:to-orange-300 disabled:opacity-40 disabled:hover:from-pink-500 disabled:hover:to-orange-400 text-white text-[11px] font-black rounded-xl transition-all glow-button"
          >
            {fetching ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                SCANNING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fas fa-radar"></i> SCAN
              </span>
            )}
          </button>
        </div>

        {/* Fetch Result */}
        {fetchResult && (
          <div className="mt-4 px-5 py-3 bg-teal-400/10 border border-teal-400/20 rounded-xl text-teal-400 text-xs font-bold flex items-center gap-2">
            <i className="fas fa-check-circle"></i> {fetchResult}
          </div>
        )}
        {fetchError && (
          <div className="mt-4 px-5 py-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i> {fetchError}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── PERSISTENT BULK ANALYSIS PANEL ── */}
      {/* Shows whenever running OR when just finished with results */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(isRunning || (bulkStatus && bulkStatus.total > 0 && (bulkStatus.completed > 0 || bulkStatus.failed > 0))) && (
        <div className="glass-card rounded-[2rem] mb-10 overflow-hidden">
          {/* Header bar */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isRunning ? (
                  <div className="w-9 h-9 border-2 border-pink-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-400/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-teal-400 text-sm"></i>
                  </div>
                )}
                <div>
                  <div className="text-sm font-black text-white">
                    {isRunning ? 'Analyzing Videos...' : 'Analysis Complete'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-3">
                    <span>
                      <span className="text-teal-400">{bulkStatus!.completed}</span> done
                    </span>
                    {bulkStatus!.failed > 0 && (
                      <span>
                        <span className="text-red-400">{bulkStatus!.failed}</span> failed
                      </span>
                    )}
                    {isRunning && (
                      <span>
                        <span className="text-orange-400">{analyzingNow.length}</span> active now
                      </span>
                    )}
                    <span className="text-slate-600">
                      {bulkStatus!.completed + bulkStatus!.failed} / {bulkStatus!.total}
                    </span>
                    {isRunning && bulkStatus!.startedAt && (
                      <span className="text-slate-600">
                        <i className="fas fa-clock mr-0.5"></i> {elapsedSince(bulkStatus!.startedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVideoDetail((v) => !v)}
                  className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <i className={`fas fa-chevron-${showVideoDetail ? 'up' : 'down'} mr-1`}></i>
                  {showVideoDetail ? 'Hide' : 'Details'}
                </button>
                {!isRunning && (
                  <button
                    onClick={() => setBulkStatus(null)}
                    className="px-3 py-1.5 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors uppercase tracking-widest"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRunning
                    ? 'bg-gradient-to-r from-pink-500 to-orange-400'
                    : 'bg-gradient-to-r from-teal-500 to-teal-400'
                }`}
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>

          {/* ── Detailed video grid ── */}
          {showVideoDetail && videoStatuses.length > 0 && (
            <div className="px-6 pb-6">
              {/* Currently Analyzing */}
              {analyzingNow.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    Analyzing Now ({analyzingNow.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {analyzingNow.map((v) => (
                      <div key={v.id} className="flex items-center gap-2.5 px-3 py-2 bg-orange-400/5 border border-orange-400/20 rounded-xl">
                        {getStorageUrl(v.thumbnail_url) ? (
                          <img src={getStorageUrl(v.thumbnail_url)!} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <i className="fas fa-film text-slate-600 text-[8px]"></i>
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] font-black text-white">@{v.username}</div>
                          <div className="text-[8px] font-bold text-orange-400 uppercase">Processing...</div>
                        </div>
                        <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin ml-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {doneVideos.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <i className="fas fa-check-circle text-[8px]"></i>
                    Completed ({doneVideos.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doneVideos.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-teal-400/5 border border-teal-400/10 rounded-lg">
                        {getStorageUrl(v.thumbnail_url) ? (
                          <img src={getStorageUrl(v.thumbnail_url)!} alt="" className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                            <i className="fas fa-film text-slate-600 text-[7px]"></i>
                          </div>
                        )}
                        <span className="text-[9px] font-black text-teal-400">@{v.username}</span>
                        <i className="fas fa-check text-teal-400 text-[7px]"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed */}
              {errorVideos.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <i className="fas fa-exclamation-triangle text-[8px]"></i>
                    Failed ({errorVideos.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {errorVideos.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-red-400/5 border border-red-400/10 rounded-lg group relative">
                        {getStorageUrl(v.thumbnail_url) ? (
                          <img src={getStorageUrl(v.thumbnail_url)!} alt="" className="w-6 h-6 rounded object-cover opacity-60" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                            <i className="fas fa-film text-slate-600 text-[7px]"></i>
                          </div>
                        )}
                        <span className="text-[9px] font-black text-red-400">@{v.username}</span>
                        <i className="fas fa-times text-red-400 text-[7px]"></i>
                        {v.error && (
                          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-slate-800 border border-white/10 rounded text-[8px] text-red-300 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                            {v.error.slice(0, 80)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Queued / Pending */}
              {isRunning && pendingVideos.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <i className="fas fa-clock text-[8px]"></i>
                    Queued ({pendingVideos.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingVideos.slice(0, 40).map((v) => (
                      <div key={v.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                        {getStorageUrl(v.thumbnail_url) ? (
                          <img src={getStorageUrl(v.thumbnail_url)!} alt="" className="w-6 h-6 rounded object-cover opacity-40" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                            <i className="fas fa-film text-slate-700 text-[7px]"></i>
                          </div>
                        )}
                        <span className="text-[9px] font-bold text-slate-600">@{v.username}</span>
                      </div>
                    ))}
                    {pendingVideos.length > 40 && (
                      <div className="flex items-center px-2.5 py-1.5 text-[9px] font-black text-slate-600">
                        +{pendingVideos.length - 40} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Filter & Sort Controls ── */}
      <div className="space-y-3 mb-6">
        {/* Row 1: Status + Platform */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-1.5">Status</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setOffset(0) }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  statusFilter === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-1.5">Platform</span>
            {[
              { value: '', label: 'All', icon: '' },
              { value: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
              { value: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => { setPlatformFilter(p.value as PlatformFilter); setOffset(0) }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  platformFilter === p.value
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {p.icon && <i className={`${p.icon} mr-1`}></i>}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Sort + Select */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-1.5">Sort</span>
            {sortOptions.map((opt) => (
              <button
                key={opt.field}
                onClick={() => toggleSort(opt.field)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
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

          {/* Selection Controls */}
          <div className="flex items-center gap-1.5">
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <i className="fas fa-check-double mr-1.5"></i> Select
              </button>
            ) : (
              <>
                <button onClick={selectAllVisible} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  All
                </button>
                <button onClick={selectUnanalyzed} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-400/5 transition-all">
                  Pending
                </button>
                <button onClick={clearSelection} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Videos Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-film text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Videos Yet</h3>
          <p className="text-sm text-slate-500">Use the scanner above to fetch videos from TikTok or Instagram.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {videos.map((video) => {
              const thumb = getThumbnailSrc(video)
              const isSelected = selected.has(video.id)
              const isAnalyzed = video.status === 'analyzed'
              const isError = video.status === 'error'
              const isDownloading = downloadingVideoIds.has(video.id)

              return (
                <div
                  key={video.id}
                  onClick={() => {
                    if (isDownloading) return
                    if (selectMode) {
                      toggleSelect(video.id)
                    } else {
                      const idx = videos.indexOf(video)
                      setCarouselData({ videos: videos as CarouselVideo[], initialIndex: idx })
                    }
                  }}
                  className={`relative group ${isDownloading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border transition-all ${
                    isDownloading
                      ? 'border-blue-500/30 opacity-50'
                      : isSelected
                      ? 'border-pink-500 ring-2 ring-pink-500/30'
                      : 'border-white/5 group-hover:border-white/10'
                  }`}>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`@${video.username}`}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isDownloading ? 'grayscale' : 'group-hover:scale-105'}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-film text-slate-700 text-2xl"></i>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3">
                      {/* Top badges */}
                      <div className="flex items-center justify-between">
                        {/* Status badge */}
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                          isAnalyzed
                            ? 'bg-teal-400/20 text-teal-400'
                            : isError
                            ? 'bg-red-400/20 text-red-400'
                            : 'bg-orange-400/20 text-orange-400'
                        }`}>
                          {isAnalyzed ? 'Analyzed' : isError ? 'Error' : 'Pending'}
                        </div>

                        {/* Content type badge */}
                        {video.content_type === 'carousel' && (
                          <div className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-blue-400/20 text-blue-300">
                            Carousel
                          </div>
                        )}

                        {/* Select checkbox */}
                        {selectMode && !isDownloading && (
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-pink-500 border-pink-500'
                              : 'border-white/30 bg-black/30'
                          }`}>
                            {isSelected && <i className="fas fa-check text-white text-[8px]"></i>}
                          </div>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-4 h-4 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                            <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[7px]`}></i>
                          </div>
                          <span className="text-[9px] font-black text-white truncate">@{video.username}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="bg-black/40 backdrop-blur-md px-1.5 py-1 rounded flex-1 flex flex-col">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Views</span>
                            <span className="text-[10px] font-black">{formatNumber(video.views)}</span>
                          </div>
                          <div className="bg-black/40 backdrop-blur-md px-1.5 py-1 rounded flex-1 flex flex-col">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Eng.</span>
                            <span className="text-[10px] font-black">
                              {video.engagement_rate
                                ? Number(video.engagement_rate).toFixed(1) + '%'
                                : '--'}
                            </span>
                          </div>
                        </div>

                        {/* Classification tags */}
                        {isAnalyzed && (video.format_class_name || video.hook_class_name) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {video.format_class_name && (
                              <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-400 text-[7px] font-black rounded uppercase truncate max-w-full">
                                {video.format_class_name}
                              </span>
                            )}
                            {video.hook_class_name && (
                              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[7px] font-black rounded uppercase truncate max-w-full">
                                {video.hook_class_name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 glass-card rounded-xl text-[11px] font-black disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-chevron-left mr-1"></i> Prev
              </button>
              <span className="text-[11px] font-black text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 glass-card rounded-xl text-[11px] font-black disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                Next <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Story Carousel */}
      {carouselData && (
        <VideoStoryCarousel
          videos={carouselData.videos}
          initialIndex={carouselData.initialIndex}
          onClose={() => setCarouselData(null)}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}
