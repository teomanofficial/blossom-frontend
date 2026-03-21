import { scoreColor, fmtTime } from './helpers'

interface TabViralityProps {
  virality: any
  benchmarks: any
  upload?: any
}

export default function TabVirality({ virality, upload }: TabViralityProps) {
  if (!virality) return null

  return (
    <div className="space-y-6">
      {/* Overall Virality Score */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          <i className="fas fa-fire mr-1 text-orange-400"></i>Overall Virality Score
        </div>
        <div className={`text-5xl sm:text-7xl font-black ${scoreColor(virality.overall_virality_score || 0)}`}>
          {virality.overall_virality_score ?? '--'}
        </div>
        <div className="text-xs text-slate-500 mt-2">out of 100</div>
      </div>

      {/* Universal Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {[
          { label: 'Shareability', value: virality.shareability?.score, icon: 'fa-share-alt', color: 'orange' },
          { label: 'Save Value', value: virality.save_value?.score, icon: 'fa-bookmark', color: 'blue' },
          { label: 'Rewatch', value: virality.rewatch?.score, icon: 'fa-redo', color: 'purple' },
          { label: 'Authenticity', value: virality.authenticity?.score, icon: 'fa-fingerprint', color: 'teal' },
          { label: 'Emotional ROI', value: virality.emotional_roi?.score, icon: 'fa-heart', color: 'pink' },
        ].map((card) => (
          <div key={card.label} className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full border-2 flex items-center justify-center mb-2 sm:mb-3 ${
              (card.value || 0) >= 70 ? 'border-teal-400/50' : (card.value || 0) >= 40 ? 'border-yellow-400/50' : 'border-red-400/50'
            }`}>
              <span className={`text-lg sm:text-2xl font-black ${scoreColor(card.value || 0)}`}>
                {card.value ?? '--'}
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark Comparison */}
      {(virality.benchmark_comparison || virality.format_momentum) && (
        <div className="space-y-4">
          {/* Niche Percentile */}
          {virality.benchmark_comparison?.niche_rank && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-chart-bar text-cyan-400 text-xs"></i>Niche Ranking
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center col-span-2 sm:col-span-1">
                  <div className={`text-lg sm:text-2xl font-black mb-1 ${
                    virality.benchmark_comparison.niche_rank.includes('top_1') ? 'text-teal-400' :
                    virality.benchmark_comparison.niche_rank.includes('top_5') ? 'text-lime-400' :
                    virality.benchmark_comparison.niche_rank.includes('top_10') ? 'text-yellow-400' :
                    virality.benchmark_comparison.niche_rank.includes('top_25') ? 'text-orange-400' :
                    'text-slate-400'
                  }`}>{virality.benchmark_comparison.niche_rank.replace(/_/g, ' ').replace('pct', '%')}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Niche Rank</div>
                </div>
                {virality.benchmark_comparison.format_percentile != null && (
                  <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                    <div className={`text-lg sm:text-2xl font-black mb-1 ${scoreColor(virality.benchmark_comparison.format_percentile)}`}>
                      {virality.benchmark_comparison.format_percentile}%
                    </div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Format %ile</div>
                  </div>
                )}
                {virality.benchmark_comparison.hook_percentile != null && (
                  <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                    <div className={`text-lg sm:text-2xl font-black mb-1 ${scoreColor(virality.benchmark_comparison.hook_percentile)}`}>
                      {virality.benchmark_comparison.hook_percentile}%
                    </div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hook %ile</div>
                  </div>
                )}
              </div>
              {virality.benchmark_comparison.engagement_vs_niche_avg && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 mt-4">
                  <div className="text-sm font-black text-white mb-1">{virality.benchmark_comparison.engagement_vs_niche_avg}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">vs Niche Avg</div>
                </div>
              )}
            </div>
          )}

          {/* Tactic Gap Analysis */}
          {virality.benchmark_comparison && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-chess text-amber-400 text-xs"></i>Tactic Gap Analysis
              </h3>
              {virality.benchmark_comparison.missing_gold_standard_tactics?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-trophy mr-1"></i>Missing Gold-Standard Tactics
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {virality.benchmark_comparison.missing_gold_standard_tactics.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <i className="fas fa-plus mr-1 text-[8px]"></i>{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {virality.benchmark_comparison.overrated_tactics_present?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-exclamation-triangle mr-1"></i>Overrated Tactics Used
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {virality.benchmark_comparison.overrated_tactics_present.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <i className="fas fa-minus mr-1 text-[8px]"></i>{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {virality.benchmark_comparison.tactic_gap_analysis && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Analysis</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{virality.benchmark_comparison.tactic_gap_analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Format Momentum */}
          {virality.format_momentum && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-lime-400 text-xs"></i>Format Momentum
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {virality.format_momentum.lifecycle_stage && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Lifecycle Stage</div>
                    <span className={`text-sm font-black capitalize ${
                      virality.format_momentum.lifecycle_stage === 'emerging' ? 'text-teal-400' :
                      virality.format_momentum.lifecycle_stage === 'rising' ? 'text-lime-400' :
                      virality.format_momentum.lifecycle_stage === 'peaking' ? 'text-orange-400' :
                      virality.format_momentum.lifecycle_stage === 'stable' ? 'text-blue-400' :
                      'text-red-400'
                    }`}>{virality.format_momentum.lifecycle_stage}</span>
                  </div>
                )}
                {virality.format_momentum.timing_assessment && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Timing Assessment</div>
                    <p className="text-sm text-slate-300">{virality.format_momentum.timing_assessment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shareability Breakdown */}
      {virality.shareability && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              <i className="fas fa-share-alt mr-2 text-orange-400 text-sm"></i>Shareability Breakdown
            </h3>
            <div className={`text-2xl font-black ${scoreColor(virality.shareability.score || 0)}`}>
              {virality.shareability.score ?? '--'}<span className="text-sm text-slate-500 font-normal">/100</span>
            </div>
          </div>

          {/* Score Reasoning */}
          {virality.shareability.score_reasoning && (
            <div className="bg-orange-500/[0.04] rounded-xl p-4 border border-orange-500/10 mb-4">
              <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">
                <i className="fas fa-brain mr-1"></i>Why This Score
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{virality.shareability.score_reasoning}</p>
            </div>
          )}

          {/* Sub-scores row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
              <div className={`text-2xl font-black mb-1 ${scoreColor(virality.shareability.score || 0)}`}>
                {virality.shareability.score ?? '--'}
              </div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                <i className="fas fa-share-alt mr-1 text-[8px]"></i>Share Score
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
              <div className={`text-2xl font-black mb-1 ${scoreColor(virality.shareability.dm_send_likelihood || 0)}`}>
                {virality.shareability.dm_send_likelihood ?? '--'}
              </div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                <i className="fas fa-paper-plane mr-1 text-[8px]"></i>DM Send Likelihood
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {virality.shareability.share_motivation && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Share Motivation</div>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-400 capitalize">
                  {virality.shareability.share_motivation.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            {virality.shareability.social_currency_type && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Social Currency</div>
                <p className="text-sm text-slate-300">{virality.shareability.social_currency_type}</p>
              </div>
            )}
            {virality.shareability.share_context && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <i className="fas fa-comment-dots mr-1 text-blue-400"></i>Share Scenario
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{virality.shareability.share_context}"</p>
              </div>
            )}
            {virality.shareability.share_friction && (
              <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10 md:col-span-2">
                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">
                  <i className="fas fa-exclamation-triangle mr-1"></i>Share Friction
                </div>
                <p className="text-sm text-red-300/70">{virality.shareability.share_friction}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewatch Analysis */}
      {virality.rewatch && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-redo mr-2 text-purple-400 text-sm"></i>Rewatch Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Loop Detected</div>
              {virality.rewatch.loop_detected ? (
                <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes — {virality.rewatch.loop_type}</span>
              ) : (
                <span className="text-slate-500 font-black text-sm"><i className="fas fa-minus-circle mr-1"></i>No loop</span>
              )}
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Info Density</div>
              <span className={`font-black text-sm capitalize ${
                virality.rewatch.information_density === 'overwhelming' || virality.rewatch.information_density === 'high'
                  ? 'text-teal-400' : virality.rewatch.information_density === 'moderate' ? 'text-yellow-400' : 'text-red-400'
              }`}>{virality.rewatch.information_density}</span>
            </div>
            {virality.rewatch.hidden_details && virality.rewatch.hidden_details.length > 0 && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hidden Details</div>
                <ul className="space-y-1">
                  {virality.rewatch.hidden_details.map((d: string, i: number) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <i className="fas fa-eye text-[8px] text-purple-400 mt-1 flex-shrink-0"></i>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authenticity */}
      {virality.authenticity && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-fingerprint mr-2 text-teal-400 text-sm"></i>Authenticity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Production Level</div>
              <span className="text-sm font-black text-white capitalize">{virality.authenticity.production_level?.replace(/_/g, ' ')}</span>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Detection Risk</div>
              <span className={`font-black text-sm capitalize ${
                virality.authenticity.ai_detection_risk === 'none' || virality.authenticity.ai_detection_risk === 'low'
                  ? 'text-teal-400' : virality.authenticity.ai_detection_risk === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{virality.authenticity.ai_detection_risk}</span>
            </div>
            {virality.authenticity.signals && virality.authenticity.signals.length > 0 && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Signals</div>
                <div className="flex flex-wrap gap-2">
                  {virality.authenticity.signals.map((s: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Value */}
      {virality.save_value && virality.save_value.save_triggers && virality.save_value.save_triggers.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-bookmark mr-2 text-blue-400 text-sm"></i>Save Value
            {virality.save_value.save_category && virality.save_value.save_category !== 'none' && (
              <span className="ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 capitalize">
                {virality.save_value.save_category}
              </span>
            )}
          </h3>
          <ul className="space-y-2">
            {virality.save_value.save_triggers.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <i className="fas fa-bookmark text-[9px] text-blue-400 mt-1.5 flex-shrink-0"></i>{t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emotional ROI */}
      {virality.emotional_roi && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-heart mr-2 text-pink-400 text-sm"></i>Emotional ROI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {virality.emotional_roi.promise_quality && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise</div>
                <p className="text-sm text-slate-300">{virality.emotional_roi.promise_quality}</p>
              </div>
            )}
            {virality.emotional_roi.payoff_quality && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payoff Quality</div>
                <span className={`font-black text-sm capitalize ${
                  virality.emotional_roi.payoff_quality === 'exceeded' || virality.emotional_roi.payoff_quality === 'satisfying'
                    ? 'text-teal-400' : virality.emotional_roi.payoff_quality === 'adequate' ? 'text-yellow-400' : 'text-red-400'
                }`}>{virality.emotional_roi.payoff_quality}</span>
              </div>
            )}
            {virality.emotional_roi.curiosity_resolution && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Curiosity Resolution</div>
                <p className="text-sm text-slate-400">{virality.emotional_roi.curiosity_resolution}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retention Danger Zones */}
      {((virality.retention_model?.danger_zones ?? virality.retention_danger_zones) || []).length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-exclamation-triangle mr-2 text-yellow-400 text-sm"></i>Retention Danger Zones
          </h3>
          {virality.retention_model?.completion_rate_estimate != null && (
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="text-slate-400">Est. completion rate: <span className="text-white font-bold">{virality.retention_model.completion_rate_estimate}%</span></span>
              <span className="text-slate-400">Rewatch: <span className="text-white font-bold">{virality.retention_model.rewatch_probability}</span></span>
            </div>
          )}
          <div className="space-y-3">
            {(virality.retention_model?.danger_zones ?? virality.retention_danger_zones ?? []).map((zone: any, idx: number) => (
              <div key={idx} className={`rounded-xl p-4 border ${
                zone.risk_level === 'high' ? 'bg-red-500/[0.04] border-red-500/10'
                  : zone.risk_level === 'medium' ? 'bg-yellow-500/[0.04] border-yellow-500/10'
                  : 'bg-white/[0.02] border-white/5'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">
                      <i className="fas fa-clock mr-1 text-xs text-slate-500"></i>
                      {fmtTime(zone.timestamp_sec)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      zone.risk_level === 'high' ? 'bg-red-500/20 text-red-400'
                        : zone.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-white/10 text-slate-400'
                    }`}>{zone.risk_level} risk</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-2">{zone.reason}</p>
                {zone.fix_suggestion && (
                  <div className="flex items-start gap-1.5 text-xs text-teal-400">
                    <i className="fas fa-lightbulb text-[9px] mt-0.5"></i>
                    <span>{zone.fix_suggestion}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform-Specific: TikTok */}
      {upload?.platform === 'tiktok' && virality.tiktok_specific && virality.tiktok_specific.seo_score != null && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fab fa-tiktok mr-2 text-sm"></i>TikTok-Specific Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-4">
            {[
              { label: 'SEO Score', value: virality.tiktok_specific.seo_score, icon: 'fa-search' },
              { label: 'Golden 2s Alignment', value: virality.tiktok_specific.golden_2s_alignment, icon: 'fa-bullseye' },
            ].filter(c => c.value != null).map((card) => (
              <div key={card.label} className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                <div className={`text-2xl sm:text-3xl font-black mb-1 ${scoreColor(card.value || 0)}`}>{card.value}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>{card.label}
                </div>
              </div>
            ))}
            {virality.tiktok_specific.audio_niche_fit && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                <div className="text-lg font-black text-white mb-1 capitalize">{virality.tiktok_specific.audio_niche_fit.replace(/_/g, ' ')}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <i className="fas fa-music mr-1 text-[8px]"></i>Audio Niche Fit
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {virality.tiktok_specific.searchable_phrases && virality.tiktok_specific.searchable_phrases.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Searchable Phrases</div>
                <div className="flex flex-wrap gap-2">
                  {virality.tiktok_specific.searchable_phrases.map((p: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400">"{p}"</span>
                  ))}
                </div>
              </div>
            )}
            {virality.tiktok_specific.caption_seo_keywords && virality.tiktok_specific.caption_seo_keywords.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Caption SEO Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {virality.tiktok_specific.caption_seo_keywords.map((k: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {virality.tiktok_specific.golden_2s_mismatch && (
              <div className="bg-yellow-500/[0.04] rounded-xl p-4 border border-yellow-500/10">
                <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-2">Golden 2s Mismatch</div>
                <p className="text-sm text-yellow-300/70">{virality.tiktok_specific.golden_2s_mismatch}</p>
              </div>
            )}
            {virality.tiktok_specific.audio_niche_reasoning && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audio Niche Analysis</div>
                <p className="text-sm text-slate-400">{virality.tiktok_specific.audio_niche_reasoning}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform-Specific: Instagram */}
      {upload?.platform === 'instagram' && virality.instagram_specific && virality.instagram_specific.dm_shareability_score != null && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fab fa-instagram mr-2 text-sm"></i>Instagram-Specific Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {[
              { label: 'DM Shareability', value: virality.instagram_specific.dm_shareability_score, icon: 'fa-paper-plane' },
              { label: 'Platform Native', value: virality.instagram_specific.platform_native_score, icon: 'fa-check-circle' },
              { label: 'Topic Clarity', value: virality.instagram_specific.topic_category_clarity, icon: 'fa-tag' },
              { label: 'Visual Fidelity', value: virality.instagram_specific.visual_fidelity_score, icon: 'fa-camera' },
            ].filter(c => c.value != null).map((card) => (
              <div key={card.label} className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                <div className={`text-2xl sm:text-3xl font-black mb-1 ${scoreColor(card.value || 0)}`}>{card.value}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>{card.label}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {virality.instagram_specific.conversation_starter && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Conversation Starter</div>
                <p className="text-sm text-slate-300">{virality.instagram_specific.conversation_starter}</p>
                {virality.instagram_specific.dm_reaction_type && virality.instagram_specific.dm_reaction_type !== 'none' && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-400 capitalize">
                    {virality.instagram_specific.dm_reaction_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            )}
            {virality.instagram_specific.topic_category && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Algorithm Topic Category</div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">{virality.instagram_specific.topic_category}</span>
              </div>
            )}
            {virality.instagram_specific.platform_native_issues && virality.instagram_specific.platform_native_issues.length > 0 && (
              <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10">
                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Platform Native Issues</div>
                <ul className="space-y-1">
                  {virality.instagram_specific.platform_native_issues.map((issue: string, i: number) => (
                    <li key={i} className="text-sm text-red-300/70 flex items-start gap-1.5">
                      <i className="fas fa-exclamation-circle text-[9px] text-red-400 mt-1 flex-shrink-0"></i>{issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {virality.instagram_specific.visual_fidelity_notes && (
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Visual Fidelity Notes</div>
                <p className="text-sm text-slate-400">{virality.instagram_specific.visual_fidelity_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
