import { formatNumber, scoreColor, scoreBarColor, getCategoryColor, fmtTime } from './helpers'
import { ExampleVideoCard } from './ExampleVideos'

export interface TabHookProps {
  hook: any
  hookTacticFrequency: any
  benchmarks: any
  virality: any
  topHookVideos: any[]
  onOpenCarousel: (videos: any[], index: number) => void
}

export default function TabHook({
  hook,
  hookTacticFrequency,
  benchmarks,
  virality,
  topHookVideos,
  onOpenCarousel,
}: TabHookProps) {
  const hookClassAnalysis = benchmarks?.hook_class_analysis

  return (
    <div className="space-y-6">
      {/* Scroll-stop power score */}
      {hook?.first_frame && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
            Scroll-Stop Power
          </div>
          <div className={`text-5xl sm:text-7xl font-black ${scoreColor(hook.first_frame.scroll_stop_power || 0)}`}>
            {hook.first_frame.scroll_stop_power ?? '--'}
          </div>
          <div className="text-xs text-slate-500 mt-2">out of 100</div>
        </div>
      )}

      {/* Hook class + verdict */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
        {hook?.hook_class && (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">
              {hook.hook_class}
            </span>
          </div>
        )}
        {hook?.verdict && (
          <p className="text-base font-bold text-white leading-relaxed">{hook.verdict}</p>
        )}
      </div>

      {/* First Frame Analysis */}
      {hook?.first_frame && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-image mr-2 text-pink-400 text-sm"></i>First Frame
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</div>
              <p className="text-sm text-slate-300">{hook.first_frame.description}</p>
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Why It Stops The Scroll</div>
              <p className="text-sm text-slate-400">{hook.first_frame.why}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hook Tactics */}
      {hook?.tactics && hook.tactics.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-chess mr-2 text-indigo-400 text-sm"></i>Hook Tactics
          </h3>
          <div className="space-y-4">
            {hook.tactics.map((tactic: any, idx: number) => {
              const tacticNameLower = (tactic.name || '').toLowerCase().trim();
              const isGoldStandard = hookTacticFrequency?.gold_standard?.some(
                (gs: any) => (gs.name || '').toLowerCase().trim() === tacticNameLower
              );
              const isOverrated = hookTacticFrequency?.overrated?.some(
                (ov: any) => (ov.name || '').toLowerCase().trim() === tacticNameLower
              );
              const execGap = hookTacticFrequency?.execution_gaps?.find(
                (eg: any) => (eg.name || '').toLowerCase().trim() === tacticNameLower
              );
              return (
              <div key={idx} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white">{tactic.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                      {tactic.category}
                    </span>
                    {isGoldStandard && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-500/15 text-teal-400 border border-teal-500/20">
                        <i className="fas fa-check mr-0.5 text-[7px]"></i>Gold Standard
                      </span>
                    )}
                    {isOverrated && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/15 text-red-400 border border-red-500/20">
                        <i className="fas fa-exclamation mr-0.5 text-[7px]"></i>Overrated
                      </span>
                    )}
                    {execGap && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        <i className="fas fa-arrows-alt-v mr-0.5 text-[7px]"></i>Exec Gap
                        {execGap.avg_score_top != null && execGap.avg_score_bottom != null && (
                          <span className="ml-1 text-[8px] opacity-75">
                            (top: {Math.round(execGap.avg_score_top)} / bottom: {Math.round(execGap.avg_score_bottom)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-black ${scoreColor(tactic.execution_score || 0)}`}>
                    {tactic.execution_score}
                  </span>
                </div>
                {/* Score bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(tactic.execution_score || 0)}`}
                    style={{ width: `${Math.min(100, tactic.execution_score || 0)}%` }}
                  ></div>
                </div>
                {tactic.when_sec != null && (
                  <div className="text-[10px] font-bold text-slate-500 mb-1">
                    <i className="fas fa-clock mr-1"></i>{fmtTime(tactic.when_sec)}
                  </div>
                )}
                <p className="text-sm text-slate-300 mb-1">{tactic.what}</p>
                {tactic.viewer_effect && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 mt-1">
                    {tactic.viewer_effect}
                  </span>
                )}
                {tactic.execution_note && (
                  <p className="text-xs text-slate-500 mt-1 italic">{tactic.execution_note}</p>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promise Setup */}
      {hook?.promise_setup && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-bullseye mr-2 text-orange-400 text-sm"></i>Promise Setup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Planted</div>
              <div className="flex items-center gap-2">
                {hook.promise_setup.promise_planted ? (
                  <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes</span>
                ) : (
                  <span className="text-red-400 font-black text-sm"><i className="fas fa-times-circle mr-1"></i>No</span>
                )}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Single Promise</div>
              <div className="flex items-center gap-2">
                {hook.promise_setup.is_single_promise ? (
                  <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes</span>
                ) : (
                  <span className="text-yellow-400 font-black text-sm"><i className="fas fa-exclamation-circle mr-1"></i>No</span>
                )}
              </div>
            </div>
            {hook.promise_setup.promise_text && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Text</div>
                <p className="text-sm text-slate-300">{hook.promise_setup.promise_text}</p>
              </div>
            )}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Curiosity Loop</div>
              {hook.promise_setup.curiosity_loop_opened ? (
                <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Opened</span>
              ) : (
                <span className="text-slate-500 font-black text-sm"><i className="fas fa-minus-circle mr-1"></i>Not opened</span>
              )}
            </div>
            {hook.promise_setup.loop_description && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Loop Description</div>
                <p className="text-sm text-slate-400">{hook.promise_setup.loop_description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio in First 3s */}
      {hook?.audio_in_first_3s && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-volume-up mr-2 text-violet-400 text-sm"></i>Audio (First 3 Seconds)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Type</div>
              <p className="text-sm font-bold text-white capitalize">{hook.audio_in_first_3s.type}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</div>
              <p className="text-sm text-slate-300">{hook.audio_in_first_3s.description}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Impact</div>
              <p className="text-sm text-slate-400">{hook.audio_in_first_3s.impact}</p>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Patterns */}
      {hook?.anti_patterns_detected && hook.anti_patterns_detected.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-shield-alt mr-2 text-red-400 text-sm"></i>Anti-Patterns Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {hook.anti_patterns_detected.map((pattern: string, idx: number) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20">
                <i className="fas fa-exclamation-triangle mr-1.5 text-[9px]"></i>
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* HOOK CLASS COMPARISON */}

      {/* Section A: Your Hook vs Hook Class Benchmark */}
      {benchmarks?.hook_name && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-chart-bar mr-2 text-purple-400 text-sm"></i>Your Hook vs "{benchmarks.hook_name}"
          </h3>
          {(benchmarks.hook_video_count || 0) <= 1 ? (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className="text-sm text-slate-400 italic">
                <i className="fas fa-info-circle mr-1.5 text-slate-500"></i>
                This hook class was just identified. More data will accumulate as similar videos are analyzed.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {virality?.benchmark_comparison?.hook_percentile != null && (
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hook Percentile</div>
                    <div className={`text-xl font-black ${scoreColor(virality.benchmark_comparison.hook_percentile)}`}>
                      {virality.benchmark_comparison.hook_percentile}<span className="text-xs text-slate-500">%ile</span>
                    </div>
                  </div>
                )}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Videos in Class</div>
                  <div className="text-xl font-black text-white">{formatNumber(benchmarks.hook_video_count || 0)}</div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Class Avg Views</div>
                  <div className="text-xl font-black text-white">{formatNumber(benchmarks.hook_avg_views || 0)}</div>
                </div>
                {benchmarks.hook_avg_engagement != null && (
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Class Avg Engagement</div>
                    <div className="text-xl font-black text-white">{Number(benchmarks.hook_avg_engagement).toFixed(1)}%</div>
                  </div>
                )}
              </div>
              {benchmarks.hook_lifecycle && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stage:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    benchmarks.hook_lifecycle === 'emerging' ? 'bg-teal-500/15 text-teal-400' :
                    benchmarks.hook_lifecycle === 'rising' ? 'bg-lime-500/15 text-lime-400' :
                    benchmarks.hook_lifecycle === 'peaking' ? 'bg-orange-500/15 text-orange-400' :
                    benchmarks.hook_lifecycle === 'stable' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>{benchmarks.hook_lifecycle}</span>
                </div>
              )}
              {(benchmarks.hook_video_count || 0) < 3 && (benchmarks.hook_video_count || 0) > 1 && (
                <div className="mt-3 text-xs text-slate-500 italic">
                  <i className="fas fa-info-circle mr-1"></i>
                  Limited data ({benchmarks.hook_video_count} videos). Comparison may not be statistically meaningful.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Section B: Gold Standard / Execution Gaps / Overrated from class_analysis */}
      {hookClassAnalysis &&
        (hookClassAnalysis.gold_standard_tactics?.length > 0 ||
         hookClassAnalysis.execution_gaps?.length > 0 ||
         hookClassAnalysis.overrated_tactics?.length > 0) && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-6">
              <i className="fas fa-microscope mr-2 text-purple-400 text-sm"></i>Hook Class Best & Worst Practices
            </h3>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Gold Standard */}
              {hookClassAnalysis.gold_standard_tactics?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-teal-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-check-circle"></i> Gold Standard
                  </h4>
                  <div className="space-y-3">
                    {hookClassAnalysis.gold_standard_tactics.map((tactic: any, i: number) => (
                      <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 border-l-4 border-l-teal-500">
                        {tactic.category && (
                          <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                            {tactic.category}
                          </div>
                        )}
                        <h5 className="font-bold text-white text-sm mb-1">{tactic.tactic || tactic.name}</h5>
                        {(tactic.analysis || tactic.description || tactic.why) && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {tactic.analysis || tactic.description || tactic.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Gaps */}
              {hookClassAnalysis.execution_gaps?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-orange-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i> Execution Gaps
                  </h4>
                  <div className="space-y-3">
                    {hookClassAnalysis.execution_gaps.map((tactic: any, i: number) => (
                      <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 border-l-4 border-l-orange-500">
                        {tactic.category && (
                          <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                            {tactic.category}
                          </div>
                        )}
                        <h5 className="font-bold text-white text-sm mb-1">{tactic.tactic || tactic.name}</h5>
                        {(tactic.analysis || tactic.description || tactic.why) && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {tactic.analysis || tactic.description || tactic.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overrated */}
              {hookClassAnalysis.overrated_tactics?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-times-circle"></i> Overrated
                  </h4>
                  <div className="space-y-3">
                    {hookClassAnalysis.overrated_tactics.map((tactic: any, i: number) => (
                      <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 border-l-4 border-l-red-500 opacity-80 hover:opacity-100 transition-opacity">
                        {tactic.category && (
                          <div className={`text-[10px] font-black uppercase mb-1 inline-block px-1.5 py-0.5 rounded ${getCategoryColor(tactic.category)}`}>
                            {tactic.category}
                          </div>
                        )}
                        <h5 className="font-bold text-white text-sm mb-1">{tactic.tactic || tactic.name}</h5>
                        {(tactic.analysis || tactic.description || tactic.why) && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {tactic.analysis || tactic.description || tactic.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
      )}

      {/* Section D: Missing Gold Standard Hook Tactics */}
      {(() => {
        if (!hookTacticFrequency?.gold_standard?.length || !hook?.tactics) return null;
        const userTacticNames = new Set(
          (hook.tactics as any[]).map((t: any) => (t.name || '').toLowerCase().trim())
        );
        const missing = hookTacticFrequency.gold_standard.filter(
          (gs: any) => !userTacticNames.has((gs.name || '').toLowerCase().trim())
        );
        if (missing.length === 0) return null;
        return (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              <i className="fas fa-trophy mr-2 text-amber-400 text-sm"></i>Missing Gold-Standard Hook Tactics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Top performers in this hook class use these tactics significantly more often.
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map((t: any, i: number) => (
                <div key={i} className="px-3 py-2 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20">
                  <span className="font-black text-amber-400">
                    <i className="fas fa-plus mr-1 text-[8px]"></i>{t.name}
                  </span>
                  {t.top_freq != null && t.bottom_freq != null && (
                    <span className="text-amber-400/60 ml-2 text-[10px]">
                      {t.top_freq}% top vs {t.bottom_freq}% bottom
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Section E: Top Performers in Hook Class */}
      {topHookVideos && topHookVideos.length > 0 && benchmarks?.hook_name && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-crown mr-2 text-purple-400 text-sm"></i>Top Performers — "{benchmarks.hook_name}"
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {topHookVideos.map((v: any, i: number) => (
              <ExampleVideoCard key={v.video_id} video={v} videos={topHookVideos} index={i} onOpenCarousel={onOpenCarousel} />
            ))}
          </div>
          {topHookVideos.length > 4 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <i className="fas fa-chevron-left text-[7px] text-slate-600"></i>
              {Array.from({ length: Math.min(topHookVideos.length, 8) }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-purple-400/60' : 'bg-slate-700'}`} />
              ))}
              <i className="fas fa-chevron-right text-[7px] text-slate-600"></i>
              <span className="text-[9px] text-slate-600 ml-1">{topHookVideos.length} videos</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
