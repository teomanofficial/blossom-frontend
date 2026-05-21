/**
 * Tier 0 — "What's happening right now"
 *
 * Stage 3 FE1 scaffolds the layout; Stage 4 W0 fills the slots with
 * real widgets. The 4-card hero strip answers: "Am I behind on what's
 * breaking out today?"
 *
 * Desktop layout: 4-column grid (one card per slot).
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Slot contract (Stage 4 W0 must keep the slot names + order):
 *   1. BreakoutsStrip       — hooks/formats/sounds/topics surging in 24h
 *   2. AlgorithmWeatherCard — weekly algorithm-shift summary
 *   3. LifecycleDistribution — emerging→declining mix across the niche
 *   4. JumpOnTodayFeed      — high-fit emerging items worth riding now
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetSlot from './WidgetSlot'

export default function Tier0Hero() {
  return (
    <section className="mb-8 lg:mb-12">
      <TierSectionHeader
        tier="Tier 0"
        title="What's happening right now"
        question="Am I behind on what's breaking out today?"
        icon="fa-bolt"
        iconBg="bg-pink-500/15"
        iconColor="text-pink-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <WidgetSlot
          name="BreakoutsStrip"
          hint="Hooks, formats, sounds, and topics surging in the last 24h."
          icon="fa-fire"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="AlgorithmWeatherCard"
          hint="What the algorithm is rewarding this week."
          icon="fa-cloud-bolt"
          iconBg="bg-sky-500/15"
          iconColor="text-sky-400"
        />
        <WidgetSlot
          name="LifecycleDistribution"
          hint="How emerging vs. declining your niche is right now."
          icon="fa-chart-pie"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <WidgetSlot
          name="JumpOnTodayFeed"
          hint="High-fit moves with a closing window."
          icon="fa-rocket"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
      </div>
    </section>
  )
}
