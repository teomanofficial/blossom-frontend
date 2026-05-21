/**
 * Tier 3 — "Under the hood"
 *
 * The strategic anatomy of viral content in your space. Tier 3 is the
 * densest tier (~18 widgets). To keep things scannable we group widgets
 * into four sub-bands with their own small headings:
 *   - Anatomy        (9 widgets)
 *   - Hook Lab       (3 widgets)
 *   - Sound          (3 widgets)
 *   - Category       (3 widgets)
 *
 * Within each sub-band we use a 4-column dense grid on desktop with
 * select widgets spanning 2 columns when they carry richer chart UIs.
 *
 * Each widget is wrapped in WidgetErrorBoundary so a render-time crash
 * in one widget can't break the rest of the tier — useful for the
 * chart-heavy widgets where a malformed backend payload could trip up
 * Recharts.
 *
 * Slot contract (preserved from FE1's design):
 *
 * Anatomy:
 *   1.  HookMatrix (2-col)
 *   2.  FormatQuadrant (2-col)
 *   3.  CognitiveInterruptionHeatmap (2-col)
 *   4.  EmotionDistribution
 *   5.  RetentionDangerZones
 *   6.  TacticCoOccurrenceNetwork (2-col)
 *   7.  OptimalLengthCurves
 *   8.  ShareMotivationMix
 *   9.  SaveShareRewatchQuadrant (2-col)
 *
 * Hook Lab:
 *  10.  ScrollStopLeaderboard (2-col)
 *  11.  SpokenHookKeywords
 *  12.  OnScreenHookKeywords
 *
 * Sound:
 *  13.  SoundLifecycleBrowser (2-col)
 *  14.  SoundsByPlatform
 *  15.  SonicDNAPanel
 *
 * Category:
 *  16.  CategoryHeatGrid (2-col)
 *  17.  PostingTimeHeatmap
 *  18.  LengthSweetSpotByNiche
 */

import type { ReactNode } from 'react'
import TierSectionHeader from './TierSectionHeader'
import WidgetErrorBoundary from './WidgetErrorBoundary'

// Anatomy
import HookMatrix from './widgets/tier3/HookMatrix'
import FormatQuadrant from './widgets/tier3/FormatQuadrant'
import CognitiveInterruptionHeatmap from './widgets/tier3/CognitiveInterruptionHeatmap'
import EmotionDistribution from './widgets/tier3/EmotionDistribution'
import RetentionDangerZones from './widgets/tier3/RetentionDangerZones'
import TacticCoOccurrenceNetwork from './widgets/tier3/TacticCoOccurrenceNetwork'
import OptimalLengthCurves from './widgets/tier3/OptimalLengthCurves'
import ShareMotivationMix from './widgets/tier3/ShareMotivationMix'
import SaveShareRewatchQuadrant from './widgets/tier3/SaveShareRewatchQuadrant'

// Hook Lab
import ScrollStopLeaderboard from './widgets/tier3/ScrollStopLeaderboard'
import SpokenHookKeywords from './widgets/tier3/SpokenHookKeywords'
import OnScreenHookKeywords from './widgets/tier3/OnScreenHookKeywords'

// Sound
import SoundLifecycleBrowser from './widgets/tier3/SoundLifecycleBrowser'
import SoundsByPlatform from './widgets/tier3/SoundsByPlatform'
import SonicDNAPanel from './widgets/tier3/SonicDNAPanel'

// Category
import CategoryHeatGrid from './widgets/tier3/CategoryHeatGrid'
import PostingTimeHeatmap from './widgets/tier3/PostingTimeHeatmap'
import LengthSweetSpotByNiche from './widgets/tier3/LengthSweetSpotByNiche'

function SubBand({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 lg:mb-8 last:mb-0">
      <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 mb-3 sm:mb-4 pl-1">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {children}
      </div>
    </div>
  )
}

export default function Tier3Anatomy() {
  return (
    <section className="mb-8 lg:mb-12">
      <TierSectionHeader
        tier="Tier 3"
        title="Under the hood"
        question="The strategic anatomy of viral content in your space."
        icon="fa-dna"
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
      />

      <SubBand title="Anatomy">
        <WidgetErrorBoundary name="HookMatrix" className="lg:col-span-2">
          <HookMatrix className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="FormatQuadrant" className="lg:col-span-2">
          <FormatQuadrant className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary
          name="CognitiveInterruptionHeatmap"
          className="lg:col-span-2"
        >
          <CognitiveInterruptionHeatmap className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="EmotionDistribution">
          <EmotionDistribution />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="RetentionDangerZones">
          <RetentionDangerZones />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary
          name="TacticCoOccurrenceNetwork"
          className="lg:col-span-2"
        >
          <TacticCoOccurrenceNetwork className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="OptimalLengthCurves">
          <OptimalLengthCurves />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="ShareMotivationMix">
          <ShareMotivationMix />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary
          name="SaveShareRewatchQuadrant"
          className="lg:col-span-2"
        >
          <SaveShareRewatchQuadrant className="lg:col-span-2" />
        </WidgetErrorBoundary>
      </SubBand>

      <SubBand title="Hook Lab">
        <WidgetErrorBoundary
          name="ScrollStopLeaderboard"
          className="lg:col-span-2"
        >
          <ScrollStopLeaderboard className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="SpokenHookKeywords">
          <SpokenHookKeywords />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="OnScreenHookKeywords">
          <OnScreenHookKeywords />
        </WidgetErrorBoundary>
      </SubBand>

      <SubBand title="Sound">
        <WidgetErrorBoundary name="SoundLifecycleBrowser" className="lg:col-span-2">
          <SoundLifecycleBrowser className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="SoundsByPlatform">
          <SoundsByPlatform />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="SonicDNAPanel">
          <SonicDNAPanel />
        </WidgetErrorBoundary>
      </SubBand>

      <SubBand title="Category">
        <WidgetErrorBoundary name="CategoryHeatGrid" className="lg:col-span-2">
          <CategoryHeatGrid className="lg:col-span-2" />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="PostingTimeHeatmap">
          <PostingTimeHeatmap />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="LengthSweetSpotByNiche">
          <LengthSweetSpotByNiche />
        </WidgetErrorBoundary>
      </SubBand>
    </section>
  )
}
