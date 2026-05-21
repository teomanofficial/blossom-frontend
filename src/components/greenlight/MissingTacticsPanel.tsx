/**
 * MissingTacticsPanel — gold-standard tactics the concept plausibly
 * lacks. Backend returns a flat list of `{ tactic, lift, reason }`
 * (no category field — Greenlight's pipeline doesn't carry it through),
 * so we group inferentially: tactic names that start with common
 * prefixes (Hook/Visual/Audio/Pacing) get bucketed where we can, and
 * the rest fall into a "Other" group.
 *
 * Each row composes the shared TacticChip primitive with a fallback
 * "other" category for color consistency with the rest of the
 * dashboard, plus a lift badge and the AI-generated rationale.
 *
 * Pure presentational. Empty state is friendly — "no gaps found" is a
 * good answer.
 */

import { useMemo } from 'react'
import type { GreenlightResponse } from '../../types/insights'
import TacticChip from '../insights/shared/TacticChip'

interface MissingTacticsPanelProps {
  missing: GreenlightResponse['missing_gold_standard_tactics']
  className?: string
}

type MissingItem = GreenlightResponse['missing_gold_standard_tactics'][number]

interface CategoryBucket {
  slug: string
  label: string
  items: MissingItem[]
}

/**
 * Heuristic categorisation by tactic name. The pipeline doesn't ship
 * a category field with each missing tactic, so we infer based on
 * common keywords. Anything we can't classify lands in "Other".
 */
function inferCategorySlug(tactic: string): string {
  const lower = tactic.toLowerCase()
  if (/\bhook|cold open|opener|first.{0,3}second|attention.grab/.test(lower)) {
    return 'hook_structural'
  }
  if (/\bvisual|cut|shot|frame|reveal|b.?roll|composition/.test(lower)) {
    return 'visual_style'
  }
  if (/\baudio|sound|music|sfx|beat|voice/.test(lower)) {
    return 'audio_design'
  }
  if (/\btext|caption|overlay|subtitle/.test(lower)) {
    return 'text_overlay'
  }
  if (/\bpace|pacing|tempo|rhythm|fast.cut/.test(lower)) {
    return 'pacing'
  }
  if (/\bcta|comment|share|save|bookmark|engage/.test(lower)) {
    return 'engagement_bait'
  }
  if (/\bemot|feel|mood|tension|empathy/.test(lower)) {
    return 'emotional'
  }
  if (/\bidentity|signature|brand|niche.signal/.test(lower)) {
    return 'identity_signal'
  }
  if (/\btrend|viral|sound trend|format trend/.test(lower)) {
    return 'trend_leverage'
  }
  if (/\bstory|narrative|structure|payoff|ending/.test(lower)) {
    return 'content_structure'
  }
  return 'other'
}

function prettifyCategory(slug: string): string {
  if (slug === 'other') return 'Other'
  return slug
    .split('_')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ')
}

function formatLift(lift: number): string {
  if (!Number.isFinite(lift) || lift <= 0) return '—'
  if (lift >= 10) return `${Math.round(lift)}×`
  return `${lift.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}×`
}

export default function MissingTacticsPanel({
  missing,
  className = '',
}: MissingTacticsPanelProps) {
  const buckets = useMemo<CategoryBucket[]>(() => {
    if (!missing || missing.length === 0) return []
    const map = new Map<string, MissingItem[]>()
    for (const item of missing) {
      const slug = inferCategorySlug(item.tactic)
      const list = map.get(slug) ?? []
      list.push(item)
      map.set(slug, list)
    }
    const ordered: CategoryBucket[] = []
    for (const [slug, items] of map.entries()) {
      ordered.push({
        slug,
        label: prettifyCategory(slug),
        items,
      })
    }
    // Push 'Other' to the bottom so the categorised buckets surface first.
    ordered.sort((a, b) => {
      if (a.slug === 'other') return 1
      if (b.slug === 'other') return -1
      return b.items.length - a.items.length
    })
    return ordered
  }, [missing])

  const isEmpty = buckets.length === 0

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 lg:p-7 ${className}`}
      aria-label="Missing gold-standard tactics"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            <i className="fas fa-puzzle-piece text-purple-400 text-xs sm:text-sm" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
              What top-decile videos do that yours doesn&apos;t
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-snug">
              {isEmpty
                ? 'Your concept already covers the gold-standard playbook.'
                : `${missing.length} tactic${missing.length === 1 ? '' : 's'} the gold-standard playbook for this hook + format uses that your concept appears to skip.`}
            </p>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <i className="fas fa-circle-check text-emerald-400 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs">
            Nothing missing. Your concept already covers the tactics top creators in this niche
            lean on.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {buckets.map((bucket) => (
            <div key={bucket.slug}>
              <div className="flex items-center gap-2 mb-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {bucket.label}
                </h4>
                <span className="text-[10px] font-bold text-slate-600">
                  {bucket.items.length} missing
                </span>
              </div>
              <ul className="space-y-2">
                {bucket.items.map((item, i) => (
                  <li
                    key={`${item.tactic}-${i}`}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 sm:p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <TacticChip
                        name={item.tactic}
                        category={bucket.slug === 'other' ? '' : bucket.slug}
                        size="md"
                      />
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black tabular-nums text-emerald-300">
                        <i className="fas fa-arrow-trend-up text-[9px]" />
                        +{formatLift(item.lift)} lift
                      </span>
                    </div>
                    {item.reason ? (
                      <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.reason}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
