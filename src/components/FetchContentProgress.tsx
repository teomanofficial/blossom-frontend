import { useEffect, useState, useRef } from 'react'
import { getSocket } from '../lib/socket'

export interface FetchProgress {
  phase: 'fetching' | 'processing' | 'downloading' | 'done' | 'error'
  message: string
  fetched: number
  target: number
  created: number
  updated: number
  skipped: number
  downloaded: number
  downloadFailed?: number
  downloadTotal: number
}

function getOverallPercent(p: FetchProgress): number {
  if (p.phase === 'done') return 100
  if (p.phase === 'error') return 0

  // Weighted: fetching 30%, processing 10%, downloading 60%
  if (p.phase === 'fetching') {
    return p.target > 0 ? Math.round((p.fetched / p.target) * 30) : 0
  }
  if (p.phase === 'processing') {
    return 30
  }
  if (p.phase === 'downloading') {
    const dlPct = p.downloadTotal > 0 ? ((p.downloaded + (p.downloadFailed || 0)) / p.downloadTotal) : 0
    return Math.min(30 + Math.round(dlPct * 60), 99)
  }
  return 0
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'fetching': return 'from-blue-500 to-cyan-400'
    case 'processing': return 'from-purple-500 to-pink-400'
    case 'downloading': return 'from-orange-500 to-amber-400'
    case 'done': return 'from-teal-500 to-green-400'
    case 'error': return 'from-red-500 to-red-400'
    default: return 'from-slate-500 to-slate-400'
  }
}

function getPhaseIcon(phase: string): string {
  switch (phase) {
    case 'fetching': return 'fa-cloud-download-alt'
    case 'processing': return 'fa-database'
    case 'downloading': return 'fa-file-video'
    case 'done': return 'fa-check-circle'
    case 'error': return 'fa-exclamation-triangle'
    default: return 'fa-spinner fa-spin'
  }
}

interface Props {
  influencerId: number | string
  onComplete?: () => void
  onDismiss?: () => void
}

export default function FetchContentProgress({ influencerId, onComplete, onDismiss }: Props) {
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const completeCalled = useRef(false)

  useEffect(() => {
    const socket = getSocket()

    socket.emit('join:influencer', String(influencerId))

    const handler = (data: FetchProgress) => {
      setProgress(data)
      if (data.phase === 'done' && !completeCalled.current) {
        completeCalled.current = true
        onComplete?.()
      }
    }

    socket.on('fetch-content:progress', handler)

    return () => {
      socket.off('fetch-content:progress', handler)
      socket.emit('leave:influencer', String(influencerId))
    }
  }, [influencerId, onComplete])

  const p: FetchProgress = progress || {
    phase: 'fetching',
    message: 'Connecting to Instagram API...',
    fetched: 0,
    target: 100,
    created: 0,
    updated: 0,
    skipped: 0,
    downloaded: 0,
    downloadTotal: 0,
  }

  const pct = getOverallPercent(p)
  const isActive = p.phase !== 'done' && p.phase !== 'error'
  const isDone = p.phase === 'done'
  const isError = p.phase === 'error'

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
            isDone ? 'bg-teal-500/10' : isError ? 'bg-red-500/10' : 'bg-blue-500/10'
          }`}>
            <i className={`fas ${getPhaseIcon(p.phase)} text-sm ${
              isDone ? 'text-teal-400' : isError ? 'text-red-400' :
              p.phase === 'downloading' ? 'text-orange-400' : 'text-blue-400'
            } ${isActive && p.phase !== 'downloading' ? 'animate-pulse' : ''}`}></i>
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {isDone ? 'Fetch Complete' :
               isError ? 'Fetch Failed' :
               'Fetching Videos...'}
            </div>
            <div className="text-[11px] text-slate-500">
              {p.message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-xs font-bold text-slate-400">{pct}%</span>
          )}
          {!isActive && (
            <button
              onClick={onDismiss}
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
          className={`h-full rounded-full bg-gradient-to-r ${getPhaseColor(p.phase)} transition-all duration-500 ${isActive ? 'animate-pulse' : ''}`}
          style={{ width: `${isDone ? 100 : Math.max(pct, isActive && !progress ? 2 : 0)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Fetched</div>
          <div className="text-sm font-bold text-white">{p.fetched}</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">New</div>
          <div className="text-sm font-bold text-green-400">{p.created}</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Updated</div>
          <div className="text-sm font-bold text-blue-400">{p.updated}</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Downloaded</div>
          <div className="text-sm font-bold text-white">
            {p.downloaded}/{p.downloadTotal || '—'}
            {(p.downloadFailed || 0) > 0 && (
              <span className="text-red-400 text-[10px] ml-0.5">+{p.downloadFailed}</span>
            )}
          </div>
        </div>
      </div>

      {/* Skipped info */}
      {p.skipped > 0 && (
        <div className="mt-2 text-[10px] text-slate-500 text-center">
          {p.skipped} video{p.skipped > 1 ? 's' : ''} skipped (longer than 3 min)
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {p.message}
        </div>
      )}
    </div>
  )
}
