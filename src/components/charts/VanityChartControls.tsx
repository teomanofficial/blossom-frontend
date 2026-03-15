import type { GrowthPattern } from '../../lib/vanity-charts'

interface VanityChartControlsProps {
  multiplier: number
  pattern: GrowthPattern
  baseValue: number
  onMultiplierChange: (v: number) => void
  onPatternChange: (v: GrowthPattern) => void
  onBaseValueChange: (v: number) => void
  /** Show base value input (useful when there's no real data) */
  showBaseValue?: boolean
}

const PATTERNS: { value: GrowthPattern; label: string; icon: string }[] = [
  { value: 'steady', label: 'Steady', icon: 'fa-arrow-trend-up' },
  { value: 'exponential', label: 'Exponential', icon: 'fa-rocket' },
  { value: 'viral-spike', label: 'Viral Spike', icon: 'fa-bolt' },
  { value: 'hockey-stick', label: 'Hockey Stick', icon: 'fa-chart-line' },
]

const MULTIPLIER_PRESETS = [1, 5, 10, 50, 100, 500]

export default function VanityChartControls({
  multiplier,
  pattern,
  baseValue,
  onMultiplierChange,
  onPatternChange,
  onBaseValueChange,
  showBaseValue = false,
}: VanityChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 rounded-xl bg-violet-500/[0.06] border border-violet-500/15">
      {/* Multiplier */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Scale</span>
        <div className="flex items-center gap-0.5">
          {MULTIPLIER_PRESETS.map(m => (
            <button
              key={m}
              onClick={() => onMultiplierChange(m)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                multiplier === m
                  ? 'bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {m}x
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={10000}
            value={multiplier}
            onChange={(e) => onMultiplierChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white outline-none focus:border-violet-500/40 text-center"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Pattern */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Curve</span>
        <div className="flex items-center gap-0.5">
          {PATTERNS.map(p => (
            <button
              key={p.value}
              onClick={() => onPatternChange(p.value)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                pattern === p.value
                  ? 'bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className={`fas ${p.icon} text-[8px]`} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Base Value (when no real data) */}
      {showBaseValue && (
        <>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Base</span>
            <input
              type="number"
              min={1}
              value={baseValue}
              onChange={(e) => onBaseValueChange(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white outline-none focus:border-violet-500/40 text-center"
            />
          </div>
        </>
      )}
    </div>
  )
}
