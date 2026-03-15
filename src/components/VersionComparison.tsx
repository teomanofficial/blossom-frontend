import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface ScoreDelta {
  hook_power: number | null
  retention_strength: number | null
  shareability: number | null
  emotional_impact: number | null
  tactic_execution: number | null
  optimization: number | null
  virality: number | null
}

interface VersionComparisonData {
  scoreDelta: ScoreDelta
  resolvedWeaknesses: Array<{ index: number; what: string }>
  persistingWeaknesses: Array<{ index: number; what: string }>
  newWeaknesses: string[]
  implementedItems: Array<{
    category: string
    index: number
    label: string
    confidence: string
  }>
  newTactics: string[]
  removedTactics: string[]
  hookChanged: boolean
  formatChanged: boolean
  overallVerdict: string
}

interface VersionComparisonProps {
  uploadId: number
  versionInfo: {
    versionGroupId: string | null
    versionNumber: number
    totalVersions: number
    previousUploadId: number | null
    nextUploadId: number | null
  }
}

function DeltaDisplay({ value, label, suffix = '' }: { value: number | null; label: string; suffix?: string }) {
  if (value == null) return null
  const isPositive = value > 0
  const isNeutral = value === 0
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-white/5 min-w-[90px]">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-bold ${isPositive ? 'text-teal-400' : isNeutral ? 'text-slate-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{Math.round(value)}{suffix}
      </span>
      <i className={`fas ${isPositive ? 'fa-arrow-up' : isNeutral ? 'fa-minus' : 'fa-arrow-down'} text-xs ${isPositive ? 'text-teal-400' : isNeutral ? 'text-slate-500' : 'text-red-400'}`}></i>
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { icon: string; text: string; className: string }> = {
    improved: { icon: 'fa-arrow-trend-up', text: 'Improved', className: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    regressed: { icon: 'fa-arrow-trend-down', text: 'Regressed', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
    mixed: { icon: 'fa-arrows-left-right', text: 'Mixed Results', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    unchanged: { icon: 'fa-equals', text: 'Unchanged', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  }
  const c = config[verdict] || config['unchanged']!
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${c!.className}`}>
      <i className={`fas ${c!.icon}`}></i>
      {c!.text}
    </span>
  )
}

export default function VersionComparison({ uploadId, versionInfo }: VersionComparisonProps) {
  const [comparison, setComparison] = useState<VersionComparisonData | null>(null)
  const [versionProgress, setVersionProgress] = useState<any>(null)
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (versionInfo.versionNumber <= 1 || !versionInfo.previousUploadId) {
      setLoading(false)
      return
    }

    apiFetch(`/api/content-analysis/${uploadId}/comparison`)
      .then(res => res.json())
      .then(data => {
        setComparison(data.comparison)
        setVersionProgress(data.versionProgress)
      })
      .catch(() => console.error('Failed to load comparison'))
      .finally(() => setLoading(false))
  }, [uploadId, versionInfo.versionNumber, versionInfo.previousUploadId])

  if (versionInfo.versionNumber <= 1 || !versionInfo.previousUploadId) return null
  if (loading) return null
  if (!comparison) return null

  const { scoreDelta, resolvedWeaknesses, persistingWeaknesses, newWeaknesses, implementedItems, newTactics, removedTactics } = comparison

  // Count totals for progress
  const totalResolved = resolvedWeaknesses.length
  const totalPersisting = persistingWeaknesses.length
  const totalWeaknesses = totalResolved + totalPersisting
  const totalImplemented = implementedItems.length

  return (
    <div className="mb-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-teal-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className="fas fa-chart-line text-purple-400"></i>
          <span className="font-semibold text-white">
            Progress from v{versionInfo.versionNumber - 1}
          </span>
          <VerdictBadge verdict={comparison.overallVerdict} />
        </div>
        <div className="flex items-center gap-4">
          {totalWeaknesses > 0 && (
            <span className="text-xs text-slate-400">
              <i className="fas fa-check-circle text-teal-400 mr-1"></i>
              {totalResolved}/{totalWeaknesses} weaknesses resolved
            </span>
          )}
          {totalImplemented > 0 && (
            <span className="text-xs text-slate-400">
              <i className="fas fa-check-circle text-teal-400 mr-1"></i>
              {totalImplemented} suggestions implemented
            </span>
          )}
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-slate-500`}></i>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* Score deltas */}
          <div className="flex flex-wrap gap-2 pt-2">
            <DeltaDisplay value={scoreDelta.virality} label="Virality" />
            <DeltaDisplay value={scoreDelta.optimization} label="Optimization" />
            <DeltaDisplay value={scoreDelta.hook_power} label="Hook" />
            <DeltaDisplay value={scoreDelta.retention_strength} label="Retention" />
            <DeltaDisplay value={scoreDelta.emotional_impact} label="Emotion" />
            <DeltaDisplay value={scoreDelta.shareability} label="Shareability" />
            <DeltaDisplay value={scoreDelta.tactic_execution} label="Tactics" />
          </div>

          {/* Gemini's progress summary */}
          {versionProgress?.overall_progress_summary && (
            <div className="rounded-xl bg-white/5 p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-robot text-purple-400 text-xs"></i>
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">AI Progress Assessment</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{versionProgress.overall_progress_summary}</p>
            </div>
          )}

          {/* Resolved weaknesses */}
          {resolvedWeaknesses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <i className="fas fa-check-circle mr-1"></i>
                Resolved Weaknesses ({resolvedWeaknesses.length})
              </h4>
              <div className="space-y-1.5">
                {resolvedWeaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-check text-teal-400 mt-0.5 text-xs"></i>
                    <span className="text-slate-300 line-through opacity-70">{w.what}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persisting weaknesses */}
          {persistingWeaknesses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Still Present ({persistingWeaknesses.length})
              </h4>
              <div className="space-y-1.5">
                {persistingWeaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-minus text-yellow-400 mt-0.5 text-xs"></i>
                    <span className="text-slate-400">{w.what}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New weaknesses */}
          {newWeaknesses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                <i className="fas fa-plus-circle mr-1"></i>
                New Issues ({newWeaknesses.length})
              </h4>
              <div className="space-y-1.5">
                {newWeaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-exclamation text-red-400 mt-0.5 text-xs"></i>
                    <span className="text-slate-300">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Implemented suggestions */}
          {implementedItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
                <i className="fas fa-clipboard-check mr-1"></i>
                Implemented Suggestions ({implementedItems.length})
              </h4>
              <div className="space-y-1.5">
                {implementedItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-check-double text-teal-400 mt-0.5 text-xs"></i>
                    <span className="text-slate-300">{item.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      item.confidence === 'high' ? 'bg-teal-500/20 text-teal-300' :
                      item.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {item.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tactic changes */}
          {(newTactics.length > 0 || removedTactics.length > 0) && (
            <div className="flex gap-6">
              {newTactics.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1.5">
                    New Tactics
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {newTactics.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/20">
                        + {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {removedTactics.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                    Removed Tactics
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {removedTactics.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/20">
                        - {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regression areas from Gemini */}
          {versionProgress?.regression_areas?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                <i className="fas fa-arrow-trend-down mr-1"></i>
                Regression Areas
              </h4>
              <div className="space-y-1.5">
                {versionProgress.regression_areas.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      r.severity === 'significant' ? 'bg-red-500/20 text-red-300' :
                      r.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>{String(r.severity || 'minor')}</span>
                    <span className="text-slate-300">{String(r.area || '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
