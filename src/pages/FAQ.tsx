import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

type DetailItem = string | { label: string; text: string }

type FaqItem = {
  q: string
  a: string // definitive lead answer — used verbatim in JSON-LD
  details?: DetailItem[] // optional bulleted breakdown rendered after `a`
  feature?: { label: string; to: string }
  related?: string[] // refs like "hooks-2" (categoryId-itemIndex)
  keywords?: string[]
}

type FaqCategory = {
  id: string
  label: string
  emoji: string
  blurb: string
  items: FaqItem[]
}

// ──────────────────────────────────────────────────────────────────────────
// Content
// ──────────────────────────────────────────────────────────────────────────

const CATEGORIES: FaqCategory[] = [
  {
    id: 'going-viral',
    label: 'Going Viral 101',
    emoji: '🚀',
    blurb:
      'Everything creators ask about going viral on Instagram Reels, TikTok, and YouTube Shorts — answered with what the algorithm actually rewards in 2026.',
    items: [
      {
        q: 'How do I go viral on Instagram Reels or TikTok in 2026?',
        a: 'Going viral in 2026 is no longer a guessing game — it\'s a math problem with four measurable inputs: a hook that survives the 3-second drop test, a completion rate above 70%, DM shares in the first hour (now weighted ~15× a like in Instagram\'s distribution score), and a rising sound or format caught before its 72–120 hour peak window closes. Organic reach has compressed to 10–20% of followers for most accounts and Reels reach fell 35% year-over-year, which is why posting more rarely fixes the problem — the algorithm is grading every video against a stricter bar. Most flops aren\'t shadowbans either; TikTok\'s staged distribution caps videos at ~200 views when the first test group fails on completion or shares, meaning the diagnosis is almost always in the hook or the first three seconds of retention. The fastest fix is to reverse-engineer videos that actually broke through in your niche this week — their hook, length, sound, drop-off curve — and rebuild your next post against that pattern. Blossom does this in 30–120 seconds against a library of 1.2M+ viral videos and scores your draft on visual, audio, narrative, engagement, and strategy before you publish.',
        details: [
          { label: 'Pass the 3-second test', text: '63% of top-performing videos deliver their main message inside the first 3 seconds; a steep drop on TikTok Studio\'s retention graph in that window is the single biggest signal your hook is killing reach.' },
          { label: 'Hit 70%+ completion', text: 'The viral push threshold rose from 50% in 2024 to ~70% in 2026 for 15–30s videos. Below it, videos rarely break 10,000 views regardless of niche or follower count.' },
          { label: 'Engineer DM shares, not likes', text: '1 DM share = ~15 likes in Instagram\'s 2026 distribution score; saves = ~10 likes each. Likes dropped from 20% algorithmic weight in 2023 to roughly 5% today.' },
          { label: 'Win the first 60 minutes', text: 'Early engagement velocity decides ~80% of a video\'s final reach. A post with 30 substantive comments in hour one beats 300 likes across 24 hours.' },
          { label: 'Catch trends before they crest', text: 'Trending sounds and formats have a 72–120 hour relevance window with peaks averaging 11 days. By the time a trend hits a “top trends” listicle, the boost is already cooling.' },
          { label: 'Drop watermarks and reposts', text: 'Instagram\'s content fingerprinting demotes cross-posted Reels with detectable TikTok watermarks — even if you crop them — so native-first beats repurposed.' },
        ],
        feature: { label: 'Score your next Reel before you post', to: '/signup' },
        related: ['hooks-0', 'algorithm-0', 'posting-0'],
        keywords: ['viral', 'go viral', 'how to go viral on tiktok in 2026', 'instagram reels viral strategy 2026', 'viral video algorithm signals', 'why my reels are not getting views', 'tiktok views stuck at 200', 'dm shares instagram algorithm'],
      },
      {
        q: 'What actually makes a video go viral?',
        a: 'A viral video almost always combines four ingredients in the right proportion: a pattern-interrupting opening, a clear payoff that earns rewatches, audio that\'s either trending or perfectly synced to a beat drop, and a topic that triggers an emotional response strong enough to make people share it. Miss any one and the ceiling on reach drops by roughly an order of magnitude.',
        details: [
          { label: 'Visual', text: 'a frame that interrupts the scroll — an unusual angle, an unexpected object, a face in motion.' },
          { label: 'Narrative', text: 'an open loop in the first second that gets closed before the end. Viewers stay to find out.' },
          { label: 'Audio', text: 'either a sound that\'s already rising on the platform, or original audio that hits a beat drop within the cut.' },
          { label: 'Emotional payload', text: 'recognition, indignation, awe, or aspiration. Neutral content shares at near-zero rate.' },
        ],
        related: ['hooks-1', 'formats-0', 'trends-0'],
        keywords: ['viral video', 'makes viral', 'why viral'],
      },
      {
        q: 'What counts as "going viral" in views?',
        a: 'The industry benchmark is 1,000,000+ views within 72 hours of posting. For smaller or niche creators, 100K–250K views is considered "mini-viral" and usually triggers a follower spike of 1–5% of that view count.',
        details: [
          'Macro-viral: 1M+ views in 72 hours — usually requires the algorithm to push you to non-followers at scale.',
          'Mini-viral: 100K–250K views — common for accounts under 50K followers when one video over-indexes on shares.',
          'Niche-viral: 10K–50K views inside a tight niche — earns follower conversions at the highest rate per view.',
        ],
        related: ['engagement-1', 'engagement-2'],
        keywords: ['viral views', 'how many views', '1 million views'],
      },
      {
        q: 'Can you guarantee my video will go viral?',
        a: 'No serious analytics tool can guarantee virality — anyone who says otherwise is selling smoke. What Blossom does guarantee is that you stop posting blind: every video gets a virality probability score, a list of weak points with concrete fixes, and side-by-side references to viral videos in your exact niche that already won with the format you\'re trying.',
        related: ['ai-analysis-3', 'blossom-1'],
        keywords: ['guarantee viral', 'blossom guarantee'],
      },
      {
        q: 'Is it harder to go viral now than it was a few years ago?',
        a: 'Yes — and the data backs it up. Average Reels engagement dropped from 1.5% to 0.65% between 2024 and 2026 because both Reels and TikTok now test new content with your existing followers first before showing it to strangers. That makes your first-hour engagement the single biggest predictor of whether the algorithm expands distribution.',
        details: [
          'TikTok now seeds new videos to 200–500 existing followers before any non-follower sees them.',
          'Instagram Reels seeds to ~25% of followers first, then expands only if save/share rate clears the niche median.',
          'Creators with weak first-hour engagement see their next post throttled by 30–60% on average.',
        ],
        related: ['algorithm-0', 'algorithm-1', 'engagement-3'],
        keywords: ['harder to go viral', 'engagement rate dropping'],
      },
      {
        q: 'What are the most common reasons creators DON\'T go viral?',
        a: 'Across Blossom\'s analysis of 50,000+ published videos, six failure patterns account for 82% of zero-traction posts. Most are fixable in a single re-shoot.',
        details: [
          'Weak hook — 80%+ swipe-away inside 3 seconds (the biggest single killer).',
          'Niche drift — content that doesn\'t match the algorithm\'s classification of your account.',
          'Watermarked or recycled footage — auto-detected and down-ranked 30–50%.',
          'Slow visual pacing — frames hold for more than 1.5 seconds without a cut or zoom.',
          'No on-screen text on mute — 65% of first views happen with the sound off.',
          'No comment-bait — captions that don\'t prompt a 4+ word reply lose late-cycle distribution.',
        ],
        feature: { label: 'Find your failure pattern', to: '/signup' },
        related: ['low-views-0', 'hooks-5', 'formats-1'],
        keywords: ['why not viral', 'reasons not viral', 'video flop'],
      },
      {
        q: 'Is virality random or repeatable?',
        a: 'Virality looks random because the variance is high, but the underlying drivers are repeatable. Creators who run the same hook + format structure consistently see virality rates 4–7× higher than creators who change strategy every post. The trick is testing one variable at a time so you can isolate what actually moves the needle.',
        related: ['hooks-1', 'features-0'],
        keywords: ['random viral', 'repeatable viral', 'consistent'],
      },
    ],
  },
  {
    id: 'hooks',
    label: 'Hooks & First 3 Seconds',
    emoji: '⚡',
    blurb:
      'The first 3 seconds decide whether your video reaches 100 people or 1,000,000. Here\'s how hooks actually work in 2026 and how Blossom scores yours.',
    items: [
      {
        q: 'What is a hook in a TikTok or Reel?',
        a: 'A hook is the first 1–3 seconds of a short-form video — the visual, sound, and on-screen text that has to stop the scroll. The algorithm measures hook strength via the "3-second check": if more than ~40% of viewers swipe away inside 3 seconds, distribution gets throttled.',
        details: [
          'TikTok checks completion at the 1, 3, and 7-second marks.',
          'Instagram Reels measures completion past 3 seconds as the binary signal for further distribution.',
          'YouTube Shorts is more forgiving but still down-weights videos with under 50% retention past 5 seconds.',
        ],
        feature: { label: 'Browse the Hook library', to: '/signup' },
        related: ['hooks-1', 'algorithm-0'],
        keywords: ['what is hook', 'hook definition', '3 seconds'],
      },
      {
        q: 'How do I write a viral hook for Instagram Reels and TikTok in 2026?',
        a: 'Write hooks from a specific, observable detail in your niche, then layer a curiosity gap on top — that beats every copy-paste template circulating in 2026. Pattern recognition is now the killer: audiences have seen the same “POV”, “wait for it”, and “nobody talks about this” openers thousands of times, and platforms throttle content that reads as duplicated. Recycled trends lost 40–60% of their reach after the September 2025 algorithm changes, and a weak or generic hook is the single most common cause of the 200-view ceiling — up to 50% of viewers scroll within the first three seconds if the opener doesn\'t promise something concrete. Five hook patterns still work in 2026 because they force an involuntary attention reflex: bold contrarian, open-loop, named pain-point, listicle promise, and disqualifying filter. The trick is filling each one with a detail only your niche would recognize — a number, a tool, a specific failure mode — instead of a vague claim. If your hooks all sound the same, the problem is rarely the formula; it\'s that you\'re writing from imagination instead of evidence. Blossom indexes 50,000+ viral hooks tagged by niche, view count, and hook type, so you can see exactly which contrarian or pain-point opener worked on accounts your size last week.',
        details: [
          { label: 'Bold contrarian', text: '“Stop posting at peak times — my 1.4M-view Reel went up at 2:47 AM.” Pair the claim with a specific number so it can\'t be dismissed as a hot take.' },
          { label: 'Open-loop', text: '“The reason 99% of your TikToks die in the first frame isn\'t your hook — it\'s the half-second before it.” Specificity makes the curiosity gap feel earned, not spammy.' },
          { label: 'Named pain-point', text: '“If your Reels are stuck between 180 and 220 views, you\'re hitting the algorithm\'s test pool ceiling — here\'s the exit.” Use the exact number your audience sees in their analytics.' },
          { label: 'Listicle promise', text: '“3 things creators between 10K and 100K never do that I learned auditing 47 accounts.” Listicles only work in 2026 if the receipt — accounts audited, hours, dollars — is on screen.' },
          { label: 'Disqualifying filter', text: '“This is for faceless creators in the finance niche. Lifestyle people, skip.” Naming the exact sub-segment outperforms broad disqualifiers because it signals the rest of the video will be specific too.' },
          { label: 'Why your hooks all sound the same', text: 'If every opener feels recycled, you\'re writing from formulas instead of from a fresh observation. Audit five videos from your niche that hit 100K+ this week, write down the exact detail each one led with, and seed your own from that — not the wording, the detail.' },
        ],
        feature: { label: 'Browse 50,000+ viral hooks by niche', to: '/signup' },
        related: ['hooks-0', 'hooks-5'],
        keywords: ['write hook', 'viral hook templates', 'hook examples', 'viral hook examples 2026', 'tiktok hook templates', 'instagram reels hook ideas', 'how to write a viral hook'],
      },
      {
        q: 'How long should my hook be?',
        a: 'On TikTok, the hook should resolve within 1.5 seconds — TikTok\'s algorithm checks completion at the 1, 3, and 7-second marks. On Instagram Reels you have up to 3 seconds because the autoplay preview is slightly longer. YouTube Shorts is the most forgiving at ~5 seconds.',
        related: ['hooks-0', 'production-2'],
        keywords: ['hook length', 'hook duration', 'hook seconds'],
      },
      {
        q: 'Should the hook be visual or verbal?',
        a: 'Both, in sync. In 2026, the highest-performing hooks combine a strong visual pattern interrupt (an unusual angle, a quick zoom, a face reaction) with on-screen text that promises a payoff. Audio-only hooks lose against the muted scroll — 65% of Reels are watched on mute the first time.',
        related: ['captions-2', 'production-3'],
        keywords: ['visual hook', 'verbal hook', 'on-screen text'],
      },
      {
        q: 'How do I know if my hook is actually working?',
        a: 'Three signals tell you whether a hook is doing its job: average watch time above 3 seconds, percentage of viewers past the 3-second mark above 60%, and rewatch rate above 8%. You can pull these from native analytics, but they\'re scattered across screens. Blossom collapses all three into a single Hook Score per post.',
        details: [
          'Average watch time > 3s = your hook beat the swipe.',
          'Reach past 3s > 60% = the algorithm will keep testing the video.',
          'Rewatch rate > 8% = your payoff was strong enough to compound distribution.',
        ],
        related: ['ai-analysis-0', 'features-0'],
        keywords: ['hook working', 'hook score', 'measure hook'],
      },
      {
        q: 'Why do question hooks work so well?',
        a: 'Question hooks force the brain into involuntary attention — your viewer has to wait for the answer, which buys you the next 5–10 seconds for free. The trick is the question has to be specific enough to feel personally targeted ("Why are your Reels stuck at 1,000 views?") and not generic ("Want to grow on Instagram?").',
        related: ['hooks-1'],
        keywords: ['question hook', 'rhetorical', 'curiosity'],
      },
      {
        q: 'What are the worst hook mistakes creators make?',
        a: 'There are four hook mistakes that account for the majority of weak openings. Each is easy to fix once you can see it.',
        details: [
          'Burying the lede — the actual hook arrives at 0:04 instead of 0:00.',
          'Front-loading credentials — "Hi, I\'m a 10-year marketing veteran" before the payoff.',
          'Vague promises — "Today I\'m going to talk about Reels" with no specific outcome.',
          'No visual change in the first second — a static face plus a static background reads as low-effort.',
        ],
        related: ['hooks-1', 'hooks-4'],
        keywords: ['hook mistakes', 'bad hooks', 'hook errors'],
      },
      {
        q: 'Should I A/B test different hooks for the same video?',
        a: 'Yes — and the best workflow is to film the body once, then film 3–4 different hook takes and stitch each as a separate post over the next 7 days. You\'ll learn which hook pattern your audience responds to without wasting full production cycles. Blossom\'s analysis will score each variant against your historical baseline.',
        related: ['production-0', 'engagement-2'],
        keywords: ['a/b test hook', 'test hooks', 'hook variants'],
      },
    ],
  },
  {
    id: 'algorithm',
    label: 'Algorithm Decoded',
    emoji: '🧬',
    blurb:
      'How the 2026 Instagram, TikTok, and YouTube Shorts algorithms rank your video — and which signals matter most for distribution.',
    items: [
      {
        q: 'How does the TikTok algorithm work in 2026?',
        a: 'The TikTok algorithm in 2026 ranks videos through a follower-first test wave: every upload is shown to a small seed of your existing followers within minutes of posting, and only videos that beat your niche\'s completion-rate baseline get pushed further. The bar moved up this year — you now need roughly 70% watch-through to clear into For You Page distribution, up from around 50% in 2024. Watch time and completion carry 40–50% of total ranking weight, shares are weighted ~3× higher than likes, and saves and rewatches signal stronger intent than follows. Two structural penalties matter: posting across 3+ unrelated topics costs about 45% reach, and AI-generated content without a clear human voice is down-ranked. If your views suddenly tanked, it is usually one of these — not a shadowban — and the fix is diagnostic, not random. Blossom analyzes any public TikTok across visual, audio, narrative, engagement, and strategy dimensions, so you can see which signal is dragging seed-batch performance before you post the next one.',
        details: [
          { label: 'Completion bar', text: 'About 70% watch-through is now required to graduate from the seed batch into FYP distribution — up from roughly 50% in 2024.' },
          { label: 'Seed audience', text: 'Stage 1 is 200–500 viewers, mostly your existing followers. The next 60 minutes decide whether you reach the ~10K second batch.' },
          { label: 'Signal weights', text: 'Shares are weighted around 3× higher than likes. Saves and rewatches outrank follows. Likes alone barely move ranking.' },
          { label: 'Niche penalty', text: 'Cross-topic posting (3+ unrelated themes) costs about 45% reach. Creators who keep 80%+ of posts inside one niche grow fastest.' },
          { label: 'AI down-rank', text: 'Fully AI-generated videos are deprioritized in favor of authentic human creators. Hybrid use is fine; faceless AI-voice content is not.' },
          { label: 'Not a shadowban', text: 'Sudden zero-view stretches during algorithm retraining are routing stalls, not bans. A real suppression is a 70%+ drop sustained 3+ days.' },
        ],
        feature: { label: 'Analyze your last video free', to: '/signup' },
        related: ['algorithm-1', 'engagement-3', 'posting-2'],
        keywords: ['tiktok algorithm', 'tiktok 2026', 'how tiktok works', 'tiktok for you page algorithm', 'tiktok completion rate 2026', 'tiktok seed audience'],
      },
      {
        q: 'How does the Instagram Reels algorithm work in 2026?',
        a: 'Instagram Reels ranks content using six weighted signals in 2026: watch time, DM shares (highest weight), saves, comments with 4+ words, profile visits within 24 hours, and follow conversion from non-followers. Likes were officially demoted in late 2025 and now carry near-zero ranking weight.',
        details: [
          'DM shares — weighted ~10× more than likes. The strongest single signal.',
          'Saves — proxy for "I want to see this again." Weighted ~5× likes.',
          'Comments with 4+ words — replies under 4 words are filtered as spam-like.',
          'Profile visits — signal that the content drove curiosity about the creator.',
          'Follow conversion — gold standard for non-follower reach.',
          'Watermarked content (TikTok logos, Snapchat watermarks) is down-ranked 30–50%.',
        ],
        related: ['cross-platform-3', 'engagement-2'],
        keywords: ['instagram algorithm', 'reels algorithm', 'meta algorithm'],
      },
      {
        q: 'What is the difference between the TikTok and Instagram algorithms?',
        a: 'TikTok\'s algorithm favors discovery — it actively promotes new content from creators with zero followers, which is why TikTok\'s average engagement rate (3.15%) is nearly 5× higher than Reels (0.65%). Instagram\'s algorithm prioritizes accounts you already follow, so it rewards consistency with your existing audience more than novelty.',
        details: [
          'TikTok — best for finding new audiences.',
          'Instagram Reels — best for converting new audiences into followers and retaining them.',
          'Practical takeaway: post the same idea to both with different hooks tuned for each.',
        ],
        related: ['cross-platform-0', 'cross-platform-3'],
        keywords: ['tiktok vs instagram', 'algorithm difference'],
      },
      {
        q: 'Does the algorithm reward consistency or virality?',
        a: 'Both, but consistency compounds. Buffer\'s 2026 analysis of 52M+ posts shows creators who post 3–5 times per week consistently grow 450% faster than creators who chase virality with sporadic posts. Accounts that go silent for 7+ days get distribution penalties of up to 60% on the next post.',
        related: ['posting-2', 'features-3'],
        keywords: ['consistency vs viral', 'posting frequency'],
      },
      {
        q: 'Why are likes worth less than saves and shares now?',
        a: 'Likes are passive — a viewer can tap-like in 0.2 seconds without engaging with the content. Saves and shares require intent: a save means the viewer wants to revisit, a share means they want others to see. DM shares are the single strongest possible signal of personal value, which is why both platforms now weight them 8–12× more than likes.',
        related: ['algorithm-1', 'engagement-2'],
        keywords: ['likes vs saves', 'shares matter', 'why likes demoted'],
      },
      {
        q: 'How does the algorithm know what niche I\'m in?',
        a: 'Both platforms classify your account using three signals: the topics, objects, and on-screen text the AI detects in your videos; the captions and hashtags you use; and the bios of accounts that engage with you. Mixing niches dilutes this classification and is the #1 reason "my account used to grow and now it doesn\'t."',
        related: ['formats-1', 'trends-3'],
        keywords: ['niche', 'algorithm niche', 'account classification'],
      },
      {
        q: 'How does the YouTube Shorts algorithm differ from TikTok?',
        a: 'YouTube Shorts blends two signals that TikTok doesn\'t weight as heavily: viewer retention across the entire video (not just hook beats) and the cross-effect with your long-form catalog. A strong Short that drives subscribers and then watches of your long-form content is rewarded more than a viral Short in isolation.',
        details: [
          'Retention is measured continuously, not just at checkpoints.',
          'Subscriber-from-Short conversion is a high-weight ranking signal.',
          'Shorts that drive long-form session time get boosted aggressively.',
          'Watermarks from TikTok/Reels are detected and down-ranked, same as on Reels.',
        ],
        related: ['cross-platform-3', 'algorithm-0'],
        keywords: ['youtube shorts', 'shorts algorithm', 'youtube'],
      },
      {
        q: 'What is "shadow distribution" and is it the same as a shadowban?',
        a: 'Shadow distribution is a softer, much more common version of suppression — the algorithm continues to show your content but only to a fraction of your followers and almost no non-followers. It\'s triggered by repeated low-engagement posts, off-niche drift, or borderline content. A full shadowban is rare; shadow distribution affects most creators at some point.',
        related: ['low-views-1', 'low-views-2', 'algorithm-5'],
        keywords: ['shadow distribution', 'soft suppression', 'reach throttle'],
      },
    ],
  },
  {
    id: 'posting',
    label: 'Posting & Timing',
    emoji: '🕐',
    blurb:
      'The actual data on when to post, how often, and the small mistakes that quietly kill reach.',
    items: [
      {
        q: 'What is the best time to post on TikTok in 2026?',
        a: 'Based on Buffer\'s analysis of 7M+ TikTok posts in 2026, the single highest-engagement window is Sunday 9 AM in your audience\'s local time. Strong secondary windows are Tuesday–Thursday 10–11 AM and the universal 6–9 PM evening prime.',
        details: [
          'Sunday 9 AM — the highest median engagement of the week.',
          'Tuesday–Thursday 10–11 AM — strong office-break window.',
          'Daily 6–9 PM — evening prime that works across most niches.',
          'Saturday — highest total engagement day; Sunday — highest "golden hour" raw views.',
        ],
        feature: { label: 'See your personal posting heatmap', to: '/signup' },
        related: ['posting-1', 'posting-2', 'features-4'],
        keywords: ['best time tiktok', 'when to post', 'tiktok timing'],
      },
      {
        q: 'What is the best time to post on Instagram Reels?',
        a: 'Buffer\'s analysis of 9.6M+ Instagram posts in 2026 identified Thursday 9 AM, Wednesday 12 PM, and Wednesday 6 PM as the top three windows globally. Evening hours (6–11 PM) win across most days. Posts inside peak windows get 2–3× the engagement of posts outside them.',
        related: ['posting-0', 'posting-2'],
        keywords: ['best time instagram', 'reels timing', 'instagram peak'],
      },
      {
        q: 'How often should I post to grow on TikTok?',
        a: 'Individual creators trying to grow should post 1–3 times per day; established brands typically post 4× per week. The sweet spot for the first 90 days of a new account is 1 high-effort post + 1 medium-effort post per day. Going below 3 posts per week stalls growth because TikTok\'s algorithm needs frequent data points to learn your niche.',
        related: ['posting-3', 'features-3'],
        keywords: ['how often post', 'tiktok frequency', 'daily posting'],
      },
      {
        q: 'How often should I post on Instagram Reels?',
        a: '3–5 Reels per week is the documented sweet spot. Posting more than once a day on Reels actively splits your reach — the algorithm only fully distributes one Reel per 24-hour window per account, so additional Reels compete with your own previous post. Stories and carousels don\'t count against this.',
        related: ['posting-2', 'formats-3'],
        keywords: ['reels frequency', 'instagram how often'],
      },
      {
        q: 'Does it hurt to delete a flopping post?',
        a: 'Yes — deleting underperforming posts within 48 hours of publishing now triggers a soft distribution penalty on both Instagram and TikTok, because the platforms treat it as a quality signal. If a post genuinely flops, archive it (Instagram) or hide it from your profile (TikTok) instead.',
        related: ['low-views-4', 'algorithm-7'],
        keywords: ['delete post', 'flop post', 'archive vs delete'],
      },
      {
        q: 'Should I schedule posts or post manually?',
        a: 'For consistency at any cadence above 1 post per day, scheduling wins — but you should still publish through the platform\'s native scheduler (Instagram\'s Meta Business Suite, TikTok\'s scheduling tool) instead of third-party APIs, because the platforms slightly favor native publishing. Posting manually is fine when you have time; just don\'t let "no time today" become "no post today."',
        related: ['posting-2', 'posting-3'],
        keywords: ['schedule posts', 'manual posting', 'scheduling tool'],
      },
      {
        q: 'Do time zones matter for global creators?',
        a: 'Yes — and they matter more than the global "best time" averages. If 60%+ of your audience is in one region, post in that region\'s peak window even if it\'s the middle of your night. Most analytics dashboards let you see your follower active hours by location. Blossom builds a personalized heatmap that weights each window by where your engaged followers actually live.',
        related: ['posting-0', 'features-4'],
        keywords: ['time zones', 'global audience', 'international'],
      },
    ],
  },
  {
    id: 'low-views',
    label: 'No Views & Shadowbans',
    emoji: '🚫',
    blurb: 'Why your views suddenly tanked, whether you\'re shadowbanned, and how to actually fix it.',
    items: [
      {
        q: 'Why are my TikTok videos getting no views?',
        a: 'There are seven documented causes of zero or near-zero TikTok views in 2026. Most are fixable in one re-shoot.',
        details: [
          'Weak hook — 80%+ swipe-away inside 3 seconds (the biggest single cause).',
          'Watermarked or recycled content auto-detected by the platform.',
          'Banned or community-guideline-flagged keywords in your caption.',
          'Posting in your audience\'s sleeping hours.',
          'Account-level shadowban after a policy strike.',
          'Niche drift confusing the algorithm.',
          'Brand-new account still in the 7–14 day calibration phase.',
        ],
        feature: { label: 'Diagnose my last post', to: '/signup' },
        related: ['low-views-1', 'low-views-3', 'hooks-6'],
        keywords: ['tiktok no views', 'zero views', 'why no views'],
      },
      {
        q: 'Am I shadowbanned on Instagram or TikTok?',
        a: 'You\'re likely shadowbanned if all four of these are true: views dropped 70%+ overnight with no content change, your posts don\'t appear in hashtag search results when you check from a logged-out account, your video doesn\'t reach non-followers (visible in TikTok analytics under "For You" traffic source), and you recently used a banned hashtag, posted near-policy content, or had a copyright strike.',
        details: [
          'Sudden 70%+ view drop with no content change — most reliable signal.',
          'Posts missing from hashtag results when searched logged-out.',
          'Near-zero "For You" or "Explore" traffic in native analytics.',
          'Recent banned hashtag, copyright strike, or community guideline warning.',
        ],
        related: ['low-views-2', 'algorithm-7'],
        keywords: ['shadowban', 'shadow ban', 'shadowbanned'],
      },
      {
        q: 'How do I fix a shadowban?',
        a: 'You can\'t force-lift a shadowban — but you can shorten it. Most natural-expiry shadowbans clear in 24 hours to 2 weeks.',
        details: [
          'Delete any post that may have triggered a guideline review.',
          'Stop posting for 24–48 hours to break the suspicious-activity pattern.',
          'Re-engage gently — post a story or reply to existing comments before publishing a new Reel.',
          'Avoid follow/unfollow loops, generic "follow for follow" comments, and any third-party automation.',
          'When you resume, post your strongest niche content to your warm audience first.',
        ],
        related: ['low-views-1'],
        keywords: ['fix shadowban', 'remove shadowban'],
      },
      {
        q: 'Why does my new TikTok account get 0 views?',
        a: 'New accounts go through a 7–14 day calibration phase where TikTok limits distribution while it figures out who to show your content to. During calibration, expect 50–300 views per post even if the content is great. The fix is not to delete and restart — you\'ll just reset the timer.',
        details: [
          'Post 1× per day for the first 14 days, all in the same niche.',
          'Don\'t use more than 3 hashtags per post during calibration.',
          'Avoid switching content style for the first 10 posts.',
          'Engage with 5–10 accounts in your niche daily to seed the recommendation graph.',
        ],
        related: ['low-views-0', 'algorithm-5'],
        keywords: ['new account no views', 'tiktok calibration'],
      },
      {
        q: 'Why did my views suddenly drop after going viral?',
        a: 'The "viral hangover" is real and documented. After a video crosses 100K+ views, the algorithm temporarily widens your audience pool to people who don\'t actually fit your niche — which crushes the engagement rate of your next 2–3 posts and triggers a reach reduction. The fix is to keep posting your strongest niche content immediately after a viral hit, not switch styles to chase the wider audience.',
        related: ['posting-4', 'engagement-3'],
        keywords: ['viral hangover', 'views dropped', 'after viral'],
      },
      {
        q: 'What is "ghost engagement" and how do I avoid it?',
        a: 'Ghost engagement is when likes and views come in but no shares, saves, or follows convert — usually a signal that your content is reaching the wrong audience pool. Both Instagram and TikTok shrink your reach progressively when this happens because they read it as "the wrong people are seeing this." The fix is tighter niche focus, more specific captions, and disqualifying-filter hooks ("This is for X. Everyone else, skip.").',
        related: ['engagement-3', 'formats-1'],
        keywords: ['ghost engagement', 'fake engagement', 'wrong audience'],
      },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement & Growth',
    emoji: '📈',
    blurb:
      'Engagement-rate benchmarks, follower growth, and what to actually optimize when you\'re scaling past 10K, 100K, and 1M.',
    items: [
      {
        q: 'What is a good engagement rate in 2026?',
        a: 'The 2026 median engagement rates are: LinkedIn 6.2%, Facebook 5.6%, Instagram 5.5% (carousels skew this up), TikTok 4.6%, and Instagram Reels alone 0.65%. Anything above your platform\'s median puts you in the top half; above 2× median puts you in the top 10%.',
        details: [
          'Compare to your niche, not the global median — finance and B2B routinely run 2–3× lifestyle.',
          'Smaller accounts (under 10K) naturally show 2–3× higher engagement; don\'t panic when it dips at scale.',
          'Reels-specific engagement looks low because it\'s measured against view count, which is huge.',
        ],
        related: ['engagement-1', 'engagement-2'],
        keywords: ['engagement rate', 'good engagement', 'benchmark'],
      },
      {
        q: 'How fast can I grow from 0 to 10K followers?',
        a: 'With consistent daily posting and a single tight niche, 0 → 10K in 90 days is realistic for the median creator on TikTok and ~120 days on Instagram Reels. The single biggest accelerator is one breakout video — most creators who cross 10K do so because of one video that hit 100K+ views.',
        related: ['going-viral-6', 'posting-2'],
        keywords: ['grow 10k followers', 'fast growth', '0 to 10k'],
      },
      {
        q: 'How do I increase my engagement rate?',
        a: 'Four levers, in order of impact: shift your content mix toward carousels and Reels (carousels have 3× the save rate of single images), ask one specific question in the caption that requires a 4+ word reply, reply to every comment within the first 60 minutes, and end every Reel with a verbal cue that prompts a rewatch.',
        details: [
          'Mix shift: 4 Reels + 2 carousels + 1 single image per week is the documented sweet spot.',
          'Caption: prompt a 4+ word reply ("what would you add?" beats "thoughts?").',
          'First-60-minute reply rate: respond to 100% of comments — the algorithm reads it as engagement extension.',
          'Rewatch cue: "watch it again, the answer\'s in the background" routinely doubles loop rate.',
        ],
        related: ['captions-0', 'formats-3'],
        keywords: ['increase engagement', 'higher engagement'],
      },
      {
        q: 'Why are my followers not seeing my posts?',
        a: 'On Instagram, only ~25% of your followers see any given post by default. The number drops to 10–15% if your engagement rate is below your niche median for 7+ consecutive posts because the algorithm progressively shrinks your audience. The recovery move is 2–3 posts back-to-back designed to over-index on shares (controversial takes, micro-tutorials, identity statements).',
        related: ['algorithm-1', 'low-views-5'],
        keywords: ['followers not seeing', 'reach dropping'],
      },
      {
        q: 'Does buying followers ever work?',
        a: 'No — and it gets worse every year. Bought followers don\'t engage, which drags your engagement rate below the niche median, which throttles the reach you have to real followers. Both Instagram and TikTok now run quarterly purges of bot accounts that can wipe 20–60% of bought followers overnight.',
        related: ['engagement-0', 'monetization-5'],
        keywords: ['buy followers', 'fake followers'],
      },
      {
        q: 'How do I convert viewers into actual followers?',
        a: 'Follower conversion from a viral video averages 0.5–2% on TikTok and 0.3–1.5% on Reels. To push toward the high end, your video needs to do three things: prove value or identity in the first 5 seconds, give the viewer a reason to expect more of the same from your account, and end with a verbal or visual cue that prompts a profile visit.',
        details: [
          'Pin a "start here" intro Reel on your profile so visitors hit your strongest content first.',
          'Bio: one sentence that says exactly who you are and what they get from following.',
          'End-of-video CTA: "follow for part 2" outperforms "follow for more" by ~3×.',
        ],
        related: ['hooks-1', 'formats-0'],
        keywords: ['follower conversion', 'turn views into followers'],
      },
      {
        q: 'Which metrics should I ignore?',
        a: 'Three metrics are mostly noise in 2026: raw like count, raw view count, and follower count growth in isolation. The signals that actually correlate with sustained growth are share rate, save rate, completion percentage, and follower conversion rate per 1,000 views.',
        related: ['engagement-2', 'features-4'],
        keywords: ['vanity metrics', 'metrics to ignore', 'important metrics'],
      },
    ],
  },
  {
    id: 'formats',
    label: 'Content Formats & Niches',
    emoji: '🎬',
    blurb:
      'Which content formats actually work in 2026, how to pick a niche that grows, and how Blossom\'s Format library accelerates the decision.',
    items: [
      {
        q: 'What types of content go viral most often?',
        a: 'The five formats that account for ~70% of viral short-form content in 2026 are: POV/relatable scenarios with a hard cut to payoff, "How to do X in 60 seconds" listicles, contrarian-take talking heads, before/after transformations with on-screen labels, and reactive duets/stitches to trending content.',
        details: [
          'POV — relatable scenario + hard cut + reaction.',
          'Listicle — "3 things…" or "How to X in 60s" with on-screen counter.',
          'Contrarian talking head — face-to-camera, bold statement, evidence, payoff.',
          'Transformation — clear before/after with labels and a satisfying reveal.',
          'Reactive — duet, stitch, or response to trending content with your own twist.',
        ],
        feature: { label: 'Explore the Format library', to: '/signup' },
        related: ['formats-1', 'features-1'],
        keywords: ['viral formats', 'content formats', 'video types'],
      },
      {
        q: 'Should I niche down or post about everything?',
        a: 'Niche down — hard. The algorithm classifies your account by the topics it detects across your last ~20 posts; mixing topics dilutes that classification and is the documented #1 cause of stalled growth. The right move is one niche per account, with sub-topic variation within it.',
        related: ['algorithm-5', 'formats-2'],
        keywords: ['niche down', 'choose niche', 'multiple niches'],
      },
      {
        q: 'What\'s the best content niche to start in 2026?',
        a: '"Best niche" is the wrong question — the right question is "which niche overlaps your knowledge AND has rising search velocity in your country." That said, the fastest-growing niches in 2026 by audience velocity are AI tools/workflows, longevity & sleep, finance for Gen Z, micro-fitness (5-min workouts), home cooking with $20 budgets, and parenting tactics for screen-era kids.',
        related: ['features-5', 'trends-0'],
        keywords: ['best niche', 'what niche', 'starting niche'],
      },
      {
        q: 'Do carousels still work on Instagram?',
        a: 'Yes — and they\'re currently underrated. Carousels have 3× the save rate of single images and are the only post type Instagram re-shows to users who didn\'t engage the first time, which gives them a longer reach half-life. The 2026 sweet spot is 7–10 slides with a hook slide, 5 value slides, and a CTA slide.',
        related: ['engagement-2', 'formats-4'],
        keywords: ['carousels', 'carousel posts', 'instagram carousel'],
      },
      {
        q: 'Should I post Reels or feed posts more often?',
        a: 'Reels for reach, feed for retention. Reels reach roughly 5–8× the audience of a feed post, but feed posts hold engagement from your existing followers longer. The optimal 2026 mix is 4 Reels + 2 carousels + 1 single image per week.',
        related: ['engagement-2', 'formats-3'],
        keywords: ['reels vs feed', 'content mix'],
      },
      {
        q: 'Does faceless content actually work?',
        a: 'Yes — faceless niches grew 38% in 2026 and many crossed 1M+ followers without ever showing a creator on camera. The categories that work best for faceless are: explainer animation, ASMR/satisfying loops, screen-recording tutorials, voiceover-driven storytelling, and AI-generated visuals with original audio. The trade-off is lower follower conversion per view — faceless accounts need 2–3× the views to hit the same follower number.',
        related: ['formats-0', 'production-4'],
        keywords: ['faceless content', 'no face', 'faceless creator'],
      },
      {
        q: 'How do I plan a content calendar that actually grows?',
        a: 'The 70/20/10 rule beats any rigid template: 70% of posts are your bread-and-butter format that you know works, 20% are tactical experiments testing a single variable (new hook, new audio, new format), and 10% are pure swings — trends or formats outside your comfort zone. Track them separately so the bread-and-butter doesn\'t drown out the data from the experiments.',
        related: ['features-6', 'posting-2'],
        keywords: ['content calendar', 'content plan', 'schedule'],
      },
    ],
  },
  {
    id: 'captions',
    label: 'Captions, Hashtags & Search',
    emoji: '🔤',
    blurb:
      'How captions, hashtags, and on-platform SEO actually drive distribution in 2026 — beyond the myths that won\'t die.',
    items: [
      {
        q: 'How long should my caption be?',
        a: 'The data shows two windows that outperform: 8–15 words (the "fast hook" caption) and 70–120 words (the "context" caption). Anything between 16 and 69 words underperforms both. The fast-hook caption works for entertainment niches; the context caption works for education, finance, and B2B.',
        details: [
          '8–15 words — pair with a strong visual hook. Punchy, single line.',
          '70–120 words — open with the payoff in line 1, then context. The "more" cut should land on a curiosity beat.',
          'Avoid: 16–69 word captions. They read as either too long for entertainment or too short for value.',
        ],
        related: ['hooks-1', 'engagement-2'],
        keywords: ['caption length', 'caption words', 'how long caption'],
      },
      {
        q: 'How many hashtags should I use in 2026?',
        a: '3–5 hashtags on Instagram, 2–4 on TikTok. The old "use 30 hashtags" advice is outdated and now actively hurts reach because both platforms read hashtag stuffing as a low-quality signal. Pick hashtags that are specific to your niche (under 1M posts) rather than broad ones (#fyp, #foryou) which add no classification value.',
        related: ['captions-2', 'algorithm-5'],
        keywords: ['hashtags 2026', 'how many hashtags'],
      },
      {
        q: 'Do hashtags still work in 2026?',
        a: 'Yes — but as a classification signal, not a discovery channel. Posts with hashtags get 5% more views and ~10% more interactions on average, but the lift comes from helping the algorithm classify your content correctly, not from people searching the tag. Hashtag-traffic share has dropped to under 10% of total Reels reach.',
        related: ['captions-1', 'captions-3'],
        keywords: ['do hashtags work', 'hashtag effectiveness'],
      },
      {
        q: 'What is TikTok SEO and Instagram SEO?',
        a: 'Both platforms now run keyword-based search engines on top of the recommendation feed. Roughly 40% of Gen Z TikTok users use TikTok as a search engine for product reviews, recipes, and how-to content. To rank, you need keywords in three places: the caption (first 80 characters), the on-screen text, and the spoken transcript that the platform auto-generates.',
        details: [
          'Caption — first 80 characters carry the most search weight.',
          'On-screen text — readable by both platforms\' image models.',
          'Spoken transcript — auto-generated and indexed for search.',
          'Pick 1 primary keyword per video and use it in all three places.',
        ],
        feature: { label: 'See what keywords win in your niche', to: '/signup' },
        related: ['captions-1', 'captions-2'],
        keywords: ['tiktok seo', 'instagram seo', 'keywords'],
      },
      {
        q: 'Should I use keywords in my caption?',
        a: 'Yes — but naturally, in the first line, and ideally as part of the hook. The platforms\' search engines tokenize the first 80 characters of your caption with the heaviest weight, so leading with the keyword ("Best TikTok hooks for…" instead of "Hey guys, today I want to talk about…") is the single biggest caption-level SEO move.',
        related: ['captions-3', 'hooks-1'],
        keywords: ['keywords caption', 'caption seo'],
      },
      {
        q: 'What hashtags should I avoid?',
        a: 'Avoid generic high-volume tags (#fyp, #foryou, #viral, #explore) — they\'re saturated, classify your account as nothing in particular, and signal "trying too hard" to the algorithm. Also avoid any tag flagged on the unofficial banned-hashtag lists circulating in 2026, which include some surprising entries like #adulting and #happythanksgiving that quietly suppress reach.',
        related: ['captions-1', 'low-views-1'],
        keywords: ['banned hashtags', 'avoid hashtags', 'fyp hashtag'],
      },
    ],
  },
  {
    id: 'production',
    label: 'Video Length & Production',
    emoji: '🎥',
    blurb:
      'Gear, editing, length, subtitles, aspect ratio — the production decisions that quietly multiply reach.',
    items: [
      {
        q: 'How long should my videos be in 2026?',
        a: 'TikTok favors 21–34 seconds for max reach and 60–90 seconds for max watch time. Instagram Reels favors 7–15 seconds for viral spread and 30–60 seconds for educational content. YouTube Shorts ranks 45–60 second videos highest because the algorithm rewards retention time more than completion percentage.',
        details: [
          'TikTok viral sweet spot — 21–34 seconds.',
          'Reels viral sweet spot — 7–15 seconds.',
          'Shorts sweet spot — 45–60 seconds.',
          'Anything over 60 seconds needs a mid-video re-hook every ~15 seconds.',
        ],
        related: ['hooks-2', 'production-5'],
        keywords: ['video length', 'how long video', 'duration'],
      },
      {
        q: 'What gear do I actually need to start?',
        a: 'A 2-year-old smartphone, a $30 mini tripod, and natural window light is enough to reach 100K+ followers. The single highest-ROI upgrade after that is a $50–$80 lavalier microphone — clear audio raises completion rate more than 4K video ever will.',
        details: [
          'Phone — anything from the last 3 years shoots fine at 1080p.',
          'Light — window light at 10 AM–2 PM. Add a $30 LED ring if you film at night.',
          'Audio — $50–$80 lavalier mic. Clear audio = 15–25% completion lift.',
          'Tripod — $20–$40 mini tripod or arm.',
        ],
        related: ['production-2', 'production-3'],
        keywords: ['gear creator', 'starter equipment', 'creator setup'],
      },
      {
        q: 'What are the best editing apps for short-form video in 2026?',
        a: 'CapCut still leads for mobile-first editing with native exports for TikTok, Reels, and Shorts; Descript wins for talking-head edits and auto-captioning; and Adobe Premiere Pro remains the desktop standard for higher-effort content. The right answer depends on your workflow speed, not your output quality — fast editors out-publish slow editors.',
        related: ['production-1', 'production-3'],
        keywords: ['editing apps', 'best editor', 'capcut'],
      },
      {
        q: 'Should I add subtitles or captions to every video?',
        a: 'Yes — and the data on this is unambiguous. 65% of Reels and 55% of TikToks are watched on mute the first time. Videos with on-screen captions retain 28% better than videos without. Use auto-captions and edit them for accuracy; both platforms now have built-in caption tools that don\'t hurt reach.',
        related: ['hooks-3', 'production-2'],
        keywords: ['subtitles', 'captions on video', 'on-screen text'],
      },
      {
        q: 'What\'s the ideal aspect ratio and resolution?',
        a: '9:16 vertical at 1080×1920 minimum is the standard for all three short-form platforms. Avoid 1:1 and 4:5 — they trigger black bars that count as wasted screen space, which the algorithms read as lower production quality. Export at 60 FPS if your phone supports it; the platforms now favor 60 FPS for sports, dance, and fast-cut content.',
        related: ['production-0', 'production-1'],
        keywords: ['aspect ratio', 'resolution', 'vertical video'],
      },
      {
        q: 'How do I keep retention high in a longer video?',
        a: 'Add a re-hook every 15 seconds. A re-hook is a quick pattern interrupt — a cut to a new angle, an on-screen text reveal, a sound effect, or a verbal "wait, this is the part that matters." Without re-hooks, completion rate drops linearly with video length; with them, it stays nearly flat through 60 seconds.',
        related: ['production-0', 'hooks-4'],
        keywords: ['retention', 'keep watching', 're-hook'],
      },
    ],
  },
  {
    id: 'trends',
    label: 'Trends & Sounds',
    emoji: '🔥',
    blurb: 'How to find trending sounds, jump on trends early, and use trends without becoming a copycat account.',
    items: [
      {
        q: 'How do I find trending sounds on TikTok and Reels?',
        a: 'Three reliable sources in 2026: Instagram\'s creator dashboard → Tips and resources → Trending audio (US pro accounts only), TikTok Creative Center → Top sounds by region, and the upward-arrow indicator next to a sound when you tap to use it in a draft. The smart move is to catch sounds while they have 5,000–50,000 uses — past 500K uses you\'re late.',
        feature: { label: 'See rising sounds now', to: '/signup' },
        related: ['trends-1', 'features-4'],
        keywords: ['trending sounds', 'trending audio', 'find sounds'],
      },
      {
        q: 'How early do I need to be on a trend?',
        a: 'For sounds, under 50,000 total uses is early and under 5,000 is very early. For format trends (a specific transition or POV setup), the first 72 hours of the trend going viral is the prime window — after day 5 the algorithm starts down-weighting the format as "saturated."',
        related: ['trends-0', 'trends-2'],
        keywords: ['trend timing', 'jump on trend', 'early trend'],
      },
      {
        q: 'Do Instagram Reels and TikTok trends overlap?',
        a: 'Most Instagram Reels sound and format trends start on TikTok 3–7 days earlier. If a sound is trending on TikTok but has fewer than 5,000 Reels using it on Instagram, you have a documented head-start window of about a week.',
        related: ['cross-platform-2', 'trends-1'],
        keywords: ['trend cross platform', 'reels tiktok trends'],
      },
      {
        q: 'Can a trend hurt my account if it doesn\'t fit my niche?',
        a: 'Yes. Jumping on an off-niche trend can spike one post\'s views but confuses the algorithm\'s niche classification of your account, which then suppresses your next 5–10 posts. The rule of thumb is: only ride trends you can rewrite into your niche\'s language.',
        related: ['algorithm-5', 'formats-1'],
        keywords: ['off niche trend', 'trend hurts account'],
      },
      {
        q: 'Should I just chase every viral trend?',
        a: 'No — chasing trends is the most common low-conversion strategy in 2026. Pure trend-chasers earn views but lose follower conversion because each viral post brings the wrong audience. The high-ROI move is to pick 1–2 trends per week that fit your niche and stack them on top of your evergreen content cadence.',
        related: ['trends-3', 'formats-6'],
        keywords: ['trend chasing', 'every trend', 'trend strategy'],
      },
    ],
  },
  {
    id: 'competitor',
    label: 'Competitor & Viral Analysis',
    emoji: '🔍',
    blurb: 'How to study viral videos, learn from competitors, and reverse-engineer what works without copying.',
    items: [
      {
        q: 'How do I analyze a competitor\'s viral video?',
        a: 'A useful competitor breakdown answers six questions: what is the hook in the first 1.5 seconds, when does the payoff land, what audio is used and is it trending, what on-screen text appears and when, what is the implicit emotional trigger, and how does the caption set up the comment section. Doing this manually for one video takes ~20 minutes. Blossom does all six in under 90 seconds for any public Instagram or TikTok URL.',
        feature: { label: 'Analyze any public video', to: '/signup' },
        related: ['ai-analysis-0', 'features-0'],
        keywords: ['competitor analysis', 'analyze viral', 'reverse engineer'],
      },
      {
        q: 'Which creators should I study?',
        a: 'Not the 10M+ giants — their growth playbook stopped applying years ago. Study mid-sized creators with 50K–300K followers who are still growing 5%+ per month, because their tactics are still active and replicable. Blossom\'s influencer discovery filters by follower range AND growth velocity so you can build a study list of accounts that are actually winning right now.',
        related: ['features-5', 'monetization-3'],
        keywords: ['who to study', 'which creators', 'mid sized creators'],
      },
      {
        q: 'Is it plagiarism to copy a viral format?',
        a: 'Formats themselves are not protected — the structure of "before/after transformation with hard cut" is a public format used by millions of creators. What\'s protected is the specific footage, audio (when not licensed for use), and the exact script wording. Replicating a format with your own footage, your own script, and a freely-usable sound is standard practice.',
        related: ['competitor-3', 'ai-analysis-5'],
        keywords: ['copy format', 'plagiarism', 'is it copying'],
      },
      {
        q: 'Should I duet, stitch, or just take inspiration?',
        a: 'Duets and stitches preserve the original creator\'s credit and tap into their audience signal — they are reach multipliers when the original is trending. Pure inspiration (replicating the format with your own content) is better when you want to build your own niche authority.',
        related: ['competitor-2', 'cross-platform-4'],
        keywords: ['duet vs stitch', 'inspiration', 'remix content'],
      },
      {
        q: 'How many videos should I study before I post?',
        a: 'For a new niche, study 20–30 top-performing videos across 5–10 creators before your first post. That sample is large enough to reveal the dominant hook patterns, format choices, and pacing without locking you into one creator\'s style. Blossom\'s niche dashboard surfaces this set automatically when you pick your category.',
        related: ['competitor-1', 'features-5'],
        keywords: ['study videos', 'how many to watch', 'research'],
      },
    ],
  },
  {
    id: 'cross-platform',
    label: 'Cross-Platform Strategy',
    emoji: '🔁',
    blurb: 'Repost smart, dodge watermark penalties, and decide which platform to lead with.',
    items: [
      {
        q: 'Can I repost my TikToks to Instagram Reels?',
        a: 'Yes — and most successful creators do. But you must re-export the video without the TikTok watermark, because Instagram\'s algorithm down-ranks watermarked content by 30–50%. Save the original from CapCut or your draft, not from your published TikTok.',
        details: [
          'Always re-export from your editing app, never download from the published TikTok.',
          'Re-thread the caption — what works on TikTok rarely works verbatim on Reels.',
          'Re-time the post for the destination platform\'s peak window.',
          'Wait 24–48 hours between platforms so the algorithms don\'t cross-detect the duplicate.',
        ],
        related: ['cross-platform-3', 'algorithm-1'],
        keywords: ['repost tiktok instagram', 'crosspost', 'reuse content'],
      },
      {
        q: 'Should I have separate accounts for TikTok and Instagram?',
        a: 'Yes — one account per platform. The audiences, algorithms, and content norms are different enough that one set of posts cannot win on both without per-platform adaptation. The same niche, the same brand, just two different "front doors" tuned to each algorithm.',
        related: ['cross-platform-0', 'algorithm-2'],
        keywords: ['separate accounts', 'one account both', 'cross post account'],
      },
      {
        q: 'Which platform should I focus on first?',
        a: 'TikTok if you\'re starting from zero and need new audience discovery — its algorithm aggressively promotes new creators. Instagram Reels if you already have an existing Instagram audience you want to convert into short-form viewers. YouTube Shorts if you have or plan to have long-form content to drive subscribers toward.',
        details: [
          'TikTok — best for cold-start growth from 0 followers.',
          'Reels — best for converting an existing IG audience.',
          'Shorts — best when paired with a long-form YouTube channel.',
        ],
        related: ['cross-platform-1', 'algorithm-2'],
        keywords: ['which platform first', 'tiktok or reels'],
      },
      {
        q: 'How do I avoid the watermark penalty when crossposting?',
        a: 'Two rules: never download a published video from one platform to upload to another, and never use third-party "watermark removers" that fail to clean the embedded metadata. Always export the original from your editing app (CapCut, Premiere, Descript). The platforms detect watermarks via visual matching AND metadata fingerprinting, so a partial removal still triggers the penalty.',
        related: ['cross-platform-0', 'algorithm-1'],
        keywords: ['watermark penalty', 'remove watermark', 'tiktok logo'],
      },
      {
        q: 'Can I duet or stitch a TikTok on Instagram?',
        a: 'Not natively — Instagram doesn\'t support TikTok duets or stitches because the source video lives on a competing platform. The workaround is the Remix feature (Instagram\'s version of duet/stitch), which only works on existing Reels. If you want to react to a TikTok on Instagram, screen-record (with credit) and treat it as inspiration content rather than a true duet.',
        related: ['competitor-3'],
        keywords: ['duet across platforms', 'cross duet', 'reels remix'],
      },
      {
        q: 'Do trends move between platforms?',
        a: 'Yes — trends almost always start on TikTok and move to Instagram Reels within 3–7 days. YouTube Shorts trails by an additional 5–10 days. The arbitrage window is real: a trending sound on TikTok with under 5,000 Reels using it on Instagram gives you a documented head-start.',
        related: ['trends-2', 'features-4'],
        keywords: ['trends move platforms', 'cross platform trends'],
      },
    ],
  },
  {
    id: 'monetization',
    label: 'Monetization & Brand Deals',
    emoji: '💰',
    blurb: 'How many followers you actually need to make money — and how to make more without more followers.',
    items: [
      {
        q: 'How many followers do I need to monetize on TikTok in 2026?',
        a: 'TikTok\'s 2026 tiered requirements: 1,000 followers for LIVE Gifts, 5,000 followers for TikTok Shop affiliate, and 10,000 followers + 100,000 monthly views for the Creator Rewards Program. Your account must also be 30+ days old and policy-clean. Affiliate marketing has no minimum.',
        details: [
          '1,000 followers — LIVE Gifts.',
          '5,000 followers — TikTok Shop affiliate.',
          '10,000 followers + 100,000 monthly views — Creator Rewards Program (replaced the old Creator Fund).',
          'No minimum — affiliate marketing, product sales, brand deals.',
        ],
        related: ['monetization-1', 'monetization-2'],
        keywords: ['tiktok monetize', 'how many followers tiktok'],
      },
      {
        q: 'How many followers do I need to monetize on Instagram?',
        a: 'Instagram\'s 2026 thresholds: 10,000 followers for subscriptions and Reels Play monetization (also requires 600,000 Reels views in 60 days), 10,000 for branded content tools, and 100,000 to be eligible for IG\'s top-tier brand deal marketplace. Affiliate links and brand deals are negotiable at any size.',
        related: ['monetization-0', 'monetization-2'],
        keywords: ['instagram monetize', 'instagram followers needed'],
      },
      {
        q: 'How much can a creator with 100K followers actually earn?',
        a: 'In 2026, a niche-focused creator with 100K engaged followers typically earns $1,500–$4,000 per sponsored post, $200–$800/month from TikTok Creator Rewards if posting daily, $500–$3,000/month from affiliate deals depending on conversion, and anywhere from $0 to $50,000 from a single product launch with this audience size.',
        details: [
          'Sponsored post — $1,500–$4,000. Finance and B2B pay 3–5× more than lifestyle.',
          'Creator Rewards — $200–$800/month at daily-posting cadence.',
          'Affiliate — $500–$3,000/month depending on niche conversion.',
          'Product launch — $0–$50K from one launch at 100K audience size.',
        ],
        related: ['monetization-1', 'monetization-4'],
        keywords: ['creator income', 'how much earn'],
      },
      {
        q: 'How do I get my first brand deal?',
        a: 'You\'re ready for your first brand deal once you can show three things: 30 days of consistent posting in a single niche, an engagement rate at or above your niche median, and at least one post that crossed 50K views. With those three, you can pitch brands directly — most micro-influencer deals come from outbound pitches, not inbound DMs.',
        details: [
          'Pick 10 brands you genuinely use that fit your niche.',
          'Send a one-paragraph pitch with one specific post idea and your three best metrics.',
          'Quote $80–$150 per 10,000 followers as a starting rate for a single post.',
          'Bundle a Reel + a Story + a feed post for 2–3× the single-post rate.',
        ],
        related: ['monetization-4', 'monetization-5'],
        keywords: ['first brand deal', 'pitch brands', 'sponsored'],
      },
      {
        q: 'What do brands actually look at before paying you?',
        a: 'Five things in order: engagement rate against your niche median, audience demographic match to the brand\'s buyer, content quality (production, captions, retention), posting consistency over the last 90 days, and your last 5 sponsored posts\' performance compared to your organic posts. Follower count is a distant sixth.',
        related: ['monetization-3', 'engagement-0'],
        keywords: ['brands look at', 'brand requirements'],
      },
      {
        q: 'Is the creator economy still growing?',
        a: 'Yes — the global creator economy is projected at $480B by end of 2026, up from $250B in 2023. The growth is increasingly concentrated in "quality over quantity" creators: 50K–250K-follower accounts with 5%+ engagement now command brand deal rates that used to be reserved for 1M+ accounts.',
        related: ['monetization-2', 'monetization-4'],
        keywords: ['creator economy', 'is creator growing'],
      },
      {
        q: 'Should I work with an agency or stay independent?',
        a: 'Agencies typically take 15–25% of brand deal revenue in exchange for inbound deal flow, contract negotiation, and payment chasing. They\'re worth it once you\'re fielding more than 4–5 inbound brand requests per month and your time on negotiation exceeds what you\'d save by paying the cut. Below that threshold, independence is more profitable.',
        related: ['monetization-3', 'monetization-4'],
        keywords: ['agency creator', 'manager', 'independent'],
      },
    ],
  },
  {
    id: 'blossom',
    label: 'About Blossom',
    emoji: '🌸',
    blurb: 'What Blossom does, what makes it different, and how it fits into a creator\'s daily workflow.',
    items: [
      {
        q: 'What is Blossom?',
        a: 'Blossom is an AI-powered social media intelligence platform that analyzes viral Instagram and TikTok content, scores your own posts against proven viral patterns, and tells you exactly which parts of a video will lose viewers before you publish. It indexes 1.2M+ viral videos across 60+ niches, classifies them by hook, format, and tactic, and uses Google Gemini to break down the visual, audio, and narrative dimensions of every video.',
        feature: { label: 'Start a free trial', to: '/signup' },
        related: ['blossom-1', 'features-0'],
        keywords: ['what is blossom', 'blossom app', 'blossom platform'],
      },
      {
        q: 'How is Blossom different from other content analysis tools?',
        a: 'Three things set Blossom apart from tools like Virlo, Memories.ai, Viewstats, or quso.ai: Blossom analyzes 5 dimensions in parallel (visual, audio, narrative, engagement, strategy) rather than just hooks or just retention; it ships a curated Format/Hook/Tactic library that gives you replicable structures, not just data; and it generates 5 filmable scripts per day pre-scored for your specific niche so you don\'t have to start from scratch.',
        details: [
          'Most tools stop at analytics. Blossom finishes at execution.',
          '5-dimension parallel scoring (visual / audio / narrative / engagement / strategy).',
          'Curated Hook (50K+), Format (1,200+), and Tactic (800+) libraries.',
          'Daily filmable scripts pre-scored for your niche.',
        ],
        related: ['blossom-2', 'features-0'],
        keywords: ['blossom vs', 'compare blossom', 'alternative tools'],
      },
      {
        q: 'Who is Blossom for?',
        a: 'Blossom is built for serious short-form creators on Instagram Reels and TikTok — typically creators with 1K–500K followers who post 3+ times per week and want to move past guessing. It\'s also used by social-first brands and agencies managing 5–50 creator accounts at once.',
        related: ['blossom-0', 'monetization-6'],
        keywords: ['who is blossom for', 'blossom audience'],
      },
      {
        q: 'How much does Blossom cost?',
        a: 'Blossom offers a free starter tier with limited monthly analyses, a Premium tier for active solo creators, and a Platin tier with influencer insights, the Trend dashboard, API access, and higher analysis limits. All paid tiers start with a free trial — you\'re not charged at signup.',
        feature: { label: 'See current pricing', to: '/#pricing' },
        related: ['privacy-3', 'privacy-4'],
        keywords: ['pricing', 'cost', 'how much'],
      },
      {
        q: 'Does Blossom work on Instagram, TikTok, or both?',
        a: 'Both — Blossom is built natively for Instagram (Reels, carousels, posts) and TikTok. The platform fetches video metadata via official-tier partners (HikerAPI for Instagram, LamaTok for TikTok), analyzes content with Google Gemini, and runs audio analysis with Meyda and FFmpeg. YouTube Shorts support is on the public roadmap.',
        related: ['ai-analysis-0', 'ai-analysis-1'],
        keywords: ['instagram tiktok', 'which platforms', 'platform support'],
      },
      {
        q: 'Do I have to connect my social accounts to use Blossom?',
        a: 'No. You can paste any public Instagram or TikTok URL and get a full analysis without ever connecting your account. Connecting your accounts unlocks personalized features — follower-active heatmaps, post-by-post benchmarking, and breakout-video alerts — but it\'s optional.',
        related: ['privacy-0', 'privacy-1'],
        keywords: ['connect account', 'do i need to connect'],
      },
      {
        q: 'How do I get started with Blossom in 5 minutes?',
        a: 'Sign up, choose your primary niche, and paste a public Instagram or TikTok URL. Blossom runs the full 5-dimension analysis in under 90 seconds and shows you the score, the weakness breakdown, and 3 fixable improvements. You\'ll see real value before you\'ve even configured an account.',
        details: [
          '1. Sign up (no card on free trial).',
          '2. Pick your niche from the category picker.',
          '3. Paste a public IG or TikTok URL.',
          '4. Read the weakness breakdown and the fix list.',
          '5. Get today\'s 5 filmable scripts personalized to your niche.',
        ],
        feature: { label: 'Start now', to: '/signup' },
        related: ['blossom-0', 'features-3'],
        keywords: ['get started', 'onboarding', 'how to start'],
      },
    ],
  },
  {
    id: 'ai-analysis',
    label: 'AI, Analysis & Tech',
    emoji: '🤖',
    blurb: 'What Blossom\'s AI actually does, how the analysis pipeline works, and where the data comes from.',
    items: [
      {
        q: 'How does Blossom\'s AI analysis work?',
        a: 'When you submit a video, Blossom runs a multi-stage pipeline: the video is fetched and key frames are extracted, audio is separated and analyzed for beat structure and energy curve, Google Gemini analyzes the frames + transcript + audio markers in parallel across five dimensions, the result is classified against our library of 1,200+ formats, 50,000+ hooks, and 800+ tactics, and you receive a virality probability score with a weakness breakdown and a fix list. The whole pipeline runs in 30–120 seconds depending on video length.',
        details: [
          'Stage 1 — Fetch + keyframe extraction.',
          'Stage 2 — Audio separation, beat detection, music ID (Meyda + FFmpeg).',
          'Stage 3 — Multimodal reasoning (Google Gemini 2.5 Pro) across 5 dimensions.',
          'Stage 4 — Classification against Hook/Format/Tactic library.',
          'Stage 5 — Score + weakness breakdown + ranked fix list.',
        ],
        related: ['ai-analysis-1', 'ai-analysis-3'],
        keywords: ['how ai works', 'analysis pipeline', 'gemini'],
      },
      {
        q: 'What AI model does Blossom use?',
        a: 'Blossom\'s analysis is powered by Google Gemini 2.5 Pro for multimodal reasoning across video frames, transcripts, and audio markers. Audio analysis uses Meyda for spectral and energy features and FFmpeg for extraction. The classification step uses our own fine-tuned models trained on Blossom\'s indexed library of viral content.',
        related: ['ai-analysis-0'],
        keywords: ['ai model', 'gemini', 'which ai'],
      },
      {
        q: 'Can I track how my content improves over time?',
        a: 'Yes. Every analysis Blossom runs is versioned — you can compare any two versions of the same content side-by-side and see exactly which scores moved, which weaknesses were fixed, and which new ones emerged. The version timeline is especially powerful when you re-shoot a flop with Blossom\'s suggested fixes applied.',
        related: ['features-7', 'going-viral-6'],
        keywords: ['version', 'track improvement', 'history'],
      },
      {
        q: 'Is the analysis accurate?',
        a: 'Blossom\'s virality probability score correlates with actual published-video performance at r=0.74 on our internal validation set of 50,000 posts. That makes it directionally reliable but not deterministic — no model can perfectly predict virality because viral spikes depend on real-time algorithm state, posting timing, and audience mood. We treat the score as a strong indicator, not a guarantee.',
        related: ['going-viral-3', 'ai-analysis-0'],
        keywords: ['accurate analysis', 'reliable', 'how accurate'],
      },
      {
        q: 'Does Blossom have an API?',
        a: 'Yes — Platin-tier accounts get access to Blossom\'s public API at /api/v1 with endpoints for videos, influencers, formats, hooks, tactics, music, suggestions, trending content, and categories. Authentication uses an X-API-Key header (keys are prefixed blsm_). Rate limits are 100 requests/min on Platin and 600/min on enterprise.',
        feature: { label: 'API key management', to: '/dashboard/account/api' },
        related: ['blossom-3'],
        keywords: ['api', 'public api', 'developer'],
      },
      {
        q: 'How does Blossom respect copyright?',
        a: 'Blossom only analyzes publicly accessible content for educational and analytical purposes consistent with fair-use principles. We do not redistribute third-party videos — analysis results show frames and clips solely to illustrate the breakdown for the original publisher or for the user paying to study them. We respond to DMCA requests at dmca@blossomapp.ai and our full IP policy is in the Terms of Use.',
        related: ['privacy-2'],
        keywords: ['copyright', 'dmca', 'legal'],
      },
      {
        q: 'How fast is the analysis?',
        a: '30–120 seconds end-to-end for most videos under 60 seconds. The bottleneck is the multimodal model pass on Gemini, which scales roughly linearly with video duration. Bulk analyses (20+ videos at once) run in parallel and complete in roughly the same time as a single video.',
        related: ['ai-analysis-0', 'features-2'],
        keywords: ['analysis speed', 'how fast', 'analysis time'],
      },
    ],
  },
  {
    id: 'features',
    label: 'Blossom Features Deep-Dive',
    emoji: '🎯',
    blurb: 'A complete tour of every feature inside Blossom and the exact creator problem each one solves.',
    items: [
      {
        q: 'What does Content Analysis do?',
        a: 'Content Analysis is Blossom\'s core feature: paste any public Instagram or TikTok URL — or your own video file — and get a 5-dimension breakdown (visual, audio, narrative, engagement, strategy), a virality probability score, the exact frame where the hook lands or fails, and a ranked list of fixes that would move the score the most.',
        feature: { label: 'Try it free', to: '/signup' },
        related: ['ai-analysis-0', 'features-7'],
        keywords: ['content analysis', 'analyze video', 'core feature'],
      },
      {
        q: 'What does the Hooks library do?',
        a: 'The Hooks library is an indexed, searchable catalog of 50,000+ proven viral hooks across every major niche on Instagram and TikTok. Each hook entry includes the exact frame, the on-screen text, the audio cue, the timestamp of the payoff, and the engagement metrics of the post it came from.',
        details: [
          'Filter by niche, hook type, and minimum view count.',
          'See the exact timestamp of the payoff inside each hook.',
          'Copy the structure into your script with one click.',
        ],
        feature: { label: 'Open Hooks library', to: '/signup' },
        related: ['hooks-0', 'hooks-1'],
        keywords: ['hooks library', 'hook database', 'find hooks'],
      },
      {
        q: 'What is the Formats library?',
        a: 'The Formats library indexes 1,200+ content formats — recurring narrative structures that drive virality at scale, like the "7-second POV setup with hard cut to reaction," the "3-step listicle with on-screen counter," or the "before/after with split-screen reveal." Each format card shows example videos, the average view count for that format, the niches it works best in, and a step-by-step recipe to recreate it.',
        related: ['formats-0', 'features-1'],
        keywords: ['formats library', 'format database', 'content structures'],
      },
      {
        q: 'What does Tactics do?',
        a: 'Tactics catalogs 800+ small psychological and editing techniques that movable creators stack on top of formats — things like "the 0.3-second pause before the punchline," "the rule-of-three reveal," "the off-center subject framing," "the false-ending fake-out." These are the micro-decisions that turn a good video into a viral one, and most are invisible unless you slow-mo and reverse-engineer the footage.',
        related: ['features-1', 'features-2'],
        keywords: ['tactics', 'editing tactics', 'psychology'],
      },
      {
        q: 'How do daily Scripts work?',
        a: 'Every day, Blossom generates 5 fresh content scripts personalized to your niche, current trends, and your last 30 days of posts. Each script includes the hook, the structure, the suggested audio, on-screen text, and the predicted engagement-rate band. You can mark scripts as "filming today" or "discarded" to refine future suggestions.',
        feature: { label: 'Get today\'s scripts', to: '/signup' },
        related: ['features-6', 'production-1'],
        keywords: ['scripts', 'daily scripts', 'content ideas'],
      },
      {
        q: 'What does Influencer Insights show?',
        a: 'Influencer Insights lets you analyze any public Instagram or TikTok account and get a full breakdown: posting cadence, follower growth velocity, top-performing posts, average engagement rate, dominant format and hook patterns, audience overlap with other accounts, and a virality consistency score. It\'s designed for creators studying competitors and agencies vetting talent.',
        related: ['competitor-0', 'competitor-1'],
        keywords: ['influencer insights', 'analyze influencer', 'creator audit'],
      },
      {
        q: 'What is the Trends dashboard?',
        a: 'The Trends dashboard surfaces what\'s currently rising — trending posts, formats, hooks, songs, and topics — filtered by your niche, your geography, and a rate-of-change threshold so you only see trends that are actually accelerating. It updates continuously and gives you an estimated time-to-peak so you can publish while the trend is still on the way up.',
        related: ['trends-0', 'trends-1'],
        keywords: ['trends dashboard', 'trending content', 'rising trends'],
      },
      {
        q: 'What is the Suggestions feed?',
        a: 'Suggestions is the "what should I post next" inbox. It combines your account state, current trends, gaps in your content mix, and the formats/hooks/tactics that overperform for accounts your size in your niche, then produces an ordered list of recommended actions — "film a contrarian Reel on X today," "re-shoot post #234 with these 3 fixes," "jump on this rising sound while it\'s under 8K uses."',
        feature: { label: 'See my next 5 actions', to: '/signup' },
        related: ['features-4', 'formats-6'],
        keywords: ['suggestions', 'recommendations', 'what to post'],
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy, Trust & Pricing',
    emoji: '🔒',
    blurb: 'How your data is handled, how billing works, and what happens if you cancel.',
    items: [
      {
        q: 'Is my data safe with Blossom?',
        a: 'Yes. Blossom stores account data in Supabase (PostgreSQL with row-level security), encrypts sensitive fields at rest, and never sells personal data to third parties. Uploaded videos are processed by Google Gemini under their enterprise data-handling terms and are not used to train public models.',
        details: [
          'Account + analysis data — Supabase, encrypted, RLS-isolated per user.',
          'Video processing — Google Gemini under enterprise terms (no public-model training).',
          'No data resale, ever.',
          'Full deletion on request via support@blossomapp.ai.',
        ],
        related: ['privacy-1', 'privacy-2'],
        keywords: ['data safe', 'privacy', 'security'],
      },
      {
        q: 'Can I delete my account and all my data?',
        a: 'Yes — at any time, with no friction. Delete from Account → Security, and we hard-delete all your analyses, uploaded content, connected-account tokens, and personal profile within 30 days. We may retain anonymized aggregate data (e.g., "X% of users in niche Y use format Z") that does not identify you.',
        related: ['privacy-0', 'privacy-3'],
        keywords: ['delete account', 'data deletion', 'gdpr'],
      },
      {
        q: 'Does Blossom share my data with anyone?',
        a: 'Only the third parties strictly required to run the service: Supabase (database and auth), Google Gemini (AI analysis under enterprise terms), Paddle (payment processing, merchant of record), and the social data APIs we use to fetch public content. We never sell, rent, or share your data for advertising. Full list in our Privacy Policy.',
        related: ['privacy-0', 'privacy-1'],
        keywords: ['share data', 'third party', 'data sharing'],
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes — one click, no phone calls, no email chains. Your subscription stays active until the end of the current billing period, you retain full access until then, and no partial refunds are issued for unused time (except where required by consumer-protection law).',
        related: ['privacy-4', 'blossom-3'],
        keywords: ['cancel subscription', 'cancel anytime', 'cancellation'],
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes — all paid tiers start with a free trial and no payment due at signup. You also get a permanent free starter tier with limited monthly analyses that lets you evaluate the product before deciding on a plan.',
        feature: { label: 'Start free trial', to: '/signup' },
        related: ['blossom-3', 'privacy-3'],
        keywords: ['free trial', 'free tier', 'try free'],
      },
      {
        q: 'How do refunds work?',
        a: 'Refunds are handled through Paddle (our merchant of record) in line with Paddle\'s refund policy and applicable consumer-protection law in your country. For most regions, you can request a refund within 14 days of your first paid charge with no questions asked. Contact support@blossomapp.ai to initiate.',
        related: ['privacy-3'],
        keywords: ['refund', 'money back', 'guarantee'],
      },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────
// Derived data
// ──────────────────────────────────────────────────────────────────────────

const ALL_ITEMS = CATEGORIES.flatMap((c, ci) =>
  c.items.map((item, ii) => ({
    ...item,
    categoryId: c.id,
    categoryLabel: c.label,
    categoryEmoji: c.emoji,
    anchor: `${c.id}-${ii}`,
    ci,
    ii,
  }))
)

const ITEM_BY_ANCHOR = new Map(ALL_ITEMS.map((i) => [i.anchor, i]))
const TOTAL_QUESTIONS = ALL_ITEMS.length

function answerForSchema(item: FaqItem): string {
  if (!item.details || item.details.length === 0) return item.a
  const detailText = item.details
    .map((d) => (typeof d === 'string' ? d : `${d.label}: ${d.text}`))
    .join(' ')
  return `${item.a} ${detailText}`
}

function buildJsonLd() {
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: answerForSchema(item) },
    })),
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Blossom',
    description:
      'AI-powered social media intelligence platform that analyzes viral Instagram Reels and TikTok content and tells creators exactly how to improve theirs.',
    url: 'https://blossomapp.ai',
    logo: 'https://blossomapp.ai/logo-light.png',
    sameAs: [
      'https://www.instagram.com/blossomapp.ai',
      'https://www.tiktok.com/@blossomapp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@blossomapp.ai',
    },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blossomapp.ai/' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://blossomapp.ai/faq' },
    ],
  }

  return [faqPage, organization, breadcrumb]
}

// ──────────────────────────────────────────────────────────────────────────
// Small icon components
// ──────────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
        open ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 015.656 0 4 4 0 010 5.656l-3 3a4 4 0 01-5.656 0M10.172 13.828a4 4 0 01-5.656 0 4 4 0 010-5.656l3-3a4 4 0 015.656 0"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Inject JSON-LD + meta on mount
  useEffect(() => {
    const blocks = buildJsonLd()
    const scripts: HTMLScriptElement[] = []
    blocks.forEach((block, idx) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = `faq-jsonld-${idx}`
      script.textContent = JSON.stringify(block)
      document.head.appendChild(script)
      scripts.push(script)
    })

    const prevTitle = document.title
    document.title = 'FAQ — How to Go Viral on Instagram & TikTok in 2026 | Blossom'

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const prevDesc = metaDesc?.content
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content =
      'Definitive 2026 answers to the most-searched creator questions: how to go viral on Instagram and TikTok, hooks, algorithm, shadowbans, posting times, hashtags, monetization, brand deals, and how Blossom analyzes it all.'

    return () => {
      scripts.forEach((s) => s.remove())
      document.title = prevTitle
      if (metaDesc && prevDesc !== undefined) metaDesc.content = prevDesc
    }
  }, [])

  // Reading progress bar
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      if (total <= 0) return setProgress(0)
      setProgress(Math.min(100, Math.max(0, (doc.scrollTop / total) * 100)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Open question from URL hash on mount + on hash change
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace(/^#/, '')
      if (!hash) return
      if (ITEM_BY_ANCHOR.has(hash)) {
        setOpenItems((prev) => new Set(prev).add(hash))
        // small delay so the section is rendered
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
      } else {
        // Maybe a category anchor
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Active section tracking for sidebar TOC
  useEffect(() => {
    const els = CATEGORIES.map((c) => sectionRefs.current[c.id]).filter(Boolean) as HTMLDivElement[]
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target?.id) {
          setActiveAnchor(visible[0].target.id)
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const visibleCategories = useMemo(() => {
    if (activeCategory === 'all' && !query.trim()) return CATEGORIES
    const q = query.trim().toLowerCase()
    return CATEGORIES.map((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) return null
      if (!q) return cat
      const filtered = cat.items.filter((item) => {
        const detailText = (item.details || [])
          .map((d) => (typeof d === 'string' ? d : `${d.label} ${d.text}`))
          .join(' ')
          .toLowerCase()
        return (
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          detailText.includes(q) ||
          (item.keywords || []).some((k) => k.toLowerCase().includes(q))
        )
      })
      if (filtered.length === 0) return null
      return { ...cat, items: filtered }
    }).filter(Boolean) as FaqCategory[]
  }, [activeCategory, query])

  const totalVisible = visibleCategories.reduce((n, c) => n + c.items.length, 0)

  const toggleItem = useCallback((key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const all = new Set<string>()
    visibleCategories.forEach((cat, ci) =>
      cat.items.forEach((_, ii) => all.add(`${cat.id}-${ii}`))
    )
    setOpenItems(all)
  }, [visibleCategories])

  const collapseAll = useCallback(() => setOpenItems(new Set()), [])

  const copyAnchor = useCallback(async (anchor: string) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${anchor}`
      await navigator.clipboard.writeText(url)
      window.history.replaceState(null, '', `#${anchor}`)
      setCopiedAnchor(anchor)
      setTimeout(() => setCopiedAnchor((curr) => (curr === anchor ? null : curr)), 1800)
    } catch {
      /* ignore — clipboard blocked */
    }
  }, [])

  const renderRelatedChips = (refs: string[] | undefined) => {
    if (!refs || refs.length === 0) return null
    const items = refs.map((r) => ITEM_BY_ANCHOR.get(r)).filter(Boolean) as (typeof ALL_ITEMS)[number][]
    if (items.length === 0) return null
    return (
      <div className="mt-6 pt-5 border-t border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
          Related questions
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((rel) => (
            <a
              key={rel.anchor}
              href={`#${rel.anchor}`}
              onClick={(e) => {
                e.preventDefault()
                setOpenItems((prev) => new Set(prev).add(rel.anchor))
                window.history.replaceState(null, '', `#${rel.anchor}`)
                setTimeout(() => {
                  const el = document.getElementById(rel.anchor)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 30)
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-xs text-slate-300 font-semibold transition-all"
            >
              <span className="text-[10px] opacity-70">{rel.categoryEmoji}</span>
              <span className="line-clamp-1 max-w-[260px]">{rel.q}</span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] overflow-x-hidden">
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 z-[60] transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />

      {/* Background mesh */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
        }}
      />

      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 sm:pt-44 pb-12 px-4 sm:px-6 text-center z-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-8 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z" />
            </svg>
            FREQUENTLY ASKED QUESTIONS · {TOTAL_QUESTIONS} ANSWERS
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-display mb-6 leading-[1.1] tracking-tight uppercase">
            EVERY CREATOR
            <br />
            QUESTION,
            <br />
            <span className="gradient-text">ONE ANSWER.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 font-medium">
            How to go viral on Instagram Reels and TikTok in 2026, why your views tanked, how
            the algorithm actually ranks you, and how Blossom turns the answers into posts
            that hit.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-3">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${TOTAL_QUESTIONS} questions — hooks, algorithm, shadowban, hashtags…`}
                className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-500 text-sm sm:text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-500 hover:text-white text-xs font-bold"
                >
                  CLEAR
                </button>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-3 font-medium">
              Showing {totalVisible} of {TOTAL_QUESTIONS} questions across {CATEGORIES.length} topics
            </p>
          </div>
        </div>
      </section>

      {/* Category tab strip (mobile + secondary nav) */}
      <section className="px-4 sm:px-6 relative z-20 sticky top-24 sm:top-28">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All ({TOTAL_QUESTIONS})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id)
                    setTimeout(() => {
                      const el = document.getElementById(cat.id)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 30)
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <span className="text-[9px] opacity-60">{cat.items.length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-3 text-[10px] font-bold uppercase tracking-widest">
            <button
              onClick={expandAll}
              className="text-slate-500 hover:text-white transition-colors"
            >
              Expand all
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={collapseAll}
              className="text-slate-500 hover:text-white transition-colors"
            >
              Collapse all
            </button>
          </div>
        </div>
      </section>

      {/* Main layout — sidebar TOC + content */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex gap-10">
          {/* Desktop sidebar TOC */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-48">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Table of Contents
              </div>
              <nav className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const active = activeAnchor === cat.id
                  return (
                    <a
                      key={cat.id}
                      href={`#${cat.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        const el = document.getElementById(cat.id)
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        window.history.replaceState(null, '', `#${cat.id}`)
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-white/[0.06] text-white border-l-2 border-pink-500'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border-l-2 border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{cat.emoji}</span>
                        <span className="truncate">{cat.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">{cat.items.length}</span>
                    </a>
                  )
                })}
              </nav>

              <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/5 border border-pink-500/15">
                <div className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-2">
                  Try Blossom Free
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mb-3 font-medium">
                  Paste your last video URL and get a full virality breakdown in 90 seconds.
                </p>
                <Link
                  to="/signup"
                  className="block w-full text-center px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-12 sm:space-y-16">
              {visibleCategories.length === 0 && (
                <div className="glass-card rounded-3xl p-12 text-center">
                  <div className="text-5xl mb-4">🤔</div>
                  <h3 className="text-xl font-black mb-2">No questions match that search.</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Try a broader keyword like “hook”, “algorithm”, “views”, or “monetize”.
                  </p>
                </div>
              )}

              {visibleCategories.map((cat) => (
                <div
                  key={cat.id}
                  id={cat.id}
                  ref={(el) => {
                    sectionRefs.current[cat.id] = el
                  }}
                  className="scroll-mt-44"
                >
                  <div className="flex items-start gap-4 mb-8">
                    <div className="text-4xl sm:text-5xl flex-shrink-0">{cat.emoji}</div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase mb-2">
                        {cat.label}
                      </h2>
                      <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
                        {cat.blurb}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cat.items.map((item, idx) => {
                      const key = `${cat.id}-${idx}`
                      const open = openItems.has(key)
                      const copied = copiedAnchor === key
                      return (
                        <div
                          key={key}
                          id={key}
                          className={`glass-card rounded-2xl transition-all duration-300 scroll-mt-44 ${
                            open ? 'bg-white/[0.04]' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(key)}
                            className="w-full text-left px-5 sm:px-7 py-5 sm:py-6 flex items-start justify-between gap-4 group"
                            aria-expanded={open}
                          >
                            <h3
                              className={`text-base sm:text-lg font-bold leading-snug transition-colors ${
                                open ? 'text-white' : 'text-slate-200 group-hover:text-white'
                              }`}
                            >
                              {item.q}
                            </h3>
                            <ChevronIcon open={open} />
                          </button>
                          {open && (
                            <div className="px-5 sm:px-7 pb-6 sm:pb-7 pt-0 -mt-2">
                              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                                {item.a}
                              </p>

                              {item.details && item.details.length > 0 && (
                                <ul className="mt-4 space-y-2.5">
                                  {item.details.map((d, di) => (
                                    <li
                                      key={di}
                                      className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed font-medium"
                                    >
                                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pink-500/70 flex-shrink-0" />
                                      <span>
                                        {typeof d === 'string' ? (
                                          d
                                        ) : (
                                          <>
                                            <strong className="text-white font-bold">
                                              {d.label}
                                            </strong>
                                            <span className="text-slate-300"> — {d.text}</span>
                                          </>
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              <div className="mt-5 flex flex-wrap items-center gap-2">
                                {item.feature && (
                                  <Link
                                    to={item.feature.to}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-widest transition-all"
                                  >
                                    {item.feature.label}
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2.5}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </Link>
                                )}
                                <button
                                  onClick={() => copyAnchor(key)}
                                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                                    copied
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5'
                                  }`}
                                  aria-label="Copy link to this question"
                                >
                                  {copied ? <CheckIcon /> : <LinkIcon />}
                                  {copied ? 'Copied' : 'Share link'}
                                </button>
                              </div>

                              {renderRelatedChips(item.related)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature spotlight strip */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">
              WHAT BLOSSOM <span className="gradient-text">ACTUALLY DOES</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Every answer above maps to a feature inside Blossom. Here are the six that do
              the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                title: 'Content Analysis',
                desc: 'Paste any public Instagram or TikTok URL. Get a virality score, weakness breakdown, and a fix list in under 90 seconds.',
                grad: 'from-pink-500/15 to-pink-500/[0.02]',
                bord: 'border-pink-500/20',
                accent: 'text-pink-400',
              },
              {
                title: 'Hooks Library',
                desc: '50,000+ proven viral hooks indexed by niche, type, and view count. Study or steal the structure for your next post.',
                grad: 'from-orange-500/15 to-orange-500/[0.02]',
                bord: 'border-orange-500/20',
                accent: 'text-orange-400',
              },
              {
                title: 'Formats & Tactics',
                desc: '1,200+ format recipes and 800+ micro-tactics — the structural and psychological levers that separate good from viral.',
                grad: 'from-violet-500/15 to-violet-500/[0.02]',
                bord: 'border-violet-500/20',
                accent: 'text-violet-400',
              },
              {
                title: 'Daily Scripts',
                desc: '5 fresh filmable scripts every day, scored for your niche, your size, and the trends that are actively rising right now.',
                grad: 'from-emerald-500/15 to-emerald-500/[0.02]',
                bord: 'border-emerald-500/20',
                accent: 'text-emerald-400',
              },
              {
                title: 'Trends Dashboard',
                desc: 'Rising sounds, formats, and hooks filtered by your niche and geography — with an estimated time-to-peak so you publish while the trend is still climbing.',
                grad: 'from-cyan-500/15 to-cyan-500/[0.02]',
                bord: 'border-cyan-500/20',
                accent: 'text-cyan-400',
              },
              {
                title: 'Influencer Insights',
                desc: 'Audit any public account — posting cadence, growth velocity, dominant formats, consistency score. Built for studying competitors honestly.',
                grad: 'from-amber-500/15 to-amber-500/[0.02]',
                bord: 'border-amber-500/20',
                accent: 'text-amber-400',
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`relative p-6 sm:p-7 rounded-3xl border ${card.bord} bg-gradient-to-br ${card.grad} hover:bg-white/[0.03] transition-all`}
              >
                <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${card.accent}`}>
                  {card.title}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase">
            STILL <span className="gradient-text">GUESSING?</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-10 font-medium leading-relaxed">
            Stop posting blind. Paste your last flop, see exactly why it lost, and get five
            scripts that won't.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-3 px-10 sm:px-14 py-5 sm:py-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-black text-lg sm:text-xl rounded-2xl glow-button shadow-xl"
          >
            Analyze My First Video
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
          </Link>
          <p className="mt-6 text-emerald-400/80 text-xs font-bold tracking-widest uppercase">
            Free trial · No card · 90-second first analysis
          </p>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
            <span>Question we missed? Email support@blossomapp.ai</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
