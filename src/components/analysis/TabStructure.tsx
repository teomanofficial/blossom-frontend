import { scoreColor } from './helpers'

interface TabStructureProps {
  full: any
  upload: any
}

export default function TabStructure({ full }: TabStructureProps) {
  return (
    <div className="space-y-6">
      {/* Format Class */}
      {full?.format_class && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-2">
            <i className="fas fa-shapes mr-2 text-pink-400 text-sm"></i>Format Class
          </h3>
          <span className="px-4 py-1.5 rounded-full text-sm font-black bg-pink-500/15 text-pink-400 capitalize inline-block">
            {full.format_class}
          </span>
        </div>
      )}

      {/* Timeline Visualization */}
      {full?.structural_breakdown && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-stream mr-2 text-indigo-400 text-sm"></i>Timeline Breakdown
          </h3>
          {(() => {
            const sb = full.structural_breakdown;
            const totalDur = sb.total_seconds || 1;
            const hookPct = ((sb.hook_seconds || 0) / totalDur) * 100;
            const setupPct = ((sb.setup_seconds || 0) / totalDur) * 100;
            const payoffPct = ((sb.payoff_seconds || 0) / totalDur) * 100;

            return (
              <div className="space-y-4">
                {/* Bar */}
                <div className="w-full h-10 rounded-xl overflow-hidden flex">
                  {hookPct > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center relative group"
                      style={{ width: `${Math.max(hookPct, 5)}%` }}
                    >
                      <span className="text-[9px] font-black text-white/90 uppercase">Hook</span>
                    </div>
                  )}
                  {setupPct > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-center relative group"
                      style={{ width: `${Math.max(setupPct, 5)}%` }}
                    >
                      <span className="text-[9px] font-black text-white/90 uppercase">Setup</span>
                    </div>
                  )}
                  {payoffPct > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 flex items-center justify-center relative group"
                      style={{ width: `${Math.max(payoffPct, 5)}%` }}
                    >
                      <span className="text-[9px] font-black text-white/90 uppercase">Payoff</span>
                    </div>
                  )}
                </div>

                {/* Duration Labels */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-500 to-orange-400"></div>
                    <span className="text-xs font-bold text-slate-400">Hook: {sb.hook_seconds ?? 0}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-indigo-500"></div>
                    <span className="text-xs font-bold text-slate-400">Setup: {sb.setup_seconds ?? 0}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-teal-500 to-emerald-400"></div>
                    <span className="text-xs font-bold text-slate-400">Payoff: {sb.payoff_seconds ?? 0}s</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 ml-auto">Total: {sb.total_seconds ?? 0}s</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Stats Grid */}
      {full?.structural_breakdown && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Pacing Style', value: full.structural_breakdown.pacing_style, icon: 'fa-tachometer-alt' },
            { label: 'Avg Shot Length', value: full.structural_breakdown.avg_shot_length_sec != null ? `${full.structural_breakdown.avg_shot_length_sec}s` : '--', icon: 'fa-camera' },
            { label: 'Movement Frequency', value: full.structural_breakdown.movement_frequency, icon: 'fa-running' },
            { label: 'Open Loop', value: full.structural_breakdown.has_open_loop ? 'Yes' : 'No', icon: 'fa-redo' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <i className={`fas ${stat.icon} mr-1`}></i>{stat.label}
              </div>
              <div className="text-sm font-black text-white capitalize">{stat.value || '--'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loop Description */}
      {full?.structural_breakdown?.loop_description && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            <i className="fas fa-redo mr-1"></i>Loop Description
          </div>
          <p className="text-sm text-slate-300">{full.structural_breakdown.loop_description}</p>
        </div>
      )}

      {/* Promise Analysis */}
      {full?.promise && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-bullseye mr-2 text-orange-400 text-sm"></i>Promise Analysis
          </h3>
          <div className="space-y-4">
            {full.promise.statement && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Statement</div>
                <p className="text-sm text-white font-semibold">{full.promise.statement}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Clarity</div>
                <div className={`text-lg sm:text-2xl font-black ${scoreColor(((full.promise.clarity || 0) / 10) * 100)}`}>
                  {full.promise.clarity ?? '--'}<span className="text-xs sm:text-sm text-slate-500">/10</span>
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Single Promise</div>
                {full.promise.is_single_promise ? (
                  <div className="text-teal-400 font-black"><i className="fas fa-check-circle text-lg sm:text-xl"></i></div>
                ) : (
                  <div className="text-yellow-400 font-black"><i className="fas fa-exclamation-circle text-lg sm:text-xl"></i></div>
                )}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5 text-center">
                <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payoff Delivered</div>
                {full.promise.payoff_delivered ? (
                  <div className="text-teal-400 font-black"><i className="fas fa-check-circle text-lg sm:text-xl"></i></div>
                ) : (
                  <div className="text-red-400 font-black"><i className="fas fa-times-circle text-lg sm:text-xl"></i></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shareability */}
      {full?.shareability && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-share-alt mr-2 text-orange-400 text-sm"></i>Shareability
          </h3>
          <div className="space-y-4">
            {full.shareability.would_share_because && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Would Share Because</div>
                <p className="text-sm text-slate-300">{full.shareability.would_share_because}</p>
              </div>
            )}
            {full.shareability.identity_signal && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Identity Signal</div>
                <p className="text-sm text-slate-300">{full.shareability.identity_signal}</p>
              </div>
            )}
            {full.shareability.share_trigger && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Share Trigger</div>
                <p className="text-sm text-white font-semibold">{full.shareability.share_trigger}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
