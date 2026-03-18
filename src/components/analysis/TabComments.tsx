import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../../lib/api'

interface TabCommentsProps {
  upload: any
  uploadId: number
  sessionToken: string
}

export default function TabComments({ upload: _upload, uploadId, sessionToken }: TabCommentsProps) {
  const [commentAnalysis, setCommentAnalysis] = useState<any>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const fetchCommentAnalysis = useCallback(async (cId: number) => {
    if (!sessionToken) return
    try {
      const resp = await fetch(`${API_URL}/api/analysis/uploads/${cId}/comments-analysis`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        setCommentAnalysis(data)
      }
    } catch {}
  }, [sessionToken])

  const triggerCommentAnalysis = async () => {
    if (!uploadId || !sessionToken) return
    setCommentLoading(true)
    setCommentError(null)
    try {
      const resp = await fetch(`${API_URL}/api/analysis/uploads/${uploadId}/analyze-comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const data = await resp.json()
      if (!resp.ok) {
        setCommentError(data.error || 'Failed to analyze comments')
      } else {
        setCommentAnalysis({ ...data.analysis, total_comments_analyzed: data.comments_analyzed })
      }
    } catch (err: any) {
      setCommentError(err.message || 'Failed to analyze comments')
    } finally {
      setCommentLoading(false)
    }
  }

  useEffect(() => {
    if (uploadId && sessionToken) {
      fetchCommentAnalysis(uploadId)
    }
  }, [uploadId, sessionToken, fetchCommentAnalysis])

  return (
    <div className="space-y-4">
      {commentAnalysis ? (
        <>
          {/* Summary */}
          {commentAnalysis.summary && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <i className="fas fa-quote-left text-blue-400 text-xs"></i>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Comment Summary</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{commentAnalysis.summary}</p>
              <div className="mt-3 text-[10px] font-bold text-slate-600">
                {commentAnalysis.total_comments_analyzed || commentAnalysis.total_analyzed} comments analyzed
              </div>
            </div>
          )}

          {/* Scores Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Buyer Intent', score: commentAnalysis.buyer_intent_score, color: 'emerald', icon: 'fa-shopping-cart' },
              { label: 'Community', score: commentAnalysis.community_engagement_score, color: 'blue', icon: 'fa-users' },
              { label: 'Controversy', score: commentAnalysis.controversy_score, color: 'orange', icon: 'fa-bolt' },
            ].map(({ label, score, color, icon }) => (
              <div key={label} className="glass-card rounded-2xl p-5 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-full bg-${color}-500/10 flex items-center justify-center`}>
                  <i className={`fas ${icon} text-${color}-400 text-sm`}></i>
                </div>
                <div className="text-2xl font-black text-white">{score ?? '--'}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Sentiment Distribution */}
          {commentAnalysis.sentiment_distribution && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Sentiment Distribution</h3>
              <div className="space-y-2">
                {Object.entries(commentAnalysis.sentiment_distribution).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-16 capitalize">{key}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${key === 'positive' ? 'bg-emerald-500' : key === 'negative' ? 'bg-red-500' : key === 'mixed' ? 'bg-orange-500' : 'bg-slate-500'}`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-white w-10 text-right">{val}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Themes */}
          {commentAnalysis.top_themes && commentAnalysis.top_themes.length > 0 && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Top Themes</h3>
              <div className="space-y-3">
                {(Array.isArray(commentAnalysis.top_themes) ? commentAnalysis.top_themes : []).map((theme: any, i: number) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-white">{theme.theme}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          theme.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                          theme.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>{theme.sentiment}</span>
                        <span className="text-[10px] font-bold text-slate-500">{theme.count} comments</span>
                      </div>
                    </div>
                    {theme.example_comment && (
                      <p className="text-xs text-slate-400 italic pl-3 border-l-2 border-white/10">{theme.example_comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notable Comments */}
          {commentAnalysis.notable_comments && commentAnalysis.notable_comments.length > 0 && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Notable Comments</h3>
              <div className="space-y-3">
                {(Array.isArray(commentAnalysis.notable_comments) ? commentAnalysis.notable_comments : []).map((c: any, i: number) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-slate-300 mb-2">{c.text}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-violet-500/10 text-violet-400 uppercase">{c.intent?.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        c.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                        c.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>{c.sentiment}</span>
                      {c.why_notable && <span className="text-[10px] text-slate-500">{c.why_notable}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Insights */}
          {commentAnalysis.actionable_insights && commentAnalysis.actionable_insights.length > 0 && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Actionable Insights</h3>
              <div className="space-y-2">
                {commentAnalysis.actionable_insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-teal-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience Signals */}
          {commentAnalysis.audience_signals && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Audience Signals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {commentAnalysis.audience_signals.demographics_hints?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Demographics</div>
                    {commentAnalysis.audience_signals.demographics_hints.map((h: string, i: number) => (
                      <div key={i} className="text-xs text-slate-400 mb-1">- {h}</div>
                    ))}
                  </div>
                )}
                {commentAnalysis.audience_signals.content_requests?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Content Requests</div>
                    {commentAnalysis.audience_signals.content_requests.map((r: string, i: number) => (
                      <div key={i} className="text-xs text-slate-400 mb-1">- {r}</div>
                    ))}
                  </div>
                )}
                {commentAnalysis.audience_signals.pain_points?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pain Points</div>
                    {commentAnalysis.audience_signals.pain_points.map((p: string, i: number) => (
                      <div key={i} className="text-xs text-slate-400 mb-1">- {p}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Re-analyze button */}
          <div className="text-center pt-2">
            <button
              onClick={triggerCommentAnalysis}
              disabled={commentLoading}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              {commentLoading ? 'Analyzing...' : 'Re-analyze Comments'}
            </button>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-400/10 rounded-full flex items-center justify-center">
            <i className="fas fa-comments text-blue-400 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">Comment Analysis</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Analyze the comment section to uncover buyer intent, audience sentiment, content ideas, and actionable insights.
          </p>
          {commentError && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 max-w-md mx-auto">
              {commentError}
            </div>
          )}
          <button
            onClick={triggerCommentAnalysis}
            disabled={commentLoading}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {commentLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fetching & Analyzing...
              </span>
            ) : 'Analyze Comments'}
          </button>
        </div>
      )}
    </div>
  )
}
