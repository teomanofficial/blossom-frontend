/**
 * Tier 2 — "Why did this work or flop"
 *
 * Stage 0 placeholder. Stage 3 FE1 + Stage 4 W2 replace this body
 * with the PostMortemEntry, TacticGapsList, BestVsWorstDiff,
 * ImprovementVelocityChart, and HookStrengthGauge widgets. The
 * flagship Post-Mortem page lives at /dashboard/post-mortem/:videoId.
 */

import TierSectionPlaceholder from './TierSectionPlaceholder'

export default function Tier2Forensics() {
  return (
    <TierSectionPlaceholder
      tier="Tier 2"
      title="Why did this work or flop"
      question="What specifically diverged from my own hits?"
      icon="fa-magnifying-glass-chart"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
    />
  )
}
