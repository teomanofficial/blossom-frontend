import { useState } from 'react'
import { ExampleVideoRow } from './ExampleVideos'
import { scoreColor, effortColor, getCategoryColor, fmtTime } from './helpers'

export interface TabImprovementsProps {
  improv: any
  exampleVideos: any
  onOpenCarousel: (videos: any[], index: number) => void
}

export default function TabImprovements({ improv, exampleVideos, onOpenCarousel }: TabImprovementsProps) {
  const [expandedHooks, setExpandedHooks] = useState<Set<number>>(new Set())

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-pink-500/40 via-orange-400/40 to-yellow-400/40">
      <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-rocket text-white text-xs sm:text-sm"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">How to Improve This Content</h2>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Actionable suggestions to boost performance
                {improv?.fine_tune_enhanced && (
                  <span className="ml-2 px-2 py-0.5 bg-pink-500/15 text-pink-400 text-[9px] font-black rounded-md uppercase tracking-widest">
                    <i className="fas fa-sliders mr-1"></i>Fine-tuned
                  </span>
                )}
              </p>
            </div>
          </div>
          {improv?.optimization_score != null && (
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</div>
              <div className={`text-2xl sm:text-3xl font-black ${scoreColor(improv.optimization_score)}`}>{improv.optimization_score}<span className="text-xs sm:text-sm text-slate-600">/100</span></div>
            </div>
          )}
        </div>

        {/* Improvements content */}
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">

          {/* Version Progress Summary (if versioned) */}
          {improv?.version_progress && (
            <div className="rounded-xl bg-gradient-to-r from-purple-500/5 to-teal-500/5 border border-purple-500/15 p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-chart-line text-purple-400 text-xs"></i>
                <span className="text-xs font-black text-purple-300 uppercase tracking-widest">Version Progress</span>
                {improv.version_progress.fixed_weaknesses?.length > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-teal-500/15 text-teal-300">
                    {improv.version_progress.fixed_weaknesses.length} weaknesses fixed
                  </span>
                )}
                {improv.version_progress.implemented_items?.length > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-teal-500/15 text-teal-300">
                    {improv.version_progress.implemented_items.length} suggestions implemented
                  </span>
                )}
              </div>
              {improv.version_progress.overall_progress_summary && (
                <p className="text-sm text-slate-300 leading-relaxed">{improv.version_progress.overall_progress_summary}</p>
              )}
            </div>
          )}

          {/* Priority Actions */}
          {improv?.priority_actions && improv.priority_actions.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-list-ol text-pink-400 text-xs"></i>Priority Actions
              </h3>
              <div className="space-y-3">
                {improv.priority_actions.map((action: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-white">{action.rank ?? idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-2">{action.action}</p>
                      <div className="flex items-center gap-2">
                        {action.effort && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${effortColor(action.effort)}`}>
                            <i className="fas fa-bolt mr-1 text-[8px]"></i>{action.effort} effort
                          </span>
                        )}
                        {action.expected_impact && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-400">
                            <i className="fas fa-chart-line mr-1 text-[8px]"></i>{action.expected_impact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ExampleVideoRow videos={exampleVideos?.priority_actions?.flatMap((p: any) => p.examples)} label="Top videos using these strategies" onOpenCarousel={onOpenCarousel} />
            </div>
          )}

          {/* Alternative Hooks */}
          {improv?.alternative_hooks && improv.alternative_hooks.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-magic text-purple-400 text-xs"></i>Alternative Hooks
              </h3>
              <div className="space-y-4">
                {improv.alternative_hooks.map((alt: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                    <button
                      onClick={() => {
                        setExpandedHooks((prev: Set<number>) => {
                          const next = new Set(prev);
                          if (next.has(idx)) next.delete(idx);
                          else next.add(idx);
                          return next;
                        });
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-400 capitalize">
                          {alt.type}
                        </span>
                        {alt.estimated_scroll_stop_improvement && (
                          <span className="text-[10px] font-bold text-teal-400">
                            <i className="fas fa-arrow-up mr-0.5 text-[8px]"></i>{alt.estimated_scroll_stop_improvement}
                          </span>
                        )}
                      </div>
                      <i className={`fas fa-chevron-${expandedHooks.has(idx) ? 'up' : 'down'} text-slate-500 text-xs`}></i>
                    </button>
                    {expandedHooks.has(idx) && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Script</div>
                          <p className="text-sm text-white bg-white/[0.03] rounded-lg p-3 border border-white/5 leading-relaxed">{alt.script}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Why It's Better</div>
                          <p className="text-sm text-slate-400">{alt.why_better}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ExampleVideoRow videos={exampleVideos?.alternative_hooks?.flatMap((p: any) => p.examples)} label="Example videos with strong hooks" onOpenCarousel={onOpenCarousel} />
            </div>
          )}

          {/* Retention Improvements */}
          {improv?.retention_improvements && improv.retention_improvements.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-user-clock text-blue-400 text-xs"></i>Retention Improvements
              </h3>
              <div className="space-y-4">
                {improv.retention_improvements.map((ret: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500/15 text-blue-400">
                        <i className="fas fa-clock mr-1 text-[9px]"></i>{fmtTime(ret.timestamp_sec)}
                      </span>
                      {ret.tactic_to_add && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-400">
                          + {ret.tactic_to_add}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Current Issue</span>
                      </div>
                      <p className="text-sm text-red-300/80 pl-3.5">{ret.current_issue}</p>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Suggested Change</span>
                      </div>
                      <p className="text-sm text-teal-300/80 pl-3.5">{ret.suggested_change}</p>
                    </div>
                    {ret.expected_impact && (
                      <div className="text-xs text-slate-500 pl-3.5 italic">
                        <i className="fas fa-chart-line mr-1 text-[9px]"></i>{ret.expected_impact}
                      </div>
                    )}
                    <ExampleVideoRow videos={exampleVideos?.retention_improvements?.[idx]?.examples} label="See this tactic in action" onOpenCarousel={onOpenCarousel} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing High-Impact Tactics */}
          {improv?.missing_high_impact_tactics && improv.missing_high_impact_tactics.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-puzzle-piece text-amber-400 text-xs"></i>Missing High-Impact Tactics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {improv.missing_high_impact_tactics.map((tactic: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] rounded-xl p-5 border border-white/5 border-l-4 border-l-amber-400/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-black text-white">{tactic.tactic_name}</span>
                      {tactic.category && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                          {(tactic.category || '').replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {tactic.where_to_insert && (
                      <div className="mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Where: </span>
                        <span className="text-xs text-slate-400">{tactic.where_to_insert}</span>
                      </div>
                    )}
                    {tactic.implementation && (
                      <div className="mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How: </span>
                        <span className="text-xs text-slate-300">{tactic.implementation}</span>
                      </div>
                    )}
                    {tactic.why_high_impact && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Why High Impact: </span>
                        <span className="text-xs text-slate-400">{tactic.why_high_impact}</span>
                      </div>
                    )}
                    <ExampleVideoRow videos={exampleVideos?.missing_tactics?.[idx]?.examples} label="This video nails it" onOpenCarousel={onOpenCarousel} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before / After Rewrites */}
          {improv?.before_after_rewrites && improv.before_after_rewrites.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-exchange-alt text-emerald-400 text-xs"></i>Before / After Rewrites
              </h3>
              <div className="space-y-6">
                {improv.before_after_rewrites.map((rw: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    {rw.section && (
                      <div className="text-xs font-black text-white uppercase tracking-widest">
                        <i className="fas fa-tag mr-1.5 text-[9px] text-slate-500"></i>{rw.section}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Before</span>
                        </div>
                        <p className="text-sm text-red-300/70 leading-relaxed">{rw.before}</p>
                      </div>
                      <div className="bg-teal-500/[0.04] rounded-xl p-4 border border-teal-500/10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                          <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">After</span>
                        </div>
                        <p className="text-sm text-teal-300/70 leading-relaxed">{rw.after}</p>
                      </div>
                    </div>
                    {rw.improvement_rationale && (
                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Rationale:</span>
                        <span className="text-xs text-slate-400">{rw.improvement_rationale}</span>
                      </div>
                    )}
                    <ExampleVideoRow videos={exampleVideos?.before_after?.[idx]?.examples} label="Example of the improved version" onOpenCarousel={onOpenCarousel} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Amplifiers */}
          {improv?.engagement_amplifiers && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-bullhorn text-yellow-400 text-xs"></i>Engagement Amplifiers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-comment mr-1"></i>Comment Bait
                  </div>
                  {improv.engagement_amplifiers.comment_bait_suggestions?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.engagement_amplifiers.comment_bait_suggestions.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-chevron-right text-yellow-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-bookmark mr-1"></i>Save Triggers
                  </div>
                  {improv.engagement_amplifiers.save_worthy_moments?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.engagement_amplifiers.save_worthy_moments.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-chevron-right text-blue-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-share-alt mr-1"></i>Share Triggers
                  </div>
                  {improv.engagement_amplifiers.share_triggers?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.engagement_amplifiers.share_triggers.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-chevron-right text-orange-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
              </div>
              {improv.engagement_amplifiers.duet_stitch_potential && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-2">
                    <i className="fas fa-layer-group mr-1"></i>Duet / Stitch Potential
                  </div>
                  <p className="text-sm text-slate-300">{improv.engagement_amplifiers.duet_stitch_potential}</p>
                </div>
              )}
            </div>
          )}

          {/* Trend Alignment */}
          {improv?.trend_alignment && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-fire text-lime-400 text-xs"></i>Trend Alignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-lime-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-trending-up mr-1"></i>Trends to Leverage
                  </div>
                  {improv.trend_alignment.current_trends_to_leverage?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.trend_alignment.current_trends_to_leverage.map((t: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-fire text-lime-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-random mr-1"></i>Format Remixes
                  </div>
                  {improv.trend_alignment.format_remix_suggestions?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.trend_alignment.format_remix_suggestions.map((f: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-shapes text-cyan-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-music mr-1"></i>Audio Suggestions
                  </div>
                  {improv.trend_alignment.audio_suggestions?.length > 0 ? (
                    <ul className="space-y-2">
                      {improv.trend_alignment.audio_suggestions.map((a: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className="fas fa-volume-up text-violet-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                          {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">No suggestions</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Virality Optimization */}
          {improv?.virality_optimization && (
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-fire text-orange-400 text-xs"></i>Virality Optimization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'SEO Improvements', items: improv.virality_optimization.seo_improvements, icon: 'fa-search', color: 'teal' },
                  { label: 'Shareability Boosters', items: improv.virality_optimization.shareability_boosters, icon: 'fa-share-alt', color: 'orange' },
                  { label: 'Save Triggers to Add', items: improv.virality_optimization.save_triggers_to_add, icon: 'fa-bookmark', color: 'blue' },
                  { label: 'Authenticity Adjustments', items: improv.virality_optimization.authenticity_adjustments, icon: 'fa-fingerprint', color: 'emerald' },
                  { label: 'Platform-Specific Fixes', items: improv.virality_optimization.platform_specific_fixes, icon: 'fa-mobile-alt', color: 'purple' },
                ].filter(section => section.items && section.items.length > 0).map((section) => (
                  <div key={section.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className={`text-[10px] font-black text-${section.color}-400 uppercase tracking-widest mb-3`}>
                      <i className={`fas ${section.icon} mr-1`}></i>{section.label}
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <i className={`fas fa-check text-${section.color}-400/50 text-[7px] mt-1 flex-shrink-0`}></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data-Grounded Actions (from benchmarks) */}
          {improv?.benchmark_grounded_actions && improv.benchmark_grounded_actions.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <i className="fas fa-database text-cyan-400 text-xs"></i>Data-Grounded Actions
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">Based on analysis of 34,000+ videos in our database</p>
              <div className="space-y-3">
                {improv.benchmark_grounded_actions.map((bga: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] rounded-xl p-5 border border-white/5 border-l-4 border-l-cyan-400/50">
                    <p className="text-sm font-bold text-white mb-3">{bga.action}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {bga.current_state && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Current</span>
                          </div>
                          <p className="text-xs text-red-300/70">{bga.current_state}</p>
                        </div>
                      )}
                      {bga.benchmark_target && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Target</span>
                          </div>
                          <p className="text-xs text-teal-300/70">{bga.benchmark_target}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {bga.data_source && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/10 text-cyan-400">
                          <i className="fas fa-database mr-1 text-[7px]"></i>{bga.data_source}
                        </span>
                      )}
                      {bga.expected_lift && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-lime-500/10 text-lime-400">
                          <i className="fas fa-arrow-up mr-1 text-[7px]"></i>{bga.expected_lift}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
