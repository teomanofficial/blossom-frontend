import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import { useAudioPlayer, getAudioUrl } from '../lib/useAudioPlayer'

/* ── Helpers ── */
function fmt(n: number | null | undefined): string {
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

interface AdminStats {
  total_songs: number
  canonical_songs: number
  merged_songs: number
  instagram_songs: number
  tiktok_songs: number
  original_sounds: number
  music_tracks: number
  audio_downloaded: number
  total_video_links: number
  total_views_all: number
  recent_7d: number
  top_songs: any[]
  potential_duplicates: DuplicateGroup[]
}

interface DuplicateGroup {
  title: string
  artist: string | null
  platform_count: number
  platforms: string[]
  ids: number[]
  combined_video_count: number
}

interface SongRow {
  id: number
  title: string
  artist: string | null
  album: string | null
  platform: string
  platform_music_id: string
  cover_url: string | null
  local_cover_path: string | null
  play_url: string | null
  local_audio_path: string | null
  is_original: boolean
  video_count: number
  total_views: number
  avg_views: number
  duration_sec: number | null
  canonical_music_id: number | null
  created_at: string
  effective_video_count: number
  effective_total_views: number
  format_count: number
  top_formats: { id: number; name: string }[] | null
  recent_video_count: number
  merged_count: number
  merged_platforms: string[] | null
}

type SortField = 'video_count' | 'total_views' | 'avg_views' | 'title' | 'artist' | 'created_at' | 'format_count' | 'recent_videos'
type Tab = 'songs' | 'duplicates'

const PAGE_SIZE = 30

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'video_count', label: 'Videos' },
  { field: 'total_views', label: 'Total Views' },
  { field: 'avg_views', label: 'Avg Views' },
  { field: 'format_count', label: 'Formats' },
  { field: 'recent_videos', label: 'Recent' },
  { field: 'title', label: 'Title' },
  { field: 'created_at', label: 'Date' },
]

export default function Songs() {
  const [tab, setTab] = useState<Tab>('songs')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [songs, setSongs] = useState<SongRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortField>('video_count')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [platform, setPlatform] = useState('')
  const [isOriginal, setIsOriginal] = useState('')
  const [hasAudio, setHasAudio] = useState('')
  const [merging, setMerging] = useState(false)
  const audio = useAudioPlayer()

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await authFetch('/api/analysis/music/admin-stats')
      if (!res.ok) throw new Error('Failed to load stats')
      setStats(await res.json())
    } catch {
      toast.error('Failed to load song stats')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch song list
  const fetchSongs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        order,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (platform) params.set('platform', platform)
      if (isOriginal) params.set('is_original', isOriginal)
      if (hasAudio) params.set('has_audio', hasAudio)

      const res = await authFetch(`/api/analysis/music/admin-list?${params}`)
      if (!res.ok) throw new Error('Failed to load songs')
      const data = await res.json()
      setSongs(data.music || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load songs')
    } finally {
      setLoading(false)
    }
  }, [sortBy, order, page, search, platform, isOriginal, hasAudio])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchSongs() }, [fetchSongs])
  useEffect(() => { setPage(0) }, [sortBy, order, search, platform, isOriginal, hasAudio])

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder(o => o === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setOrder('desc')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleMerge = async (canonicalId: number, mergeIds: number[]) => {
    setMerging(true)
    try {
      const res = await authFetch('/api/analysis/music/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonical_id: canonicalId, merge_ids: mergeIds }),
      })
      if (!res.ok) throw new Error('Merge failed')
      const data = await res.json()
      toast.success(data.message)
      fetchStats()
      fetchSongs()
    } catch {
      toast.error('Failed to merge songs')
    } finally {
      setMerging(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statCards = stats ? [
    { label: 'Total Songs', value: fmt(stats.total_songs), icon: 'fa-music', color: 'text-white' },
    { label: 'Instagram', value: fmt(stats.instagram_songs), icon: 'fa-instagram', color: 'text-pink-400', fab: true },
    { label: 'TikTok', value: fmt(stats.tiktok_songs), icon: 'fa-tiktok', color: 'text-cyan-400', fab: true },
    { label: 'Music Tracks', value: fmt(stats.music_tracks), icon: 'fa-compact-disc', color: 'text-violet-400' },
    { label: 'Original Sounds', value: fmt(stats.original_sounds), icon: 'fa-microphone', color: 'text-amber-400' },
    { label: 'Video Links', value: fmt(stats.total_video_links), icon: 'fa-link', color: 'text-teal-400' },
    { label: 'Audio Saved', value: fmt(stats.audio_downloaded), icon: 'fa-download', color: 'text-green-400' },
    { label: 'New (7d)', value: fmt(stats.recent_7d), icon: 'fa-clock', color: 'text-orange-400' },
    { label: 'Duplicates', value: String(stats.potential_duplicates?.length || 0), icon: 'fa-clone', color: 'text-red-400' },
  ] : []

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <span className="badge-glass text-cyan-400 font-black">Music Library</span>
          <h1 className="text-2xl md:text-4xl font-black font-display tracking-tighter">SONGS</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            All discovered songs across platforms. {total > 0 && <span className="text-slate-400">{total} songs</span>}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-3 md:grid-cols-9 gap-3 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="glass-card rounded-xl p-3 text-center">
              <div className={`text-lg md:text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">
                <i className={`${s.fab ? 'fab' : 'fas'} ${s.icon} mr-1`} />
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: 'songs' as Tab, label: 'All Songs', icon: 'fa-music' },
          { key: 'duplicates' as Tab, label: `Duplicates${stats?.potential_duplicates?.length ? ` (${stats.potential_duplicates.length})` : ''}`, icon: 'fa-clone' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-pink-500/20 text-pink-400' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className={`fas ${t.icon} text-[10px]`} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'songs' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-5">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 flex items-center gap-3 glass-input px-4 py-2.5 rounded-xl">
                <i className="fas fa-search text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search by title or artist..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/15 transition-colors">
                Search
              </button>
            </form>

            <select value={platform} onChange={e => setPlatform(e.target.value)} className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none">
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>

            <select value={isOriginal} onChange={e => setIsOriginal(e.target.value)} className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none">
              <option value="">All Types</option>
              <option value="false">Music Tracks</option>
              <option value="true">Original Sounds</option>
            </select>

            <select value={hasAudio} onChange={e => setHasAudio(e.target.value)} className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none">
              <option value="">All Audio</option>
              <option value="true">Audio Saved</option>
              <option value="false">No Audio</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-2">Sort by</span>
            {sortOptions.map(opt => (
              <button
                key={opt.field}
                onClick={() => toggleSort(opt.field)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors border ${
                  sortBy === opt.field
                    ? 'bg-white/10 text-white border-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
                }`}
              >
                {opt.label}
                {sortBy === opt.field && (
                  <i className={`fas fa-chevron-${order === 'desc' ? 'down' : 'up'} ml-1 text-[8px]`} />
                )}
              </button>
            ))}
          </div>

          {/* Song List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : songs.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-music text-cyan-400 text-xl" />
              </div>
              <h3 className="text-lg font-black mb-2">No Songs Found</h3>
              <p className="text-sm text-slate-500">No songs match your filters.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 bg-white/[0.03]">
                        <th className="text-left py-3 px-4 w-12"></th>
                        <th className="text-left py-3 px-4">Song</th>
                        <th className="text-left py-3 px-4">Platform</th>
                        <th className="text-right py-3 px-4">Videos</th>
                        <th className="text-right py-3 px-4">Total Views</th>
                        <th className="text-right py-3 px-4">Avg Views</th>
                        <th className="text-right py-3 px-4">Formats</th>
                        <th className="text-right py-3 px-4">Recent 7d</th>
                        <th className="text-center py-3 px-4">Audio</th>
                        <th className="text-center py-3 px-4">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songs.map(song => {
                        const coverSrc = getStorageUrl(song.local_cover_path)
                        const hasAudioFile = !!getAudioUrl(song)
                        const isPlaying = audio.playingId === song.id
                        const isAudioLoading = audio.loadingId === song.id

                        return (
                          <tr
                            key={song.id}
                            className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                              isPlaying ? 'bg-cyan-500/5' : ''
                            }`}
                          >
                            {/* Cover */}
                            <td className="py-2.5 px-4">
                              <div
                                className={`w-10 h-10 rounded-lg overflow-hidden bg-slate-800 relative cursor-pointer group flex-shrink-0 ${
                                  isPlaying ? 'ring-2 ring-cyan-500/50' : ''
                                }`}
                                onClick={hasAudioFile ? () => audio.toggle(song) : undefined}
                              >
                                {coverSrc ? (
                                  <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-pink-500/10">
                                    <i className="fas fa-music text-cyan-400/30 text-xs" />
                                  </div>
                                )}
                                {hasAudioFile && (
                                  <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
                                    isPlaying || isAudioLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}>
                                    {isAudioLoading ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-white text-[10px]`} />
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Title & Artist */}
                            <td className="py-2.5 px-4 min-w-[200px]">
                              <div className={`text-sm font-bold truncate max-w-[280px] ${isPlaying ? 'text-cyan-300' : 'text-white'}`}>
                                {song.title || 'Untitled'}
                              </div>
                              {song.artist && (
                                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[280px]">
                                  {song.artist}
                                </div>
                              )}
                              {song.merged_count > 0 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 mt-0.5 inline-block">
                                  +{song.merged_count} merged
                                </span>
                              )}
                            </td>

                            {/* Platform */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <i className={`${platformIcon(song.platform)} text-xs ${platformColor(song.platform)}`} />
                                <span className="text-xs text-slate-400 capitalize">{song.platform}</span>
                              </div>
                              {song.merged_platforms && song.merged_platforms.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {song.merged_platforms.filter(p => p !== song.platform).map(p => (
                                    <i key={p} className={`${platformIcon(p)} text-[9px] ${platformColor(p)} opacity-50`} />
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Videos */}
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-sm font-black text-white">{fmt(song.effective_video_count)}</span>
                              {song.merged_count > 0 && song.video_count !== song.effective_video_count && (
                                <div className="text-[9px] text-slate-600">{fmt(song.video_count)} own</div>
                              )}
                            </td>

                            {/* Total Views */}
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-sm font-bold text-slate-300">{fmt(song.effective_total_views)}</span>
                            </td>

                            {/* Avg Views */}
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-sm font-bold text-slate-400">{fmt(song.avg_views)}</span>
                            </td>

                            {/* Formats */}
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-sm font-bold text-violet-400">{song.format_count}</span>
                              {song.top_formats && song.top_formats.length > 0 && (
                                <div className="text-[9px] text-slate-600 truncate max-w-[100px] text-right">
                                  {song.top_formats.map(f => f.name).join(', ')}
                                </div>
                              )}
                            </td>

                            {/* Recent 7d */}
                            <td className="py-2.5 px-4 text-right">
                              {song.recent_video_count > 0 ? (
                                <span className="text-sm font-bold text-green-400">
                                  <i className="fas fa-arrow-trend-up text-[8px] mr-0.5" />
                                  {song.recent_video_count}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-600">-</span>
                              )}
                            </td>

                            {/* Audio */}
                            <td className="py-2.5 px-4 text-center">
                              {song.local_audio_path ? (
                                <span className="text-green-400"><i className="fas fa-check text-xs" /></span>
                              ) : song.play_url ? (
                                <span className="text-amber-400"><i className="fas fa-link text-xs" /></span>
                              ) : (
                                <span className="text-slate-600"><i className="fas fa-minus text-xs" /></span>
                              )}
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-4 text-center">
                              {song.is_original ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
                                  Original
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                                  Music
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-left text-[10px] text-slate-400" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 7) pageNum = i
                      else if (page < 3) pageNum = i
                      else if (page > totalPages - 4) pageNum = totalPages - 7 + i
                      else pageNum = page - 3 + i
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                            page === pageNum ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                          }`}
                        >{pageNum + 1}</button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-right text-[10px] text-slate-400" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Duplicates Tab */}
      {tab === 'duplicates' && (
        <>
          <p className="text-sm text-slate-500 font-medium mb-4">
            Songs that appear on both Instagram and TikTok with matching title + artist. Merge them to get accurate video counts.
          </p>

          {statsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !stats?.potential_duplicates?.length ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-400 text-xl" />
              </div>
              <h3 className="text-lg font-black mb-2">No Cross-Platform Duplicates</h3>
              <p className="text-sm text-slate-500">All songs are unique across platforms.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.potential_duplicates.map((dup, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-white truncate">{dup.title}</span>
                        {dup.platforms.map(p => (
                          <i key={p} className={`${platformIcon(p)} text-xs ${platformColor(p)}`} />
                        ))}
                      </div>
                      {dup.artist && (
                        <div className="text-xs text-slate-500 font-medium">{dup.artist}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-bold">
                        <span><i className="fas fa-video mr-0.5" /> {dup.combined_video_count} combined videos</span>
                        <span><i className="fas fa-globe mr-0.5" /> {dup.platform_count} platforms</span>
                        <span className="text-slate-700">IDs: {dup.ids.join(', ')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMerge(dup.ids[0]!, dup.ids.slice(1))}
                      disabled={merging}
                      className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <i className="fas fa-code-merge text-[10px]" />
                      {merging ? 'Merging...' : 'Merge'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
