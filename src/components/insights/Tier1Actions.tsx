/**
 * Tier 1 — "What should I make next"
 *
 * The action layer — concrete moves backed by data. Stage 4 W1 shipped
 * the 4 widget slots (OutlierFeed was shipped earlier as the N3
 * flagship). W4's polish pass wraps each widget in WidgetErrorBoundary.
 *
 * Desktop layout: 3-column grid. OutlierFeed spans 2 columns (it's the
 * primary action artifact); the other 4 slots are single-column cards.
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Slot order (kept stable so the visual hierarchy is predictable):
 *   1. OutlierFeed         — videos > 3× their creator's median (2-col span)
 *   2. WhitespaceKeywords  — high-engagement / low-volume keywords
 *   3. CrossNicheImports   — formats winning in adjacent niches
 *   4. EarlySoundsRadar    — emerging sounds with high niche fit
 *   5. NextPostsRanked     — re-ranked suggestions by user DISC + niche
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetErrorBoundary from './WidgetErrorBoundary'
import OutlierFeed from './OutlierFeed'
import WhitespaceKeywords from './widgets/tier1/WhitespaceKeywords'
import CrossNicheImports from './widgets/tier1/CrossNicheImports'
import EarlySoundsRadar from './widgets/tier1/EarlySoundsRadar'
import NextPostsRanked from './widgets/tier1/NextPostsRanked'

export default function Tier1Actions() {
  return (
    <section className="mb-8 lg:mb-12">
      <TierSectionHeader
        tier="Tier 1"
        title="What should I make next"
        question="The action layer — concrete moves backed by data."
        icon="fa-arrow-trend-up"
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <WidgetErrorBoundary name="OutlierFeed" className="sm:col-span-2">
          <OutlierFeed />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="WhitespaceKeywords">
          <WhitespaceKeywords />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="CrossNicheImports">
          <CrossNicheImports />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="EarlySoundsRadar">
          <EarlySoundsRadar />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="NextPostsRanked">
          <NextPostsRanked />
        </WidgetErrorBoundary>
      </div>
    </section>
  )
}
