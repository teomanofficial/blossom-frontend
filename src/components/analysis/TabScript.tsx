import { useMemo, useState } from 'react'

interface ScriptSegment {
  start?: number
  end?: number
  text?: string
}

interface ScriptObject {
  has_speech?: boolean
  language?: string | null
  full_text?: string
  segments?: ScriptSegment[]
  on_screen_text?: string[]
  transcription_confidence?: 'high' | 'medium' | 'low'
  source?: 'gemini' | 'whisper' | 'none'
}

interface TabScriptProps {
  full: any
}

function formatTimestamp(sec?: number): string {
  if (sec == null || isNaN(sec)) return '0:00'
  const total = Math.max(0, Math.floor(sec))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-rose-500/10 text-rose-400',
}

export default function TabScript({ full }: TabScriptProps) {
  const script: ScriptObject | null = full?.script ?? null
  const [copied, setCopied] = useState(false)

  const segments = useMemo(
    () => (Array.isArray(script?.segments) ? script!.segments!.filter((s) => s?.text?.trim()) : []),
    [script]
  )
  const onScreenText = useMemo(
    () => (Array.isArray(script?.on_screen_text) ? script!.on_screen_text!.filter((t) => t?.trim()) : []),
    [script]
  )

  const fullText = (script?.full_text || '').trim()
  const hasSpeech = !!script?.has_speech && (fullText.length > 0 || segments.length > 0)

  const handleCopy = async () => {
    const text = fullText || segments.map((s) => s.text).join('\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  // Empty state — no spoken script (e.g. silent ASMR, music-only montage).
  if (!hasSpeech) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
            <i className="fas fa-microphone-slash text-slate-500 text-lg"></i>
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2">This video doesn't contain a script</h3>
          <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
            No spoken words were detected in the audio. This is normal for no-talking content like silent
            ASMR, instrumental montages, or sound-effect-only clips.
          </p>
        </div>

        {/* On-screen text may still exist even without speech */}
        {onScreenText.length > 0 && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              <i className="fas fa-closed-captioning mr-2 text-sky-400 text-sm"></i>On-screen Text
            </h3>
            <div className="flex flex-wrap gap-2">
              {onScreenText.map((t, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const confidence = script?.transcription_confidence || 'medium'

  return (
    <div className="space-y-6">
      {/* Header meta + copy */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white">
              <i className="fas fa-quote-left mr-2 text-pink-400 text-sm"></i>Script
            </h3>
            {script?.language && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-300">
                {script.language}
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.medium}`}
              title="How confident the transcription is"
            >
              {confidence} confidence
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs font-bold whitespace-nowrap"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Full transcript */}
        {fullText && (
          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap">
            {fullText}
          </p>
        )}
      </div>

      {/* Timestamped segments */}
      {segments.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-stream mr-2 text-purple-400 text-sm"></i>Timed Segments
          </h3>
          <div className="space-y-2">
            {segments.map((seg, idx) => (
              <div
                key={idx}
                className="flex gap-3 sm:gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/5 transition-all"
              >
                <span className="shrink-0 font-mono text-[11px] font-bold text-pink-400 pt-0.5 tabular-nums">
                  {formatTimestamp(seg.start)}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On-screen text */}
      {onScreenText.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-closed-captioning mr-2 text-sky-400 text-sm"></i>On-screen Text
          </h3>
          <div className="flex flex-wrap gap-2">
            {onScreenText.map((t, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
