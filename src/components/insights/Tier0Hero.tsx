/**
 * Tier 0 — "What's happening right now"
 *
 * The 4-card hero strip answers: "Am I behind on what's breaking out
 * today?" Stage 4 W0 widgets fill all four slots; W4's polish pass wraps
 * each in WidgetErrorBoundary so a single render-time crash can't
 * collapse the rest of the tier.
 *
 * Desktop layout: 4-column grid (one card per slot).
 * Tablet: 2-column grid.
 * Mobile: stacked single column.
 *
 * Slot order (preserved):
 *   1. BreakoutsStrip       — hooks/formats/sounds/topics surging in 24h
 *   2. AlgorithmWeatherCard — weekly algorithm-shift summary
 *   3. LifecycleDistribution — emerging→declining mix across the niche
 *   4. JumpOnTodayFeed      — high-fit emerging items worth riding now
 */

import TierSectionHeader from './TierSectionHeader'
import WidgetErrorBoundary from './WidgetErrorBoundary'
import AlgorithmWeatherCard from './widgets/tier0/AlgorithmWeatherCard'
import BreakoutsStrip from './widgets/tier0/BreakoutsStrip'
import JumpOnTodayFeed from './widgets/tier0/JumpOnTodayFeed'
import LifecycleDistribution from './widgets/tier0/LifecycleDistribution'

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
        <WidgetErrorBoundary name="BreakoutsStrip">
          <BreakoutsStrip />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="AlgorithmWeatherCard">
          <AlgorithmWeatherCard />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="LifecycleDistribution">
          <LifecycleDistribution />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="JumpOnTodayFeed">
          <JumpOnTodayFeed />
        </WidgetErrorBoundary>
      </div>
    </section>
  )
}
