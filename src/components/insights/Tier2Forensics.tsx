/**
 * Tier 2 — "Why did this work — and why didn't this?"
 *
 * The forensics tier — diagnose your own content with tactic-level
 * teardowns. Stage 4 W2 shipped the widgets; W4's polish pass wraps
 * each in WidgetErrorBoundary so chart-component crashes can't sink
 * the rest of the tier.
 *
 * The PostMortemEntry card is the headline CTA — it spans both columns
 * on lg and links to the dedicated flagship page at /dashboard/post-mortem.
 *
 * Desktop layout: 2-column grid. PostMortemEntry spans both columns
 * (the "why did this flop?" entry point is the centerpiece).
 * Mobile: stacked single column.
 *
 * Slot order (preserved from FE1's contract):
 *   1. PostMortemEntry          — flagship link card (2-col span)
 *   2. TacticGapsList           — top-decile niche tactics you're missing
 *   3. BestVsWorstDiff          — what diverges between your top 5 and bottom 5
 *   4. ImprovementVelocityChart — your version-over-version progress
 *   5. HookStrengthGauge        — your scroll-stop power vs. niche P50/P90
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetErrorBoundary from './WidgetErrorBoundary'
import PostMortemEntry from './widgets/tier2/PostMortemEntry'
import TacticGapsList from './widgets/tier2/TacticGapsList'
import BestVsWorstDiff from './widgets/tier2/BestVsWorstDiff'
import ImprovementVelocityChart from './widgets/tier2/ImprovementVelocityChart'
import HookStrengthGauge from './widgets/tier2/HookStrengthGauge'

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
        <WidgetErrorBoundary name="PostMortemEntry" className="lg:col-span-2">
          <PostMortemEntry className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="TacticGapsList">
          <TacticGapsList />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="BestVsWorstDiff">
          <BestVsWorstDiff />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="ImprovementVelocityChart">
          <ImprovementVelocityChart />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="HookStrengthGauge">
          <HookStrengthGauge />
        </WidgetErrorBoundary>
      </div>
    </section>
  )
}
