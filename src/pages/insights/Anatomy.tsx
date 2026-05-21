/**
 * Anatomy — drill-down page for Tier 3 ("Under the hood").
 *
 * Tier 3 is the densest tier — 18 widgets in the old single-page layout,
 * crammed into a 4-column grid. That's unreadable. This page splits them
 * into 4 internal tabs (Anatomy / Hook Lab / Sound / Category) so each
 * widget gets col-6 or col-12 room to breathe. Tab state lives in the URL
 * via `?tab=anatomy|hook-lab|sound|category` for deep-linking.
 *
 * Per-tab layouts (12-col grid):
 *
 * Anatomy:
 *   Cognitive Interruption Heatmap                                col-12
 *   Hook Matrix             col-6 │ Format Quadrant               col-6
 *   Emotion Distribution    col-6 │ Share Motivation Mix          col-6
 *   Retention Danger Zones                                        col-12
 *   Tactic Co-Occurrence Network                                  col-12
 *   Optimal Length Curves   col-6 │ Save/Share/Rewatch Quadrant   col-6
 *
 * Hook Lab:
 *   Scroll Stop Leaderboard                                       col-12
 *   Spoken Hook Keywords    col-6 │ On-Screen Hook Keywords       col-6
 *
 * Sound:
 *   Sound Lifecycle Browser                                       col-12
 *   Sounds By Platform      col-6 │ Sonic DNA Panel               col-6
 *
 * Category:
 *   Category Heatgrid                                             col-12
 *   Posting Time Heatmap    col-6 │ Length Sweet Spot             col-6
 */

import TierSectionHeader from '../../components/insights/TierSectionHeader'
import AnatomyTabs, { useAnatomyTab } from '../../components/insights/AnatomyTabs'
import WidgetErrorBoundary from '../../components/insights/WidgetErrorBoundary'

// Anatomy
import HookMatrix from '../../components/insights/widgets/tier3/HookMatrix'
import FormatQuadrant from '../../components/insights/widgets/tier3/FormatQuadrant'
import CognitiveInterruptionHeatmap from '../../components/insights/widgets/tier3/CognitiveInterruptionHeatmap'
import EmotionDistribution from '../../components/insights/widgets/tier3/EmotionDistribution'
import RetentionDangerZones from '../../components/insights/widgets/tier3/RetentionDangerZones'
import TacticCoOccurrenceNetwork from '../../components/insights/widgets/tier3/TacticCoOccurrenceNetwork'
import OptimalLengthCurves from '../../components/insights/widgets/tier3/OptimalLengthCurves'
import ShareMotivationMix from '../../components/insights/widgets/tier3/ShareMotivationMix'
import SaveShareRewatchQuadrant from '../../components/insights/widgets/tier3/SaveShareRewatchQuadrant'

// Hook Lab
import ScrollStopLeaderboard from '../../components/insights/widgets/tier3/ScrollStopLeaderboard'
import SpokenHookKeywords from '../../components/insights/widgets/tier3/SpokenHookKeywords'
import OnScreenHookKeywords from '../../components/insights/widgets/tier3/OnScreenHookKeywords'

// Sound
import SoundLifecycleBrowser from '../../components/insights/widgets/tier3/SoundLifecycleBrowser'
import SoundsByPlatform from '../../components/insights/widgets/tier3/SoundsByPlatform'
import SonicDNAPanel from '../../components/insights/widgets/tier3/SonicDNAPanel'

// Category
import CategoryHeatGrid from '../../components/insights/widgets/tier3/CategoryHeatGrid'
import PostingTimeHeatmap from '../../components/insights/widgets/tier3/PostingTimeHeatmap'
import LengthSweetSpotByNiche from '../../components/insights/widgets/tier3/LengthSweetSpotByNiche'

function AnatomyTabContent() {
  return (
    <div
      id="anatomy-panel-anatomy"
      role="tabpanel"
      aria-labelledby="anatomy-tab-anatomy"
      className="grid grid-cols-12 gap-4 lg:gap-6"
    >
      <div className="col-span-12">
        <WidgetErrorBoundary name="CognitiveInterruptionHeatmap">
          <CognitiveInterruptionHeatmap />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="HookMatrix">
          <HookMatrix />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="FormatQuadrant">
          <FormatQuadrant />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="EmotionDistribution">
          <EmotionDistribution />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="ShareMotivationMix">
          <ShareMotivationMix />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12">
        <WidgetErrorBoundary name="RetentionDangerZones">
          <RetentionDangerZones />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12">
        <WidgetErrorBoundary name="TacticCoOccurrenceNetwork">
          <TacticCoOccurrenceNetwork />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="OptimalLengthCurves">
          <OptimalLengthCurves />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="SaveShareRewatchQuadrant">
          <SaveShareRewatchQuadrant />
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}

function HookLabTabContent() {
  return (
    <div
      id="anatomy-panel-hook-lab"
      role="tabpanel"
      aria-labelledby="anatomy-tab-hook-lab"
      className="grid grid-cols-12 gap-4 lg:gap-6"
    >
      <div className="col-span-12">
        <WidgetErrorBoundary name="ScrollStopLeaderboard">
          <ScrollStopLeaderboard />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="SpokenHookKeywords">
          <SpokenHookKeywords />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="OnScreenHookKeywords">
          <OnScreenHookKeywords />
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}

function SoundTabContent() {
  return (
    <div
      id="anatomy-panel-sound"
      role="tabpanel"
      aria-labelledby="anatomy-tab-sound"
      className="grid grid-cols-12 gap-4 lg:gap-6"
    >
      <div className="col-span-12">
        <WidgetErrorBoundary name="SoundLifecycleBrowser">
          <SoundLifecycleBrowser />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="SoundsByPlatform">
          <SoundsByPlatform />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="SonicDNAPanel">
          <SonicDNAPanel />
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}

function CategoryTabContent() {
  return (
    <div
      id="anatomy-panel-category"
      role="tabpanel"
      aria-labelledby="anatomy-tab-category"
      className="grid grid-cols-12 gap-4 lg:gap-6"
    >
      <div className="col-span-12">
        <WidgetErrorBoundary name="CategoryHeatGrid">
          <CategoryHeatGrid />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="PostingTimeHeatmap">
          <PostingTimeHeatmap />
        </WidgetErrorBoundary>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <WidgetErrorBoundary name="LengthSweetSpotByNiche">
          <LengthSweetSpotByNiche />
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}

export default function Anatomy() {
  const { tab, setTab } = useAnatomyTab()

  return (
    <>
      <TierSectionHeader
        variant="page"
        tier="Insights / Anatomy"
        title="Under the hood"
        question="The strategic anatomy of viral content in your space — hooks, formats, retention, sound, timing."
        icon="fa-dna"
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        backHref="/dashboard"
      />

      <AnatomyTabs activeTab={tab} onChange={setTab} />

      {tab === 'anatomy' ? <AnatomyTabContent /> : null}
      {tab === 'hook-lab' ? <HookLabTabContent /> : null}
      {tab === 'sound' ? <SoundTabContent /> : null}
      {tab === 'category' ? <CategoryTabContent /> : null}
    </>
  )
}
