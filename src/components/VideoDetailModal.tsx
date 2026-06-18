import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import type { VideoDetail } from '../types/business'

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
function pct(r: number | null | undefined): string {
  if (r == null) return '—'
  // stored engagement_rate may be a fraction (<=1) or already a percent
  const v = r <= 1 ? r * 100 : r
  return `${v.toFixed(1)}%`
}

export default function VideoDetailModal({
  videoId,
  businessLabel,
  adapting,
  onAdapt,
  onClose,
}: {
  videoId: number
  businessLabel: string | null
  adapting: boolean
  onAdapt: (videoId: number) => void
  onClose: () => void
}) {
  const [detail, setDetail] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [transcriptStatus, setTranscriptStatus] = useState<string>('none')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/business-profiles/inspiration/video/${videoId}`)
      if (!res.ok) throw new Error('load_failed')
      const d: VideoDetail = await res.json()
      setDetail(d)
      setTranscript(d.transcript)
      setTranscriptStatus(d.transcript_status)
    } catch {
      toast.error('Could not load video detail')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    load()
  }, [load])

  const getTranscript = async () => {
    setTranscribing(true)
    try {
      const res = await authFetch(`/api/business-profiles/inspiration/video/${videoId}/transcript`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setTranscriptStatus(data.status)
      setTranscript(data.transcript || '')
      if (data.status === 'no_speech') toast('No spoken audio in this video')
      else if (data.status === 'failed') toast.error('Could not transcribe this one')
    } catch {
      toast.error('Transcription failed')
      setTranscriptStatus('failed')
    } finally {
      setTranscribing(false)
    }
  }

  const thumb = detail ? getStorageUrl(detail.thumbnail_path) : null
  const m = detail?.metrics

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-3xl bg-[rgba(14,14,20,0.98)] border border-white/[0.1] flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: thumbnail + metrics */}
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-5 overflow-y-auto dashboard-scrollbar">
          {detail && (
            <>
              <div className="flex items-center gap-2 mb-3">
                {detail.avatar_url && (
                  <img src={detail.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                )}
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">
                    {detail.username ? `@${detail.username}` : 'Creator'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {detail.platform}
                    {detail.duration_sec ? ` · ${detail.duration_sec}s` : ''}
                  </p>
                </div>
              </div>

              <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-white/[0.04] mb-4 relative">
                {thumb ? (
                  <img src={thumb} alt={detail.caption || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <i className="fas fa-clapperboard text-2xl" />
                  </div>
                )}
              </div>

              {m && (
                <div className="space-y-2 text-sm">
                  <Metric icon="fa-play" label="Views" value={fmt(m.views)} />
                  <Metric icon="fa-heart" label="Likes" value={fmt(m.likes)} />
                  <Metric icon="fa-bookmark" label="Saves" value={fmt(m.saves)} />
                  <Metric icon="fa-share" label="Shares" value={fmt(m.shares)} />
                  <Metric icon="fa-comment" label="Comments" value={fmt(m.comments)} />
                  <div className="h-px bg-white/[0.08] my-2" />
                  <Metric icon="fa-chart-line" label="Engagement" value={pct(m.engagement_rate)} />
                  <Metric icon="fa-bookmark" label="Save rate" value={pct(m.save_rate)} />
                </div>
              )}

              {detail.content_url && (
                <a
                  href={detail.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-center px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition"
                >
                  <i className="fas fa-arrow-up-right-from-square mr-1" /> Open original
                </a>
              )}
            </>
          )}
        </div>

        {/* Right: anatomy */}
        <div className="flex-1 overflow-y-auto dashboard-scrollbar p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-white">{detail?.caption || 'Video breakdown'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none shrink-0">×</button>
          </div>

          {loading ? (
            <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
          ) : !detail ? null : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {detail.format_class && <Tag>{detail.format_class}</Tag>}
                {detail.hook_class && <Tag>{detail.hook_class}</Tag>}
                {detail.niche && <Tag>{detail.niche}</Tag>}
              </div>

              {detail.why_it_works && (
                <p className="text-sm text-slate-200 mb-4">
                  <span className="text-pink-400 font-bold">Why it works: </span>
                  {detail.why_it_works}
                </p>
              )}

              <button
                onClick={() => onAdapt(detail.video_id)}
                disabled={adapting}
                className="w-full mb-5 px-4 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:scale-[1.01] transition disabled:opacity-50"
              >
                {adapting ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-wand-magic-sparkles mr-2" />Adapt{businessLabel ? ` for ${businessLabel}` : ''}</>}
              </button>

              {/* Structural beats */}
              {detail.structural && (
                <Section icon="fa-layer-group" title="Structure">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {detail.structural.hook_seconds != null && <Beat label="Hook" v={`${detail.structural.hook_seconds}s`} />}
                    {detail.structural.setup_seconds != null && <Beat label="Setup" v={`${detail.structural.setup_seconds}s`} />}
                    {detail.structural.payoff_seconds != null && <Beat label="Payoff" v={`${detail.structural.payoff_seconds}s`} />}
                    {detail.structural.total_seconds != null && <Beat label="Total" v={`${detail.structural.total_seconds}s`} />}
                  </div>
                  <KV k="Pacing" v={detail.structural.pacing_style} />
                  <KV k="Loop" v={detail.structural.loop_description || detail.structural.loop_type} />
                  <KV k="Shot length" v={detail.structural.avg_shot_length_sec != null ? `${detail.structural.avg_shot_length_sec}s` : null} />
                </Section>
              )}

              {/* Hook anatomy */}
              {detail.hook && (
                <Section icon="fa-bolt" title="Hook anatomy">
                  <KV k="Verdict" v={detail.hook.verdict} />
                  <KV k="First frame" v={detail.hook.first_frame?.description || detail.hook.first_frame} />
                  <KV k="Promise" v={detail.hook.promise_setup?.promise_text} />
                  <KV k="Loop opened" v={detail.hook.promise_setup?.loop_description} />
                  {detail.hook.cognitive_interruption?.primal_trigger && (
                    <KV k="Primal trigger" v={detail.hook.cognitive_interruption.primal_trigger} />
                  )}
                  <KV k="Audio (first 3s)" v={detail.hook.audio_in_first_3s?.description} />
                </Section>
              )}

              {/* Tactics */}
              {detail.tactics.length > 0 && (
                <Section icon="fa-chess" title="Tactics & why they work">
                  <div className="space-y-2">
                    {detail.tactics.map((t: any, i: number) => (
                      <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white text-sm font-semibold">{t.name}</span>
                          {t.viewer_effect && (
                            <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 text-[10px] font-bold uppercase tracking-wide">
                              {String(t.viewer_effect).replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        {(t.why_it_works || t.viewer_effect_description) && (
                          <p className="text-xs text-slate-400 mt-1">{t.why_it_works || t.viewer_effect_description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Emotions */}
              {detail.emotional && (
                <Section icon="fa-heart" title="Emotional arc">
                  <KV k="Primary emotion" v={detail.emotional.primary_emotion} />
                  <KV k="Arousal" v={detail.emotional.arousal_curve} />
                  <KV k="Relatability" v={detail.emotional.relatability_moment} />
                </Section>
              )}

              {/* Weaknesses */}
              {detail.weaknesses.length > 0 && (
                <Section icon="fa-triangle-exclamation" title="Weaknesses">
                  <ul className="space-y-1">
                    {detail.weaknesses.map((w: any, i: number) => (
                      <li key={i} className="text-sm text-slate-300">
                        {w.what}{w.fix ? <span className="text-slate-500"> → {w.fix}</span> : null}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Transcript (on demand) */}
              <Section icon="fa-closed-captioning" title="Spoken transcript">
                {transcript ? (
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{transcript}</p>
                ) : transcriptStatus === 'no_speech' ? (
                  <p className="text-sm text-slate-500">No spoken audio in this video.</p>
                ) : (
                  <button
                    onClick={getTranscript}
                    disabled={transcribing}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] transition disabled:opacity-50"
                  >
                    {transcribing ? (
                      <><i className="fas fa-spinner fa-spin mr-2" />Transcribing…</>
                    ) : (
                      <><i className="fas fa-wand-magic-sparkles mr-2" />Get transcript</>
                    )}
                  </button>
                )}
                {transcriptStatus === 'failed' && !transcript && (
                  <p className="text-xs text-slate-500 mt-2">Couldn’t pull the audio for this one.</p>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400"><i className={`fas ${icon} mr-2 text-slate-500 text-xs`} />{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  )
}
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
      <h3 className="text-sm font-bold text-white mb-2"><i className={`fas ${icon} mr-2 text-pink-400 text-xs`} />{title}</h3>
      {children}
    </div>
  )
}
function KV({ k, v }: { k: string; v: any }) {
  if (v == null || v === '') return null
  return <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500">{k}: </span>{String(v)}</p>
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-200 text-xs font-medium">{children}</span>
}
function Beat({ label, v }: { label: string; v: string }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-200 font-bold">
      {label} <span className="text-pink-400">{v}</span>
    </span>
  )
}
