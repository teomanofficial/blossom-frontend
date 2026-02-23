import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

interface ModelConfig {
  id: number
  model_name: string
  display_name: string
  provider: string
  is_default: boolean
  is_enabled: boolean
  temperature: number
  top_p: number
  max_output_tokens: number
  cost_per_1m_input: number
  cost_per_1m_output: number
  notes: string | null
  created_at: string
  updated_at: string
}

interface OperationOverride {
  operation: string
  model_name: string
  updated_at: string
}

interface AvailableModel {
  model_name: string
  display_name: string
}

interface CostStat {
  model: string
  total_requests: string
  total_input_tokens: string
  total_output_tokens: string
  total_tokens: string
  total_cost_usd: string
  avg_duration_ms: number
  avg_cost_per_request: string
}

interface OperationStat {
  model: string
  operation: string
  request_count: string
  avg_duration_ms: number
  total_cost_usd: string
}

interface DailyCost {
  date: string
  model: string
  requests: string
  cost_usd: string
}

interface QualityStat {
  model_used: string
  analysis_type: string
  analysis_count: string
  avg_tokens: string
  avg_duration_ms: number
  avg_virality_score: string | null
}

interface RecentAnalysis {
  id: number
  video_id: number
  analysis_type: string
  model_used: string
  tokens_used: number
  analysis_duration_ms: number
  analysis_json: any
  created_at: string
  caption: string | null
  platform: string
  views: number
  thumbnail_url: string | null
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function formatCost(n: number): string {
  if (n < 0.01) return '<$0.01'
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toFixed(2)}`
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
  return `${days}d ago`
}

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  full: 'Full Analysis',
  hook: 'Hook Analysis',
  virality: 'Virality Scores',
}

const MODEL_COLORS: Record<string, string> = {
  'gemini-2.0-flash': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'gemini-2.5-flash': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'gemini-2.5-pro': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const MODEL_CHART_COLORS: Record<string, { bar: string; text: string; ring: string }> = {
  'gemini-2.0-flash': { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  'gemini-2.5-flash': { bar: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  'gemini-2.5-pro': { bar: 'bg-purple-500', text: 'text-purple-400', ring: 'ring-purple-500/30' },
}

function getModelChartColor(model: string) {
  return MODEL_CHART_COLORS[model] || { bar: 'bg-slate-500', text: 'text-slate-400', ring: 'ring-slate-500/30' }
}

function getModelColor(model: string): string {
  return MODEL_COLORS[model] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export default function AIModelLab() {
  const [activeTab, setActiveTab] = useState<'config' | 'analytics' | 'results'>('config')
  const [models, setModels] = useState<ModelConfig[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [costStats, setCostStats] = useState<CostStat[]>([])
  const [operationStats, setOperationStats] = useState<OperationStat[]>([])
  const [dailyCost, setDailyCost] = useState<DailyCost[]>([])
  const [qualityStats, setQualityStats] = useState<QualityStat[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null)
  const [showAddModel, setShowAddModel] = useState(false)
  const [newModel, setNewModel] = useState({ model_name: '', display_name: '', provider: 'gemini', cost_per_1m_input: '', cost_per_1m_output: '', notes: '' })
  const [operationOverrides, setOperationOverrides] = useState<OperationOverride[]>([])
  const [knownOperations, setKnownOperations] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [defaultModelName, setDefaultModelName] = useState('')
  const [overridesLoading, setOverridesLoading] = useState(false)
  const [savingOperation, setSavingOperation] = useState<string | null>(null)

  const fetchModels = async () => {
    setModelsLoading(true)
    try {
      const res = await authFetch('/api/admin/model-config')
      const data = await res.json()
      setModels(data.models || [])
    } catch {
      toast.error('Failed to load models')
    } finally {
      setModelsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await authFetch(`/api/admin/model-analytics?days=${analyticsDays}`)
      const data = await res.json()
      setCostStats(data.costStats || [])
      setOperationStats(data.operationStats || [])
      setDailyCost(data.dailyCost || [])
      setQualityStats(data.qualityStats || [])
      setRecentAnalyses(data.recentAnalyses || [])
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => { fetchModels() }, [])
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'results') fetchAnalytics()
  }, [activeTab, analyticsDays])

  const setDefault = async (id: number) => {
    try {
      await authFetch(`/api/admin/model-config/${id}/default`, { method: 'PUT' })
      toast.success('Default model updated')
      fetchModels()
    } catch {
      toast.error('Failed to set default')
    }
  }

  const toggleEnabled = async (id: number, currentEnabled: boolean) => {
    try {
      await authFetch(`/api/admin/model-config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !currentEnabled }),
      })
      fetchModels()
    } catch {
      toast.error('Failed to toggle model')
    }
  }

  const deleteModel = async (id: number) => {
    if (!confirm('Remove this model configuration?')) return
    try {
      const res = await authFetch(`/api/admin/model-config/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success('Model removed')
      fetchModels()
    } catch {
      toast.error('Failed to delete model')
    }
  }

  const addModel = async () => {
    if (!newModel.model_name || !newModel.display_name) { toast.error('Name required'); return }
    try {
      await authFetch('/api/admin/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newModel,
          cost_per_1m_input: parseFloat(newModel.cost_per_1m_input) || 0,
          cost_per_1m_output: parseFloat(newModel.cost_per_1m_output) || 0,
        }),
      })
      toast.success('Model added')
      setShowAddModel(false)
      setNewModel({ model_name: '', display_name: '', provider: 'gemini', cost_per_1m_input: '', cost_per_1m_output: '', notes: '' })
      fetchModels()
    } catch {
      toast.error('Failed to add model')
    }
  }

  const fetchOperationOverrides = async () => {
    setOverridesLoading(true)
    try {
      const res = await authFetch('/api/admin/operation-model-overrides')
      const data = await res.json()
      setOperationOverrides(data.overrides || [])
      setKnownOperations(data.operations || [])
      setAvailableModels(data.availableModels || [])
      setDefaultModelName(data.defaultModel || '')
    } catch {
      toast.error('Failed to load operation overrides')
    } finally {
      setOverridesLoading(false)
    }
  }

  const updateOperationModel = async (operation: string, modelName: string) => {
    setSavingOperation(operation)
    // Optimistic update
    const prevOverrides = operationOverrides
    if (modelName === '') {
      setOperationOverrides(prev => prev.filter(o => o.operation !== operation))
    } else {
      setOperationOverrides(prev => {
        const exists = prev.find(o => o.operation === operation)
        if (exists) return prev.map(o => o.operation === operation ? { ...o, model_name: modelName } : o)
        return [...prev, { operation, model_name: modelName, updated_at: new Date().toISOString() }]
      })
    }
    try {
      if (modelName === '') {
        await authFetch(`/api/admin/operation-model-overrides/${encodeURIComponent(operation)}`, { method: 'DELETE' })
        toast.success(`${operation} reset to default`)
      } else {
        await authFetch('/api/admin/operation-model-overrides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation, model_name: modelName }),
        })
        toast.success(`${operation} → ${modelName}`)
      }
    } catch {
      // Rollback on error
      setOperationOverrides(prevOverrides)
      toast.error('Failed to update operation model')
    } finally {
      setSavingOperation(null)
    }
  }

  useEffect(() => {
    if (activeTab === 'config') fetchOperationOverrides()
  }, [activeTab])

  const tabs = [
    { key: 'config' as const, label: 'Model Config', icon: 'fa-sliders' },
    { key: 'analytics' as const, label: 'Cost & Performance', icon: 'fa-chart-bar' },
    { key: 'results' as const, label: 'Analysis Results', icon: 'fa-flask' },
  ]

  const totalCost = costStats.reduce((s, c) => s + parseFloat(c.total_cost_usd || '0'), 0)
  const totalRequests = costStats.reduce((s, c) => s + parseInt(c.total_requests || '0'), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">AI Model Lab</h1>
          <p className="text-sm text-slate-400 mt-1">Manage Gemini models, compare performance, and analyze costs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-2xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-pink-500/20 via-orange-400/20 to-yellow-400/20 text-white border border-pink-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <i className={`fas ${tab.icon} text-xs`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════ CONFIG TAB ═══════════ */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Active model banner */}
          {models.filter(m => m.is_default).map(m => (
            <div key={m.id} className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <i className="fas fa-check-circle text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Model</div>
                  <div className="text-lg font-bold">{m.display_name}</div>
                  <div className="text-xs text-slate-400 font-mono">{m.model_name}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-slate-400">Cost per 1M tokens</div>
                  <div className="text-sm font-bold text-slate-300">
                    In: ${parseFloat(String(m.cost_per_1m_input)).toFixed(2)} / Out: ${parseFloat(String(m.cost_per_1m_output)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Model cards */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Available Models</h2>
            <button
              onClick={() => setShowAddModel(!showAddModel)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-colors"
            >
              <i className="fas fa-plus mr-1.5" />Add Model
            </button>
          </div>

          {/* Add model form */}
          {showAddModel && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model ID</label>
                  <input
                    value={newModel.model_name}
                    onChange={e => setNewModel({ ...newModel, model_name: e.target.value })}
                    placeholder="gemini-2.5-flash-lite"
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-pink-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                  <input
                    value={newModel.display_name}
                    onChange={e => setNewModel({ ...newModel, display_name: e.target.value })}
                    placeholder="Gemini 2.5 Flash Lite"
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-pink-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Cost / 1M tokens</label>
                  <input
                    value={newModel.cost_per_1m_input}
                    onChange={e => setNewModel({ ...newModel, cost_per_1m_input: e.target.value })}
                    placeholder="0.15"
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-pink-500/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Cost / 1M tokens</label>
                  <input
                    value={newModel.cost_per_1m_output}
                    onChange={e => setNewModel({ ...newModel, cost_per_1m_output: e.target.value })}
                    placeholder="0.60"
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-pink-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                <input
                  value={newModel.notes}
                  onChange={e => setNewModel({ ...newModel, notes: e.target.value })}
                  placeholder="Optional notes about this model"
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-pink-500/40"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={addModel} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-sm font-bold transition-colors">
                  Add Model
                </button>
                <button onClick={() => setShowAddModel(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {modelsLoading ? (
            <div className="text-center py-12 text-slate-500">Loading models...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {models.map(m => (
                <div
                  key={m.id}
                  className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                    m.is_default ? 'border-emerald-500/30' : m.is_enabled ? 'border-white/10' : 'border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{m.display_name}</span>
                        {m.is_default && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase">Default</span>
                        )}
                        {!m.is_enabled && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-full uppercase">Disabled</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{m.model_name}</div>
                      {m.notes && <p className="text-xs text-slate-400 mt-1">{m.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="text-[10px] text-slate-500">Input / Output (1M)</div>
                        <div className="text-sm font-bold font-mono text-slate-300">
                          ${parseFloat(String(m.cost_per_1m_input)).toFixed(2)} / ${parseFloat(String(m.cost_per_1m_output)).toFixed(2)}
                        </div>
                      </div>
                      {!m.is_default && (
                        <button
                          onClick={() => setDefault(m.id)}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => toggleEnabled(m.id, m.is_enabled)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          m.is_enabled
                            ? 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {m.is_enabled ? 'Disable' : 'Enable'}
                      </button>
                      {!m.is_default && (
                        <button
                          onClick={() => deleteModel(m.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors"
                        >
                          <i className="fas fa-trash text-[10px]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Operation model assignments */}
          <div className="mt-6">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Operation Model Assignments</h2>
            <p className="text-xs text-slate-500 mb-3">
              Override which model is used for each operation. Operations without an override use the default model.
            </p>
            {overridesLoading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Loading operations...</div>
            ) : knownOperations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No operations found yet. Run some analyses first.</div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {knownOperations.map(op => {
                      const override = operationOverrides.find(o => o.operation === op)
                      const currentModel = override?.model_name || ''
                      return (
                        <tr key={op} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2.5 text-slate-300 text-xs font-mono">{op}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={currentModel}
                              onChange={e => updateOperationModel(op, e.target.value)}
                              className={`w-full max-w-[260px] px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:border-pink-500/40 ${
                                override
                                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                  : 'bg-white/5 border-white/10 text-slate-400'
                              }`}
                            >
                              <option value="">Default ({defaultModelName})</option>
                              {availableModels.map(m => (
                                <option key={m.model_name} value={m.model_name}>{m.display_name} ({m.model_name})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {savingOperation === op ? (
                              <i className="fas fa-spinner fa-spin text-pink-400 text-xs" />
                            ) : override ? (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-full uppercase">Override</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-white/5 text-slate-500 text-[10px] font-black rounded-full uppercase">Default</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ ANALYTICS TAB ═══════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Period:</span>
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setAnalyticsDays(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  analyticsDays === d ? 'bg-pink-500/20 text-pink-400 border border-pink-500/20' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {analyticsLoading ? (
            <div className="text-center py-12 text-slate-500">Loading analytics...</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost</div>
                  <div className="text-2xl font-black mt-1">{formatCost(totalCost)}</div>
                  <div className="text-[10px] text-slate-500">last {analyticsDays} days</div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Requests</div>
                  <div className="text-2xl font-black mt-1">{formatNumber(totalRequests)}</div>
                  <div className="text-[10px] text-slate-500">last {analyticsDays} days</div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Cost/Req</div>
                  <div className="text-2xl font-black mt-1">{totalRequests > 0 ? formatCost(totalCost / totalRequests) : '--'}</div>
                  <div className="text-[10px] text-slate-500">across all models</div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Models Used</div>
                  <div className="text-2xl font-black mt-1">{costStats.length}</div>
                  <div className="text-[10px] text-slate-500">with activity</div>
                </div>
              </div>

              {/* Cost by Model */}
              {costStats.length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Cost by Model</h2>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
                    {/* Proportional bar */}
                    <div className="h-8 rounded-xl overflow-hidden flex">
                      {costStats
                        .filter(s => parseFloat(s.total_cost_usd || '0') > 0)
                        .sort((a, b) => parseFloat(b.total_cost_usd || '0') - parseFloat(a.total_cost_usd || '0'))
                        .map(stat => {
                          const cost = parseFloat(stat.total_cost_usd || '0')
                          const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0
                          const colors = getModelChartColor(stat.model)
                          return (
                            <div
                              key={stat.model}
                              className={`${colors.bar} opacity-80 hover:opacity-100 transition-opacity relative group`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                {pct >= 12 && (
                                  <span className="text-[10px] font-black text-white drop-shadow-sm">
                                    {pct.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono whitespace-nowrap z-10 pointer-events-none">
                                {stat.model}: {formatCost(cost)} ({pct.toFixed(1)}%)
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* Per-model horizontal bars */}
                    <div className="space-y-3">
                      {costStats
                        .sort((a, b) => parseFloat(b.total_cost_usd || '0') - parseFloat(a.total_cost_usd || '0'))
                        .map(stat => {
                          const cost = parseFloat(stat.total_cost_usd || '0')
                          const maxModelCost = Math.max(...costStats.map(s => parseFloat(s.total_cost_usd || '0')), 0.01)
                          const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0
                          const barPct = maxModelCost > 0 ? (cost / maxModelCost) * 100 : 0
                          const colors = getModelChartColor(stat.model)
                          const requests = parseInt(stat.total_requests || '0')
                          return (
                            <div key={stat.model} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-sm ${colors.bar}`} />
                                  <span className={`text-xs font-bold ${colors.text}`}>{stat.model}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-slate-500">{formatNumber(requests)} reqs</span>
                                  <span className="text-xs font-black">{formatCost(cost)}</span>
                                  <span className="text-[10px] text-slate-500 w-10 text-right">{pct.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${colors.bar} opacity-70 group-hover:opacity-100 transition-all`}
                                  style={{ width: `${Math.max(barPct, 1)}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Per-model breakdown */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Per-Model Breakdown</h2>
                <div className="grid grid-cols-1 gap-3">
                  {costStats.map(stat => (
                    <div key={stat.model} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getModelColor(stat.model)}`}>
                            {stat.model}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">Requests</div>
                            <div className="text-sm font-black">{formatNumber(parseInt(stat.total_requests))}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">Total Cost</div>
                            <div className="text-sm font-black">{formatCost(parseFloat(stat.total_cost_usd || '0'))}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">Avg Cost</div>
                            <div className="text-sm font-black">{formatCost(parseFloat(stat.avg_cost_per_request || '0'))}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">Avg Speed</div>
                            <div className="text-sm font-black">{(stat.avg_duration_ms / 1000).toFixed(1)}s</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">Total Tokens</div>
                            <div className="text-sm font-black">{formatNumber(parseInt(stat.total_tokens || '0'))}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {costStats.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">No data for this period</div>
                  )}
                </div>
              </div>

              {/* Operations breakdown */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Operations by Model</h2>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation</th>
                        <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requests</th>
                        <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Avg Speed</th>
                        <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationStats.map((stat, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getModelColor(stat.model)}`}>
                              {stat.model}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 text-xs font-mono">{stat.operation}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{stat.request_count}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 hidden sm:table-cell">{(stat.avg_duration_ms / 1000).toFixed(1)}s</td>
                          <td className="px-4 py-2.5 text-right font-bold">{formatCost(parseFloat(stat.total_cost_usd || '0'))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {operationStats.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">No data for this period</div>
                  )}
                </div>
              </div>

              {/* Operation Cost Trend - vertical bar chart */}
              {operationStats.length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Operation Cost Trend</h2>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 overflow-x-auto">
                    {(() => {
                      // Aggregate cost by operation across all models
                      const opCostMap = new Map<string, number>()
                      for (const stat of operationStats) {
                        const cost = parseFloat(stat.total_cost_usd || '0')
                        opCostMap.set(stat.operation, (opCostMap.get(stat.operation) || 0) + cost)
                      }
                      const sorted = Array.from(opCostMap.entries()).sort((a, b) => b[1] - a[1])
                      const maxCost = sorted.length > 0 ? sorted[0][1] : 0.01

                      const barColors = [
                        'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
                        'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
                        'bg-teal-500', 'bg-orange-500', 'bg-violet-500', 'bg-lime-500',
                        'bg-fuchsia-500', 'bg-sky-500', 'bg-red-500', 'bg-green-500'
                      ]

                      return (
                        <div className="min-w-[500px]">
                          <div className="flex items-end gap-1.5" style={{ height: 200 }}>
                            {sorted.map(([op, cost], i) => {
                              const pct = maxCost > 0 ? (cost / maxCost) * 100 : 0
                              return (
                                <div key={op} className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-0">
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono whitespace-nowrap z-10 pointer-events-none">
                                    {op}: {formatCost(cost)}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {formatCost(cost)}
                                  </div>
                                  <div
                                    className={`w-full rounded-t-md ${barColors[i % barColors.length]} opacity-70 hover:opacity-100 transition-opacity cursor-default`}
                                    style={{ height: `${Math.max(pct, 2)}%` }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex gap-1.5 mt-2 border-t border-white/5 pt-2">
                            {sorted.map(([op], i) => (
                              <div key={op} className="flex-1 min-w-0">
                                <div className="text-[8px] text-slate-500 font-mono truncate text-center" title={op}>
                                  {op.replace(/_/g, '\u200B_')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Daily cost chart (text-based) */}
              {dailyCost.length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Daily Cost Trend</h2>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 overflow-x-auto">
                    <div className="min-w-[500px]">
                      {(() => {
                        // Group by date
                        const dateMap = new Map<string, { total: number; models: Record<string, number> }>()
                        for (const d of dailyCost) {
                          const existing = dateMap.get(d.date) || { total: 0, models: {} }
                          const cost = parseFloat(d.cost_usd || '0')
                          existing.total += cost
                          existing.models[d.model] = (existing.models[d.model] || 0) + cost
                          dateMap.set(d.date, existing)
                        }
                        const entries = Array.from(dateMap.entries()).slice(-14)
                        const maxCost = Math.max(...entries.map(([, v]) => v.total), 0.01)

                        return (
                          <div className="space-y-1">
                            {entries.map(([date, data]) => (
                              <div key={date} className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500 font-mono w-20 shrink-0">
                                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden flex">
                                  {Object.entries(data.models).map(([model, cost]) => (
                                    <div
                                      key={model}
                                      className={`h-full ${
                                        model.includes('2.0') ? 'bg-emerald-500/60' :
                                        model.includes('2.5-flash') ? 'bg-blue-500/60' :
                                        model.includes('2.5-pro') ? 'bg-purple-500/60' : 'bg-slate-500/60'
                                      }`}
                                      style={{ width: `${(cost / maxCost) * 100}%` }}
                                      title={`${model}: ${formatCost(cost)}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono w-16 text-right shrink-0">
                                  {formatCost(data.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="w-3 h-3 rounded bg-emerald-500/60" /> 2.0 Flash
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="w-3 h-3 rounded bg-blue-500/60" /> 2.5 Flash
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="w-3 h-3 rounded bg-purple-500/60" /> 2.5 Pro
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════ RESULTS TAB ═══════════ */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Period:</span>
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setAnalyticsDays(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  analyticsDays === d ? 'bg-pink-500/20 text-pink-400 border border-pink-500/20' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Recent analysis results with model info. Click to expand and compare output quality across models.
          </p>

          {analyticsLoading ? (
            <div className="text-center py-12 text-slate-500">Loading results...</div>
          ) : (
            <div className="space-y-2">
              {recentAnalyses.map(a => (
                <div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedAnalysis(expandedAnalysis === a.id ? null : a.id)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    {a.thumbnail_url && (
                      <img src={a.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getModelColor(a.model_used)}`}>
                          {a.model_used}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] font-bold rounded">
                          {ANALYSIS_TYPE_LABELS[a.analysis_type] || a.analysis_type}
                        </span>
                        <span className="text-[10px] text-slate-500">{a.platform}</span>
                        {a.views > 0 && <span className="text-[10px] text-slate-500">{formatNumber(a.views)} views</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">{a.caption || 'No caption'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold">{(a.analysis_duration_ms / 1000).toFixed(1)}s</div>
                      <div className="text-[10px] text-slate-500">{formatNumber(a.tokens_used)} tok</div>
                      <div className="text-[10px] text-slate-500">{timeAgo(a.created_at)}</div>
                    </div>
                    <i className={`fas fa-chevron-${expandedAnalysis === a.id ? 'up' : 'down'} text-xs text-slate-500`} />
                  </button>

                  {expandedAnalysis === a.id && (
                    <div className="border-t border-white/5 p-4">
                      <AnalysisResultPreview analysis={a.analysis_json} type={a.analysis_type} />
                    </div>
                  )}
                </div>
              ))}
              {recentAnalyses.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">No analysis results in this period</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnalysisResultPreview({ analysis, type }: { analysis: any; type: string }) {
  if (!analysis) return <p className="text-sm text-slate-500 italic">No analysis data</p>

  if (type === 'full') {
    return (
      <div className="space-y-3">
        {analysis.format_class && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Format:</span>
            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-xs font-bold rounded">{analysis.format_class}</span>
          </div>
        )}
        {analysis.one_line_verdict && (
          <p className="text-sm text-slate-300">{analysis.one_line_verdict}</p>
        )}
        {analysis.tactics?.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Tactics ({analysis.tactics.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.tactics.slice(0, 10).map((t: any, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-bold rounded">
                  {t.name} <span className="text-slate-500">({t.execution_score})</span>
                </span>
              ))}
              {analysis.tactics.length > 10 && (
                <span className="text-[10px] text-slate-500">+{analysis.tactics.length - 10} more</span>
              )}
            </div>
          </div>
        )}
        {analysis.weaknesses?.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Weaknesses</div>
            <div className="space-y-1">
              {analysis.weaknesses.map((w: any, i: number) => (
                <p key={i} className="text-xs text-slate-400">
                  <span className="text-red-400">{w.what}</span> — {w.fix}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'hook') {
    return (
      <div className="space-y-3">
        {analysis.hook_class && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Hook:</span>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-bold rounded">{analysis.hook_class}</span>
          </div>
        )}
        {analysis.verdict && <p className="text-sm text-slate-300">{analysis.verdict}</p>}
        {analysis.first_frame && (
          <div className="text-xs text-slate-400">
            <span className="text-slate-500">First frame:</span> {analysis.first_frame.description}
            <span className="ml-2 text-amber-400">Stop power: {analysis.first_frame.scroll_stop_power}/100</span>
          </div>
        )}
        {analysis.tactics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.tactics.map((t: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-bold rounded">
                {t.name} <span className="text-slate-500">({t.execution_score})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (type === 'virality') {
    return (
      <div className="space-y-3">
        {analysis.overall_virality_score != null && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Virality Score:</span>
            <span className={`text-xl font-black ${
              analysis.overall_virality_score >= 70 ? 'text-emerald-400' :
              analysis.overall_virality_score >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>{analysis.overall_virality_score}/100</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {analysis.shareability?.score != null && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-500">Shareability</div>
              <div className="text-sm font-black">{analysis.shareability.score}</div>
            </div>
          )}
          {analysis.save_value?.score != null && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-500">Save Value</div>
              <div className="text-sm font-black">{analysis.save_value.score}</div>
            </div>
          )}
          {analysis.rewatch?.score != null && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-500">Rewatch</div>
              <div className="text-sm font-black">{analysis.rewatch.score}</div>
            </div>
          )}
          {analysis.authenticity?.score != null && (
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-500">Authenticity</div>
              <div className="text-sm font-black">{analysis.authenticity.score}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fallback: show JSON keys
  return (
    <div className="text-xs text-slate-400 font-mono">
      {Object.keys(analysis).slice(0, 10).map(key => (
        <div key={key}>
          <span className="text-slate-500">{key}:</span>{' '}
          {typeof analysis[key] === 'string' ? analysis[key].slice(0, 100) : JSON.stringify(analysis[key]).slice(0, 100)}
        </div>
      ))}
    </div>
  )
}
