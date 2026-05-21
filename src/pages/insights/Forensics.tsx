/**
 * Forensics — drill-down page for Tier 2 ("Why did this work — and why
 * didn't this?").
 *
 * Layout (12-col grid):
 *   - Post-Mortem Entry hero CTA                       col-12
 *   - Tactic Gaps   col-6 │ Best vs Worst Diff         col-6
 *   - Improvement Velocity Chart                       col-12
 *   - Hook Strength Gauge (small KPI tile)             col-4
 *
 * The HookStrengthGauge slot stays at col-4 because the gauge itself is
 * physically small (a single number + meter) — surrounding it with
 * negative space prevents the page from looking off-balance after the
 * Improvement Velocity Chart's full-width chart.
 */

import TierSectionHeader from '../../components/insights/TierSectionHeader'
import WidgetErrorBoundary from '../../components/insights/WidgetErrorBoundary'
import ForensicsOnboardingBanner from '../../components/insights/ForensicsOnboardingBanner'
import PostMortemEntry from '../../components/insights/widgets/tier2/PostMortemEntry'
import TacticGapsList from '../../components/insights/widgets/tier2/TacticGapsList'
import BestVsWorstDiff from '../../components/insights/widgets/tier2/BestVsWorstDiff'
import ImprovementVelocityChart from '../../components/insights/widgets/tier2/ImprovementVelocityChart'
import HookStrengthGauge from '../../components/insights/widgets/tier2/HookStrengthGauge'

export default function Forensics() {
  return (
    <>
      <TierSectionHeader
        variant="page"
        tier="Insights / Forensics"
        title="Why did this work — and why didn't this?"
        question="Diagnose your own content with tactic-level forensics. Find what diverged and what to swap next time."
        icon="fa-magnifying-glass-chart"
        iconBg="bg-purple-500/15"
        iconColor="text-purple-400"
        backHref="/dashboard"
      />

      {/* First-run onboarding (renders null when count >= 3) */}
      <ForensicsOnboardingBanner />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Post-Mortem Entry — hero CTA */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="PostMortemEntry">
            <PostMortemEntry />
          </WidgetErrorBoundary>
        </div>

        {/* Tactic Gaps │ Best vs Worst Diff */}
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="TacticGapsList">
            <TacticGapsList />
          </WidgetErrorBoundary>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <WidgetErrorBoundary name="BestVsWorstDiff">
            <BestVsWorstDiff />
          </WidgetErrorBoundary>
        </div>

        {/* Improvement Velocity — full-width chart */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="ImprovementVelocityChart">
            <ImprovementVelocityChart />
          </WidgetErrorBoundary>
        </div>

        {/* Hook Strength Gauge — small KPI tile, leaves room to breathe */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <WidgetErrorBoundary name="HookStrengthGauge">
            <HookStrengthGauge />
          </WidgetErrorBoundary>
        </div>
      </div>
    </>
  )
}
