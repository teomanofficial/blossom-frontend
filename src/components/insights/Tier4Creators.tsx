/**
 * Tier 4 — "Who's winning in your niche"
 *
 * Stage 3 FE1 scaffolds the layout; Stage 4 W4 fills the slots with
 * real widgets. Creators to study, learn from, and reverse-engineer.
 *
 * Desktop layout: 3-column grid. NicheLeaderboard takes the lead row
 * (full 3-col span) because the ranked table needs horizontal room.
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Slot contract (Stage 4 W4 must keep the slot names + order):
 *   1. NicheLeaderboard      — top creators in the user's niche (3-col span)
 *   2. RisingStars           — creators with sharp 7d/30d view-ratio surges
 *   3. DiscDistribution      — DISC mix across top performers
 *   4. AudienceArchetypeMap  — audience archetypes vs. creator clusters
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetSlot from './WidgetSlot'

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
        <WidgetSlot
          name="NicheLeaderboard"
          hint="The top creators in your niche — ranked by engagement, hit rate, and consistency."
          icon="fa-ranking-star"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
          className="sm:col-span-2 lg:col-span-3"
        />
        <WidgetSlot
          name="RisingStars"
          hint="Creators with sharp 7d/30d surges — catch them on the way up."
          icon="fa-arrow-up-right-dots"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="DiscDistribution"
          hint="DISC personality mix across the top performers in your niche."
          icon="fa-chart-simple"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
        <WidgetSlot
          name="AudienceArchetypeMap"
          hint="Audience archetypes the leaders attract — and what they overlap on."
          icon="fa-people-group"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
        />
      </div>
    </section>
  )
}
