/**
 * Tier 4 — "Who's winning in your niche"
 *
 * Creators to study, learn from, and reverse-engineer.
 *
 * Desktop layout: 3-column grid. NicheLeaderboard takes the lead row
 * (full 3-col span) because the ranked table needs horizontal room.
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Each widget is wrapped in WidgetErrorBoundary so a single crash can't
 * sink the rest of the tier. The widgets themselves own their data
 * fetching + skeleton/error/empty states via WidgetCard.
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetErrorBoundary from './WidgetErrorBoundary'
import {
  AudienceArchetypeMap,
  DiscDistribution,
  NicheLeaderboard,
  RisingStars,
} from './widgets/tier4'

export default function Tier4Creators() {
  return (
    <section className="mb-8 lg:mb-12">
      <TierSectionHeader
        tier="Tier 4"
        title="Who's winning in your niche"
        question="Creators to study, learn from, and reverse-engineer."
        icon="fa-trophy"
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <WidgetErrorBoundary
          name="NicheLeaderboard"
          className="sm:col-span-2 lg:col-span-3"
        >
          <NicheLeaderboard />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="RisingStars">
          <RisingStars />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="DiscDistribution">
          <DiscDistribution />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="AudienceArchetypeMap">
          <AudienceArchetypeMap />
        </WidgetErrorBoundary>
      </div>
    </section>
  )
}
