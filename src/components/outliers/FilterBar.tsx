/**
 * FilterBar — top-of-page filter row for the Outlier Hunter page.
 *
 * Filters are intentionally lightweight (free-text niche + 3 selects) so
 * a creator can spelunk the dataset without learning a faceted UI. All
 * values are controlled by the parent page; we just render + emit changes.
 *
 * The time-window select is rendered disabled until Stage 6 materializes
 * 7d / 24h variants of mv_outliers_30d — the placeholder is visible so
 * users can SEE the surface that's coming.
 */

import type { ChangeEvent } from 'react'

export interface OutlierFilters {
  /** Free-text niche search; '' means all niches. */
  niche: string
  /** Influencer tier (nano/micro/mid/macro/mega); '' means all. */
  tier: string
  /** Platform (instagram/tiktok); '' means all. */
  platform: string
  /** Time window — currently locked to '30d'. */
  window: '30d' | '7d' | '24h'
}

interface FilterBarProps {
  filters: OutlierFilters
  onChange: (next: OutlierFilters) => void
  /** Optional className for layout overrides. */
  className?: string
  /** Total result count to display alongside the filters. */
  resultCount?: number
}

const TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All tiers' },
  { value: 'nano', label: 'Nano (< 10k)' },
  { value: 'micro', label: 'Micro (10k – 100k)' },
  { value: 'mid-tier', label: 'Mid-tier (100k – 500k)' },
  { value: 'macro', label: 'Macro (500k – 1M)' },
  { value: 'mega', label: 'Mega (> 1M)' },
]

const PLATFORM_OPTIONS: Array<{ value: string; label: string; icon: string }> = [
  { value: '', label: 'All platforms', icon: 'fa-globe' },
  { value: 'instagram', label: 'Instagram', icon: 'fa-instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'fa-tiktok' },
]

const WINDOW_OPTIONS: Array<{ value: OutlierFilters['window']; label: string; disabled?: boolean }> = [
  { value: '24h', label: 'Last 24h (coming soon)', disabled: true },
  { value: '7d', label: 'Last 7 days (coming soon)', disabled: true },
  { value: '30d', label: 'Last 30 days' },
]

function hasActiveFilters(filters: OutlierFilters): boolean {
  return Boolean(filters.niche.trim() || filters.tier || filters.platform)
}

export default function FilterBar({
  filters,
  onChange,
  className = '',
  resultCount,
}: FilterBarProps) {
  const update = <K extends keyof OutlierFilters>(key: K, value: OutlierFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const reset = () => {
    onChange({ niche: '', tier: '', platform: '', window: '30d' })
  }

  return (
    <section
      className={`glass-card rounded-3xl p-4 sm:p-5 mb-5 ${className}`}
      aria-label="Outlier filters"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Niche search */}
        <div className="relative flex-1 min-w-[180px]">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.niche}
            placeholder="Filter by niche (e.g. fitness, finance)"
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('niche', e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-pink-500/40 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-colors"
          />
        </div>

        {/* Tier select */}
        <div className="min-w-[140px]">
          <select
            value={filters.tier}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => update('tier', e.target.value)}
            className="w-full px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-pink-500/40 focus:outline-none text-sm text-slate-100 font-medium transition-colors cursor-pointer"
            aria-label="Creator tier"
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0a0a12]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Platform select */}
        <div className="min-w-[140px]">
          <select
            value={filters.platform}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => update('platform', e.target.value)}
            className="w-full px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-pink-500/40 focus:outline-none text-sm text-slate-100 font-medium transition-colors cursor-pointer"
            aria-label="Platform"
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0a0a12]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Window select (locked to 30d for now) */}
        <div className="min-w-[160px]">
          <select
            value={filters.window}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              update('window', e.target.value as OutlierFilters['window'])
            }
            className="w-full px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 font-medium transition-colors cursor-not-allowed"
            aria-label="Time window"
            title="Custom windows materialize in Stage 6"
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#0a0a12]"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors shrink-0"
          >
            <i className="fas fa-xmark mr-1.5 text-[10px]" />
            Reset
          </button>
        ) : null}

        {typeof resultCount === 'number' ? (
          <div className="ml-auto text-[11px] font-bold text-slate-500 shrink-0">
            <span className="text-slate-200 font-black">{resultCount}</span> outlier
            {resultCount === 1 ? '' : 's'}
          </div>
        ) : null}
      </div>
    </section>
  )
}
