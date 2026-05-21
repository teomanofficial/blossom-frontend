/**
 * Tier 3 — "Under the hood"
 *
 * Stage 3 FE1 scaffolds the layout; Stage 4 W3 fills the slots with
 * real widgets. The strategic anatomy of viral content in your space.
 *
 * Tier 3 is the densest tier (~18 widgets). To keep things scannable
 * we group widgets into four sub-bands with their own small headings:
 *   - Anatomy        (9 widgets)
 *   - Hook Lab       (3 widgets)
 *   - Sound          (3 widgets)
 *   - Category       (3 widgets)
 *
 * Within each sub-band we use a 4-column dense grid on desktop with
 * select widgets spanning 2 columns when they carry richer chart UIs.
 *
 * Slot contract (Stage 4 W3 must keep the slot names + order):
 *
 * Anatomy:
 *   1.  HookMatrix
 *   2.  FormatQuadrant
 *   3.  CognitiveInterruptionHeatmap
 *   4.  EmotionDistribution
 *   5.  RetentionDangerZones
 *   6.  TacticCoOccurrenceNetwork
 *   7.  OptimalLengthCurves
 *   8.  ShareMotivationMix
 *   9.  SaveShareRewatchQuadrant
 *
 * Hook Lab:
 *  10.  ScrollStopLeaderboard
 *  11.  SpokenHookKeywords
 *  12.  OnScreenHookKeywords
 *
 * Sound:
 *  13.  SoundLifecycleBrowser
 *  14.  SoundsByPlatform
 *  15.  SonicDNAPanel
 *
 * Category:
 *  16.  CategoryHeatGrid
 *  17.  PostingTimeHeatmap
 *  18.  LengthSweetSpotByNiche
 */

import type { ReactNode } from 'react'
import TierSectionHeader from './TierSectionHeader'
import WidgetSlot from './WidgetSlot'

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
        <WidgetSlot
          name="HookMatrix"
          hint="Hook classes plotted by reach × retention."
          icon="fa-grip"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="FormatQuadrant"
          hint="Format classes mapped to engagement vs. shareability."
          icon="fa-table-cells-large"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="CognitiveInterruptionHeatmap"
          hint="Primal triggers × niches — which interrupts pay off where."
          icon="fa-fire-flame-curved"
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="EmotionDistribution"
          hint="Primary emotion mix across top-decile videos."
          icon="fa-face-smile-beam"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="RetentionDangerZones"
          hint="Where viewers drop — bucketed timestamps with common causes."
          icon="fa-triangle-exclamation"
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
        />
        <WidgetSlot
          name="TacticCoOccurrenceNetwork"
          hint="Which tactic pairs compound when used together."
          icon="fa-circle-nodes"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="OptimalLengthCurves"
          hint="Hook + total-duration sweet spots per niche."
          icon="fa-wave-square"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <WidgetSlot
          name="ShareMotivationMix"
          hint="Why audiences share — relate, teach, surprise, tribe?"
          icon="fa-share-nodes"
          iconBg="bg-sky-500/15"
          iconColor="text-sky-400"
        />
        <WidgetSlot
          name="SaveShareRewatchQuadrant"
          hint="Save × share × rewatch — the virality triple-axis."
          icon="fa-rotate"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
          className="lg:col-span-2"
        />
      </SubBand>

      <SubBand title="Hook Lab">
        <WidgetSlot
          name="ScrollStopLeaderboard"
          hint="Top-ranked hooks by scroll-stop power 0-100."
          icon="fa-bullseye"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="SpokenHookKeywords"
          hint="Most common spoken keywords in the first 2 seconds."
          icon="fa-microphone-lines"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="OnScreenHookKeywords"
          hint="Most common on-screen text in the first 2 seconds."
          icon="fa-closed-captioning"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
      </SubBand>

      <SubBand title="Sound">
        <WidgetSlot
          name="SoundLifecycleBrowser"
          hint="Each sound's weekly adoption curve and current lifecycle stage."
          icon="fa-music"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="SoundsByPlatform"
          hint="What's winning on Instagram vs. TikTok right now."
          icon="fa-volume-high"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="SonicDNAPanel"
          hint="BPM, energy, and brightness signatures of viral audio."
          icon="fa-waveform-lines"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
      </SubBand>

      <SubBand title="Category">
        <WidgetSlot
          name="CategoryHeatGrid"
          hint="Categories × subcategories — where heat is concentrating."
          icon="fa-th"
          iconBg="bg-cyan-500/15"
          iconColor="text-cyan-400"
          className="lg:col-span-2"
        />
        <WidgetSlot
          name="PostingTimeHeatmap"
          hint="Day × hour heatmap of when viral hits in your niche post."
          icon="fa-clock"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
        />
        <WidgetSlot
          name="LengthSweetSpotByNiche"
          hint="The duration band where your niche consistently overperforms."
          icon="fa-ruler-horizontal"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
      </SubBand>
    </section>
  )
}
