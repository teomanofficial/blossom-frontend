/**
 * Pulse — drill-down page for Tier 0 ("What's happening right now").
 *
 * The old Tier 0 strip cramped the four hero widgets into a 4-column grid,
 * which forced the AlgorithmWeather summary to truncate and the Jump On
 * Today feed cards to wrap every word. This page gives each widget room
 * to breathe at col-12 / col-8 spans.
 *
 * Layout (12-col grid):
 *   - Algorithm Weather hero                          col-12
 *   - Breakouts of the Day                            col-12
 *   - Jump On Today                col-8 │ Lifecycle  col-4
 *
 * No tier wrappers, no error boundaries at this level — the individual
 * widgets are responsible for their own loading / error / empty / locked
 * states via WidgetCard, and they're already wrapped in
 * WidgetErrorBoundary internally where needed.
 */

import TierSectionHeader from '../../components/insights/TierSectionHeader'
import WidgetErrorBoundary from '../../components/insights/WidgetErrorBoundary'
import AlgorithmWeatherCard from '../../components/insights/widgets/tier0/AlgorithmWeatherCard'
import BreakoutsStrip from '../../components/insights/widgets/tier0/BreakoutsStrip'
import JumpOnTodayFeed from '../../components/insights/widgets/tier0/JumpOnTodayFeed'
import LifecycleDistribution from '../../components/insights/widgets/tier0/LifecycleDistribution'

export default function Pulse() {
  return (
    <>
      <TierSectionHeader
        variant="page"
        tier="Insights / Pulse"
        title="What's happening right now"
        question="Today's algorithm signals, the breakouts to ride, and the lifecycle mix across your niche."
        icon="fa-wave-square"
        iconBg="bg-pink-500/15"
        iconColor="text-pink-400"
        backHref="/dashboard"
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Algorithm Weather — hero. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="AlgorithmWeatherCard">
            <AlgorithmWeatherCard />
          </WidgetErrorBoundary>
        </div>

        {/* Breakouts of the Day — wide strip. */}
        <div className="col-span-12">
          <WidgetErrorBoundary name="BreakoutsStrip">
            <BreakoutsStrip />
          </WidgetErrorBoundary>
        </div>

        {/* Jump On Today (wider) │ Lifecycle Distribution (narrower). */}
        <div className="col-span-12 lg:col-span-8">
          <WidgetErrorBoundary name="JumpOnTodayFeed">
            <JumpOnTodayFeed />
          </WidgetErrorBoundary>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <WidgetErrorBoundary name="LifecycleDistribution">
            <LifecycleDistribution />
          </WidgetErrorBoundary>
        </div>
      </div>
    </>
  )
}
