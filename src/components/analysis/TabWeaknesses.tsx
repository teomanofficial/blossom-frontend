interface TabWeaknessesProps {
  full: any
  improv: any
}

export default function TabWeaknesses({ full, improv }: TabWeaknessesProps) {
  return (
    <div className="space-y-4">
      {/* Resolved weaknesses from previous version */}
      {improv?.version_progress?.fixed_weaknesses?.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-500/10 bg-teal-500/[0.02]">
          <h3 className="text-sm font-black text-teal-400 mb-3 flex items-center gap-2">
            <i className="fas fa-check-circle text-xs"></i>
            Resolved from Previous Version ({improv.version_progress.fixed_weaknesses.length})
          </h3>
          <div className="space-y-2">
            {improv.version_progress.fixed_weaknesses.map((fw: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <i className="fas fa-check text-teal-400 mt-0.5 text-xs"></i>
                <span className="text-slate-400 line-through opacity-70">{fw.assessment || fw.ref}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {full?.weaknesses && full.weaknesses.length > 0 ? (
        full.weaknesses.map((w: any, idx: number) => (
          <div key={idx} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            {/* Weakness heading */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-exclamation text-red-400 text-xs"></i>
              </div>
              <h3 className="text-base font-black text-white">{w.what}</h3>
            </div>

            {/* Impact */}
            {w.impact && (
              <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Impact</span>
                </div>
                <p className="text-sm text-red-300/70 pl-3.5">{w.impact}</p>
              </div>
            )}

            {/* Fix */}
            {w.fix && (
              <div className="bg-teal-500/[0.04] rounded-xl p-4 border border-teal-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Suggested Fix</span>
                </div>
                <p className="text-sm text-teal-300/70 pl-3.5">{w.fix}</p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-400/10 rounded-full flex items-center justify-center">
            <i className="fas fa-check text-teal-400 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Major Weaknesses</h3>
          <p className="text-sm text-slate-500">Great job! No significant weaknesses were found in this content.</p>
        </div>
      )}
    </div>
  )
}
