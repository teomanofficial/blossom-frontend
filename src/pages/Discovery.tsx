import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface TrendingStats {
  total_hashtags: number
  active_hashtags: number
  videos_fetched_today: number
  videos_analyzed_today: number
  new_discoveries_today: number
  last_run_at: string | null
  last_run_status: string | null
  platform_breakdown: Record<string, number>
}

interface TrackedHashtag {
  id: number
  platform: string
  hashtag: string
  is_active: boolean
  max_videos_per_run: number
  total_runs: number
  total_videos: number
  last_run_status: string | null
  last_run_at: string | null
  created_at: string
}

interface TrendingRun {
  id: number
  run_date: string
  hashtag_id: number
  platform: string
  hashtag: string
  videos_fetched: number
  videos_analyzed: number
  new_videos: number
  status: string
  error: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
}

interface DiscoverySchedule {
  id: number
  hashtag_id: number
  frequency: string
  run_hour: number
  is_active: boolean
  last_run_at: string | null
  next_run_at: string | null
  post_actions: {
    auto_analyze: boolean
    auto_download: boolean
    auto_suggestions: boolean
  }
  created_at: string
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
    case 'completed': return 'bg-teal-500/10 text-teal-400'
    case 'analyzing': return 'bg-amber-500/10 text-amber-400'
    case 'fetching': return 'bg-blue-500/10 text-blue-400'
    case 'error': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

function formatDuration(startedAt: string | null | undefined, finishedAt: string | null | undefined): string | null {
  if (!startedAt || !finishedAt) return null
  const diffMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  if (diffMs < 0) return null
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatNextRun(dateStr: string | null): string {
  if (!dateStr) return 'No schedule'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  if (diffMs < 0) return 'Overdue'
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `in ${days}d ${hours % 24}h`
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`
  return `in ${minutes}m`
}

export default function Discovery() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<TrendingStats | null>(null)
  const [hashtags, setHashtags] = useState<TrackedHashtag[]>([])
  const [runs, setRuns] = useState<TrendingRun[]>([])
  const [videosTotal, setVideosTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [runningManual, setRunningManual] = useState(false)
  const [newHashtag, setNewHashtag] = useState({ platform: 'tiktok', hashtag: '', max_videos_per_run: 30 })

  // Schedule state
  const [schedules, setSchedules] = useState<DiscoverySchedule[]>([])
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'daily',
    run_hour: 9,
    post_actions: { auto_analyze: true, auto_download: false, auto_suggestions: false },
  })

  // Run filter
  const [runHashtagFilter, setRunHashtagFilter] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      setLoading(true)
      const [statsRes, hashtagsRes, runsRes, schedulesRes] = await Promise.all([
        authFetch('/api/analysis/trending/stats').then(r => r.json()),
        authFetch('/api/analysis/trending/hashtags').then(r => r.json()),
        authFetch('/api/analysis/trending/runs?limit=20').then(r => r.json()),
        authFetch('/api/analysis/trending/schedules').then(r => r.json()).catch(() => []),
      ])
      setStats(statsRes)
      setHashtags(Array.isArray(hashtagsRes) ? hashtagsRes : [])
      setRuns(Array.isArray(runsRes) ? runsRes : [])
      setSchedules(Array.isArray(schedulesRes) ? schedulesRes : [])
      await loadVideosTotal()
    } catch (error) {
      console.error('Failed to load discovery data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadVideosTotal() {
    try {
      const data = await authFetch('/api/analysis/trending/videos?limit=1&offset=0').then(r => r.json())
      setVideosTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load discovery videos count:', error)
    }
  }

  async function handleAddHashtag(e: React.FormEvent) {
    e.preventDefault()
    if (!newHashtag.hashtag.trim()) return
    try {
      await authFetch('/api/analysis/trending/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHashtag),
      })
      setNewHashtag({ platform: 'tiktok', hashtag: '', max_videos_per_run: 30 })
      loadAll()
    } catch (error) {
      console.error('Failed to add hashtag:', error)
    }
  }

  async function toggleActive(h: TrackedHashtag) {
    try {
      await authFetch(`/api/analysis/trending/hashtags/${h.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !h.is_active }),
      })
      loadAll()
    } catch (error) {
      console.error('Failed to toggle hashtag:', error)
    }
  }

  async function deleteHashtag(id: number) {
    if (!confirm('Remove this hashtag and its run history?')) return
    try {
      await authFetch(`/api/analysis/trending/hashtags/${id}`, { method: 'DELETE' })
      loadAll()
    } catch (error) {
      console.error('Failed to delete hashtag:', error)
    }
  }

  async function triggerManualRun() {
    try {
      setRunningManual(true)
      await authFetch('/api/analysis/trending/run-now', { method: 'POST' })
      const poll = setInterval(async () => {
        const data = await authFetch('/api/analysis/trending/stats').then(r => r.json())
        setStats(data)
        const runsData = await authFetch('/api/analysis/trending/runs?limit=20').then(r => r.json())
        setRuns(Array.isArray(runsData) ? runsData : [])
        const hasRunning = (runsData as TrendingRun[]).some(r => r.status === 'fetching' || r.status === 'analyzing')
        if (!hasRunning) {
          clearInterval(poll)
          setRunningManual(false)
          loadAll()
        }
      }, 5000)
    } catch (error) {
      console.error('Failed to trigger run:', error)
      setRunningManual(false)
    }
  }

  // Schedule helpers
  function getScheduleForHashtag(hashtagId: number): DiscoverySchedule | undefined {
    return schedules.find(s => s.hashtag_id === hashtagId)
  }

  function openScheduleEditor(hashtagId: number) {
    const existing = getScheduleForHashtag(hashtagId)
    if (existing) {
      setScheduleForm({
        frequency: existing.frequency,
        run_hour: existing.run_hour,
        post_actions: { ...existing.post_actions },
      })
    } else {
      setScheduleForm({
        frequency: 'daily',
        run_hour: 9,
        post_actions: { auto_analyze: true, auto_download: false, auto_suggestions: false },
      })
    }
    setEditingSchedule(hashtagId)
  }

  async function saveSchedule(hashtagId: number) {
    try {
      const existing = getScheduleForHashtag(hashtagId)
      if (existing) {
        await authFetch(`/api/analysis/trending/schedules/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frequency: scheduleForm.frequency,
            run_hour: scheduleForm.run_hour,
            post_actions: scheduleForm.post_actions,
          }),
        })
      } else {
        await authFetch('/api/analysis/trending/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtag_id: hashtagId,
            frequency: scheduleForm.frequency,
            run_hour: scheduleForm.run_hour,
            post_actions: scheduleForm.post_actions,
          }),
        })
      }
      setEditingSchedule(null)
      const updated = await authFetch('/api/analysis/trending/schedules').then(r => r.json()).catch(() => [])
      setSchedules(Array.isArray(updated) ? updated : [])
    } catch (error) {
      console.error('Failed to save schedule:', error)
    }
  }

  async function deleteSchedule(scheduleId: number) {
    try {
      await authFetch(`/api/analysis/trending/schedules/${scheduleId}`, { method: 'DELETE' })
      setEditingSchedule(null)
      const updated = await authFetch('/api/analysis/trending/schedules').then(r => r.json()).catch(() => [])
      setSchedules(Array.isArray(updated) ? updated : [])
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  // Filtered runs
  const filteredRuns = runHashtagFilter
    ? runs.filter(r => r.hashtag === runHashtagFilter)
    : runs

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
              Discovery
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">DISCOVERY</h1>
          <p className="text-slate-500 text-sm font-medium">
            Track hashtags, schedule discovery jobs, and find trending content across platforms.
          </p>
        </div>

        <div className="flex gap-4 items-end">
          <button
            onClick={() => navigate('/dashboard/discovery/items')}
            className="h-fit px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <i className="fas fa-list"></i> View All Items
            </span>
          </button>
          <button
            onClick={triggerManualRun}
            disabled={runningManual}
            className={`h-fit px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              runningManual
                ? 'bg-amber-500/10 text-amber-400 cursor-wait'
                : 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90'
            }`}
          >
            {runningManual ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                RUNNING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fas fa-bolt"></i> RUN NOW
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Active Hashtags</div>
          <div className="text-2xl font-black text-purple-400">{stats?.active_hashtags ?? 0}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">{stats?.total_hashtags ?? 0} total</div>
        </div>
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fetched Today</div>
          <div className="text-2xl font-black text-cyan-400">{formatNumber(stats?.videos_fetched_today ?? 0)}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">videos</div>
        </div>
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">New Discoveries</div>
          <div className="text-2xl font-black text-teal-400">{formatNumber(stats?.new_discoveries_today ?? 0)}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">today</div>
        </div>
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Analyzed Today</div>
          <div className="text-2xl font-black text-pink-400">{formatNumber(stats?.videos_analyzed_today ?? 0)}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">with Gemini</div>
        </div>
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Last Run</div>
          <div className="text-lg font-black text-white mt-1">{timeAgo(stats?.last_run_at ?? null)}</div>
          {stats?.last_run_status && (
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${statusColor(stats.last_run_status)}`}>
              {stats.last_run_status}
            </span>
          )}
        </div>
      </div>

      {/* Tracked Hashtags */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-8 mb-10">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Tracked Hashtags</h2>

        {/* Add Form */}
        <form onSubmit={handleAddHashtag} className="flex gap-3 mb-6 flex-wrap">
          <select
            value={newHashtag.platform}
            onChange={(e) => setNewHashtag({ ...newHashtag, platform: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
          </select>
          <input
            type="text"
            placeholder="#hashtag"
            value={newHashtag.hashtag}
            onChange={(e) => setNewHashtag({ ...newHashtag, hashtag: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white flex-1 min-w-[200px] focus:outline-none focus:border-pink-500/50 placeholder-slate-600 transition-colors"
          />
          <input
            type="number"
            min="5"
            max="100"
            value={newHashtag.max_videos_per_run}
            onChange={(e) => setNewHashtag({ ...newHashtag, max_videos_per_run: parseInt(e.target.value) || 30 })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white w-20 focus:outline-none focus:border-pink-500/50 transition-colors"
            title="Max videos per run"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </form>

        {/* Hashtag List */}
        {hashtags.length === 0 ? (
          <p className="text-slate-600 text-xs font-bold">No hashtags tracked yet. Add one above to get started.</p>
        ) : (
          <div className="space-y-2">
            {hashtags.map(h => {
              const schedule = getScheduleForHashtag(h.id)
              return (
                <div key={h.id}>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                        h.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {h.platform}
                      </span>
                      <span className="text-sm font-black text-white">#{h.hashtag}</span>
                      <span className="text-[10px] font-bold text-slate-600">{h.total_videos || 0} videos</span>
                      <span className="text-[10px] font-bold text-slate-600">max {h.max_videos_per_run}/run</span>
                      {h.last_run_status && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(h.last_run_status)}`}>
                          {h.last_run_status}
                        </span>
                      )}
                      {h.last_run_at && (
                        <span className="text-[10px] font-bold text-slate-600">{timeAgo(h.last_run_at)}</span>
                      )}
                      {/* Schedule indicator */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        schedule ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/5 text-slate-600'
                      }`}>
                        <i className={`fas fa-clock mr-1 ${schedule ? 'text-violet-400' : 'text-slate-600'}`}></i>
                        {schedule ? formatNextRun(schedule.next_run_at) : 'No schedule'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openScheduleEditor(h.id)}
                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                          editingSchedule === h.id
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                        }`}
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => toggleActive(h)}
                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                          h.is_active
                            ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                            : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                        }`}
                      >
                        {h.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteHashtag(h.id)}
                        className="text-[10px] font-bold text-red-400/60 hover:text-red-400 px-2 py-1.5 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Inline Schedule Editor */}
                  {editingSchedule === h.id && (
                    <div className="mt-1 p-5 rounded-xl bg-violet-500/[0.03] border border-violet-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <i className="fas fa-calendar-alt text-violet-400 text-xs"></i>
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                          Schedule for #{h.hashtag}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-4">
                        {/* Frequency */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Frequency</label>
                          <select
                            value={scheduleForm.frequency}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                          >
                            <option value="daily">Daily</option>
                            <option value="every_6_hours">Every 6 hours</option>
                            <option value="every_12_hours">Every 12 hours</option>
                          </select>
                        </div>

                        {/* Hour selector (for daily) */}
                        {scheduleForm.frequency === 'daily' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Run Hour (UTC)</label>
                            <select
                              value={scheduleForm.run_hour}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, run_hour: parseInt(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Post-actions toggles */}
                      <div className="mb-4">
                        <label className="text-[10px] font-bold text-slate-500 block mb-2">Post-run Actions</label>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scheduleForm.post_actions.auto_analyze}
                              onChange={(e) => setScheduleForm({
                                ...scheduleForm,
                                post_actions: { ...scheduleForm.post_actions, auto_analyze: e.target.checked },
                              })}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                            />
                            <span className="text-[10px] font-bold text-slate-400">Auto Analyze</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scheduleForm.post_actions.auto_download}
                              onChange={(e) => setScheduleForm({
                                ...scheduleForm,
                                post_actions: { ...scheduleForm.post_actions, auto_download: e.target.checked },
                              })}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                            />
                            <span className="text-[10px] font-bold text-slate-400">Auto Download</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scheduleForm.post_actions.auto_suggestions}
                              onChange={(e) => setScheduleForm({
                                ...scheduleForm,
                                post_actions: { ...scheduleForm.post_actions, auto_suggestions: e.target.checked },
                              })}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                            />
                            <span className="text-[10px] font-bold text-slate-400">Auto Suggestions</span>
                          </label>
                        </div>
                      </div>

                      {/* Save / Delete / Cancel */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveSchedule(h.id)}
                          className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          Save Schedule
                        </button>
                        {schedule && (
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="text-[10px] font-bold text-red-400/60 hover:text-red-400 px-3 py-2 transition-colors"
                          >
                            Delete Schedule
                          </button>
                        )}
                        <button
                          onClick={() => setEditingSchedule(null)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-300 px-3 py-2 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-8 mb-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Runs</h2>
          <select
            value={runHashtagFilter}
            onChange={(e) => setRunHashtagFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-pink-500/50 transition-colors"
          >
            <option value="">All Hashtags</option>
            {hashtags.map(h => (
              <option key={h.id} value={h.hashtag}>#{h.hashtag} ({h.platform})</option>
            ))}
          </select>
        </div>

        {filteredRuns.length === 0 ? (
          <p className="text-slate-600 text-xs font-bold">No discovery runs yet. Add hashtags and click "Run Now" to start.</p>
        ) : (
          <div className="space-y-2">
            {filteredRuns.map(run => {
              const duration = formatDuration(run.started_at, run.finished_at)
              return (
                <div key={run.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(run.status)}`}>
                      {run.status}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      run.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {run.platform}
                    </span>
                    <span className="text-sm font-bold text-white">#{run.hashtag}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                    <span>{run.videos_fetched || 0} fetched</span>
                    <span className="text-teal-400">{run.new_videos || 0} new</span>
                    <span className="text-cyan-400">{run.videos_analyzed || 0} analyzed</span>
                    {duration && (
                      <span className="text-violet-400">{duration}</span>
                    )}
                    <span>{timeAgo(run.created_at)}</span>
                    {run.error && (
                      <span className="text-red-400 truncate max-w-[200px]" title={run.error}>{run.error}</span>
                    )}
                    <button
                      onClick={() => navigate(`/dashboard/discovery/items?run_id=${run.id}`)}
                      className="text-pink-400/60 hover:text-pink-400 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Discovered Items Summary */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-full flex items-center justify-center">
            <i className="fas fa-compass text-pink-400 text-xl"></i>
          </div>
          <div className="text-3xl font-black text-white mb-1">{formatNumber(videosTotal)}</div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Total Discovered Items</p>
          <button
            onClick={() => navigate('/dashboard/discovery/items')}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center gap-2">
              View Discovered Items <i className="fas fa-arrow-right"></i>
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
