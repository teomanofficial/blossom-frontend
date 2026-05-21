/**
 * AnatomyTabs — URL-synced tab strip for the /dashboard/anatomy page.
 *
 * Tier 3 used to dump 18 widgets into a single 4-column grid. That packs
 * too tightly to be readable, so we split the widgets into four bands —
 * Anatomy, Hook Lab, Sound, Category — each surfaced as a tab. Only one
 * tab's widgets render at a time, giving each widget room to breathe in
 * a 6/12-col layout.
 *
 * Tab state lives in the URL search param `?tab=anatomy|hook-lab|sound|category`
 * so deep links restore the view and the back button moves between tabs.
 * Unknown / missing values fall back to "anatomy".
 *
 * Visual: matches the "PlatformToggle" pattern used in
 * AlgorithmWeatherCard — pill row, subtle active state, single line on
 * mobile (horizontal scroll).
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type AnatomyTab = 'anatomy' | 'hook-lab' | 'sound' | 'category'

export const ANATOMY_TABS: ReadonlyArray<{
  slug: AnatomyTab
  label: string
  icon: string
  subtitle: string
}> = [
  {
    slug: 'anatomy',
    label: 'Anatomy',
    icon: 'fa-dna',
    subtitle: 'Hooks, formats, emotion, retention — the structural blueprint.',
  },
  {
    slug: 'hook-lab',
    label: 'Hook Lab',
    icon: 'fa-fish-fins',
    subtitle: 'The first three seconds, decomposed.',
  },
  {
    slug: 'sound',
    label: 'Sound',
    icon: 'fa-music',
    subtitle: 'Sounds, sonic DNA, platform lifecycle.',
  },
  {
    slug: 'category',
    label: 'Category',
    icon: 'fa-grid-2',
    subtitle: 'Niche × timing × length sweet spots.',
  },
] as const

const VALID_SLUGS = new Set<string>(ANATOMY_TABS.map((t) => t.slug))

/**
 * Read the current tab from the URL. Falls back to "anatomy" when the
 * param is missing or unknown — keeps the URL canonical without forcing
 * a redirect.
 */
export function useAnatomyTab(): {
  tab: AnatomyTab
  setTab: (next: AnatomyTab) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab') ?? ''
  const tab = useMemo<AnatomyTab>(
    () => (VALID_SLUGS.has(raw) ? (raw as AnatomyTab) : 'anatomy'),
    [raw],
  )
  const setTab = useCallback(
    (next: AnatomyTab) => {
      const sp = new URLSearchParams(searchParams)
      if (next === 'anatomy') {
        sp.delete('tab')
      } else {
        sp.set('tab', next)
      }
      setSearchParams(sp, { replace: false })
    },
    [searchParams, setSearchParams],
  )
  return { tab, setTab }
}

interface AnatomyTabsProps {
  /** Active tab — passed in from the parent so the parent can read it. */
  activeTab: AnatomyTab
  /** Click handler — usually wires to setTab from useAnatomyTab(). */
  onChange: (next: AnatomyTab) => void
}

export default function AnatomyTabs({ activeTab, onChange }: AnatomyTabsProps) {
  const activeMeta = ANATOMY_TABS.find((t) => t.slug === activeTab) ?? ANATOMY_TABS[0]!

  return (
    <div className="mb-6 lg:mb-8">
      <div
        role="tablist"
        aria-label="Anatomy section"
        className="flex items-stretch gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto dashboard-scrollbar"
      >
        {ANATOMY_TABS.map((t) => {
          const isActive = t.slug === activeTab
          return (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`anatomy-panel-${t.slug}`}
              onClick={() => onChange(t.slug)}
              className={
                'shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-widest transition-colors ' +
                (isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-cyan-100 border border-cyan-400/30 shadow-sm shadow-cyan-500/10'
                  : 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent')
              }
            >
              <i className={`fas ${t.icon} text-[11px]`} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs sm:text-sm text-slate-400 font-medium mt-3 leading-snug">
        {activeMeta.subtitle}
      </p>
    </div>
  )
}
