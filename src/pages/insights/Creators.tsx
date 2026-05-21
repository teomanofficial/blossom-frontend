/**
 * Creators — drill-down page for Tier 4 ("Who's winning in your niche").
 *
 * Layout (12-col grid):
 *   - Niche Leaderboard (full table with filter bar)             col-12
 *   - Rising Stars (3-col card grid inside col-12 wrapper)       col-12
 *   - DISC Distribution   col-6 │ Audience Archetypes            col-6
 *
 * Rising Stars at col-12 lets each card hit ~360px width on lg desktop,
 * which was the original target before the old 3-col Tier 4 grid
 * starved it down to ~220px (where "Engagement rate up 322% in the last
 * 30 days" wrapped to ~6 lines).
 */

import TierSectionHeader from '../../components/insights/TierSectionHeader'
import WidgetErrorBoundary from '../../components/insights/WidgetErrorBoundary'
import {
  AudienceArchetypeMap,
  DiscDistribution,
  NicheLeaderboard,
  RisingStars,
} from '../../components/insights/widgets/tier4'

export default function Creators() {
  return (
    <>
      <TierSectionHeader
        variant="page"
        tier="Insights / Creators"
        title="Who's winning in your niche"
        question="Creators to study, learn from, and reverse-engineer. Rising stars, niche leaders, DISC types, archetypes."
        icon="fa-medal"
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        backHref="/dashboard"
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Niche Leaderboard — full-width ranked table. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="NicheLeaderboard">
            <NicheLeaderboard />
          </WidgetErrorBoundary>
        </div>

        {/* Rising Stars — full-width so cards get breathing room. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="RisingStars">
            <RisingStars />
          </WidgetErrorBoundary>
        </div>

        {/* DISC Distribution │ Audience Archetypes. */}
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="DiscDistribution">
            <DiscDistribution />
          </WidgetErrorBoundary>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="AudienceArchetypeMap">
            <AudienceArchetypeMap />
          </WidgetErrorBoundary>
        </div>
      </div>
    </>
  )
}
