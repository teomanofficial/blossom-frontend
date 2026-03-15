import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface VersionEntry {
  uploadId: number
  versionNumber: number
  status: string
  createdAt: string
  optimizationScore: number | null
  overallViralityScore: number | null
  thumbnailPath: string | null
  caption: string | null
  versionNotes: string | null
}

interface VersionTimelineProps {
  uploadId: number
  versionInfo: {
    versionGroupId: string | null
    versionNumber: number
    totalVersions: number
    previousUploadId: number | null
    nextUploadId: number | null
  }
  onVersionSelect: (uploadId: number) => void
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-slate-500'
  if (score >= 70) return 'text-teal-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function getScoreBg(score: number | null): string {
  if (score == null) return 'bg-slate-700/50 border-slate-600'
  if (score >= 70) return 'bg-teal-500/10 border-teal-500/40'
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/40'
  return 'bg-red-500/10 border-red-500/40'
}

function getConnectorColor(prevScore: number | null, currScore: number | null): string {
  if (prevScore == null || currScore == null) return 'bg-slate-600'
  const delta = currScore - prevScore
  if (delta > 5) return 'bg-teal-500/60'
  if (delta < -5) return 'bg-red-500/60'
  return 'bg-slate-600'
}

export default function VersionTimeline({ uploadId, versionInfo, onVersionSelect }: VersionTimelineProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!versionInfo.versionGroupId || versionInfo.totalVersions <= 1) {
      setLoading(false)
      return
    }

    apiFetch(`/api/content-analysis/${uploadId}/versions`)
      .then(res => res.json())
      .then(data => {
        setVersions(data.versions || [])
      })
      .catch(() => {
        console.error('Failed to load version history')
      })
      .finally(() => setLoading(false))
  }, [uploadId, versionInfo.versionGroupId, versionInfo.totalVersions])

  if (!versionInfo.versionGroupId || versionInfo.totalVersions <= 1) return null
  if (loading) return null
  if (versions.length <= 1) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <i className="fas fa-code-branch text-purple-400 text-sm"></i>
        <span className="text-sm font-semibold text-slate-300">Version History</span>
        <span className="text-xs text-slate-500">({versions.length} versions)</span>
      </div>

      <div className="flex items-center overflow-x-auto pb-2 gap-0 scrollbar-thin scrollbar-thumb-slate-700">
        {versions.map((version, i) => {
          const isCurrent = version.uploadId === uploadId
          const score = version.optimizationScore ?? version.overallViralityScore
          const prevVersion = i > 0 ? versions[i - 1] : null
          const prevScore = prevVersion ? (prevVersion.optimizationScore ?? prevVersion.overallViralityScore) : null
          const delta = score != null && prevScore != null ? score - prevScore : null

          return (
            <div key={version.uploadId} className="flex items-center shrink-0">
              {/* Connector line */}
              {i > 0 && (
                <div className="flex items-center mx-1">
                  <div className={`w-8 h-0.5 ${getConnectorColor(prevScore, score)}`}></div>
                  {delta != null && (
                    <span className={`text-[10px] font-bold mx-0.5 ${delta > 0 ? 'text-teal-400' : delta < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                  <div className={`w-8 h-0.5 ${getConnectorColor(prevScore, score)}`}></div>
                </div>
              )}

              {/* Version node */}
              <button
                onClick={() => onVersionSelect(version.uploadId)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[80px]
                  ${isCurrent
                    ? `${getScoreBg(score)} ring-2 ring-purple-500/50`
                    : `${getScoreBg(score)} hover:ring-1 hover:ring-white/20 opacity-70 hover:opacity-100`
                  }`}
              >
                <span className={`text-xs font-bold ${isCurrent ? 'text-purple-300' : 'text-slate-400'}`}>
                  v{version.versionNumber}
                </span>
                {score != null ? (
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {Math.round(score)}
                  </span>
                ) : version.status === 'error' ? (
                  <span className="text-xs text-red-400">
                    <i className="fas fa-exclamation-triangle"></i>
                  </span>
                ) : version.status === 'analyzing' ? (
                  <span className="text-xs text-yellow-400">
                    <i className="fas fa-spinner fa-spin"></i>
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">--</span>
                )}
                <span className="text-[10px] text-slate-500">
                  {new Date(version.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
