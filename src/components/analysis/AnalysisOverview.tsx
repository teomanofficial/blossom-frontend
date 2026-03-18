import { useState } from 'react'
import { API_URL } from '../../lib/api'
import { scoreColor } from './helpers'

export interface AnalysisOverviewProps {
  upload: any
  full: any
  hook: any
  virality: any
  improv: any
  uploadId: number
  sessionToken: string
  onTitleUpdate: (newTitle: string) => void
}

export default function AnalysisOverview({
  upload,
  full,
  hook,
  virality,
  improv,
  uploadId,
  sessionToken,
  onTitleUpdate,
}: AnalysisOverviewProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [_savingTitle, setSavingTitle] = useState(false)

  const scoreBreakdown = improv?.score_breakdown

  const saveTitle = async () => {
    if (!uploadId || !sessionToken || !titleDraft.trim()) {
      setEditingTitle(false)
      return
    }
    setSavingTitle(true)
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis/${uploadId}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ title: titleDraft.trim() }),
      })
      if (resp.ok) {
        const data = await resp.json()
        onTitleUpdate(data.title)
      }
    } catch (err) {
      console.error('Failed to save title:', err)
    } finally {
      setSavingTitle(false)
      setEditingTitle(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video info card */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Thumbnail */}
          {upload?.thumbnail_path && (
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-900">
                <img
                  src={upload.thumbnail_path.startsWith('http') ? upload.thumbnail_path : `/media/${upload.thumbnail_path.split('/').pop()}`}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4">
            {/* Platform + Username */}
            <div className="flex items-center gap-3">
              {upload?.platform && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white/10 capitalize flex items-center gap-1.5">
                  <i className={`fab fa-${upload.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[10px]`}></i>
                  {upload.platform}
                </span>
              )}
              {upload?.username && (
                <span className="text-sm font-bold text-slate-300">@{upload.username}</span>
              )}
              {upload?.source_type && (
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-white/5 text-slate-500 uppercase">
                  {upload.source_type}
                </span>
              )}
            </div>

            {/* Editable Title */}
            <div className="group/title">
              {editingTitle ? (
                <div>
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onBlur={(e) => {
                      // Don't save on blur if tapping the save button (mobile)
                      if (e.relatedTarget?.getAttribute('data-save-title')) return
                      saveTitle()
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false) } }}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:border-pink-500/50"
                    maxLength={200}
                  />
                  <div className="flex justify-end mt-2 sm:hidden">
                    <button
                      data-save-title="true"
                      onClick={() => saveTitle()}
                      className="px-4 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 text-xs font-black hover:bg-pink-500/30 transition-all"
                    >
                      <i className="fas fa-check mr-1.5"></i>Save
                    </button>
                  </div>
                </div>
              ) : (
                <h2
                  onClick={() => { setEditingTitle(true); setTitleDraft(upload?.title || upload?.caption || '') }}
                  className="text-base sm:text-lg font-black text-white cursor-pointer hover:text-pink-400 transition-colors"
                  title="Click to edit title"
                >
                  {upload?.title || upload?.caption || 'Untitled'}
                  <i className="fas fa-pencil-alt ml-2 text-xs text-slate-600 opacity-0 group-hover/title:opacity-100 transition-opacity"></i>
                </h2>
              )}
            </div>

            {/* Caption (shown separately if different from title) */}
            {upload?.caption && upload?.title && upload.caption !== upload.title && (
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{upload.caption}</p>
            )}
            {/* Caption fallback if no title */}
            {upload?.caption && !upload?.title && (
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{upload.caption}</p>
            )}

            {/* One-line verdict */}
            {full?.one_line_verdict && (
              <div className="pt-2">
                <p className="text-base sm:text-xl font-black gradient-text leading-snug">{full.one_line_verdict}</p>
              </div>
            )}

            {/* Format + Hook class badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {full?.format_class && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-500/15 text-pink-400 capitalize">
                  <i className="fas fa-shapes mr-1.5 text-[9px]"></i>
                  {full.format_class}
                </span>
              )}
              {hook?.hook_class && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">
                  <i className="fas fa-magnet mr-1.5 text-[9px]"></i>
                  {hook.hook_class}
                </span>
              )}
            </div>

            {/* Scores inline */}
            {(improv?.optimization_score != null || virality?.overall_virality_score != null) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                {improv?.optimization_score != null && (
                  <div className="bg-white/[0.03] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/5 flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`text-2xl sm:text-3xl font-black ${scoreColor(improv.optimization_score)} flex-shrink-0`}>
                      {improv.optimization_score}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">Optimization</div>
                      <div className="text-[8px] sm:text-[9px] text-slate-600">out of 100</div>
                    </div>
                  </div>
                )}
                {virality?.overall_virality_score != null && (
                  <div className="bg-white/[0.03] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/5 flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`text-2xl sm:text-3xl font-black ${scoreColor(virality.overall_virality_score)} flex-shrink-0`}>
                      {virality.overall_virality_score}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                        <i className="fas fa-fire mr-1 text-orange-400"></i>Virality
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-slate-600">out of 100</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Score Breakdown */}
            {scoreBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-2">
                {[
                  { label: 'Hook Power', value: scoreBreakdown.hook_power, icon: 'fa-bolt' },
                  { label: 'Retention', value: scoreBreakdown.retention_strength, icon: 'fa-magnet' },
                  { label: 'Emotional Impact', value: scoreBreakdown.emotional_impact, icon: 'fa-heart' },
                  { label: 'Shareability', value: scoreBreakdown.shareability, icon: 'fa-share-alt' },
                  { label: 'Tactic Execution', value: scoreBreakdown.tactic_execution, icon: 'fa-crosshairs' },
                ].map((card) => (
                  <div key={card.label} className="bg-white/[0.03] rounded-xl px-2.5 sm:px-3 py-2 border border-white/5 flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      (card.value || 0) >= 70
                        ? 'border-teal-400/50'
                        : (card.value || 0) >= 40
                        ? 'border-yellow-400/50'
                        : 'border-red-400/50'
                    }`}>
                      <span className={`text-xs sm:text-sm font-black ${scoreColor(card.value || 0)}`}>
                        {card.value ?? '--'}
                      </span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-wider min-w-0 truncate">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
