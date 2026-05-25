/**
 * PricingComparisonTable — full feature matrix below the pricing cards.
 *
 * Renders four tier columns (Free / Creator / Pro / Agency) grouped under
 * section headers (Usage, Insights, AI Features, API & Integrations, Team).
 * The Pro column gets a subtle pink tint to match the "Most Popular" card.
 *
 * Visual contract:
 *   - Sticky tier header at the top of the table when the user scrolls.
 *   - First column (feature label) is sticky horizontally so the row stays
 *     readable when the table overflows on narrow screens.
 *   - Bottom CTA row mirrors the card CTAs above — same handler, same labels.
 */

import { type ReactNode } from 'react'

export type TierSlug = 'free' | 'pro' | 'premium' | 'platin'

export interface PricingTier {
  slug: TierSlug
  /** Display name shown in the column header. */
  name: string
  /** Formatted price string for the header, e.g. "$0", "$39", "$99". */
  price: string
  /** Suffix shown next to the price (e.g. "/mo" or "free"). */
  priceSuffix?: string
}

export interface ComparisonRow {
  feature: string
  /** Cell values per tier slug. Use the `Check` / `Cross` exports for
   *  binary rows; plain strings/numbers render as bold metric values. */
  values: Record<TierSlug, ReactNode>
  /** Optional muted helper text below the feature label. */
  helper?: string
}

export interface ComparisonSection {
  title: string
  rows: ComparisonRow[]
}

interface PricingComparisonTableProps {
  tiers: PricingTier[]
  sections: ComparisonSection[]
  /** Called when a tier's CTA in the bottom row is clicked. */
  onCtaClick: (slug: TierSlug) => void
  /** Slug currently in a loading state (waiting for Paddle). */
  loadingSlug?: TierSlug | null
}

const POPULAR_SLUG: TierSlug = 'premium'

// ──────────────────────────────────────────────────────────────────────────
// Shared cell renderers — exported so the page can reuse the same icons.
// ──────────────────────────────────────────────────────────────────────────

export const Check = (
  <svg
    aria-label="Included"
    className="w-5 h-5 text-teal-400 mx-auto"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
)

export const Cross = (
  <svg
    aria-label="Not included"
    className="w-4 h-4 text-slate-600 mx-auto"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/** Wrap a metric value in the standard bold treatment. */
export function Metric({ children }: { children: ReactNode }) {
  return <span className="text-sm font-bold text-white">{children}</span>
}

// ──────────────────────────────────────────────────────────────────────────

function ctaLabel(slug: TierSlug): string {
  if (slug === 'free') return 'Get Started Free'
  if (slug === POPULAR_SLUG) return 'Start Free Trial'
  return 'Choose Plan'
}

export default function PricingComparisonTable({
  tiers,
  sections,
  onCtaClick,
  loadingSlug,
}: PricingComparisonTableProps) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      {/* Horizontal scroll wrapper for narrow screens. The first column
          (feature label) stays sticky so the row context is never lost. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          {/* Tier header row — sticky to the top of the viewport while
              scrolling through long feature lists. */}
          <thead className="sticky top-0 z-20 bg-[#0a0a12]/95 backdrop-blur-md">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-[#0a0a12]/95 backdrop-blur-md text-left p-5 sm:p-6 border-b border-white/10 w-[28%] min-w-[180px]"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Compare plans
                </span>
              </th>
              {tiers.map((tier) => {
                const isPopular = tier.slug === POPULAR_SLUG
                return (
                  <th
                    key={tier.slug}
                    scope="col"
                    className={`text-center p-5 sm:p-6 border-b border-white/10 align-top ${
                      isPopular ? 'bg-pink-500/[0.06]' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-[8px] font-black uppercase tracking-widest text-white">
                          Popular
                        </span>
                      )}
                      <span className="text-base font-black text-white">{tier.name}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        <span className="text-white font-black">{tier.price}</span>
                        {tier.priceSuffix && <span className="text-slate-500">{tier.priceSuffix}</span>}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sections.map((section) => (
              <SectionGroup
                key={section.title}
                section={section}
                tierCount={tiers.length}
                tiers={tiers}
              />
            ))}

            {/* Bottom CTA row — mirrors the cards above. */}
            <tr>
              <td
                className="sticky left-0 z-10 bg-[#0a0a12]/95 backdrop-blur-md p-5 sm:p-6 border-t border-white/10"
                aria-hidden="true"
              />
              {tiers.map((tier) => {
                const isPopular = tier.slug === POPULAR_SLUG
                const isLoading = loadingSlug === tier.slug
                return (
                  <td
                    key={tier.slug}
                    className={`p-4 sm:p-6 border-t border-white/10 text-center ${
                      isPopular ? 'bg-pink-500/[0.06]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onCtaClick(tier.slug)}
                      disabled={isLoading}
                      className={`w-full py-3 px-3 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${
                        isPopular
                          ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white glow-button hover:scale-[1.03]'
                          : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                      }`}
                    >
                      {isLoading ? 'Loading...' : ctaLabel(tier.slug)}
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SectionGroupProps {
  section: ComparisonSection
  tierCount: number
  tiers: PricingTier[]
}

function SectionGroup({ section, tierCount, tiers }: SectionGroupProps) {
  return (
    <>
      {/* Section divider row */}
      <tr>
        <td
          colSpan={tierCount + 1}
          className="bg-white/[0.02] px-5 sm:px-6 py-3 border-y border-white/5"
        >
          <span className="text-[11px] font-black uppercase tracking-widest text-pink-400">
            {section.title}
          </span>
        </td>
      </tr>
      {section.rows.map((row, idx) => (
        <tr
          key={`${section.title}-${idx}`}
          className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
        >
          <th
            scope="row"
            className="sticky left-0 z-10 bg-[#0a0a12]/95 backdrop-blur-md text-left p-4 sm:p-5 text-sm font-semibold text-slate-300 align-top"
          >
            {row.feature}
            {row.helper && (
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">{row.helper}</div>
            )}
          </th>
          {tiers.map((tier) => {
            const isPopular = tier.slug === POPULAR_SLUG
            return (
              <td
                key={tier.slug}
                className={`p-4 sm:p-5 text-center text-sm text-slate-300 ${
                  isPopular ? 'bg-pink-500/[0.06]' : ''
                }`}
              >
                {row.values[tier.slug]}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
