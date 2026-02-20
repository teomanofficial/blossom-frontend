import { useEffect, useState, useRef, useCallback } from 'react'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

interface FormatRetrainItem {
  id: number
  name: string
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: any | null
  analysis_updated_at: string | null
  analysis_video_count: number | null
  new_videos_since_retrain: number
  is_stale: boolean
  version_count: number
}

interface HookRetrainItem {
  id: number
  name: string
  description: string | null
  hook_technique: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: any | null
  analysis_updated_at: string | null
  analysis_video_count: number | null
  new_videos_since_retrain: number
  is_stale: boolean
  version_count: number
}

interface TacticItem {
  id: number
  name: string
  name_normalized: string
  category: string
  description: string | null
  why_it_works: string | null
  viewer_effect: string | null
  video_count: number
  avg_views_when_present: number
  avg_execution_score: number
}

interface VersionItem {
  id: number
  class_type: 'format' | 'hook'
  class_id: number
  class_name: string | null
  version_number: number
  analysis_json: any
  video_count_at_time: number
  model_used: string | null
  triggered_by: string
  created_at: string
  notes: string | null
}

interface BulkRetrainStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  startedAt: string | null
  cancelled: boolean
  items: Record<string, {
    type: string
    id: number
    name: string
    status: 'pending' | 'retraining' | 'done' | 'error'
    error?: string
  }>
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

const TACTIC_CATEGORIES = [
  'hook_visual', 'hook_audio', 'hook_text', 'hook_structural',
  'pacing', 'emotional', 'visual_style', 'audio_design',
  'text_overlay', 'framing_angle', 'content_structure',
  'shareability', 'engagement_bait', 'trend_leverage', 'identity_signal',
]

const TACTIC_CATEGORY_COLORS: Record<string, string> = {
  hook_visual: 'bg-cyan-500/10 text-cyan-400',
  hook_audio: 'bg-violet-500/10 text-violet-400',
  hook_text: 'bg-pink-500/10 text-pink-400',
  hook_structural: 'bg-orange-500/10 text-orange-400',
  pacing: 'bg-emerald-500/10 text-emerald-400',
  emotional: 'bg-red-500/10 text-red-400',
  visual_style: 'bg-blue-500/10 text-blue-400',
  audio_design: 'bg-indigo-500/10 text-indigo-400',
  text_overlay: 'bg-yellow-500/10 text-yellow-400',
  framing_angle: 'bg-teal-500/10 text-teal-400',
  content_structure: 'bg-lime-500/10 text-lime-400',
  shareability: 'bg-fuchsia-500/10 text-fuchsia-400',
  engagement_bait: 'bg-amber-500/10 text-amber-400',
  trend_leverage: 'bg-rose-500/10 text-rose-400',
  identity_signal: 'bg-sky-500/10 text-sky-400',
}

function tacticLabel(t: any): string {
  if (typeof t === 'string') return t
  return t.name || t.tactic || t.description || t.analysis || t.why || JSON.stringify(t)
}

function stringifyVal(val: any): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : (v?.name || v?.text || v?.instruction || v?.description || JSON.stringify(v))).join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function VersionAnalysisDisplay({ analysis }: { analysis: any }) {
  if (!analysis) return <p className="text-sm text-slate-500 italic">No analysis data</p>
  return (
    <div className="space-y-3">
      {analysis.class_description && <p className="text-sm text-slate-300">{analysis.class_description}</p>}
      {analysis.gold_standard_tactics?.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gold Standard Tactics</div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.gold_standard_tactics.map((t: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded">
                {tacticLabel(t)}
              </span>
            ))}
          </div>
        </div>
      )}
      {analysis.overrated_tactics?.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Overrated Tactics</div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.overrated_tactics.map((t: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-xs rounded">
                {tacticLabel(t)}
              </span>
            ))}
          </div>
        </div>
      )}
      {analysis.execution_gaps?.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Execution Gaps</div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.execution_gaps.map((t: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded">
                {tacticLabel(t)}
              </span>
            ))}
          </div>
        </div>
      )}
      {analysis.blueprint && (
        <div>
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Blueprint</div>
          <div className="text-xs text-slate-400 space-y-1">
            {Object.entries(analysis.blueprint).map(([key, val]) => (
              <div key={key}><span className="text-slate-500">{key}:</span> {stringifyVal(val)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BulkAnalysisManagement() {
  const [activeTab, setActiveTab] = useState<'formats' | 'hooks' | 'tactics' | 'history'>('formats')
  const [formats, setFormats] = useState<FormatRetrainItem[]>([])
  const [formatsLoading, setFormatsLoading] = useState(false)
  const [hooks, setHooks] = useState<HookRetrainItem[]>([])
  const [hooksLoading, setHooksLoading] = useState(false)
  const [tactics, setTactics] = useState<TacticItem[]>([])
  const [tacticsLoading, setTacticsLoading] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsTotal, setVersionsTotal] = useState(0)
  const [selectedFormats, setSelectedFormats] = useState<Set<number>>(new Set())
  const [selectedHooks, setSelectedHooks] = useState<Set<number>>(new Set())
  const [retrainStatus, setRetrainStatus] = useState<BulkRetrainStatus | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [formatSearch, setFormatSearch] = useState('')
  const [hookSearch, setHookSearch] = useState('')
  const [tacticSearch, setTacticSearch] = useState('')
  const [tacticCategoryFilter, setTacticCategoryFilter] = useState('')
  const [versionTypeFilter, setVersionTypeFilter] = useState<'all' | 'format' | 'hook'>('all')
  const [compareVersions, setCompareVersions] = useState<[VersionItem, VersionItem] | null>(null)
  const retrainPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tactics tab state
  const [editingTactic, setEditingTactic] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; category: string; description: string }>({ name: '', category: '', description: '' })
  const [mergingTactic, setMergingTactic] = useState<number | null>(null)
  const [mergeTarget, setMergeTarget] = useState<number | null>(null)
  const [recomputingStats, setRecomputingStats] = useState(false)
  const [savingTactic, setSavingTactic] = useState(false)

  // Version history tab state
  const [versionPage, setVersionPage] = useState(0)
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set())
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  // === Data Fetching ===

  const fetchFormats = useCallback(async () => {
    setFormatsLoading(true)
    try {
      const res = await authFetch('/api/analysis/formats/retrain-status')
      if (res.ok) {
        const data = await res.json()
        setFormats(Array.isArray(data) ? data : [])
      }
    } catch (err) { console.error('Failed to fetch formats:', err) }
    finally { setFormatsLoading(false) }
  }, [])

  const fetchHooks = useCallback(async () => {
    setHooksLoading(true)
    try {
      const res = await authFetch('/api/analysis/hooks/retrain-status')
      if (res.ok) {
        const data = await res.json()
        setHooks(Array.isArray(data) ? data : [])
      }
    } catch (err) { console.error('Failed to fetch hooks:', err) }
    finally { setHooksLoading(false) }
  }, [])

  const fetchTactics = useCallback(async () => {
    setTacticsLoading(true)
    try {
      const res = await authFetch('/api/analysis/tactics?limit=500&sort_by=video_count&order=desc')
      if (res.ok) {
        const data = await res.json()
        setTactics(Array.isArray(data) ? data : [])
      }
    } catch (err) { console.error('Failed to fetch tactics:', err) }
    finally { setTacticsLoading(false) }
  }, [])

  const fetchVersions = useCallback(async () => {
    setVersionsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50', offset: String(versionPage * 50) })
      if (versionTypeFilter !== 'all') params.set('class_type', versionTypeFilter)
      const res = await authFetch(`/api/analysis/class-versions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.items || [])
        setVersionsTotal(data.total || 0)
      }
    } catch (err) { console.error('Failed to fetch versions:', err) }
    finally { setVersionsLoading(false) }
  }, [versionTypeFilter, versionPage])

  const fetchRetrainStatus = useCallback(async () => {
    try {
      const res = await authFetch('/api/analysis/bulk-retrain-status')
      if (res.ok) setRetrainStatus(await res.json())
    } catch (err) { console.error('Failed to fetch retrain status:', err) }
  }, [])

  useEffect(() => {
    if (activeTab === 'formats') fetchFormats()
    else if (activeTab === 'hooks') fetchHooks()
    else if (activeTab === 'tactics') fetchTactics()
    else if (activeTab === 'history') fetchVersions()
  }, [activeTab, fetchFormats, fetchHooks, fetchTactics, fetchVersions])

  useEffect(() => {
    if (retrainStatus?.running) {
      retrainPollingRef.current = setInterval(fetchRetrainStatus, 2000)
    } else {
      if (retrainPollingRef.current) { clearInterval(retrainPollingRef.current); retrainPollingRef.current = null }
    }
    return () => { if (retrainPollingRef.current) { clearInterval(retrainPollingRef.current); retrainPollingRef.current = null } }
  }, [retrainStatus?.running, fetchRetrainStatus])

  useEffect(() => {
    if (retrainStatus && !retrainStatus.running && retrainStatus.completed > 0) {
      if (activeTab === 'formats') fetchFormats()
      else if (activeTab === 'hooks') fetchHooks()
    }
  }, [retrainStatus?.running]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRetrainStatus() }, [fetchRetrainStatus])

  // === Actions ===

  const handleCancelRetrain = async () => {
    try {
      const res = await authFetch('/api/analysis/bulk-retrain-cancel', { method: 'POST' })
      if (res.ok) { toast.success('Retrain cancelled'); fetchRetrainStatus() }
      else toast.error('Failed to cancel retrain')
    } catch { toast.error('Failed to cancel retrain') }
  }

  const toggleExpanded = (key: string) => {
    setExpandedIds(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next })
  }

  // Format actions
  const toggleFormatSelect = (id: number) => {
    setSelectedFormats(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const filteredFormats = formats.filter(f => {
    if (!formatSearch) return true
    const q = formatSearch.toLowerCase()
    return f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
  })

  const staleFormatsList = filteredFormats.filter(f => f.is_stale || !f.class_analysis)
  const staleFormatCount = staleFormatsList.length
  const staleFormatIds = staleFormatsList.map(f => f.id)

  const selectAllStaleFormats = () => {
    setSelectedFormats(new Set(staleFormatIds))
  }

  const startRetrainFormats = async (ids: number[]) => {
    if (ids.length === 0) return
    try {
      const items = ids.map(id => ({ type: 'format' as const, id }))
      const res = await authFetch('/api/analysis/bulk-retrain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      toast.success(`Started retraining ${ids.length} format(s)`)
      setSelectedFormats(new Set())
      fetchRetrainStatus()
    } catch { toast.error('Failed to start retrain') }
  }

  // Hook actions
  const toggleHookSelect = (id: number) => {
    setSelectedHooks(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const filteredHooks = hooks.filter(h => {
    if (!hookSearch) return true
    const q = hookSearch.toLowerCase()
    return h.name.toLowerCase().includes(q) || (h.description && h.description.toLowerCase().includes(q)) || (h.hook_technique && h.hook_technique.toLowerCase().includes(q))
  })

  const staleHooksList = filteredHooks.filter(h => h.is_stale || !h.class_analysis)
  const staleHookCount = staleHooksList.length
  const staleHookIds = staleHooksList.map(h => h.id)

  const selectAllStaleHooks = () => {
    setSelectedHooks(new Set(staleHookIds))
  }

  const startRetrainHooks = async (ids: number[]) => {
    if (ids.length === 0) return
    try {
      const items = ids.map(id => ({ type: 'hook' as const, id }))
      const res = await authFetch('/api/analysis/bulk-retrain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      toast.success(`Started retraining ${ids.length} hook(s)`)
      setSelectedHooks(new Set())
      fetchRetrainStatus()
    } catch { toast.error('Failed to start retrain') }
  }

  // Tactic actions
  const startEditTactic = (tactic: TacticItem) => {
    setEditingTactic(tactic.id)
    setEditForm({ name: tactic.name, category: tactic.category, description: tactic.description || '' })
  }

  const saveTactic = async (id: number) => {
    setSavingTactic(true)
    try {
      const res = await authFetch(`/api/analysis/tactics/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed to save'); return }
      toast.success('Tactic updated')
      setEditingTactic(null)
      fetchTactics()
    } catch { toast.error('Failed to save tactic') }
    finally { setSavingTactic(false) }
  }

  const mergeTactic = async (fromId: number, intoId: number) => {
    try {
      const res = await authFetch(`/api/analysis/tactics/${fromId}/merge`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge_into_id: intoId }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed to merge'); return }
      toast.success('Tactics merged')
      setMergingTactic(null); setMergeTarget(null)
      fetchTactics()
    } catch { toast.error('Failed to merge') }
  }

  const recomputeAllStats = async () => {
    setRecomputingStats(true)
    try {
      const res = await authFetch('/api/analysis/tactics/recompute-stats', { method: 'POST' })
      if (!res.ok) { toast.error('Failed to recompute'); return }
      toast.success('All tactic stats recomputed')
      fetchTactics()
    } catch { toast.error('Failed') }
    finally { setRecomputingStats(false) }
  }

  const filteredTactics = tactics.filter(tactic => {
    const matchesSearch = !tacticSearch ||
      tactic.name.toLowerCase().includes(tacticSearch.toLowerCase()) ||
      (tactic.description && tactic.description.toLowerCase().includes(tacticSearch.toLowerCase())) ||
      tactic.name_normalized.toLowerCase().includes(tacticSearch.toLowerCase())
    const matchesCategory = !tacticCategoryFilter || tactic.category === tacticCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Version history actions
  const toggleVersionExpanded = (id: number) => {
    setExpandedVersions(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const toggleSelectForCompare = (id: number) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) return [prev[1]!, id]
      return [...prev, id]
    })
  }

  const openCompareModal = () => {
    if (selectedForCompare.length !== 2) return
    const v1 = versions.find(v => v.id === selectedForCompare[0])
    const v2 = versions.find(v => v.id === selectedForCompare[1])
    if (v1 && v2) setCompareVersions([v1, v2])
  }

  const restoreVersion = async (versionId: number) => {
    if (!confirm('Restore this version? Current analysis will be snapshotted first.')) return
    setRestoringVersion(versionId)
    try {
      const res = await authFetch(`/api/analysis/class-versions/${versionId}/restore`, { method: 'POST' })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed to restore'); return }
      toast.success('Version restored')
      fetchVersions(); fetchFormats(); fetchHooks()
    } catch { toast.error('Failed to restore') }
    finally { setRestoringVersion(null) }
  }

  // === Computed Values ===

  const staleFormatsCount = formats.filter(f => f.is_stale).length
  const staleHooksCount = hooks.filter(h => h.is_stale).length

  const retrainElapsed = retrainStatus?.startedAt ? Math.floor((Date.now() - new Date(retrainStatus.startedAt).getTime()) / 1000) : 0
  const retrainElapsedStr = retrainElapsed > 0 ? `${Math.floor(retrainElapsed / 60)}m ${retrainElapsed % 60}s` : ''
  const currentlyProcessing = retrainStatus?.items ? Object.values(retrainStatus.items).find(i => i.status === 'retraining') : null
  const retrainProgress = retrainStatus && retrainStatus.total > 0 ? Math.round((retrainStatus.completed / retrainStatus.total) * 100) : 0

  const tabs = [
    { key: 'formats' as const, label: 'Formats', count: formats.length, icon: 'fa-layer-group' },
    { key: 'hooks' as const, label: 'Hooks', count: hooks.length, icon: 'fa-bolt' },
    { key: 'tactics' as const, label: 'Tactics', count: tactics.length, icon: 'fa-chess' },
    { key: 'history' as const, label: 'Version History', count: versionsTotal, icon: 'fa-clock-rotate-left' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold">Bulk Analysis Management</h1>
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase rounded">management</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Formats</div>
              <div className="text-2xl font-bold">{formats.length}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Hooks</div>
              <div className="text-2xl font-bold">{hooks.length}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Stale Formats</div>
              <div className="text-2xl font-bold text-orange-400">{staleFormatsCount}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Stale Hooks</div>
              <div className="text-2xl font-bold text-orange-400">{staleHooksCount}</div>
            </div>
          </div>
        </div>

        {/* Bulk Retrain Progress Panel */}
        {retrainStatus && (retrainStatus.running || retrainStatus.completed > 0) && (
          <div className="mb-8 rounded-xl p-[1px] bg-gradient-to-r from-pink-500 to-orange-400">
            <div className="bg-[#020617] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {retrainStatus.running
                    ? <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    : <i className="fas fa-check-circle text-emerald-400" />
                  }
                  <span className="font-bold text-sm">
                    {retrainStatus.running
                      ? `Retraining ${retrainStatus.completed}/${retrainStatus.total}`
                      : `Retrain Complete — ${retrainStatus.completed}/${retrainStatus.total} succeeded`
                    }
                  </span>
                  {retrainStatus.failed > 0 && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded">
                      {retrainStatus.failed} failed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {retrainElapsedStr && <span className="text-xs text-slate-500">{retrainElapsedStr} elapsed</span>}
                  {retrainStatus.running && (
                    <button onClick={handleCancelRetrain}
                      className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition">
                      <i className="fas fa-stop mr-1.5" />Cancel
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${retrainProgress}%` }} />
              </div>
              {retrainStatus.running && currentlyProcessing && (
                <div className="text-xs text-slate-400">
                  <i className="fas fa-gear fa-spin mr-1.5" />
                  Processing: <span className="text-white font-medium">{currentlyProcessing.name}</span>
                  <span className="text-slate-600 ml-1.5">({currentlyProcessing.type})</span>
                </div>
              )}
              {!retrainStatus.running && retrainStatus.completed > 0 && (
                <div className="text-xs text-slate-400">
                  <i className="fas fa-circle-check text-emerald-400 mr-1.5" />
                  Successfully retrained {retrainStatus.completed} classes
                  {retrainStatus.failed > 0 && (
                    <span className="text-red-400 ml-2"><i className="fas fa-circle-xmark mr-1" />{retrainStatus.failed} failed</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-white/5 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-3 text-sm font-semibold transition ${activeTab === tab.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <i className={`fas ${tab.icon} mr-2 text-xs`} />
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-black rounded ${activeTab === tab.key ? 'bg-pink-500/10 text-pink-400' : 'bg-white/5 text-slate-500'}`}>
                {tab.count}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ==================== FORMATS TAB ==================== */}
        {activeTab === 'formats' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button onClick={selectAllStaleFormats}
                className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition">
                Select All Stale ({staleFormatCount})
              </button>
              <button onClick={() => startRetrainFormats(Array.from(selectedFormats))}
                disabled={selectedFormats.size === 0 || !!retrainStatus?.running}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold text-sm rounded-lg hover:opacity-90 transition disabled:opacity-50">
                Retrain Selected ({selectedFormats.size})
              </button>
              <button onClick={() => startRetrainFormats(staleFormatIds)}
                disabled={staleFormatCount === 0 || !!retrainStatus?.running}
                className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition disabled:opacity-50">
                Retrain All Stale ({staleFormatCount})
              </button>
              <div className="ml-auto">
                <input type="text" placeholder="Search formats..." value={formatSearch}
                  onChange={(e) => setFormatSearch(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 w-64" />
              </div>
            </div>
            {formatsLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!formatsLoading && filteredFormats.length === 0 && (
              <div className="text-center py-20 text-slate-600">{formatSearch ? 'No formats match your search' : 'No formats found'}</div>
            )}
            {!formatsLoading && filteredFormats.length > 0 && (
              <div className="space-y-1">
                {filteredFormats.map(format => (
                  <div key={format.id}>
                    <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition cursor-pointer"
                      onClick={() => toggleExpanded(`format-${format.id}`)}>
                      <input type="checkbox" checked={selectedFormats.has(format.id)}
                        onChange={() => toggleFormatSelect(format.id)} onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500/20" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{format.name}</div>
                        <div className="text-xs text-slate-500 truncate">{format.description || 'No description'}</div>
                      </div>
                      <div className="text-xs text-slate-400">{formatNumber(format.video_count)} videos</div>
                      <div className="text-xs text-slate-400">{formatNumber(format.avg_views || 0)} avg views</div>
                      <div className="text-xs text-slate-500">{format.analysis_updated_at ? timeAgo(format.analysis_updated_at) : 'Never'}</div>
                      {!format.class_analysis
                        ? <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded">NOT TRAINED</span>
                        : format.is_stale
                          ? <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded">+{format.new_videos_since_retrain} NEW</span>
                          : <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded">UP TO DATE</span>
                      }
                      {format.version_count > 0 && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded">v{format.version_count}</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); startRetrainFormats([format.id]) }}
                        disabled={!!retrainStatus?.running} className="p-2 text-slate-500 hover:text-white transition disabled:opacity-50" title="Retrain">
                        <i className="fas fa-arrows-rotate" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpanded(`format-${format.id}`) }}
                        className="p-2 text-slate-500 hover:text-white transition" title="View Analysis">
                        <i className={`fas fa-chevron-${expandedIds.has(`format-${format.id}`) ? 'up' : 'down'}`} />
                      </button>
                    </div>
                    {expandedIds.has(`format-${format.id}`) && format.class_analysis && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <p className="text-sm text-slate-300 mb-3">{format.class_analysis.class_description}</p>
                        {format.class_analysis.gold_standard_tactics?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gold Standard Tactics</div>
                            <div className="flex flex-wrap gap-1.5">
                              {format.class_analysis.gold_standard_tactics.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {format.class_analysis.overrated_tactics?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Overrated Tactics</div>
                            <div className="flex flex-wrap gap-1.5">
                              {format.class_analysis.overrated_tactics.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {format.class_analysis.execution_gaps?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Execution Gaps</div>
                            <div className="flex flex-wrap gap-1.5">
                              {format.class_analysis.execution_gaps.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {format.class_analysis.blueprint && (
                          <div>
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Blueprint</div>
                            <div className="text-xs text-slate-400 space-y-1">
                              {Object.entries(format.class_analysis.blueprint).map(([key, val]) => (
                                <div key={key}><span className="text-slate-500">{key}:</span> {stringifyVal(val)}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-600">
                          Trained with {format.analysis_video_count || '?'} videos{format.analysis_updated_at && ` · ${timeAgo(format.analysis_updated_at)}`}
                        </div>
                      </div>
                    )}
                    {expandedIds.has(`format-${format.id}`) && !format.class_analysis && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <p className="text-sm text-slate-500 italic">No analysis data yet. Click retrain to generate.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== HOOKS TAB ==================== */}
        {activeTab === 'hooks' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button onClick={selectAllStaleHooks}
                className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition">
                Select All Stale ({staleHookCount})
              </button>
              <button onClick={() => startRetrainHooks(Array.from(selectedHooks))}
                disabled={selectedHooks.size === 0 || !!retrainStatus?.running}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold text-sm rounded-lg hover:opacity-90 transition disabled:opacity-50">
                Retrain Selected ({selectedHooks.size})
              </button>
              <button onClick={() => startRetrainHooks(staleHookIds)}
                disabled={staleHookCount === 0 || !!retrainStatus?.running}
                className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition disabled:opacity-50">
                Retrain All Stale ({staleHookCount})
              </button>
              <div className="ml-auto">
                <input type="text" placeholder="Search hooks..." value={hookSearch}
                  onChange={(e) => setHookSearch(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 w-64" />
              </div>
            </div>
            {hooksLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hooksLoading && filteredHooks.length === 0 && (
              <div className="text-center py-20 text-slate-600">{hookSearch ? 'No hooks match your search' : 'No hooks found'}</div>
            )}
            {!hooksLoading && filteredHooks.length > 0 && (
              <div className="space-y-1">
                {filteredHooks.map(hook => (
                  <div key={hook.id}>
                    <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition cursor-pointer"
                      onClick={() => toggleExpanded(`hook-${hook.id}`)}>
                      <input type="checkbox" checked={selectedHooks.has(hook.id)}
                        onChange={() => toggleHookSelect(hook.id)} onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500/20" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{hook.name}</div>
                        <div className="text-xs text-slate-500 truncate">{hook.description || 'No description'}</div>
                        {hook.hook_technique && <div className="text-xs text-purple-400/70 truncate mt-0.5">{hook.hook_technique}</div>}
                      </div>
                      <div className="text-xs text-slate-400">{formatNumber(hook.video_count)} videos</div>
                      <div className="text-xs text-slate-400">{formatNumber(hook.avg_views || 0)} avg views</div>
                      <div className="text-xs text-slate-500">{hook.analysis_updated_at ? timeAgo(hook.analysis_updated_at) : 'Never'}</div>
                      {!hook.class_analysis
                        ? <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded">NOT TRAINED</span>
                        : hook.is_stale
                          ? <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded">+{hook.new_videos_since_retrain} NEW</span>
                          : <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded">UP TO DATE</span>
                      }
                      {hook.version_count > 0 && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded">v{hook.version_count}</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); startRetrainHooks([hook.id]) }}
                        disabled={!!retrainStatus?.running} className="p-2 text-slate-500 hover:text-white transition disabled:opacity-50" title="Retrain">
                        <i className="fas fa-arrows-rotate" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpanded(`hook-${hook.id}`) }}
                        className="p-2 text-slate-500 hover:text-white transition" title="View Analysis">
                        <i className={`fas fa-chevron-${expandedIds.has(`hook-${hook.id}`) ? 'up' : 'down'}`} />
                      </button>
                    </div>
                    {expandedIds.has(`hook-${hook.id}`) && hook.class_analysis && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <p className="text-sm text-slate-300 mb-3">{hook.class_analysis.class_description}</p>
                        {hook.class_analysis.gold_standard_tactics?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gold Standard Tactics</div>
                            <div className="flex flex-wrap gap-1.5">
                              {hook.class_analysis.gold_standard_tactics.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {hook.class_analysis.overrated_tactics?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Overrated Tactics</div>
                            <div className="flex flex-wrap gap-1.5">
                              {hook.class_analysis.overrated_tactics.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {hook.class_analysis.execution_gaps?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Execution Gaps</div>
                            <div className="flex flex-wrap gap-1.5">
                              {hook.class_analysis.execution_gaps.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded">{tacticLabel(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {hook.class_analysis.blueprint && (
                          <div>
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Blueprint</div>
                            <div className="text-xs text-slate-400 space-y-1">
                              {Object.entries(hook.class_analysis.blueprint).map(([key, val]) => (
                                <div key={key}><span className="text-slate-500">{key}:</span> {stringifyVal(val)}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-600">
                          Trained with {hook.analysis_video_count || '?'} videos{hook.analysis_updated_at && ` · ${timeAgo(hook.analysis_updated_at)}`}
                        </div>
                      </div>
                    )}
                    {expandedIds.has(`hook-${hook.id}`) && !hook.class_analysis && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <p className="text-sm text-slate-500 italic">No analysis data yet. Click retrain to generate.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TACTICS TAB ==================== */}
        {activeTab === 'tactics' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs" />
                <input type="text" value={tacticSearch} onChange={e => setTacticSearch(e.target.value)}
                  placeholder="Search tactics..."
                  className="bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 w-64" />
              </div>
              <select value={tacticCategoryFilter} onChange={e => setTacticCategoryFilter(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50">
                <option value="">All Categories</option>
                {TACTIC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
              </select>
              <span className="text-xs text-slate-500">{filteredTactics.length} of {tactics.length} tactics</span>
              <div className="ml-auto">
                <button onClick={recomputeAllStats} disabled={recomputingStats}
                  className="px-4 py-2 bg-white/5 border border-white/5 text-white font-semibold text-sm rounded-lg hover:bg-white/10 transition disabled:opacity-40">
                  <i className="fas fa-calculator mr-1.5" />{recomputingStats ? 'Recomputing...' : 'Recompute All Stats'}
                </button>
              </div>
            </div>
            {tacticsLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-sm text-slate-400">Loading tactics...</span>
              </div>
            )}
            {!tacticsLoading && (
              <>
                <div className="grid grid-cols-[1fr_120px_80px_80px_80px_100px] gap-2 px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <div>Name / Description</div><div>Category</div><div>Videos</div><div>Avg Views</div><div>Avg Score</div><div>Actions</div>
                </div>
                <div className="space-y-1">
                  {filteredTactics.map(tactic => (
                    editingTactic === tactic.id ? (
                      <div key={tactic.id} className="grid grid-cols-[1fr_120px_80px_80px_80px_100px] gap-2 items-center px-4 py-2 bg-white/[0.07] border border-pink-500/30 rounded-xl">
                        <div>
                          <input type="text" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500/50" placeholder="Tactic name" />
                          <textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500/50 mt-1 resize-none" rows={2} placeholder="Description..." />
                        </div>
                        <select value={editForm.category} onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50">
                          {TACTIC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
                        </select>
                        <div /><div /><div />
                        <div className="flex gap-1">
                          <button onClick={() => saveTactic(tactic.id)} disabled={savingTactic}
                            className="px-2.5 py-1.5 bg-pink-500/20 text-pink-400 font-semibold text-xs rounded-lg hover:bg-pink-500/30 transition disabled:opacity-40">
                            {savingTactic ? '...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingTactic(null)}
                            className="px-2.5 py-1.5 bg-white/5 text-slate-400 font-semibold text-xs rounded-lg hover:bg-white/10 transition">Cancel</button>
                        </div>
                      </div>
                    ) : mergingTactic === tactic.id ? (
                      <div key={tactic.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.07] border border-amber-500/30 rounded-xl">
                        <i className="fas fa-code-merge text-amber-400 text-xs" />
                        <span className="text-sm font-bold">Merge &quot;{tactic.name}&quot; into:</span>
                        <select value={mergeTarget || ''} onChange={e => setMergeTarget(e.target.value ? Number(e.target.value) : null)}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500/50 flex-1 max-w-xs">
                          <option value="">Select target...</option>
                          {tactics.filter(t => t.id !== tactic.id).map(t => <option key={t.id} value={t.id}>{t.name} ({t.video_count} videos)</option>)}
                        </select>
                        <button onClick={() => mergeTarget && mergeTactic(tactic.id, mergeTarget)} disabled={!mergeTarget}
                          className="px-3 py-1.5 bg-amber-500/20 text-amber-400 font-semibold text-xs rounded-lg hover:bg-amber-500/30 transition disabled:opacity-40">Merge</button>
                        <button onClick={() => { setMergingTactic(null); setMergeTarget(null) }}
                          className="px-3 py-1.5 bg-white/5 text-slate-400 font-semibold text-xs rounded-lg hover:bg-white/10 transition">Cancel</button>
                      </div>
                    ) : (
                      <div key={tactic.id} className="grid grid-cols-[1fr_120px_80px_80px_80px_100px] gap-2 items-center px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{tactic.name}</div>
                          <div className="text-xs text-slate-500 truncate">{tactic.description || 'No description'}</div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded truncate ${TACTIC_CATEGORY_COLORS[tactic.category] || 'bg-white/10 text-slate-400'}`}>
                          {tactic.category.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs text-slate-400">{tactic.video_count}</div>
                        <div className="text-xs text-slate-400">{formatNumber(tactic.avg_views_when_present || 0)}</div>
                        <div className="text-xs text-slate-400">{Math.round(tactic.avg_execution_score || 0)}</div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditTactic(tactic)} title="Edit"
                            className="p-2 text-slate-500 hover:text-white transition rounded-lg hover:bg-white/10"><i className="fas fa-pen text-xs" /></button>
                          <button onClick={() => { setMergingTactic(tactic.id); setMergeTarget(null) }} title="Merge"
                            className="p-2 text-slate-500 hover:text-white transition rounded-lg hover:bg-white/10"><i className="fas fa-code-merge text-xs" /></button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {filteredTactics.length === 0 && (
                  <div className="text-center py-12 text-slate-600">
                    <i className="fas fa-chess text-3xl mb-3 block opacity-30" />
                    <div className="text-sm">{tacticSearch || tacticCategoryFilter ? 'No tactics match your filters' : 'No tactics found'}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== VERSION HISTORY TAB ==================== */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex bg-white/5 rounded-lg p-0.5">
                {(['all', 'format', 'hook'] as const).map(type => (
                  <button key={type} onClick={() => { setVersionTypeFilter(type); setVersionPage(0) }}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${versionTypeFilter === type ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {type === 'all' ? 'All' : type === 'format' ? 'Formats' : 'Hooks'}
                  </button>
                ))}
              </div>
              {selectedForCompare.length === 2 && (
                <button onClick={openCompareModal}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold text-sm rounded-lg hover:opacity-90 transition">
                  <i className="fas fa-code-compare mr-1.5" />Compare Selected
                </button>
              )}
              {selectedForCompare.length > 0 && (
                <button onClick={() => setSelectedForCompare([])}
                  className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition">
                  Clear Selection ({selectedForCompare.length})
                </button>
              )}
              <div className="ml-auto text-xs text-slate-500">{versionsTotal} version{versionsTotal !== 1 ? 's' : ''} total</div>
            </div>
            {versionsLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!versionsLoading && versions.length > 0 && (
              <div className="space-y-1">
                {versions.map(version => (
                  <div key={version.id}>
                    <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition">
                      <input type="checkbox" checked={selectedForCompare.includes(version.id)}
                        onChange={() => toggleSelectForCompare(version.id)}
                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500/20" />
                      <span className={version.class_type === 'format'
                        ? 'px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded uppercase'
                        : 'px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded uppercase'}>
                        {version.class_type}
                      </span>
                      <div className="font-semibold text-sm min-w-[180px] truncate">{version.class_name || `ID: ${version.class_id}`}</div>
                      <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-[10px] font-black rounded">v{version.version_number}</span>
                      <div className="text-xs text-slate-500">{version.video_count_at_time} videos</div>
                      {version.model_used && (
                        <span className="px-2 py-0.5 bg-white/5 text-slate-600 text-[10px] font-black rounded truncate max-w-[120px]">{version.model_used}</span>
                      )}
                      <span className={version.triggered_by === 'bulk'
                        ? 'px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-black rounded'
                        : 'px-2 py-0.5 bg-slate-500/10 text-slate-400 text-[10px] font-black rounded'}>
                        {version.triggered_by}
                      </span>
                      {version.notes && <div className="text-xs text-slate-600 italic truncate max-w-[200px]" title={version.notes}>{version.notes}</div>}
                      <div className="text-xs text-slate-500 ml-auto whitespace-nowrap">{timeAgo(version.created_at)}</div>
                      <button onClick={() => toggleVersionExpanded(version.id)} className="p-2 text-slate-500 hover:text-white transition" title="View">
                        <i className={`fas fa-chevron-${expandedVersions.has(version.id) ? 'up' : 'down'} text-xs`} />
                      </button>
                      <button onClick={() => restoreVersion(version.id)} disabled={restoringVersion === version.id}
                        className="p-2 text-slate-500 hover:text-pink-400 transition disabled:opacity-50" title="Restore">
                        {restoringVersion === version.id
                          ? <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                          : <i className="fas fa-rotate-left text-xs" />}
                      </button>
                    </div>
                    {expandedVersions.has(version.id) && version.analysis_json && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <VersionAnalysisDisplay analysis={version.analysis_json} />
                        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-600">
                          {version.video_count_at_time} videos at time of snapshot{version.model_used && ` · ${version.model_used}`} · {timeAgo(version.created_at)}
                        </div>
                      </div>
                    )}
                    {expandedVersions.has(version.id) && !version.analysis_json && (
                      <div className="ml-8 mt-1 mb-2 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <p className="text-sm text-slate-500 italic">No analysis data in this version snapshot.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {versionsTotal > 50 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setVersionPage(p => Math.max(0, p - 1))} disabled={versionPage === 0}
                  className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition disabled:opacity-30">
                  <i className="fas fa-chevron-left mr-1.5 text-xs" />Previous
                </button>
                <span className="text-sm text-slate-500">Page {versionPage + 1} of {Math.ceil(versionsTotal / 50)}</span>
                <button onClick={() => setVersionPage(p => p + 1)} disabled={(versionPage + 1) * 50 >= versionsTotal}
                  className="px-3 py-1.5 bg-white/5 text-slate-300 font-semibold text-sm rounded-lg hover:bg-white/10 transition disabled:opacity-30">
                  Next<i className="fas fa-chevron-right ml-1.5 text-xs" />
                </button>
              </div>
            )}
            {!versionsLoading && versions.length === 0 && (
              <div className="text-center py-20 text-slate-600">
                <i className="fas fa-clock-rotate-left text-3xl mb-3 block opacity-30" />
                <p>No version history yet.</p>
                <p className="text-sm mt-1">Retrain a format or hook to create the first version snapshot.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== VERSION COMPARE MODAL ==================== */}
        {compareVersions && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={() => setCompareVersions(null)}>
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-code-compare text-pink-400" />
                  <h2 className="text-lg font-bold">Version Comparison</h2>
                </div>
                <button onClick={() => setCompareVersions(null)} className="p-2 text-slate-500 hover:text-white transition">
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {compareVersions.map((v, idx) => (
                  <div key={idx}>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                      <span className={v.class_type === 'format' ? 'text-blue-400' : 'text-purple-400'}>{v.class_type}</span>
                      {' · '}<span className="text-white">{v.class_name || `ID: ${v.class_id}`}</span>
                      {' · '}v{v.version_number}{' · '}{timeAgo(v.created_at)}{' · '}{v.video_count_at_time} videos
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                      <VersionAnalysisDisplay analysis={v.analysis_json} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
