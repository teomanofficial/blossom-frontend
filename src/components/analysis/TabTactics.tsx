import { useState } from 'react'
import { fmtTime, getCategoryColor, scoreColor, scoreBarColor } from './helpers'

interface TabTacticsProps {
  full: any
}

export default function TabTactics({ full }: TabTacticsProps) {
  const [tacticSort, setTacticSort] = useState<'score' | 'time'>('score')
  const [tacticFilter, setTacticFilter] = useState<string>('all')

  const allCategories: string[] = Array.from(
    new Set((full?.tactics || []).map((t: any) => t.category).filter(Boolean)) as Set<string>
  );

  const sortedTactics = [...(full?.tactics || [])].sort((a: any, b: any) => {
    if (tacticSort === 'score') return (b.execution_score || 0) - (a.execution_score || 0);
    return (a.when_start || 0) - (b.when_start || 0);
  });

  const filteredTactics =
    tacticFilter === 'all'
      ? sortedTactics
      : sortedTactics.filter((t: any) => t.category === tacticFilter);

  return (
    <div className="space-y-6">
      {/* Sort & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sort</span>
          <button
            onClick={() => setTacticSort('score')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              tacticSort === 'score' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <i className="fas fa-sort-amount-down mr-1 text-[9px]"></i>Score
          </button>
          <button
            onClick={() => setTacticSort('time')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              tacticSort === 'time' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <i className="fas fa-clock mr-1 text-[9px]"></i>Timestamp
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Filter</span>
          <button
            onClick={() => setTacticFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              tacticFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {allCategories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setTacticFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors capitalize ${
                tacticFilter === cat
                  ? `${getCategoryColor(cat)}`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tactic Count */}
      <div className="text-xs font-bold text-slate-500">
        Showing {filteredTactics.length} tactic{filteredTactics.length !== 1 ? 's' : ''}
      </div>

      {/* Tactic Cards */}
      <div className="space-y-4">
        {filteredTactics.map((tactic: any, idx: number) => (
          <div key={idx} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">{tactic.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                  {(tactic.category || '').replace(/_/g, ' ')}
                </span>
              </div>
              <span className={`text-lg font-black ${scoreColor(tactic.execution_score || 0)} flex-shrink-0 ml-3`}>
                {tactic.execution_score ?? '--'}
              </span>
            </div>

            {/* Score bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(tactic.execution_score || 0)} transition-all`}
                style={{ width: `${Math.min(100, tactic.execution_score || 0)}%` }}
              ></div>
            </div>

            {/* Timestamp */}
            {(tactic.when_start != null || tactic.when_end != null) && (
              <div className="text-[10px] font-bold text-slate-500 mb-2">
                <i className="fas fa-clock mr-1"></i>
                {fmtTime(tactic.when_start)}
                {tactic.when_end != null && ` - ${fmtTime(tactic.when_end)}`}
              </div>
            )}

            {/* What */}
            <p className="text-sm text-white mb-2">{tactic.what}</p>

            {/* Why it works */}
            {tactic.why_it_works && (
              <p className="text-xs text-slate-400 mb-2">
                <i className="fas fa-brain mr-1 text-[9px] text-slate-500"></i>
                {tactic.why_it_works}
              </p>
            )}

            {/* Viewer effect */}
            {tactic.viewer_effect && (
              <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 mr-2">
                <i className="fas fa-eye mr-1 text-[8px]"></i>{tactic.viewer_effect}
              </span>
            )}

            {/* Execution note */}
            {tactic.execution_note && (
              <p className="text-[11px] text-slate-500 mt-2 italic">{tactic.execution_note}</p>
            )}
          </div>
        ))}

        {filteredTactics.length === 0 && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
            <p className="text-sm text-slate-500">No tactics found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
