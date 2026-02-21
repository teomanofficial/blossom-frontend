import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function platformIcon(p: string) {
  return p === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'
}

function viralColor(score: number) {
  if (score >= 70) return 'text-emerald-400 bg-emerald-500/10'
  if (score >= 40) return 'text-yellow-400 bg-yellow-500/10'
  return 'text-red-400 bg-red-500/10'
}

interface PostData {
  id: number
  caption: string | null
  thumbnail_url: string | null
  media_url: string | null
  post_url: string | null
  content_type: string
  status: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  published_at: string | null
  account_username: string
  account_platform: string
  account_avatar: string | null
  metricsHistory: Array<{ views: number; likes: number; comments: number; recorded_at: string }>
}

interface AnalysisData {
  analysis_status: string
  viral_score: number | null
  progress: { status: string; steps: Record<string, string> } | null
  fullAnalysis: any
  hookAnalysis: any
  viralityAnalysis: any
  improvements: any
  optimizationScore: number | null
}

export default function PlatformPostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState<PostData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const [postRes, analysisRes] = await Promise.all([
          authFetch(`/api/social/posts/${id}`),
          authFetch(`/api/social/posts/${id}/analysis`),
        ])
        if (postRes.ok) setPost(await postRes.json())
        if (analysisRes.ok) {
          const data = await analysisRes.json()
          setAnalysis(data)
          if (data.analysis_status === 'analyzing') setPollingActive(true)
        }
      } catch {
        toast.error('Failed to load post')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  // Poll for analysis completion
  useEffect(() => {
    if (!pollingActive) return
    const interval = setInterval(async () => {
      try {
        const res = await authFetch(`/api/social/posts/${id}/analysis`)
        if (res.ok) {
          const data = await res.json()
          setAnalysis(data)
          if (data.analysis_status !== 'analyzing') {
            setPollingActive(false)
            if (data.analysis_status === 'completed') toast.success('Analysis complete!')
          }
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [pollingActive, id])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await authFetch(`/api/social/posts/${id}/analyze`, { method: 'POST' })
      if (res.ok) {
        toast.success('Analysis started')
        setPollingActive(true)
        // Refresh analysis state
        const analysisRes = await authFetch(`/api/social/posts/${id}/analysis`)
        if (analysisRes.ok) setAnalysis(await analysisRes.json())
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to start analysis')
      }
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-sm font-bold mb-2">Post not found</p>
        <Link to="/dashboard/platforms/posts" className="text-xs font-bold text-pink-400">
          <i className="fas fa-arrow-left mr-1" />Back to Posts
        </Link>
      </div>
    )
  }

  const isAnalyzing = analysis?.analysis_status === 'analyzing' || pollingActive
  const isCompleted = analysis?.analysis_status === 'completed'

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard/platforms/posts" className="text-slate-500 hover:text-white transition-colors">
          <i className="fas fa-arrow-left text-xs" />
        </Link>
        <h1 className="text-xl font-black tracking-tighter">Post Detail</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Post Preview */}
        <div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="aspect-[9/16] bg-slate-900 relative">
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-film text-slate-700 text-4xl" />
                </div>
              )}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                  <i className={`${platformIcon(post.account_platform)} text-[10px] text-white/80`} />
                  <span className="text-[11px] font-bold text-white">@{post.account_username}</span>
                </div>
                {analysis?.viral_score != null && (
                  <span className={`text-xs font-black px-2 py-1 rounded-lg backdrop-blur-sm ${viralColor(analysis.viral_score)}`}>
                    {Math.round(analysis.viral_score)}%
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { icon: 'fa-eye', value: post.views, label: 'Views' },
                  { icon: 'fa-heart', value: post.likes, label: 'Likes' },
                  { icon: 'fa-comment', value: post.comments, label: 'Comments' },
                  { icon: 'fa-share', value: post.shares, label: 'Shares' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-sm font-black">{fmt(m.value)}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">{m.label}</div>
                  </div>
                ))}
              </div>

              {post.engagement_rate > 0 && (
                <div className="flex items-center justify-between py-2 px-3 bg-emerald-500/10 rounded-lg mb-3">
                  <span className="text-[11px] text-slate-400 font-medium">Engagement Rate</span>
                  <span className="text-sm font-black text-emerald-400">{post.engagement_rate.toFixed(2)}%</span>
                </div>
              )}

              {post.caption && (
                <p className="text-xs text-slate-300 leading-relaxed">{post.caption}</p>
              )}

              {post.published_at && (
                <div className="text-[10px] text-slate-500 mt-3">
                  Published {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              )}

              {post.post_url && (
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-400 hover:text-pink-300 mt-2 transition-colors"
                >
                  <i className="fas fa-external-link" />View on {post.account_platform}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {/* Analysis Status */}
          {!analysis || analysis.analysis_status === 'error' ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-wand-magic-sparkles text-pink-400 text-xl" />
              </div>
              <p className="text-sm font-bold mb-1">AI Analysis</p>
              <p className="text-xs text-slate-500 mb-4">
                Get a detailed viral analysis including format classification, hook analysis, and improvement suggestions.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              >
                {analyzing ? <><i className="fas fa-spinner fa-spin mr-2" />Starting...</> : <><i className="fas fa-bolt mr-2" />Analyze This Post</>}
              </button>
              {analysis?.analysis_status === 'error' && (
                <p className="text-[10px] text-red-400 mt-3">Previous analysis failed. Try again.</p>
              )}
            </div>
          ) : isAnalyzing ? (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-bold">Analyzing...</p>
                  <p className="text-[10px] text-slate-500">This usually takes 30-60 seconds</p>
                </div>
              </div>
              {analysis?.progress?.steps && (
                <div className="space-y-2">
                  {Object.entries(analysis.progress.steps).map(([step, status]) => (
                    <div key={step} className="flex items-center gap-2">
                      {status === 'done' ? (
                        <i className="fas fa-check-circle text-emerald-400 text-xs" />
                      ) : status === 'running' ? (
                        <i className="fas fa-spinner fa-spin text-pink-400 text-xs" />
                      ) : status === 'error' ? (
                        <i className="fas fa-times-circle text-red-400 text-xs" />
                      ) : (
                        <i className="fas fa-circle text-slate-600 text-xs" />
                      )}
                      <span className="text-xs text-slate-400 capitalize">{step.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isCompleted && (
            <>
              {/* Viral Score Banner */}
              {analysis.viralityAnalysis && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-fire text-orange-400 text-xs" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Virality Score</h3>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`text-4xl font-black ${analysis.viral_score != null ? viralColor(analysis.viral_score).split(' ')[0] : 'text-slate-400'}`}>
                      {analysis.viral_score != null ? `${Math.round(analysis.viral_score)}%` : '—'}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${analysis.viral_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {analysis.viralityAnalysis.score_breakdown && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(analysis.viralityAnalysis.score_breakdown).map(([key, val]) => (
                        <div key={key} className="bg-white/[0.03] rounded-lg p-2.5">
                          <div className="text-[10px] text-slate-500 capitalize mb-0.5">{key.replace(/_/g, ' ')}</div>
                          <div className="text-sm font-black">{typeof val === 'number' ? `${Math.round(val as number)}%` : String(val)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Analysis */}
              {analysis.fullAnalysis && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-microscope text-blue-400 text-xs" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Full Analysis</h3>
                  </div>
                  {analysis.fullAnalysis.format_class && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Format:</span>
                      <span className="text-sm font-bold text-pink-400 capitalize">{analysis.fullAnalysis.format_class}</span>
                    </div>
                  )}
                  {analysis.fullAnalysis.summary && (
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{analysis.fullAnalysis.summary}</p>
                  )}
                  {analysis.fullAnalysis.strengths && (
                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1.5">Strengths</div>
                      <ul className="space-y-1">
                        {(Array.isArray(analysis.fullAnalysis.strengths) ? analysis.fullAnalysis.strengths : []).map((s: string, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <i className="fas fa-check text-emerald-400 text-[9px] mt-1 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.fullAnalysis.weaknesses && (
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase mb-1.5">Areas to Improve</div>
                      <ul className="space-y-1">
                        {(Array.isArray(analysis.fullAnalysis.weaknesses) ? analysis.fullAnalysis.weaknesses : []).map((w: string, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <i className="fas fa-exclamation-triangle text-amber-400 text-[9px] mt-1 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Hook Analysis */}
              {analysis.hookAnalysis && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-magnet text-purple-400 text-xs" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Hook Analysis</h3>
                  </div>
                  {analysis.hookAnalysis.hook_class && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Hook Type:</span>
                      <span className="text-sm font-bold text-purple-400 capitalize">{analysis.hookAnalysis.hook_class}</span>
                    </div>
                  )}
                  {analysis.hookAnalysis.hook_effectiveness_score != null && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Effectiveness:</span>
                      <span className="text-sm font-black">{analysis.hookAnalysis.hook_effectiveness_score}/100</span>
                    </div>
                  )}
                  {analysis.hookAnalysis.analysis && (
                    <p className="text-xs text-slate-300 leading-relaxed">{analysis.hookAnalysis.analysis}</p>
                  )}
                </div>
              )}

              {/* Improvements */}
              {analysis.improvements && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-lightbulb text-yellow-400 text-xs" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Improvements</h3>
                    </div>
                    {analysis.optimizationScore != null && (
                      <span className="text-xs font-black text-yellow-400">
                        {Math.round(analysis.optimizationScore)}% optimized
                      </span>
                    )}
                  </div>
                  {analysis.improvements.suggestions && Array.isArray(analysis.improvements.suggestions) && (
                    <div className="space-y-2">
                      {analysis.improvements.suggestions.map((s: any, i: number) => (
                        <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                          <div className="text-xs font-bold mb-1">{s.title || s.area || `Suggestion ${i + 1}`}</div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{s.suggestion || s.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {analysis.improvements.optimized_caption && (
                    <div className="mt-3 bg-pink-500/5 border border-pink-500/10 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-pink-400 uppercase mb-1">Optimized Caption</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.improvements.optimized_caption}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
