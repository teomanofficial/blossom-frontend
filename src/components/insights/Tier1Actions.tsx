/**
 * Tier 1 — "What should I make next"
 *
 * Stage 3 FE1 scaffolds the layout; Stage 4 W1 fills the slots with
 * real widgets. This is the action layer — concrete moves backed by
 * data.
 *
 * Desktop layout: 3-column grid. OutlierFeed spans 2 columns (it's the
 * primary action artifact); the other 4 slots are single-column cards.
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Slot contract (Stage 4 W1 must keep the slot names + order):
 *   1. OutlierFeed         — videos > 3× their creator's median (2-col span)
 *   2. WhitespaceKeywords  — high-engagement / low-volume keywords
 *   3. CrossNicheImports   — formats winning in adjacent niches
 *   4. EarlySoundsRadar    — emerging sounds with high niche fit
 *   5. NextPostsRanked     — re-ranked suggestions by user DISC + niche
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetSlot from './WidgetSlot'

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
        <WidgetSlot
          name="OutlierFeed"
          hint="Recent videos doing 3×+ their creator's median — with tactic teardowns."
          icon="fa-meteor"
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
          className="sm:col-span-2"
        />
        <WidgetSlot
          name="WhitespaceKeywords"
          hint="Topics with strong engagement and almost no competition."
          icon="fa-map-location-dot"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <WidgetSlot
          name="CrossNicheImports"
          hint="Formats winning in adjacent niches you haven't tried."
          icon="fa-shuffle"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
        <WidgetSlot
          name="EarlySoundsRadar"
          hint="Emerging sounds with high niche fit — jump in before saturation."
          icon="fa-music"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="NextPostsRanked"
          hint="Your content suggestions, re-ranked by DISC + niche + tactic gaps."
          icon="fa-list-ol"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
      </div>
    </section>
  )
}
