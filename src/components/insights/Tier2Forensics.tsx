/**
 * Tier 2 — "Why did this work — and why didn't this?"
 *
 * Stage 3 FE1 scaffolds the layout; Stage 4 W2 fills the slots with
 * real widgets. Diagnose your own content with tactic-level forensics.
 *
 * The PostMortemEntry slot is the headline CTA — it links to the
 * dedicated flagship page at /dashboard/post-mortem/:videoId.
 *
 * Desktop layout: 2-column grid. PostMortemEntry spans both columns
 * (the "why did this flop?" entry point is the centerpiece).
 * Mobile: stacked single column.
 *
 * Slot contract (Stage 4 W2 must keep the slot names + order):
 *   1. PostMortemEntry         — flagship link card (2-col span)
 *   2. TacticGapsList          — top-decile niche tactics you're missing
 *   3. BestVsWorstDiff         — what diverges between your top 5 and bottom 5
 *   4. ImprovementVelocityChart — your version-over-version progress
 *   5. HookStrengthGauge       — your scroll-stop power vs. niche P50/P90
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetSlot from './WidgetSlot'

export default function Tier2Forensics() {
  return (
    <section className="mb-8 lg:mb-12">
      <TierSectionHeader
        tier="Tier 2"
        title="Why did this work — and why didn't this?"
        question="Diagnose your own content with tactic-level forensics."
        icon="fa-magnifying-glass-chart"
        iconBg="bg-purple-500/15"
        iconColor="text-purple-400"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        <WidgetSlot
          name="PostMortemEntry"
          hint="Pick one of your videos — we'll show exactly what diverged from your hits."
          icon="fa-stethoscope"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="TacticGapsList"
          hint="Tactics dominating your niche's top decile that your content skips."
          icon="fa-puzzle-piece"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="BestVsWorstDiff"
          hint="What's different between your top-5 and bottom-5 posts."
          icon="fa-scale-balanced"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
        />
        <WidgetSlot
          name="ImprovementVelocityChart"
          hint="Are your revisions actually getting better? Version-over-version progress."
          icon="fa-chart-line"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <WidgetSlot
          name="HookStrengthGauge"
          hint="Your average scroll-stop power vs. niche P50 and P90."
          icon="fa-gauge-high"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
      </div>
    </section>
  )
}
