import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch, API_URL } from '../lib/api'
import { supabase } from '../lib/supabase'

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

interface Scheduler {
  id: number
  name: string
  frequency: string
  run_hour: number
  is_active: boolean
  post_actions: {
    auto_analyze: boolean
    auto_download: boolean
    auto_suggestions: boolean
  }
  hashtag_count: number
  last_run_id: number | null
  last_run_status: string | null
  last_run_fetched: number | null
  last_run_new: number | null
  last_run_total_hashtags: number | null
  last_run_completed: number | null
  last_run_failed: number | null
  last_run_finished_at: string | null
  last_run_started_at: string | null
  next_run_at: string | null
  created_at: string
}

interface SchedulerRun {
  id: number
  scheduler_id: number
  scheduler_name: string
  status: string
  total_hashtags: number
  completed_hashtags: number
  failed_hashtags: number
  total_videos_fetched: number
  total_new_videos: number
  total_videos_analyzed: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

interface LogEntry {
  ts: string
  level: 'info' | 'warn' | 'error'
  msg: string
  data?: any
}

interface SchedulerRunHashtag {
  id: number
  hashtag_id: number
  hashtag: string
  platform: string
  status: string
  videos_fetched: number
  new_videos: number
  videos_analyzed: number
  videos_downloaded: number
  error: string | null
  started_at: string | null
  finished_at: string | null
  logs: LogEntry[] | null
}

interface SchedulerRunGroup {
  scheduler_id: number
  scheduler_name: string
  is_active: boolean
  total_runs: number
  last_run_at: string
  runs: SchedulerRun[]
}

interface DiscoveryProgress {
  type: 'manual' | 'scheduler'
  schedulerId?: number
  phase: 'fetching' | 'analyzing' | 'downloading' | 'completed' | 'error'
  totalHashtags: number
  completedHashtags: number
  currentHashtag?: string
  currentHashtagPlatform?: string
  currentHashtagVideosFetched: number
  currentHashtagMaxVideos: number
  currentHashtagNewVideos: number
  currentHashtagVideosAnalyzed: number
  currentHashtagVideosDownloaded: number
  currentHashtagTotalToProcess: number
  totalVideosFetched: number
  totalNewVideos: number
  totalVideosAnalyzed: number
  totalVideosDownloaded: number
  errors: Array<{ hashtag: string; error: string }>
  startedAt: string
  message?: string
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
    case 'partial': return 'bg-amber-500/10 text-amber-400'
    case 'running': return 'bg-blue-500/10 text-blue-400'
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
  if (!dateStr) return 'Not scheduled'
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

function frequencyLabel(f: string): string {
  switch (f) {
    case 'daily': return 'Daily'
    case 'every_6h': return 'Every 6h'
    case 'every_12h': return 'Every 12h'
    default: return f
  }
}

function ProgressPanel({ progress, label }: { progress: DiscoveryProgress; label: string }) {
  const hashtagPercent = progress.totalHashtags > 0
    ? Math.round((progress.completedHashtags / progress.totalHashtags) * 100)
    : 0
  const videoPercent = progress.currentHashtagTotalToProcess > 0
    ? Math.round(
        (Math.max(progress.currentHashtagVideosAnalyzed, progress.currentHashtagVideosDownloaded) /
          progress.currentHashtagTotalToProcess) * 100
      )
    : 0
  const elapsed = Math.floor((Date.now() - new Date(progress.startedAt).getTime()) / 1000)
  const elapsedStr = elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`

  const phaseColor: Record<string, string> = {
    fetching: 'text-blue-400',
    analyzing: 'text-amber-400',
    downloading: 'text-cyan-400',
    completed: 'text-teal-400',
    error: 'text-red-400',
  }

  const phaseBg: Record<string, string> = {
    fetching: 'bg-blue-500',
    analyzing: 'bg-amber-500',
    downloading: 'bg-cyan-500',
    completed: 'bg-teal-500',
    error: 'bg-red-500',
  }

  return (
    <div className="glass-card rounded-[1.5rem] border-white/5 p-6 border border-blue-500/20 bg-blue-500/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-xs font-black text-white uppercase tracking-widest">{label}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            progress.phase === 'fetching' ? 'bg-blue-500/10 text-blue-400' :
            progress.phase === 'analyzing' ? 'bg-amber-500/10 text-amber-400' :
            progress.phase === 'downloading' ? 'bg-cyan-500/10 text-cyan-400' :
            'bg-slate-500/10 text-slate-400'
          }`}>
            {progress.phase}
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-500">{elapsedStr} elapsed</span>
      </div>

      {/* Overall hashtag progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400">
            Hashtags: {progress.completedHashtags}/{progress.totalHashtags}
          </span>
          <span className="text-[10px] font-bold text-slate-500">{hashtagPercent}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${hashtagPercent}%` }}
          />
        </div>
      </div>

      {/* Current hashtag detail */}
      {progress.currentHashtag && (
        <div className="mb-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
              progress.currentHashtagPlatform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
            }`}>
              {progress.currentHashtagPlatform}
            </span>
            <span className="text-xs font-black text-white">#{progress.currentHashtag}</span>
            <span className={`text-[10px] font-bold ${phaseColor[progress.phase] || 'text-slate-400'}`}>
              {progress.message}
            </span>
          </div>

          {/* Per-video progress bar */}
          {progress.currentHashtagTotalToProcess > 0 && (progress.phase === 'analyzing' || progress.phase === 'downloading') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500">
                  {progress.phase === 'analyzing'
                    ? `Analyzed: ${progress.currentHashtagVideosAnalyzed}/${progress.currentHashtagTotalToProcess}`
                    : `Downloaded: ${progress.currentHashtagVideosDownloaded}/${progress.currentHashtagTotalToProcess}`
                  }
                </span>
                <span className="text-[10px] font-bold text-slate-500">{videoPercent}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${phaseBg[progress.phase] || 'bg-slate-500'}`}
                  style={{ width: `${videoPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Fetching indicator */}
          {progress.phase === 'fetching' && progress.currentHashtagVideosFetched === 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-blue-400">Fetching videos from API...</span>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4 text-[10px] font-bold">
        <span className="text-slate-500">
          <span className="text-cyan-400">{progress.totalVideosFetched}</span> fetched
        </span>
        <span className="text-slate-500">
          <span className="text-teal-400">{progress.totalNewVideos}</span> new
        </span>
        <span className="text-slate-500">
          <span className="text-amber-400">{progress.totalVideosAnalyzed}</span> analyzed
        </span>
        {progress.totalVideosDownloaded > 0 && (
          <span className="text-slate-500">
            <span className="text-violet-400">{progress.totalVideosDownloaded}</span> downloaded
          </span>
        )}
        {progress.errors.length > 0 && (
          <span className="text-red-400">{progress.errors.length} error{progress.errors.length > 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}

export default function Discovery() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<TrendingStats | null>(null)
  const [hashtags, setHashtags] = useState<TrackedHashtag[]>([])
  const [schedulers, setSchedulers] = useState<Scheduler[]>([])
  const [runGroups, setRunGroups] = useState<SchedulerRunGroup[]>([])
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
  const [videosTotal, setVideosTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [runningManual, setRunningManual] = useState(false)

  // Run dialog
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [runDialogPlatformFilter, setRunDialogPlatformFilter] = useState<'all' | 'tiktok' | 'instagram'>('all')
  const [selectedHashtagIds, setSelectedHashtagIds] = useState<Set<number>>(new Set())

  // Scheduler form
  const [showSchedulerForm, setShowSchedulerForm] = useState(false)
  const [editingScheduler, setEditingScheduler] = useState<number | null>(null)
  const [schedulerForm, setSchedulerForm] = useState({
    name: '',
    frequency: 'daily',
    run_hour: 9,
    post_actions: { auto_analyze: true, auto_download: false, auto_suggestions: false },
    hashtag_ids: [] as number[],
  })

  // Run detail expansion
  const [expandedRun, setExpandedRun] = useState<number | null>(null)
  const [runDetail, setRunDetail] = useState<SchedulerRunHashtag[]>([])
  const [loadingRunDetail, setLoadingRunDetail] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null)

  // Running schedulers (for polling)
  const [runningSchedulerIds, setRunningSchedulerIds] = useState<Set<number>>(new Set())

  // Live progress from SSE
  const [manualProgress, setManualProgress] = useState<DiscoveryProgress | null>(null)
  const [schedulerProgress, setSchedulerProgress] = useState<Map<number, DiscoveryProgress>>(new Map())
  const eventSourceRef = useRef<EventSource | null>(null)

  // Compact layout state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['history']))


  function toggleSection(section: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  // SSE connection for live progress
  const connectSSE = useCallback(async () => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const url = `${API_URL}/api/analysis/trending/progress?token=${encodeURIComponent(session.access_token)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data: DiscoveryProgress = JSON.parse(event.data)

        if (data.type === 'manual') {
          if (data.phase === 'completed') {
            setManualProgress(null)
            setRunningManual(false)
            loadAll()
          } else {
            setManualProgress(data)
            setRunningManual(true)
          }
        } else if (data.type === 'scheduler' && data.schedulerId) {
          if (data.phase === 'completed') {
            setSchedulerProgress(prev => {
              const next = new Map(prev)
              next.delete(data.schedulerId!)
              return next
            })
            setRunningSchedulerIds(prev => {
              const next = new Set(prev)
              next.delete(data.schedulerId!)
              return next
            })
            loadAll()
          } else {
            setSchedulerProgress(prev => {
              const next = new Map(prev)
              next.set(data.schedulerId!, data)
              return next
            })
            setRunningSchedulerIds(prev => new Set(prev).add(data.schedulerId!))
          }
        }
      } catch (e) {
        // Ignore parse errors (heartbeat comments etc.)
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects, no action needed
    }
  }, [])

  // Connect SSE on mount, disconnect on unmount
  useEffect(() => {
    connectSSE()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connectSSE])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      setLoading(true)
      const [statsRes, hashtagsRes, schedulersRes, runsRes] = await Promise.all([
        authFetch('/api/analysis/trending/stats').then(r => r.json()),
        authFetch('/api/analysis/trending/hashtags').then(r => r.json()),
        authFetch('/api/analysis/trending/schedulers').then(r => r.json()).catch(() => []),
        authFetch('/api/analysis/trending/scheduler-runs/grouped?limit=5').then(r => r.json()).catch(() => []),
      ])
      setStats(statsRes)
      setHashtags(Array.isArray(hashtagsRes) ? hashtagsRes : [])
      setSchedulers(Array.isArray(schedulersRes) ? schedulersRes : [])
      setRunGroups(Array.isArray(runsRes) ? runsRes : [])
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

  // ---- Hashtag CRUD ----

  // ---- Manual Run (selected hashtags) ----

  async function triggerManualRun(hashtagIds: number[]) {
    try {
      setRunningManual(true)
      setShowRunDialog(false)
      await authFetch('/api/analysis/trending/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtag_ids: hashtagIds }),
      })
      // Progress updates come via SSE — no polling needed
    } catch (error) {
      console.error('Failed to trigger run:', error)
      setRunningManual(false)
    }
  }

  function openRunDialog() {
    const activeIds = new Set(hashtags.filter(h => h.is_active).map(h => h.id))
    setSelectedHashtagIds(activeIds)
    setRunDialogPlatformFilter('all')
    setShowRunDialog(true)
  }

  const filteredRunDialogHashtags = hashtags.filter(h =>
    runDialogPlatformFilter === 'all' || h.platform === runDialogPlatformFilter
  )

  // ---- Scheduler CRUD ----

  function openSchedulerForm(scheduler?: Scheduler) {
    if (scheduler) {
      setEditingScheduler(scheduler.id)
      setSchedulerForm({
        name: scheduler.name,
        frequency: scheduler.frequency,
        run_hour: scheduler.run_hour,
        post_actions: { ...scheduler.post_actions },
        hashtag_ids: [],
      })
      // Load the scheduler's hashtags
      authFetch(`/api/analysis/trending/schedulers/${scheduler.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.hashtags) {
            setSchedulerForm(prev => ({
              ...prev,
              hashtag_ids: data.hashtags.map((h: any) => h.id),
            }))
          }
        })
        .catch(() => {})
    } else {
      setEditingScheduler(null)
      setSchedulerForm({
        name: '',
        frequency: 'daily',
        run_hour: 9,
        post_actions: { auto_analyze: true, auto_download: false, auto_suggestions: false },
        hashtag_ids: [],
      })
    }
    setShowSchedulerForm(true)
  }

  async function saveScheduler() {
    if (!schedulerForm.name.trim()) return
    try {
      if (editingScheduler) {
        // Update scheduler config
        await authFetch(`/api/analysis/trending/schedulers/${editingScheduler}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: schedulerForm.name,
            frequency: schedulerForm.frequency,
            run_hour: schedulerForm.run_hour,
            post_actions: schedulerForm.post_actions,
          }),
        })
        // Sync hashtags: get current, remove missing, add new
        const currentRes = await authFetch(`/api/analysis/trending/schedulers/${editingScheduler}`).then(r => r.json())
        const currentIds = (currentRes.hashtags || []).map((h: any) => h.id)
        const toRemove = currentIds.filter((id: number) => !schedulerForm.hashtag_ids.includes(id))
        const toAdd = schedulerForm.hashtag_ids.filter(id => !currentIds.includes(id))
        for (const id of toRemove) {
          await authFetch(`/api/analysis/trending/schedulers/${editingScheduler}/hashtags/${id}`, { method: 'DELETE' })
        }
        if (toAdd.length > 0) {
          await authFetch(`/api/analysis/trending/schedulers/${editingScheduler}/hashtags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashtag_ids: toAdd }),
          })
        }
      } else {
        // Create new scheduler with hashtags
        await authFetch('/api/analysis/trending/schedulers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: schedulerForm.name,
            frequency: schedulerForm.frequency,
            run_hour: schedulerForm.run_hour,
            post_actions: schedulerForm.post_actions,
            hashtag_ids: schedulerForm.hashtag_ids,
          }),
        })
      }
      setShowSchedulerForm(false)
      setEditingScheduler(null)
      loadAll()
    } catch (error) {
      console.error('Failed to save scheduler:', error)
    }
  }

  async function deleteScheduler(id: number) {
    if (!confirm('Delete this scheduler? Run history will also be deleted.')) return
    try {
      await authFetch(`/api/analysis/trending/schedulers/${id}`, { method: 'DELETE' })
      setShowSchedulerForm(false)
      setEditingScheduler(null)
      loadAll()
    } catch (error) {
      console.error('Failed to delete scheduler:', error)
    }
  }

  async function toggleSchedulerActive(s: Scheduler) {
    try {
      await authFetch(`/api/analysis/trending/schedulers/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !s.is_active }),
      })
      loadAll()
    } catch (error) {
      console.error('Failed to toggle scheduler:', error)
    }
  }

  async function triggerSchedulerRun(schedulerId: number) {
    try {
      setRunningSchedulerIds(prev => new Set(prev).add(schedulerId))
      await authFetch(`/api/analysis/trending/schedulers/${schedulerId}/run`, { method: 'POST' })
      // Progress updates come via SSE — no polling needed
    } catch (error) {
      console.error('Failed to trigger scheduler run:', error)
      setRunningSchedulerIds(prev => {
        const next = new Set(prev)
        next.delete(schedulerId)
        return next
      })
    }
  }

  // ---- Run Detail Expansion ----

  async function toggleRunExpand(runId: number) {
    if (expandedRun === runId) {
      setExpandedRun(null)
      setRunDetail([])
      return
    }
    setExpandedRun(runId)
    setLoadingRunDetail(true)
    try {
      const data = await authFetch(`/api/analysis/trending/scheduler-runs/${runId}`).then(r => r.json())
      setRunDetail(data.hashtags || [])
    } catch (error) {
      console.error('Failed to load run detail:', error)
      setRunDetail([])
    } finally {
      setLoadingRunDetail(false)
    }
  }

  function renderRunRow(run: SchedulerRun, isLatest: boolean) {
    const duration = formatDuration(run.started_at, run.finished_at)
    const isRunExpanded = expandedRun === run.id
    const dim = isLatest ? '' : '/60'
    return (
      <>
        <div
          className={`flex items-center justify-between px-5 py-3 transition-colors cursor-pointer ${
            isRunExpanded ? 'bg-violet-500/[0.04]' : isLatest ? 'bg-white/[0.01] hover:bg-white/[0.03]' : 'bg-black/10 hover:bg-white/[0.02]'
          }`}
          onClick={() => toggleRunExpand(run.id)}
        >
          <div className="flex items-center gap-3">
            <i className={`fas fa-chevron-${isRunExpanded ? 'down' : 'right'} text-[7px] ${isLatest ? 'text-slate-600' : 'text-slate-700'}`}></i>
            {isLatest && <span className="text-[10px] font-black text-pink-400/80 uppercase tracking-widest">Latest</span>}
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(run.status)}`}>{run.status}</span>
          </div>
          <div className={`flex items-center gap-4 text-[10px] font-bold ${isLatest ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>
              <span className={`text-teal-400${dim}`}>{run.completed_hashtags}</span>
              {run.failed_hashtags > 0 && <span className={`text-red-400${dim}`}>/{run.failed_hashtags} failed</span>}
              <span className={isLatest ? 'text-slate-600' : 'text-slate-700'}>/{run.total_hashtags} hashtags</span>
            </span>
            <span>{run.total_videos_fetched} fetched</span>
            <span className={`text-teal-400${dim}`}>{run.total_new_videos} new</span>
            <span className={`text-cyan-400${dim}`}>{run.total_videos_analyzed} analyzed</span>
            {duration && <span className={`text-violet-400${dim}`}>{duration}</span>}
            <span>{timeAgo(run.created_at)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/discovery/items?scheduler_run_id=${run.id}`) }}
              className={`${isLatest ? 'text-pink-400/60' : 'text-pink-400/40'} hover:text-pink-400 transition-colors`}
            >View Videos</button>
          </div>
        </div>
        {isRunExpanded && (
          <div className="px-5 pb-4">
            <div className="p-4 rounded-xl bg-violet-500/[0.02] border border-violet-500/10">
              {loadingRunDetail ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : runDetail.length === 0 ? (
                <p className="text-slate-600 text-xs font-bold text-center py-3">No hashtag results for this run.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.03]">
                      <td className="pb-2">Platform</td><td className="pb-2">Hashtag</td><td className="pb-2">Status</td>
                      <td className="pb-2 text-right">Fetched</td><td className="pb-2 text-right">New</td>
                      <td className="pb-2 text-right">Analyzed Duration</td><td className="pb-2">Error</td>
                    </tr>
                  </thead>
                  <tbody>
                    {runDetail.map(rh => {
                      const rhDur = formatDuration(rh.started_at, rh.finished_at)
                      const hasLogs = rh.logs && rh.logs.length > 0
                      const logsOpen = expandedLogs === rh.id
                      return (
                        <React.Fragment key={rh.id}>
                          <tr className="text-xs border-b border-white/[0.03] last:border-0">
                            <td className="py-2"><span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${rh.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'}`}>{rh.platform}</span></td>
                            <td className="py-2 font-bold text-white">#{rh.hashtag}</td>
                            <td className="py-2"><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(rh.status)}`}>{rh.status}</span></td>
                            <td className="py-2 text-right font-bold text-slate-400">{rh.videos_fetched}</td>
                            <td className="py-2 text-right font-bold text-teal-400">{rh.new_videos}</td>
                            <td className="py-2 text-right"><span className="font-bold text-cyan-400">{rh.videos_analyzed}</span><span className="font-bold text-violet-400 ml-3">{rhDur || '-'}</span></td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                {rh.error && <span className="text-red-400 text-[10px] truncate max-w-[200px] inline-block" title={rh.error}>{rh.error}</span>}
                                {hasLogs && (
                                  <button onClick={() => setExpandedLogs(logsOpen ? null : rh.id)} className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition-colors ${logsOpen ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/10 text-slate-500 hover:text-slate-400'}`}>
                                    <i className={`fas fa-${logsOpen ? 'chevron-up' : 'terminal'} mr-1`}></i>{rh.logs!.length} logs
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {logsOpen && hasLogs && (
                            <tr><td colSpan={7} className="p-0" style={{ maxWidth: 0 }}>
                              <div className="bg-black/40 border border-white/5 rounded-lg mx-2 mb-2 p-3 max-h-[400px] overflow-y-auto overflow-x-hidden font-mono text-[11px] leading-relaxed">
                                {rh.logs!.map((entry, i) => {
                                  const time = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any)
                                  const lc = entry.level === 'error' ? 'text-red-400' : entry.level === 'warn' ? 'text-amber-400' : 'text-slate-500'
                                  const mc = entry.level === 'error' ? 'text-red-300' : entry.level === 'warn' ? 'text-amber-300' : 'text-slate-300'
                                  return (<div key={i} className="flex gap-2 hover:bg-white/[0.02] px-1 rounded min-w-0"><span className="text-slate-600 shrink-0">{time}</span><span className={`${lc} shrink-0 w-10 text-right uppercase`}>{entry.level}</span><span className={`${mc} break-all min-w-0`}>{entry.msg}</span>{entry.data && <span className="text-slate-600 min-w-0 break-all" title={JSON.stringify(entry.data)}>{JSON.stringify(entry.data)}</span>}</div>)
                                })}
                              </div>
                            </td></tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
              Discovery
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 font-display">DISCOVERY</h1>
          <p className="text-slate-500 text-sm font-medium">
            Create schedulers to group hashtags, set run times, and discover trending content.
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
            onClick={openRunDialog}
            disabled={runningManual || hashtags.length === 0}
            className={`h-fit px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              runningManual
                ? 'bg-amber-500/10 text-amber-400 cursor-wait'
                : 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90 disabled:opacity-50'
            }`}
          >
            {runningManual ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                RUNNING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fas fa-bolt"></i> RUN HASHTAGS
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Progress Panel */}
      {(manualProgress || schedulerProgress.size > 0) && (
        <div className="mb-8 space-y-3">
          {manualProgress && <ProgressPanel progress={manualProgress} label="Manual Run" />}
          {Array.from(schedulerProgress.entries()).map(([id, prog]) => {
            const scheduler = schedulers.find(s => s.id === id)
            return <ProgressPanel key={id} progress={prog} label={scheduler?.name || `Scheduler #${id}`} />
          })}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Active Hashtags</div>
          <div className="text-2xl font-black text-purple-400">{stats?.active_hashtags ?? 0}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">{stats?.total_hashtags ?? 0} total</div>
        </div>
        <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Schedulers</div>
          <div className="text-2xl font-black text-violet-400">{schedulers.filter(s => s.is_active).length}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1">{schedulers.length} total</div>
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
      </div>

      {/* Schedulers */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => toggleSection('schedulers')} className="flex items-center gap-2.5 group">
            <i className={`fas fa-chevron-${collapsedSections.has('schedulers') ? 'right' : 'down'} text-[8px] text-slate-600 group-hover:text-slate-400 transition-colors`}></i>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schedulers</h2>
            <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded">
              {schedulers.filter(s => s.is_active).length}/{schedulers.length}
            </span>
          </button>
          {!collapsedSections.has('schedulers') && (
            <button
              onClick={() => openSchedulerForm()}
              className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <span className="flex items-center gap-1.5">
                <i className="fas fa-plus text-[8px]"></i> New
              </span>
            </button>
          )}
        </div>

        {/* Scheduler Form (inline create/edit) */}
        {!collapsedSections.has('schedulers') && showSchedulerForm && (
          <div className="mb-4 p-5 rounded-xl bg-violet-500/[0.03] border border-violet-500/10">
            <div className="flex items-center gap-2 mb-5">
              <i className="fas fa-calendar-alt text-violet-400 text-xs"></i>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                {editingScheduler ? 'Edit Scheduler' : 'New Scheduler'}
              </span>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Name</label>
              <input
                type="text"
                placeholder="e.g. Morning TikTok Check"
                value={schedulerForm.name}
                onChange={(e) => setSchedulerForm({ ...schedulerForm, name: e.target.value })}
                className="glass-input rounded-lg px-4 py-2.5 text-xs font-bold text-white w-full max-w-md focus:outline-none focus:border-violet-500/50 placeholder-slate-600 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              {/* Frequency */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Frequency</label>
                <select
                  value={schedulerForm.frequency}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, frequency: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="every_6h">Every 6 hours</option>
                  <option value="every_12h">Every 12 hours</option>
                </select>
              </div>

              {/* Hour selector (for daily) */}
              {schedulerForm.frequency === 'daily' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Run Hour (UTC)</label>
                  <select
                    value={schedulerForm.run_hour}
                    onChange={(e) => setSchedulerForm({ ...schedulerForm, run_hour: parseInt(e.target.value) })}
                    className="glass-input rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Post-actions */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 block mb-2">Post-run Actions</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedulerForm.post_actions.auto_analyze}
                    onChange={(e) => setSchedulerForm({
                      ...schedulerForm,
                      post_actions: { ...schedulerForm.post_actions, auto_analyze: e.target.checked },
                    })}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                  />
                  <span className="text-[10px] font-bold text-slate-400">Auto Analyze</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedulerForm.post_actions.auto_download}
                    onChange={(e) => setSchedulerForm({
                      ...schedulerForm,
                      post_actions: { ...schedulerForm.post_actions, auto_download: e.target.checked },
                    })}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                  />
                  <span className="text-[10px] font-bold text-slate-400">Auto Download</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedulerForm.post_actions.auto_suggestions}
                    onChange={(e) => setSchedulerForm({
                      ...schedulerForm,
                      post_actions: { ...schedulerForm.post_actions, auto_suggestions: e.target.checked },
                    })}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                  />
                  <span className="text-[10px] font-bold text-slate-400">Auto Suggestions</span>
                </label>
              </div>
            </div>

            {/* Hashtag Selection */}
            <div className="mb-5">
              <label className="text-[10px] font-bold text-slate-500 block mb-2">
                Hashtags ({schedulerForm.hashtag_ids.length} selected)
              </label>
              {hashtags.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-600">No hashtags available. Add some below first.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  {hashtags.map(h => {
                    const selected = schedulerForm.hashtag_ids.includes(h.id)
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setSchedulerForm(prev => ({
                            ...prev,
                            hashtag_ids: selected
                              ? prev.hashtag_ids.filter(id => id !== h.id)
                              : [...prev.hashtag_ids, h.id],
                          }))
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5 ${
                          selected
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className={`text-[8px] font-black uppercase ${
                          h.platform === 'tiktok' ? 'text-pink-400' : 'text-orange-400'
                        }`}>
                          {h.platform === 'tiktok' ? 'TT' : 'IG'}
                        </span>
                        #{h.hashtag}
                        {selected && <i className="fas fa-check text-[8px] text-violet-400 ml-0.5"></i>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={saveScheduler}
                disabled={!schedulerForm.name.trim()}
                className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {editingScheduler ? 'Save Changes' : 'Create Scheduler'}
              </button>
              {editingScheduler && (
                <button
                  onClick={() => deleteScheduler(editingScheduler)}
                  className="text-[10px] font-bold text-red-400/60 hover:text-red-400 px-3 py-2 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => { setShowSchedulerForm(false); setEditingScheduler(null) }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 px-3 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Scheduler List */}
        {!collapsedSections.has('schedulers') && (schedulers.length === 0 && !showSchedulerForm ? (
          <p className="text-slate-600 text-xs font-bold">No schedulers yet. Create one to group hashtags and schedule discovery runs.</p>
        ) : (
          <div className="space-y-1.5">
            {schedulers.map(s => {
              const isRunning = runningSchedulerIds.has(s.id)
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-black text-white">{s.name}</span>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                      {s.hashtag_count} hashtag{s.hashtag_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {frequencyLabel(s.frequency)}
                      {s.frequency === 'daily' && ` at ${String(s.run_hour).padStart(2, '0')}:00 UTC`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.next_run_at ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-500/5 text-slate-600'
                    }`}>
                      <i className="fas fa-clock mr-1"></i>
                      {formatNextRun(s.next_run_at)}
                    </span>
                    {s.last_run_status && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor(s.last_run_status)}`}>
                        {s.last_run_status}
                      </span>
                    )}
                    {s.last_run_finished_at && (
                      <span className="text-[10px] font-bold text-slate-600">{timeAgo(s.last_run_finished_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerSchedulerRun(s.id)}
                      disabled={isRunning}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                        isRunning
                          ? 'bg-amber-500/10 text-amber-400 cursor-wait'
                          : 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'
                      }`}
                    >
                      {isRunning ? (
                        <span className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                          Running
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-play text-[8px]"></i> Run
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openSchedulerForm(s)}
                      className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleSchedulerActive(s)}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                        s.is_active
                          ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                          : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Tracked Hashtags — Summary Card */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tracked Hashtags</h2>
            <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded">
              {hashtags.length} total
            </span>
            <span className="text-[10px] font-bold text-teal-400/70 bg-teal-500/5 px-2 py-0.5 rounded">
              {hashtags.filter(h => h.is_active).length} active
            </span>
            <span className="text-[10px] font-bold text-pink-400/70 bg-pink-500/5 px-2 py-0.5 rounded">
              TT {hashtags.filter(h => h.platform === 'tiktok').length}
            </span>
            <span className="text-[10px] font-bold text-orange-400/70 bg-orange-500/5 px-2 py-0.5 rounded">
              IG {hashtags.filter(h => h.platform === 'instagram').length}
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard/discovery/hashtags')}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Manage <i className="fas fa-arrow-right text-[8px] ml-1"></i>
          </button>
        </div>

        {/* Currently running hashtag jobs */}
        {(() => {
          const allProgress = [manualProgress, ...Array.from(schedulerProgress.values())].filter(
            (p): p is DiscoveryProgress => !!p && p.phase !== 'completed' && !!p.currentHashtag
          )
          if (allProgress.length === 0) return null
          return (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Running</span>
              </div>
              <div className="space-y-1.5">
                {allProgress.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      p.currentHashtagPlatform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>{p.currentHashtagPlatform === 'tiktok' ? 'TT' : 'IG'}</span>
                    <span className="font-bold text-white">#{p.currentHashtag}</span>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${statusColor(p.phase)}`}>{p.phase}</span>
                    <span className="text-slate-500 font-bold">
                      {p.phase === 'fetching' && p.currentHashtagVideosFetched > 0 && `${p.currentHashtagVideosFetched} fetched`}
                      {p.phase === 'analyzing' && p.currentHashtagTotalToProcess > 0 && `${p.currentHashtagVideosAnalyzed}/${p.currentHashtagTotalToProcess}`}
                      {p.phase === 'downloading' && p.currentHashtagTotalToProcess > 0 && `${p.currentHashtagVideosDownloaded}/${p.currentHashtagTotalToProcess}`}
                    </span>
                    {p.currentHashtagTotalToProcess > 0 && (p.phase === 'analyzing' || p.phase === 'downloading') && (
                      <div className="flex-1 max-w-[120px] h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.phase === 'analyzing' ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{
                            width: `${Math.round(
                              (Math.max(p.currentHashtagVideosAnalyzed, p.currentHashtagVideosDownloaded) /
                                p.currentHashtagTotalToProcess) * 100
                            )}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Scheduler Run History */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => toggleSection('history')} className="flex items-center gap-2.5 group">
            <i className={`fas fa-chevron-${collapsedSections.has('history') ? 'right' : 'down'} text-[8px] text-slate-600 group-hover:text-slate-400 transition-colors`}></i>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Run History</h2>
            <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded">{runGroups.reduce((s, g) => s + g.total_runs, 0)}</span>
          </button>
        </div>

        {!collapsedSections.has('history') && (runGroups.length === 0 ? (
          <p className="text-slate-600 text-xs font-bold">No scheduler runs yet.</p>
        ) : (
          <div className="space-y-3">
            {runGroups.map(group => {
              const isGroupOpen = expandedGroup === group.scheduler_id
              const latestRun = group.runs[0]
              const olderRuns = group.runs.slice(1)
              return (
                <div key={group.scheduler_id} className="rounded-xl border border-white/5 overflow-hidden">
                  {/* Group header */}
                  <div
                    className="flex items-center justify-between px-5 py-3 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
                    onClick={() => setExpandedGroup(isGroupOpen ? null : group.scheduler_id)}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas fa-chevron-${isGroupOpen ? 'down' : 'right'} text-[8px] text-slate-500`}></i>
                      <span className="text-sm font-bold text-white">{group.scheduler_name}</span>
                      <span className="text-[10px] font-bold text-slate-600">{group.total_runs} run{group.total_runs !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      {latestRun && (
                        <>
                          <span className={`font-black uppercase px-2 py-0.5 rounded ${statusColor(latestRun.status)}`}>{latestRun.status}</span>
                          <span>{timeAgo(latestRun.created_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Latest run — always visible */}
                  {latestRun && <div className="border-t border-white/5">{renderRunRow(latestRun, true)}</div>}
                  {/* Older runs — shown when group expanded */}
                  {isGroupOpen && olderRuns.length > 0 && (
                    <div className="border-t border-white/[0.03]">
                      {olderRuns.map(run => (
                        <div key={run.id} className="border-t border-white/[0.02] first:border-t-0">{renderRunRow(run, false)}</div>
                      ))}
                    </div>
                  )}
                  {/* Expand/collapse toggle */}
                  {olderRuns.length > 0 && (
                    <div className="flex items-center justify-center py-2 border-t border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedGroup(isGroupOpen ? null : group.scheduler_id)}>
                      <span className="text-[10px] font-bold text-slate-600">
                        {isGroupOpen
                          ? <><i className="fas fa-chevron-up mr-1"></i>Hide older runs</>
                          : <><i className="fas fa-chevron-down mr-1"></i>{olderRuns.length} older run{olderRuns.length !== 1 ? 's' : ''}</>}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Discovered Items — Compact */}
      <div className="glass-card rounded-[1.5rem] border-white/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-compass text-pink-400 text-sm"></i>
            </div>
            <div>
              <div className="text-lg font-black text-white leading-tight">{formatNumber(videosTotal)}</div>
              <p className="text-[10px] font-bold text-slate-500">Total Discovered Items</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/discovery/items')}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center gap-1.5">
              View All <i className="fas fa-arrow-right text-[8px]"></i>
            </span>
          </button>
        </div>
      </div>

      {/* Run Hashtags Dialog */}
      {showRunDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRunDialog(false)} />
          <div className="relative w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 sm:p-8 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Run Hashtags</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Select which hashtags to run</p>
              </div>
              <button
                onClick={() => setShowRunDialog(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Platform Filter */}
            <div className="flex gap-2 mb-4">
              {(['all', 'tiktok', 'instagram'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setRunDialogPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                    runDialogPlatformFilter === p
                      ? p === 'tiktok' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : p === 'instagram' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-white/10 text-white border border-white/20'
                      : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {p === 'all' ? 'All' : p === 'tiktok' ? 'TikTok' : 'Instagram'}
                </button>
              ))}
            </div>

            {/* Select All / None */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400">
                {selectedHashtagIds.size} of {hashtags.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ids = new Set(filteredRunDialogHashtags.map(h => h.id))
                    setSelectedHashtagIds(prev => {
                      const next = new Set(prev)
                      ids.forEach(id => next.add(id))
                      return next
                    })
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Select all visible
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => {
                    const ids = new Set(filteredRunDialogHashtags.map(h => h.id))
                    setSelectedHashtagIds(prev => {
                      const next = new Set(prev)
                      ids.forEach(id => next.delete(id))
                      return next
                    })
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Deselect all visible
                </button>
              </div>
            </div>

            {/* Hashtag List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 mb-5 pr-1 min-h-0">
              {filteredRunDialogHashtags.length === 0 ? (
                <p className="text-slate-600 text-xs font-bold text-center py-8">No hashtags match this filter.</p>
              ) : (
                filteredRunDialogHashtags.map(h => {
                  const selected = selectedHashtagIds.has(h.id)
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        setSelectedHashtagIds(prev => {
                          const next = new Set(prev)
                          if (next.has(h.id)) next.delete(h.id)
                          else next.add(h.id)
                          return next
                        })
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selected
                          ? 'bg-pink-500/10 border border-pink-500/20'
                          : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'bg-pink-500 border-pink-500' : 'border-white/20'
                      }`}>
                        {selected && <i className="fas fa-check text-[8px] text-white"></i>}
                      </div>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 ${
                        h.platform === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {h.platform === 'tiktok' ? 'TT' : 'IG'}
                      </span>
                      <span className="text-sm font-bold text-white flex-1">#{h.hashtag}</span>
                      <span className="text-[10px] font-bold text-slate-600 flex-shrink-0">{h.total_videos || 0} videos</span>
                      <span className="text-[10px] font-bold text-slate-600 flex-shrink-0">max {h.max_videos_per_run}/run</span>
                      {!h.is_active && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 flex-shrink-0">
                          paused
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setShowRunDialog(false)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => triggerManualRun(Array.from(selectedHashtagIds))}
                disabled={selectedHashtagIds.size === 0}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-bolt"></i> Run {selectedHashtagIds.size} Hashtag{selectedHashtagIds.size !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
