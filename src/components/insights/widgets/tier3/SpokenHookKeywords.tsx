/**
 * SpokenHookKeywords — Tier 3 Hook Lab widget showing the most
 * frequently spoken keywords in the first two seconds of top-decile
 * videos in the user's niche.
 *
 * Visual: a hybrid bar chart + word-cloud. The top 8 keywords get
 * horizontal bars (height = relative frequency); the remainder appear
 * as a wrapped flex grid of tag chips where the font size scales with
 * frequency.
 *
 * Backend: `GET /api/insights/tier3/spoken-hook-keywords`
 *   → { keywords: [{keyword, frequency, video_count}], niche, sample_size }
 */

import KeywordCloudCard from './_KeywordCloudCard'

interface SpokenHookKeywordsProps {
  className?: string
  niche?: string
}

export default function SpokenHookKeywords({
  className = '',
  niche,
}: SpokenHookKeywordsProps) {
  return (
    <KeywordCloudCard
      path="tier3/spoken-hook-keywords"
      niche={niche}
      className={className}
      title="Spoken Hook Keywords"
      subtitle="The words that actually leave the mouth in the first 2 seconds of viral videos."
      icon="fa-microphone-lines"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      barTone={{
        gradient: 'from-pink-400 to-rose-500',
        text: 'text-pink-300',
        chip: 'bg-pink-500/10 text-pink-200 border-pink-500/20',
        chipHi: 'bg-pink-500/25 text-pink-100 border-pink-400/40',
      }}
      info={{
        what: 'The words top creators actually speak in the first 2 seconds of viral videos.',
        howToRead:
          "Bars are the 8 most-spoken hook words, sorted by frequency. The 'Also seen' chip grid is the long tail, sized by frequency. Borrow one of these openers if your hooks have been falling flat.",
        computation:
          'Counts of distinct words in the first 2 seconds of top-decile videos in your niche. Filler words excluded.',
      }}
    />
  )
}
