/**
 * OnScreenHookKeywords — Tier 3 Hook Lab widget showing the most
 * frequently displayed on-screen text keywords in the first 2 seconds
 * of top-decile videos.
 *
 * Mirrors SpokenHookKeywords but pulls from the on-screen text source
 * (`onscreen_keywords_first_2s`). The response shape is identical, so
 * we share the rendering implementation via _KeywordCloudCard.
 *
 * Backend: `GET /api/insights/tier3/onscreen-hook-keywords`
 *   → { keywords: [{keyword, frequency, video_count}], niche, sample_size }
 */

import KeywordCloudCard from './_KeywordCloudCard'

interface OnScreenHookKeywordsProps {
  className?: string
  niche?: string
}

export default function OnScreenHookKeywords({
  className = '',
  niche,
}: OnScreenHookKeywordsProps) {
  return (
    <KeywordCloudCard
      path="tier3/onscreen-hook-keywords"
      niche={niche}
      className={className}
      title="On-Screen Hook Keywords"
      subtitle="The text that flashes on screen in the first 2 seconds of viral videos."
      icon="fa-closed-captioning"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      barTone={{
        gradient: 'from-purple-400 to-fuchsia-500',
        text: 'text-purple-300',
        chip: 'bg-purple-500/10 text-purple-200 border-purple-500/20',
        chipHi: 'bg-purple-500/25 text-purple-100 border-purple-400/40',
      }}
      info={{
        what: 'The text overlays that flash on screen in the first 2 seconds of viral videos.',
        howToRead:
          "Bars are the 8 most-used on-screen overlay phrases. The 'Also seen' grid is the long tail. These are the words that snap a scroller into reading mode — borrow one for your next thumbnail or text card.",
        computation:
          'Counts of distinct on-screen text tokens from the first 2 seconds of top-decile videos in your niche.',
      }}
    />
  )
}
