import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '../lib/api'

interface AnalyzeProgress {
  running: boolean
  influencerId: number | null
  influencerUsername: string | null
  phase: 'idle' | 'fetching' | 'downloading' | 'analyzing' | 'done' | 'error' | 'cancelled'
  phaseLabel: string
  videosFetched: number
  videosTarget: number
  downloadTotal: number
  downloadCompleted: number
  downloadFailed: number
  analyzeTotal: number
  analyzeCompleted: number
  analyzeFailed: number
  startedAt: string | null
  error: string | null
  cancelled: boolean
}

function getOverallPercent(p: AnalyzeProgress): number {
  if (p.phase === 'done') return 100
  if (p.phase === 'idle') return 0

  // 3 phases weighted: fetching 10%, downloading 30%, analyzing 60%
  let pct = 0
  if (p.phase === 'fetching') {
    pct = p.videosTarget > 0 ? (p.videosFetched / p.videosTarget) * 10 : 0
  } else if (p.phase === 'downloading') {
    pct = 10 + (p.downloadTotal > 0 ? (p.downloadCompleted / p.downloadTotal) * 30 : 0)
  } else if (p.phase === 'analyzing') {
    pct = 40 + (p.analyzeTotal > 0 ? (p.analyzeCompleted / p.analyzeTotal) * 60 : 0)
  }
  return Math.min(Math.round(pct), 99)
}

function getPhaseIcon(phase: string): string {
  switch (phase) {
    case 'fetching': return 'fa-cloud-download-alt'
    case 'downloading': return 'fa-file-video'
    case 'analyzing': return 'fa-brain'
    case 'done': return 'fa-check-circle'
    case 'error': return 'fa-exclamation-triangle'
    case 'cancelled': return 'fa-ban'
    default: return 'fa-spinner fa-spin'
  }
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'fetching': return 'from-blue-500 to-blue-400'
    case 'downloading': return 'from-orange-500 to-orange-400'
    case 'analyzing': return 'from-pink-500 to-purple-500'
    case 'done': return 'from-teal-500 to-green-400'
    case 'error': return 'from-red-500 to-red-400'
    case 'cancelled': return 'from-slate-500 to-slate-400'
    default: return 'from-slate-500 to-slate-400'
  }
}

interface Props {
  onStartAnalyze?: (influencerId: number) => void
  compact?: boolean
}

export default function InfluencerAnalyzeProgress({ compact }: Props) {
  const [progress, setProgress] = useState<AnalyzeProgress | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const poll = useCallback(() => {
    authFetch('/api/analysis/influencers/full-analyze-status')
      .then(r => r.json())
      .then(setProgress)
      .catch(() => {})
  }, [])

  // Poll fast (2s) when running, slow (15s) when idle, stop when terminal
  useEffect(() => {
    poll()
    const isRunning = progress?.running
    const isTerminal = progress && !progress.running && progress.phase !== 'idle'
    if (isTerminal) return // no polling needed, just showing result
    const interval = setInterval(poll, isRunning ? 2000 : 15000)
    return () => clearInterval(interval)
  }, [poll, progress?.running, progress?.phase])

  // Reset cancelling state when analysis stops
  useEffect(() => {
    if (progress && !progress.running) setCancelling(false)
  }, [progress?.running])

  if (!progress || progress.phase === 'idle') return null

  const pct = getOverallPercent(progress)
  const isActive = progress.running
  const isCancelling = progress.cancelled && progress.running
  const isDone = progress.phase === 'done'
  const isError = progress.phase === 'error'
  const isCancelled = progress.phase === 'cancelled'
  const showDismiss = !isActive

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await authFetch('/api/analysis/influencers/full-analyze-cancel', { method: 'POST' })
    } catch {
      setCancelling(false)
    }
    // Keep cancelling=true until next poll shows cancelled state
  }

  const handleDismiss = async () => {
    try {
      await authFetch('/api/analysis/influencers/full-analyze-dismiss', { method: 'POST' })
      setProgress(null)
    } catch {}
  }

  if (compact) {
    return (
      <div className={`rounded-xl border px-3 py-2.5 ${
        isDone ? 'bg-teal-500/5 border-teal-500/20' :
        isError ? 'bg-red-500/5 border-red-500/20' :
        'bg-white/[0.03] border-white/10'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <i className={`fas ${getPhaseIcon(progress.phase)} text-[10px] ${
              isDone ? 'text-teal-400' : isError ? 'text-red-400' : 'text-pink-400'
            }`}></i>
            <span className="text-[11px] font-bold text-slate-300 truncate">
              {progress.phaseLabel || (progress.influencerUsername ? `Analyzing @${progress.influencerUsername}...` : 'Analyzing...')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isActive && (
              <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
            )}
            {isActive && (
              <button
                onClick={handleCancel}
                disabled={cancelling || isCancelling}
                className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
                title={cancelling || isCancelling ? 'Cancelling...' : 'Cancel analysis'}
              >
                <i className={`fas ${cancelling || isCancelling ? 'fa-spinner fa-spin' : 'fa-stop-circle'}`}></i>
              </button>
            )}
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="text-[10px] text-slate-500 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getPhaseColor(progress.phase)} transition-all duration-700 ${isActive ? 'animate-pulse' : ''}`}
            style={{ width: `${isDone ? 100 : pct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${
      isDone ? 'bg-teal-500/5 border-teal-500/20' :
      isError ? 'bg-red-500/5 border-red-500/20' :
      'bg-white/[0.03] border-white/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDone ? 'bg-teal-500/10' : isError ? 'bg-red-500/10' : 'bg-pink-500/10'
          }`}>
            <i className={`fas ${getPhaseIcon(progress.phase)} text-sm ${
              isDone ? 'text-teal-400' : isError ? 'text-red-400' : 'text-pink-400'
            }`}></i>
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {isDone ? 'Analysis Complete' :
               isError ? 'Analysis Failed' :
               isCancelled ? 'Analysis Cancelled' :
               progress.influencerUsername ? `Analyzing @${progress.influencerUsername}` : 'Analyzing...'}
            </div>
            <div className="text-[11px] text-slate-500">
              {progress.phaseLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={handleCancel}
              disabled={cancelling || isCancelling}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <i className={`fas ${cancelling || isCancelling ? 'fa-spinner fa-spin' : 'fa-stop-circle'} text-[9px]`}></i>
              {cancelling || isCancelling ? 'CANCELLING...' : 'CANCEL'}
            </button>
          )}
          {isActive && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Dismiss (analysis continues)"
            >
              <i className="fas fa-times text-[10px]"></i>
            </button>
          )}
          {showDismiss && (
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              DISMISS
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getPhaseColor(progress.phase)} transition-all duration-700 ${isActive ? 'animate-pulse' : ''}`}
          style={{ width: `${isDone ? 100 : pct}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Fetched</div>
          <div className="text-sm font-bold text-white">{progress.videosFetched}</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Downloaded</div>
          <div className="text-sm font-bold text-white">
            {progress.downloadCompleted}
            {progress.downloadFailed > 0 && <span className="text-red-400 text-[10px] ml-0.5">+{progress.downloadFailed} err</span>}
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Analyzed</div>
          <div className="text-sm font-bold text-white">
            {progress.analyzeCompleted}/{progress.analyzeTotal || '?'}
            {progress.analyzeFailed > 0 && <span className="text-red-400 text-[10px] ml-0.5">+{progress.analyzeFailed} err</span>}
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && progress.error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {progress.error}
        </div>
      )}
    </div>
  )
}

export type { AnalyzeProgress }
