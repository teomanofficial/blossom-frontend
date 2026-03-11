import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

interface EntityInfo {
  id: number
  name: string
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  description: string | null
  created_at: string
}

interface DuplicatePair {
  primary: EntityInfo
  duplicate: EntityInfo
  similarity: number
}

interface MergeLogEntry {
  id: number
  merge_type: 'format' | 'hook' | 'tactic'
  primary_id: number
  primary_name: string
  duplicate_id: number
  duplicate_name: string
  similarity_score: number | null
  videos_transferred: number
  analyses_updated: number
  merge_reason: string
  created_at: string
}

type TabType = 'format' | 'hook' | 'tactic' | 'history'

export default function DuplicateManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('format')
  const [threshold, setThreshold] = useState(0.5)
  const [pairs, setPairs] = useState<DuplicatePair[]>([])
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Bulk merge
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkMerging, setBulkMerging] = useState(false)

  // Merge history
  const [logs, setLogs] = useState<MergeLogEntry[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(false)

  const pairKey = (p: DuplicatePair) => `${p.primary.id}-${p.duplicate.id}`

  const detectDuplicates = useCallback(async () => {
    if (activeTab === 'history') return
    setLoading(true)
    setPairs([])
    setDismissed(new Set())
    setSelected(new Set())
    try {
      const res = await authFetch(`/api/analysis/duplicates/${activeTab}?threshold=${threshold}&limit=100`)
      if (!res.ok) throw new Error((await res.json()).error || 'Detection failed')
      const data = await res.json()
      setPairs(data.pairs || [])
      if (data.pairs.length === 0) toast('No duplicates found at this threshold', { icon: '✓' })
    } catch (err: any) {
      toast.error(err.message || 'Detection failed')
    } finally {
      setLoading(false)
    }
  }, [activeTab, threshold])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await authFetch(`/api/analysis/duplicates/merge-log?limit=100`)
      if (!res.ok) throw new Error('Failed to fetch merge log')
      const data = await res.json()
      setLogs(data.logs || [])
      setLogsTotal(data.total || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') fetchLogs()
  }, [activeTab, fetchLogs])

  const handleMerge = async (pair: DuplicatePair) => {
    const key = pairKey(pair)
    setMerging(key)
    try {
      const res = await authFetch('/api/analysis/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          primary_id: pair.primary.id,
          duplicate_id: pair.duplicate.id,
          similarity_score: pair.similarity,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Merge failed')
      const data = await res.json()
      toast.success(`Merged "${pair.duplicate.name}" → "${pair.primary.name}" (${data.videosTransferred} videos transferred)`)
      setPairs(prev => prev.filter(p => pairKey(p) !== key))
      setSelected(prev => { const next = new Set(prev); next.delete(key); return next })
    } catch (err: any) {
      toast.error(err.message || 'Merge failed')
    } finally {
      setMerging(null)
    }
  }

  const handleBulkMerge = async () => {
    if (selected.size === 0) return
    setBulkMerging(true)
    const merges = pairs
      .filter(p => selected.has(pairKey(p)))
      .map(p => ({
        type: activeTab,
        primary_id: p.primary.id,
        duplicate_id: p.duplicate.id,
        similarity_score: p.similarity,
      }))

    try {
      const res = await authFetch('/api/analysis/duplicates/bulk-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merges }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Bulk merge failed')
      const data = await res.json()
      toast.success(`Bulk merge: ${data.succeeded} succeeded, ${data.failed} failed`)

      // Remove successfully merged pairs
      const succeededKeys = new Set(
        data.results
          .filter((r: any) => r.success)
          .map((r: any) => `${r.primary_id}-${r.duplicate_id}`)
      )
      setPairs(prev => prev.filter(p => !succeededKeys.has(pairKey(p))))
      setSelected(new Set())
    } catch (err: any) {
      toast.error(err.message || 'Bulk merge failed')
    } finally {
      setBulkMerging(false)
    }
  }

  const handleDismiss = (pair: DuplicatePair) => {
    const key = pairKey(pair)
    setDismissed(prev => new Set(prev).add(key))
    setSelected(prev => { const next = new Set(prev); next.delete(key); return next })
  }

  const toggleSelect = (pair: DuplicatePair) => {
    const key = pairKey(pair)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    const visible = visiblePairs.map(pairKey)
    setSelected(new Set(visible))
  }

  const visiblePairs = pairs.filter(p => !dismissed.has(pairKey(p)))

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'format', label: 'Formats', icon: 'fa-shapes' },
    { key: 'hook', label: 'Hooks', icon: 'fa-comment-dots' },
    { key: 'tactic', label: 'Tactics', icon: 'fa-chess' },
    { key: 'history', label: 'Merge History', icon: 'fa-clock-rotate-left' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Duplicate Detection</h1>
          <p className="text-sm text-slate-400 mt-1">Detect and merge duplicate formats, hooks, and tactics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPairs([]); setDismissed(new Set()); setSelected(new Set()) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'history' ? (
        <>
          {/* Controls */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Similarity threshold:</label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-32 accent-indigo-500"
              />
              <span className="text-sm font-mono text-indigo-300 min-w-[3ch]">{(threshold * 100).toFixed(0)}%</span>
            </div>

            <button
              onClick={detectDuplicates}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Detecting...</>
              ) : (
                <><i className="fa-solid fa-magnifying-glass" /> Detect Duplicates</>
              )}
            </button>

            {visiblePairs.length > 0 && (
              <>
                <div className="h-6 w-px bg-white/10" />
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-all"
                >
                  Select all ({visiblePairs.length})
                </button>
                {selected.size > 0 && (
                  <button
                    onClick={handleBulkMerge}
                    disabled={bulkMerging}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-medium border border-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {bulkMerging ? (
                      <><i className="fa-solid fa-spinner fa-spin" /> Merging {selected.size}...</>
                    ) : (
                      <><i className="fa-solid fa-code-merge" /> Merge selected ({selected.size})</>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Results */}
          {visiblePairs.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Found {pairs.length} potential duplicate pair{pairs.length !== 1 ? 's' : ''}
                {dismissed.size > 0 && ` (${dismissed.size} dismissed)`}
              </p>
              {visiblePairs.map(pair => (
                <DuplicatePairCard
                  key={pairKey(pair)}
                  pair={pair}
                  isSelected={selected.has(pairKey(pair))}
                  isMerging={merging === pairKey(pair)}
                  onToggleSelect={() => toggleSelect(pair)}
                  onMerge={() => handleMerge(pair)}
                  onDismiss={() => handleDismiss(pair)}
                />
              ))}
            </div>
          )}

          {!loading && pairs.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <i className="fa-solid fa-code-merge text-4xl mb-4 block opacity-30" />
              <p>Click "Detect Duplicates" to find similar {activeTab}s</p>
              <p className="text-xs mt-1">Adjust the threshold to control sensitivity</p>
            </div>
          )}
        </>
      ) : (
        /* Merge History */
        <MergeHistory logs={logs} total={logsTotal} loading={logsLoading} />
      )}
    </div>
  )
}

// ============ DUPLICATE PAIR CARD ============

function DuplicatePairCard({
  pair, isSelected, isMerging, onToggleSelect, onMerge, onDismiss,
}: {
  pair: DuplicatePair
  isSelected: boolean
  isMerging: boolean
  onToggleSelect: () => void
  onMerge: () => void
  onDismiss: () => void
}) {
  const simPct = (pair.similarity * 100).toFixed(0)
  const simColor = pair.similarity > 0.8 ? 'text-red-400 bg-red-500/20 border-red-500/30'
    : pair.similarity > 0.6 ? 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    : 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'

  return (
    <div className={`bg-white/5 rounded-2xl border transition-all ${
      isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10'
    }`}>
      <div className="p-4">
        {/* Top row: checkbox + similarity badge */}
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30"
            />
            <span className="text-xs text-slate-500">Select for bulk merge</span>
          </label>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${simColor}`}>
            {simPct}% similar
          </span>
        </div>

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EntityCard entity={pair.primary} label="Primary (keep)" color="emerald" />
          <EntityCard entity={pair.duplicate} label="Duplicate (merge into primary)" color="red" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              if (confirm(`Merge "${pair.duplicate.name}" into "${pair.primary.name}"? This will transfer ${pair.duplicate.video_count} videos and delete the duplicate.`)) {
                onMerge()
              }
            }}
            disabled={isMerging}
            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isMerging ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Merging...</>
            ) : (
              <><i className="fa-solid fa-code-merge" /> Merge</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ ENTITY CARD ============

function EntityCard({ entity, label, color }: { entity: EntityInfo; label: string; color: 'emerald' | 'red' }) {
  const borderClass = color === 'emerald' ? 'border-emerald-500/30' : 'border-red-500/30'
  const labelClass = color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'

  return (
    <div className={`rounded-xl bg-black/20 border ${borderClass} p-3`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-white truncate flex-1" title={entity.name}>{entity.name}</h3>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${labelClass} whitespace-nowrap`}>
          {label.split(' ')[0]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-500">Videos</div>
          <div className="text-sm font-bold text-white">{entity.video_count}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Avg Views</div>
          <div className="text-sm font-bold text-white">{formatNumber(entity.avg_views)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Eng. Rate</div>
          <div className="text-sm font-bold text-white">{(entity.avg_engagement_rate * 100).toFixed(1)}%</div>
        </div>
      </div>
      {entity.description && (
        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{entity.description}</p>
      )}
    </div>
  )
}

// ============ MERGE HISTORY ============

function MergeHistory({ logs, total, loading }: { logs: MergeLogEntry[]; total: number; loading: boolean }) {
  const typeColors: Record<string, string> = {
    format: 'text-indigo-300 bg-indigo-500/20',
    hook: 'text-cyan-300 bg-cyan-500/20',
    tactic: 'text-amber-300 bg-amber-500/20',
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-500">
        <i className="fa-solid fa-spinner fa-spin text-2xl mb-3 block" />
        Loading merge history...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <i className="fa-solid fa-clock-rotate-left text-4xl mb-4 block opacity-30" />
        <p>No merges performed yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">{total} total merge{total !== 1 ? 's' : ''}</p>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-400">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Duplicate</th>
              <th className="px-4 py-3 font-medium">Merged Into</th>
              <th className="px-4 py-3 font-medium text-right">Similarity</th>
              <th className="px-4 py-3 font-medium text-right">Videos</th>
              <th className="px-4 py-3 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[log.merge_type] || 'text-slate-300 bg-white/10'}`}>
                    {log.merge_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-red-300 line-through opacity-70">{log.duplicate_name}</td>
                <td className="px-4 py-2.5 text-emerald-300">{log.primary_name}</td>
                <td className="px-4 py-2.5 text-right text-slate-400">
                  {log.similarity_score != null ? `${(log.similarity_score * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-white">{log.videos_transferred}</td>
                <td className="px-4 py-2.5 text-right text-slate-500 text-xs">
                  {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============ HELPERS ============

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Math.round(n).toString()
}
