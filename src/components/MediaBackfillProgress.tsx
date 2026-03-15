import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '../lib/api'

interface BackfillProgress {
  running: boolean
  phase: 'idle' | 'thumbnails' | 'avatars' | 'covers' | 'done' | 'error'
  phaseLabel: string
  thumbnails: { total: number; completed: number; failed: number }
  avatars: { total: number; completed: number; failed: number; refetched: number }
  covers: { total: number; completed: number; failed: number }
  startedAt: string | null
  error: string | null
  cancelled: boolean
}

function getOverallPercent(p: BackfillProgress): number {
  if (p.phase === 'done') return 100
  if (p.phase === 'idle') return 0

  const tTotal = p.thumbnails.total || 0
  const aTotal = p.avatars.total || 0
  const cTotal = p.covers.total || 0
  const grandTotal = tTotal + aTotal + cTotal
  if (grandTotal === 0) return 0

  const done = p.thumbnails.completed + p.thumbnails.failed
    + p.avatars.completed + p.avatars.failed
    + p.covers.completed + p.covers.failed

  return Math.min(Math.round((done / grandTotal) * 100), 99)
}

function getPhaseIcon(phase: string): string {
  switch (phase) {
    case 'thumbnails': return 'fa-image'
    case 'avatars': return 'fa-user-circle'
    case 'covers': return 'fa-music'
    case 'done': return 'fa-check-circle'
    case 'error': return 'fa-exclamation-triangle'
    default: return 'fa-spinner fa-spin'
  }
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'thumbnails': return 'from-blue-500 to-cyan-400'
    case 'avatars': return 'from-pink-500 to-purple-500'
    case 'covers': return 'from-orange-500 to-yellow-400'
    case 'done': return 'from-teal-500 to-green-400'
    case 'error': return 'from-red-500 to-red-400'
    default: return 'from-slate-500 to-slate-400'
  }
}

export default function MediaBackfillProgress() {
  const [progress, setProgress] = useState<BackfillProgress | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const poll = useCallback(() => {
    authFetch('/api/analysis/media/backfill-progress')
      .then(r => r.json())
      .then(setProgress)
      .catch(() => {})
  }, [])

  useEffect(() => {
    poll()
    const isRunning = progress?.running
    const isTerminal = progress && !progress.running && progress.phase !== 'idle'
    if (isTerminal) return
    const interval = setInterval(poll, isRunning ? 2000 : 30000)
    return () => clearInterval(interval)
  }, [poll, progress?.running, progress?.phase])

  useEffect(() => {
    if (progress && !progress.running) setCancelling(false)
  }, [progress?.running])

  if (!progress || progress.phase === 'idle') return null

  const pct = getOverallPercent(progress)
  const isActive = progress.running
  const isDone = progress.phase === 'done'
  const isError = progress.phase === 'error'
  const showDismiss = !isActive

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await authFetch('/api/analysis/media/backfill-cancel', { method: 'POST' })
    } catch {
      setCancelling(false)
    }
  }

  const handleDismiss = async () => {
    try {
      await authFetch('/api/analysis/media/backfill-dismiss', { method: 'POST' })
      setProgress(null)
    } catch {}
  }

  const totalDone = progress.thumbnails.completed + progress.avatars.completed + progress.covers.completed
  const totalFailed = progress.thumbnails.failed + progress.avatars.failed + progress.covers.failed
  const grandTotal = (progress.thumbnails.total || 0) + (progress.avatars.total || 0) + (progress.covers.total || 0)

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${
      isDone ? 'bg-teal-500/5 border-teal-500/20' :
      isError ? 'bg-red-500/5 border-red-500/20' :
      'bg-white/[0.03] border-white/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <i className={`fas ${getPhaseIcon(progress.phase)} text-[10px] ${
            isDone ? 'text-teal-400' : isError ? 'text-red-400' : 'text-pink-400'
          }`}></i>
          <span className={`text-[11px] font-bold truncate ${
            isError ? 'text-red-400' : isDone ? 'text-teal-400' : 'text-slate-300'
          }`}>
            {progress.phaseLabel || 'Media Backfill'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive && (
            <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
          )}
          {isDone && !progress.cancelled && (
            <span className="text-[10px] font-bold text-teal-400">{totalDone} done</span>
          )}
          {isActive && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Cancel backfill"
            >
              <i className={`fas ${cancelling ? 'fa-spinner fa-spin' : 'fa-stop-circle'}`}></i>
            </button>
          )}
          {showDismiss && (
            <button onClick={handleDismiss} className="text-[10px] text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getPhaseColor(progress.phase)} transition-all duration-700 ${isActive ? 'animate-pulse' : ''}`}
          style={{ width: `${isDone ? 100 : pct}%` }}
        />
      </div>

      {/* Phase Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <PhaseChip
          icon="fa-image"
          label="Thumbs"
          total={progress.thumbnails.total}
          done={progress.thumbnails.completed}
          failed={progress.thumbnails.failed}
          active={progress.phase === 'thumbnails'}
        />
        <PhaseChip
          icon="fa-user-circle"
          label="Avatars"
          total={progress.avatars.total}
          done={progress.avatars.completed}
          failed={progress.avatars.failed}
          active={progress.phase === 'avatars'}
          extra={progress.avatars.refetched > 0 ? `${progress.avatars.refetched} refetched` : undefined}
        />
        <PhaseChip
          icon="fa-music"
          label="Covers"
          total={progress.covers.total}
          done={progress.covers.completed}
          failed={progress.covers.failed}
          active={progress.phase === 'covers'}
        />
      </div>

      {/* Error */}
      {isError && progress.error && (
        <div className="mt-2 text-[10px] text-red-400 truncate">{progress.error}</div>
      )}

      {/* Summary when done */}
      {isDone && (
        <div className="mt-1.5 text-[10px] text-slate-500">
          {totalDone}/{grandTotal} downloaded
          {totalFailed > 0 && <span className="text-red-400 ml-1">({totalFailed} failed)</span>}
          {progress.avatars.refetched > 0 && <span className="text-purple-400 ml-1">({progress.avatars.refetched} re-fetched from API)</span>}
        </div>
      )}
    </div>
  )
}

function PhaseChip({ icon, label, total, done, failed, active, extra }: {
  icon: string; label: string; total: number; done: number; failed: number; active: boolean; extra?: string
}) {
  const phaseDone = total > 0 && done + failed >= total
  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${
      active ? 'bg-white/[0.06] ring-1 ring-white/10' : 'bg-white/[0.02]'
    }`}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <i className={`fas ${icon} text-[8px] ${
          phaseDone ? 'text-teal-400' : active ? 'text-white' : 'text-slate-600'
        }`}></i>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${
          phaseDone ? 'text-teal-400' : active ? 'text-white' : 'text-slate-600'
        }`}>{label}</span>
      </div>
      <div className="text-[11px] font-bold text-slate-300">
        {total === 0 ? (
          <span className="text-slate-600">--</span>
        ) : (
          <>
            {done}
            {failed > 0 && <span className="text-red-400">+{failed}</span>}
            <span className="text-slate-600">/{total}</span>
          </>
        )}
      </div>
      {extra && <div className="text-[8px] text-purple-400 mt-0.5">{extra}</div>}
    </div>
  )
}
