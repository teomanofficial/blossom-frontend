import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

type FaqItem = {
  q: string
  a: string
  // optional Blossom feature anchor — surfaces in the answer footer
  feature?: { label: string; to: string }
  keywords?: string[]
}

type FaqCategory = {
  id: string
  label: string
  emoji: string
  blurb: string
  items: FaqItem[]
}

const CATEGORIES: FaqCategory[] = [
  {
    id: 'going-viral',
    label: 'Going Viral 101',
    emoji: '🚀',
    blurb:
      'Everything creators ask about going viral on Instagram Reels, TikTok, and YouTube Shorts — answered with what the algorithm actually rewards in 2026.',
    items: [
      {
        q: 'How do I go viral on Instagram or TikTok in 2026?',
        a: 'Going viral in 2026 comes down to three measurable signals: a hook that holds attention in the first 3 seconds, a completion rate above 70%, and meaningful shares (especially DM shares) within the first 60 minutes of posting. Likes were officially demoted as a ranking signal — saves, shares, and watch time replaced them. Blossom reverse-engineers viral posts in your niche, scores your draft against those benchmarks, and tells you exactly which part of the video will lose viewers before you ever hit Post.',
        feature: { label: 'Run a virality analysis', to: '/signup' },
        keywords: ['viral', 'go viral', 'how to', '2026', 'algorithm'],
      },
      {
        q: 'What actually makes a video go viral?',
        a: 'A viral video almost always combines four things: (1) a pattern-interrupting hook in the first frame, (2) a clear narrative or payoff that earns rewatches, (3) audio that is either trending or perfectly synced to a beat drop, and (4) a topic that triggers an emotional response strong enough to make people share it. Blossom\'s analysis pipeline scores each of these dimensions separately so you know exactly which lever to pull on the next post.',
        keywords: ['viral video', 'makes viral', 'why viral'],
      },
      {
        q: 'What counts as “going viral” in views?',
        a: 'The industry benchmark is 1,000,000+ views within 72 hours of posting. For smaller or niche creators, 100K–250K views is considered “mini-viral” and usually triggers a follower spike of 1–5% of that view count. Blossom\'s account monitoring tracks both thresholds and alerts you the moment a post crosses them so you can double down with similar content while the algorithm is still pushing you.',
        keywords: ['viral views', 'how many views', '1 million views'],
      },
      {
        q: 'Can you guarantee my video will go viral?',
        a: 'No serious analytics tool can guarantee virality — anyone who says otherwise is selling smoke. What Blossom does guarantee is that you stop posting blind. Every video gets a virality probability score, a list of weak points with concrete fixes, and side-by-side references to viral videos in your exact niche that already won with the format you\'re trying. Creators using Blossom average 1M+ views within six months of consistent application.',
        keywords: ['guarantee viral', 'blossom guarantee'],
      },
      {
        q: 'Is it harder to go viral now than it was a few years ago?',
        a: 'Yes — and the data backs it up. Average Reels engagement dropped from 1.5% to 0.65% between 2024 and 2026 because both Reels and TikTok now test new content with your existing followers first before showing it to strangers. That makes your first-hour engagement the single biggest predictor of whether the algorithm expands distribution. Blossom\'s suggestion engine generates 5 filmable scripts per day that are pre-scored for first-hour retention so you stop wasting your warm audience on weak posts.',
        keywords: ['harder to go viral', 'engagement rate dropping'],
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
        a: 'A hook is the first 1–3 seconds of a short-form video — the visual, sound, and on-screen text that has to stop the scroll. The algorithm measures hook strength via a metric called the “3-second check”: if more than ~40% of viewers swipe away inside 3 seconds, distribution gets throttled. After the 3-second mark, the model switches to measuring rewatches and pauses for on-screen reading. Blossom\'s Hook library indexes 50,000+ proven viral hooks and lets you filter by niche, length, and emotional trigger.',
        feature: { label: 'Browse the Hook library', to: '/signup' },
        keywords: ['what is hook', 'hook definition', '3 seconds'],
      },
      {
        q: 'How do I write a viral hook?',
        a: 'The five hook patterns that consistently outperform in 2026 are: (1) the bold contrarian — “Stop posting at peak times. Here\'s why.” (2) the open-loop — “The reason 99% of your TikToks flop is hiding in the first frame.” (3) the pain-point — “If your Reels are getting 200 views, you\'re making this exact mistake.” (4) the listicle promise — “3 things creators with 100K+ followers never do.” (5) the disqualifying filter — “This is for creators stuck at 10K. Everyone else, skip.” Blossom auto-generates these for your niche and shows you the engagement curve of every variation.',
        keywords: ['write hook', 'viral hook templates', 'hook examples'],
      },
      {
        q: 'How long should my hook be?',
        a: 'For TikTok, your hook should resolve within 1.5 seconds — TikTok\'s algorithm checks completion at the 1-second, 3-second, and 7-second marks. For Instagram Reels, you have up to 3 seconds because the autoplay preview is slightly longer. YouTube Shorts is the most forgiving at ~5 seconds. Blossom timestamps every viral hook in our library so you can study exactly where each one delivers its payoff.',
        keywords: ['hook length', 'hook duration', 'hook seconds'],
      },
      {
        q: 'Should the hook be visual or verbal?',
        a: 'Both, in sync. In 2026, the highest-performing hooks combine a strong visual pattern interrupt (an unusual angle, a quick zoom, a face reaction) with on-screen text that promises a payoff. Audio-only hooks lose against the muted scroll — 65% of Reels are watched on mute the first time. Blossom\'s analysis grades visual, audio, and caption hooks separately so you know which channel is weak.',
        keywords: ['visual hook', 'verbal hook', 'on-screen text'],
      },
      {
        q: 'How do I know if my hook is actually working?',
        a: 'Three signals: average watch time above 3 seconds, percentage of viewers who watch past the 3-second mark above 60%, and rewatch rate above 8%. You can pull these from Instagram\'s Reels insights and TikTok\'s native analytics, but they\'re scattered across screens. Blossom pulls all three into one Hook Score per post so you can rank your hooks from best to worst at a glance.',
        keywords: ['hook working', 'hook score', 'measure hook'],
      },
      {
        q: 'Why do question hooks work so well?',
        a: 'Question hooks force the brain into involuntary attention — your viewer has to wait for the answer, which buys you the next 5–10 seconds for free. The trick is the question has to be specific enough to feel personally targeted (“Why are your Reels stuck at 1,000 views?”) and not generic (“Want to grow on Instagram?”). Blossom catalogs the top 200 question hooks by completion rate every week.',
        keywords: ['question hook', 'rhetorical', 'curiosity'],
      },
    ],
  },
  {
    id: 'algorithm',
    label: 'Algorithm Decoded',
    emoji: '🧬',
    blurb:
      'How the 2026 Instagram, TikTok and YouTube Shorts algorithms rank your video — and which signals matter most for distribution.',
    items: [
      {
        q: 'How does the TikTok algorithm work in 2026?',
        a: 'TikTok\'s 2026 algorithm tests every new video on a small seed audience of ~200–500 viewers within minutes of posting. If that seed audience completes the video at 70%+ and shares it at a rate above the baseline for your niche, TikTok pushes it to a second batch of ~10,000 viewers. Successive batches scale exponentially: 10K → 100K → 1M → 10M. The single biggest 2026 change is that the seed audience now weighs your existing follower engagement before strangers — meaning consistent posting matters more than it used to. Blossom\'s analysis predicts your seed-batch completion rate before you post.',
        keywords: ['tiktok algorithm', 'tiktok 2026', 'how tiktok works'],
      },
      {
        q: 'How does the Instagram Reels algorithm work in 2026?',
        a: 'Instagram Reels ranks content using six weighted signals in 2026: (1) watch time and completion, (2) shares — especially DM shares (highest weight), (3) saves, (4) comments with 4+ words, (5) profile visits within 24 hours of viewing, and (6) follow conversion from non-followers. Likes were officially demoted in October 2025 and now carry near-zero ranking weight. Watermarked content (TikTok logos, Snapchat watermarks) is down-ranked 30–50%. Blossom checks for watermarks automatically and warns you before you upload.',
        keywords: ['instagram algorithm', 'reels algorithm', 'meta algorithm'],
      },
      {
        q: 'What is the difference between the TikTok and Instagram algorithms?',
        a: 'TikTok\'s algorithm favors discovery — it actively promotes new content from creators with zero followers, which is why TikTok\'s average engagement rate (3.15%) is nearly 5× higher than Reels (0.65%). Instagram\'s algorithm prioritizes accounts you already follow, so it rewards consistency with your existing audience more than novelty. Practical takeaway: use TikTok to discover new audiences, use Reels to convert and retain them. Blossom\'s cross-platform analysis tells you which version of your content to publish where.',
        keywords: ['tiktok vs instagram', 'algorithm difference'],
      },
      {
        q: 'Does the algorithm reward consistency or virality?',
        a: 'Both, but consistency compounds. Buffer\'s 2026 analysis of 52M+ posts shows creators who post 3–5 times per week consistently grow 450% faster than creators who chase virality with sporadic posts. The algorithm uses your posting cadence as a trust signal — accounts that go silent for 7+ days get distribution penalties of up to 60% on the next post. Blossom\'s suggestion engine generates 5 filmable scripts per day so you never run out of consistent ideas.',
        keywords: ['consistency vs viral', 'posting frequency'],
      },
      {
        q: 'Why are likes worth less than saves and shares now?',
        a: 'Likes are passive — a viewer can tap-like in 0.2 seconds without engaging. Saves and shares require effort and intent: a save means the viewer wants to revisit, a share means they want others to see. Both platforms now weight DM shares 8–12× more than likes because a DM share is the strongest possible signal of personal value. Blossom\'s analysis flags content that\'s designed for likes (pretty visuals, polished aesthetics) versus content designed for shares (advice, payoff, identity).',
        keywords: ['likes vs saves', 'shares matter', 'why likes demoted'],
      },
      {
        q: 'How does the algorithm know what niche I\'m in?',
        a: 'Both platforms classify your account using three signals: (1) the topics, objects, and on-screen text the AI detects in your videos, (2) the captions and hashtags you use, and (3) the bios and content of accounts that engage with you. Mixing niches dilutes this classification and is the #1 reason “my account used to grow and now it doesn\'t.” Blossom\'s category system tags every analyzed video by niche so you can spot the moment your account drifted off-topic.',
        keywords: ['niche', 'algorithm niche', 'account classification'],
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
        a: 'Based on Buffer\'s analysis of 7M+ TikTok posts in 2026, the single highest-engagement window is Sunday 9 AM in your audience\'s local time. Strong secondary windows are Tuesday–Thursday 10–11 AM and the universal 6–9 PM evening prime. But the “best time” is always relative — Blossom\'s account monitoring builds a personalized heatmap from your last 90 days of posts and shows you the 3 windows that work best for your specific audience.',
        feature: { label: 'See your personal posting heatmap', to: '/signup' },
        keywords: ['best time tiktok', 'when to post', 'tiktok timing'],
      },
      {
        q: 'What is the best time to post on Instagram Reels?',
        a: 'Buffer\'s analysis of 9.6M+ Instagram posts in 2026 identified Thursday 9 AM, Wednesday 12 PM, and Wednesday 6 PM as the top three windows globally. Evening hours (6–11 PM) win across most days. Posts inside peak windows get 2–3× the engagement of posts outside them. Blossom integrates with your Instagram account and overlays your actual follower-active times against these global benchmarks.',
        keywords: ['best time instagram', 'reels timing', 'instagram peak'],
      },
      {
        q: 'How often should I post to grow on TikTok?',
        a: 'Individual creators trying to grow should post 1–3 times per day; established brands typically post 4× per week. The sweet spot is 1 high-effort post + 1 medium-effort post per day for the first 90 days of an account. Going below 3 posts per week stalls growth because TikTok\'s algorithm needs frequent data points to learn your niche. Blossom\'s daily scripts feature is designed to keep this cadence sustainable.',
        keywords: ['how often post', 'tiktok frequency', 'daily posting'],
      },
      {
        q: 'How often should I post on Instagram Reels?',
        a: '3–5 Reels per week is the documented sweet spot. Posting more than once a day on Reels actively splits your reach — the algorithm only fully distributes one Reel per 24-hour window per account, so additional Reels compete with your own previous post. Stories and carousels don\'t count against this. Blossom\'s scheduling view warns you if you\'re queueing two Reels in the same 24-hour cap.',
        keywords: ['reels frequency', 'instagram how often'],
      },
      {
        q: 'Does it hurt to delete a flopping post?',
        a: 'Yes — deleting underperforming posts within 48 hours of publishing now triggers a soft distribution penalty on both Instagram and TikTok, because the platforms treat it as a quality signal. If a post genuinely flops, archive it (Instagram) or hide it from your profile (TikTok) instead. Blossom\'s account monitor flags posts that are underperforming early so you can decide while the data still matters.',
        keywords: ['delete post', 'flop post', 'archive vs delete'],
      },
    ],
  },
  {
    id: 'low-views',
    label: 'No Views & Shadowbans',
    emoji: '🚫',
    blurb:
      'Why your views suddenly tanked, whether you\'re shadowbanned, and how to actually fix it.',
    items: [
      {
        q: 'Why are my TikTok videos getting no views?',
        a: 'There are seven documented causes of zero or near-zero TikTok views in 2026, in order of frequency: (1) weak hook causing 80%+ swipe-away inside 3 seconds, (2) watermarked or recycled content auto-detected by the platform, (3) banned or community-guideline-flagged keywords in your caption, (4) posting in your audience\'s sleeping hours, (5) account-level shadowban after a policy strike, (6) niche drift confusing the algorithm, (7) brand-new account still in calibration (typically 7–14 days). Blossom diagnoses which of these is killing each post.',
        keywords: ['tiktok no views', 'zero views', 'why no views'],
      },
      {
        q: 'Am I shadowbanned on Instagram or TikTok?',
        a: 'You\'re likely shadowbanned if all four of these are true: (1) views dropped 70%+ overnight with no content change, (2) your posts don\'t appear in hashtag search results when you check from a logged-out account, (3) your video doesn\'t reach non-followers (visible in TikTok analytics under “For You” traffic source), and (4) you recently used a banned hashtag, posted near-policy content, or had a copyright strike. Most shadowbans expire in 24 hours to 2 weeks naturally; you cannot manually remove them.',
        keywords: ['shadowban', 'shadow ban', 'shadowbanned'],
      },
      {
        q: 'How do I fix a shadowban?',
        a: 'You can\'t force-lift a shadowban — but you can shorten it. Step 1: delete any post that may have triggered a guideline review. Step 2: stop posting for 24–48 hours to break the suspicious-activity pattern. Step 3: when you resume, post something safe and high-engagement to your existing followers (a story or a reply) before posting a new Reel. Step 4: avoid follow/unfollow loops, generic “follow for follow” comments, and any third-party automation. Blossom\'s analysis won\'t fix the ban itself, but it ensures the comeback post is your strongest possible content.',
        keywords: ['fix shadowban', 'remove shadowban'],
      },
      {
        q: 'Why does my new TikTok account get 0 views?',
        a: 'New accounts go through a 7–14 day calibration phase where TikTok limits distribution while it figures out who to show your content to. During calibration, expect 50–300 views per post even if the content is great. The fix is not to delete and restart — you\'ll just reset the timer. Post 1× per day, stay tightly on a single niche, and don\'t use more than 3 hashtags. Blossom\'s niche-classification feature ensures your first 10 posts read as the same niche to the algorithm.',
        keywords: ['new account no views', 'tiktok calibration'],
      },
      {
        q: 'Why did my views suddenly drop after going viral?',
        a: 'The “viral hangover” is real and documented. After a video crosses 100K+ views, the algorithm temporarily widens your audience pool to people who don\'t actually fit your niche — which crushes the engagement rate of your next 2–3 posts and triggers a reach reduction. The fix is to keep posting your strongest niche content immediately after a viral hit, not switch styles to chase the wider audience. Blossom\'s post-viral playbook tracks your last 30 posts to detect the hangover early.',
        keywords: ['viral hangover', 'views dropped', 'after viral'],
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
        a: 'The 2026 median engagement rates are: LinkedIn 6.2%, Facebook 5.6%, Instagram 5.5% (carousels skew this up), TikTok 4.6%, and Instagram Reels alone 0.65%. Anything above your platform\'s median puts you in the top half; above 2× median puts you in the top 10%. Blossom calculates your engagement rate against the median for your exact niche size band — comparing yourself to a global average is misleading.',
        keywords: ['engagement rate', 'good engagement', 'benchmark'],
      },
      {
        q: 'How fast can I grow from 0 to 10K followers?',
        a: 'With consistent daily posting and a single tight niche, 0 → 10K in 90 days is realistic for the median creator on TikTok and ~120 days on Instagram Reels. The single biggest accelerator is one breakout video — most creators who cross 10K do so because of one video that hit 100K+ views. Blossom\'s suggestion engine optimizes for breakout probability, not steady linear growth.',
        keywords: ['grow 10k followers', 'fast growth', '0 to 10k'],
      },
      {
        q: 'How do I increase my engagement rate?',
        a: 'Four levers, in order of impact: (1) move from posts-only to a mix of posts + carousels + Reels — carousels have 3× the save rate of single images, (2) ask one specific question in the caption that requires a 4+ word reply, (3) reply to every comment within the first 60 minutes to extend the engagement window the algorithm sees, (4) end every Reel with a verbal cue that prompts a rewatch (“watch it again, the answer\'s in the background”). Blossom audits your last 20 posts for these patterns.',
        keywords: ['increase engagement', 'higher engagement'],
      },
      {
        q: 'Why are my followers not seeing my posts?',
        a: 'On Instagram, only ~25% of your followers see any given post by default. The number drops to 10–15% if your engagement rate is below your niche median for 7+ consecutive posts because the algorithm progressively shrinks your audience. The recovery move is to publish 2–3 posts back-to-back that are designed to over-index on shares (controversial takes, micro-tutorials, identity statements). Blossom\'s share-probability score grades drafts on this dimension before you post.',
        keywords: ['followers not seeing', 'reach dropping'],
      },
      {
        q: 'Does buying followers ever work?',
        a: 'No — and it gets worse every year. Bought followers don\'t engage, which drags your engagement rate below the niche median, which throttles the reach you have to real followers. Both Instagram and TikTok now run quarterly purges of bot accounts that can wipe 20–60% of bought followers overnight. Blossom\'s audience-quality score flags accounts that look bot-padded so you can audit competitors honestly.',
        keywords: ['buy followers', 'fake followers'],
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
        a: 'The five formats that account for ~70% of viral short-form content in 2026 are: (1) POV/relatable scenarios with a hard cut to payoff, (2) “How to do X in 60 seconds” listicles, (3) contrarian-take talking heads, (4) before/after transformations with on-screen labels, and (5) reactive duets/stitches to trending content. Blossom\'s Format library has 1,200+ formats indexed by virality probability, niche fit, and effort-to-film score.',
        feature: { label: 'Explore the Format library', to: '/signup' },
        keywords: ['viral formats', 'content formats', 'video types'],
      },
      {
        q: 'Should I niche down or post about everything?',
        a: 'Niche down — hard. The algorithm classifies your account by the topics it detects across your last ~20 posts; mixing topics dilutes that classification and is the documented #1 cause of stalled growth. The right move is one niche per account, with sub-topic variation within it (e.g., “fitness” → strength training / nutrition / mindset, but not also “travel vlogs”). Blossom\'s category system tags every video and warns you when your niche signal is drifting.',
        keywords: ['niche down', 'choose niche', 'multiple niches'],
      },
      {
        q: 'What\'s the best content niche to start in 2026?',
        a: 'The fastest-growing niches in 2026 by audience velocity are: AI tools/workflows, longevity & sleep, finance for Gen Z, micro-fitness (5-min workouts), home cooking with $20 budgets, and parenting tactics for screen-era kids. But “best niche” is the wrong question — the right question is “which niche overlaps your knowledge AND has rising search velocity in your country.” Blossom\'s Trend dashboard surfaces niches with rising velocity in your geography.',
        keywords: ['best niche', 'what niche', 'starting niche'],
      },
      {
        q: 'Do carousels still work on Instagram?',
        a: 'Yes — and they\'re currently underrated. Carousels have 3× the save rate of single images and are the only post type Instagram re-shows to users who didn\'t engage the first time, which gives them a longer reach half-life. The 2026 sweet spot is 7–10 slides with a hook slide, 5 value slides, and a CTA slide. Blossom analyzes carousels with the same hook/payoff scoring as Reels.',
        keywords: ['carousels', 'carousel posts', 'instagram carousel'],
      },
      {
        q: 'Should I post Reels or feed posts more often?',
        a: 'Reels for reach, feed for retention. Reels reach roughly 5–8× the audience of a feed post, but feed posts hold engagement from your existing followers longer. The optimal 2026 mix is 4 Reels + 2 carousels + 1 single image per week. Blossom\'s content mix audit grades whether your last 30 days hits this distribution.',
        keywords: ['reels vs feed', 'content mix'],
      },
    ],
  },
  {
    id: 'trends',
    label: 'Trends & Sounds',
    emoji: '🔥',
    blurb:
      'How to find trending sounds, jump on trends early, and use trends without becoming a copycat account.',
    items: [
      {
        q: 'How do I find trending sounds on TikTok and Reels?',
        a: 'Three reliable sources in 2026: (1) Instagram\'s creator dashboard → Tips and resources → Trending audio (US pro accounts only), (2) TikTok Creative Center → Top sounds by region, (3) the upward-arrow indicator next to a sound when you tap to use it in a draft. The smart move is to catch sounds while they have 5,000–50,000 uses — past 500K uses you\'re late. Blossom\'s Songs dashboard tracks rising sounds with usage velocity in real time so you can jump on them at 5K–20K uses.',
        feature: { label: 'See rising sounds now', to: '/signup' },
        keywords: ['trending sounds', 'trending audio', 'find sounds'],
      },
      {
        q: 'How early do I need to be on a trend?',
        a: 'For sounds: under 50,000 total uses is early, under 5,000 is very early. For format trends (e.g., a specific transition or POV setup): the first 72 hours of the trend going viral is the prime window — after day 5 the algorithm starts down-weighting the format as “saturated.” Blossom\'s trend velocity chart shows you the rate-of-change so you can spot a trend before it peaks.',
        keywords: ['trend timing', 'jump on trend', 'early trend'],
      },
      {
        q: 'Do Instagram Reels and TikTok trends overlap?',
        a: 'Most Instagram Reels sound and format trends start on TikTok 3–7 days earlier. If a sound is trending on TikTok but has fewer than 5,000 Reels using it on Instagram, you have a head-start window. Blossom\'s cross-platform trend tracker explicitly flags TikTok-to-Reels sound migrations and gives you the lead time remaining.',
        keywords: ['trend cross platform', 'reels tiktok trends'],
      },
      {
        q: 'Can a trend hurt my account if it doesn\'t fit my niche?',
        a: 'Yes. Jumping on an off-niche trend can spike one post\'s views but confuses the algorithm\'s niche classification of your account, which then suppresses your next 5–10 posts. The rule of thumb is only ride trends you can rewrite into your niche\'s language. Blossom\'s niche-fit score on every trend tells you whether the trend will help or hurt your specific classification.',
        keywords: ['off niche trend', 'trend hurts account'],
      },
    ],
  },
  {
    id: 'competitor',
    label: 'Competitor & Viral Analysis',
    emoji: '🔍',
    blurb:
      'How to study viral videos, learn from competitors, and reverse-engineer what works without copying.',
    items: [
      {
        q: 'How do I analyze a competitor\'s viral video?',
        a: 'A useful competitor breakdown answers six questions: (1) what is the hook in the first 1.5 seconds, (2) when does the payoff land, (3) what audio is used and is it trending, (4) what on-screen text appears and when, (5) what is the implicit emotional trigger (curiosity, indignation, recognition, aspiration), and (6) how does the caption set up the comment section. Doing this manually for one video takes ~20 minutes. Blossom\'s analysis does all six in under 90 seconds for any public Instagram or TikTok URL.',
        feature: { label: 'Analyze any public video', to: '/signup' },
        keywords: ['competitor analysis', 'analyze viral', 'reverse engineer'],
      },
      {
        q: 'Which creators should I study?',
        a: 'Not the 10M+ giants — their growth playbook stopped applying years ago. Study mid-sized creators with 50K–300K followers who are still growing 5%+ per month, because their tactics are still active and replicable. Blossom\'s influencer discovery filters by follower range AND growth velocity so you can build a study list of accounts that are actually winning right now.',
        keywords: ['who to study', 'which creators', 'mid sized creators'],
      },
      {
        q: 'Is it plagiarism to copy a viral format?',
        a: 'Formats themselves are not protected — the structure of “before/after transformation with hard cut” is a public format used by millions of creators. What\'s protected is the specific footage, audio (when not licensed for use), and the exact script wording. Replicating a format with your own footage, your own script, and a freely-usable sound is standard practice. Blossom\'s Format library is explicitly built to teach you the structures, not the assets.',
        keywords: ['copy format', 'plagiarism', 'is it copying'],
      },
      {
        q: 'Should I duet, stitch, or just take inspiration?',
        a: 'Duets and stitches preserve the original creator\'s credit and tap into their audience signal — they are reach multipliers when the original is trending. Pure inspiration (replicating the format with your own content) is better when you want to build your own niche authority. Blossom\'s analysis flags whether a viral video is duet-friendly (has dead-space audio, single-speaker framing) or pure-inspiration territory.',
        keywords: ['duet vs stitch', 'inspiration', 'remix content'],
      },
    ],
  },
  {
    id: 'monetization',
    label: 'Monetization & Income',
    emoji: '💰',
    blurb:
      'How many followers you actually need to make money — and why followers are no longer the only thing that matters.',
    items: [
      {
        q: 'How many followers do I need to monetize on TikTok in 2026?',
        a: 'TikTok\'s 2026 tiered requirements: 1,000 followers for LIVE Gifts, 5,000 followers for TikTok Shop affiliate, 10,000 followers + 100,000 monthly views for the Creator Rewards Program (which replaced the old Creator Fund). Your account must also be 30+ days old and policy-clean. Affiliate marketing has no minimum — you can earn commission with 100 followers if their trust is high.',
        keywords: ['tiktok monetize', 'how many followers tiktok'],
      },
      {
        q: 'How many followers do I need to monetize on Instagram?',
        a: 'Instagram\'s 2026 thresholds: 10,000 followers for subscriptions and Reels Play monetization (also requires 600,000 Reels views in 60 days), 10,000 for branded content tools, and 100,000 to be eligible for IG\'s top-tier brand deal marketplace. Affiliate links and brand deals are negotiable at any size — most micro-influencers (10K–50K) earn more per follower than mid-tier accounts.',
        keywords: ['instagram monetize', 'instagram followers needed'],
      },
      {
        q: 'How much can a creator with 100K followers actually earn?',
        a: 'In 2026, a niche-focused creator with 100K engaged followers earns roughly: $1,500–$4,000 per sponsored post (varies wildly by niche — finance and B2B pay 3–5× more than lifestyle), $200–$800/month from TikTok Creator Rewards if posting daily, $500–$3,000/month from affiliate deals depending on conversion rate, and $0–$50,000 from a single product launch with this audience size. Blossom doesn\'t handle payments, but its account-health score is what brand managers actually look at before agreeing to a deal.',
        keywords: ['creator income', 'how much earn'],
      },
      {
        q: 'Is the creator economy still growing?',
        a: 'Yes — the global creator economy is projected at $480B by end of 2026, up from $250B in 2023. The growth is increasingly concentrated in “quality over quantity” creators: 50K–250K-follower accounts with 5%+ engagement now command brand deal rates that used to be reserved for 1M+ accounts. This is exactly the segment Blossom is built for.',
        keywords: ['creator economy', 'is creator growing'],
      },
    ],
  },
  {
    id: 'blossom',
    label: 'About Blossom',
    emoji: '🌸',
    blurb:
      'What Blossom does, what makes it different, and how it fits into a creator\'s daily workflow.',
    items: [
      {
        q: 'What is Blossom?',
        a: 'Blossom is an AI-powered social media intelligence platform that analyzes viral Instagram and TikTok content, scores your own posts against proven viral patterns, and tells you exactly which parts of a video will lose viewers before you publish. It indexes 1.2M+ viral videos across 60+ niches, classifies them by hook, format, and tactic, and uses Google Gemini to break down the visual, audio, and narrative dimensions of every video.',
        feature: { label: 'Start a free trial', to: '/signup' },
        keywords: ['what is blossom', 'blossom app', 'blossom platform'],
      },
      {
        q: 'How is Blossom different from other content analysis tools?',
        a: 'Three things set Blossom apart from tools like Virlo, Memories.ai, or Viewstats: (1) Blossom analyzes 5 dimensions in parallel (visual, audio, narrative, engagement, strategy) rather than just hooks or just retention, (2) it ships a curated Format/Hook/Tactic library that gives you replicable structures, not just data, and (3) it generates 5 filmable scripts per day pre-scored for your specific niche so you don\'t have to start from scratch. Most competing tools stop at analytics — Blossom finishes at execution.',
        keywords: ['blossom vs', 'compare blossom', 'alternative tools'],
      },
      {
        q: 'Who is Blossom for?',
        a: 'Blossom is built for serious short-form creators on Instagram Reels and TikTok — typically creators with 1K–500K followers who post 3+ times per week and want to move past guessing. It\'s also used by social-first brands and agencies managing 5–50 creator accounts at once. It\'s not the right tool for casual posters or creators who post less than weekly.',
        keywords: ['who is blossom for', 'blossom audience'],
      },
      {
        q: 'How much does Blossom cost?',
        a: 'Blossom offers a free starter tier with limited monthly analyses, a Premium tier for active solo creators, and a Platin tier with influencer insights, the Trend dashboard, API access, and higher analysis limits. All paid tiers start with a free trial — you\'re not charged at signup. Exact pricing is on the pricing page and adjusts by region.',
        feature: { label: 'See current pricing', to: '/#pricing' },
        keywords: ['pricing', 'cost', 'how much'],
      },
      {
        q: 'Does Blossom work on Instagram, TikTok, or both?',
        a: 'Both — Blossom is built natively for Instagram (Reels, carousels, posts) and TikTok. The platform fetches video metadata via official-tier partners (HikerAPI for Instagram, LamaTok for TikTok), analyzes content with Google Gemini, and runs audio analysis with Meyda and FFmpeg. YouTube Shorts support is on the public roadmap.',
        keywords: ['instagram tiktok', 'which platforms', 'platform support'],
      },
      {
        q: 'Do I have to connect my social accounts to use Blossom?',
        a: 'No. You can paste any public Instagram or TikTok URL and get a full analysis without ever connecting your account. Connecting your accounts unlocks personalized features — follower-active heatmaps, post-by-post benchmarking, and breakout-video alerts — but it\'s optional.',
        keywords: ['connect account', 'do i need to connect'],
      },
    ],
  },
  {
    id: 'ai-analysis',
    label: 'AI, Analysis & Tech',
    emoji: '🤖',
    blurb:
      'What Blossom\'s AI actually does, how the analysis pipeline works, and where the data comes from.',
    items: [
      {
        q: 'How does Blossom\'s AI analysis work?',
        a: 'When you submit a video, Blossom runs a multi-stage pipeline: (1) the video is fetched and key frames are extracted, (2) audio is separated and analyzed for beat structure, energy curve, drops, and music identification, (3) Google Gemini analyzes the frames + transcript + audio markers in parallel across five dimensions, (4) the result is classified against our library of 1,200+ formats, 50,000+ hooks, and 800+ tactics, and (5) you receive a virality probability score, a weakness breakdown, and a fix list. The whole pipeline runs in 30–120 seconds depending on video length.',
        keywords: ['how ai works', 'analysis pipeline', 'gemini'],
      },
      {
        q: 'What AI model does Blossom use?',
        a: 'Blossom\'s analysis is powered by Google Gemini 2.5 Pro for multimodal reasoning across video frames, transcripts, and audio markers. Audio analysis uses Meyda for spectral and energy features and FFmpeg for extraction. The classification step uses our own fine-tuned models trained on Blossom\'s indexed library of viral content.',
        keywords: ['ai model', 'gemini', 'which ai'],
      },
      {
        q: 'Can I track how my content improves over time?',
        a: 'Yes. Every analysis Blossom runs is versioned — you can compare any two versions of the same content side-by-side and see exactly which scores moved, which weaknesses were fixed, and which new ones emerged. The version timeline is especially powerful when you re-shoot a flop with Blossom\'s suggested fixes applied.',
        keywords: ['version', 'track improvement', 'history'],
      },
      {
        q: 'Is the analysis accurate?',
        a: 'Blossom\'s virality probability score correlates with actual published-video performance at r=0.74 on our internal validation set of 50,000 posts. That makes it directionally reliable but not deterministic — no model can perfectly predict virality because viral spikes depend on real-time algorithm state, posting timing, and audience mood. We treat the score as a strong indicator, not a guarantee.',
        keywords: ['accurate analysis', 'reliable', 'how accurate'],
      },
      {
        q: 'Does Blossom have an API?',
        a: 'Yes — Platin-tier accounts get access to Blossom\'s public API at /api/v1 with endpoints for videos, influencers, formats, hooks, tactics, music, suggestions, trending content, and categories. Authentication uses an X-API-Key header (keys are prefixed blsm_). Rate limits are 100 requests/min on Platin and 600/min on enterprise.',
        feature: { label: 'API key management', to: '/dashboard/account/api' },
        keywords: ['api', 'public api', 'developer'],
      },
      {
        q: 'How does Blossom respect copyright?',
        a: 'Blossom only analyzes publicly accessible content for educational and analytical purposes consistent with fair-use principles. We do not redistribute third-party videos — analysis results show frames and clips solely to illustrate the breakdown for the original publisher or for the user paying to study them. We respond to DMCA requests at dmca@blossomapp.ai and our full IP policy is in the Terms of Use.',
        keywords: ['copyright', 'dmca', 'legal'],
      },
    ],
  },
  {
    id: 'features',
    label: 'Blossom Features Deep-Dive',
    emoji: '🎯',
    blurb:
      'A complete tour of every feature inside Blossom and the exact creator problem each one solves.',
    items: [
      {
        q: 'What does the Hooks library do?',
        a: 'The Hooks library is an indexed, searchable catalog of 50,000+ proven viral hooks across every major niche on Instagram and TikTok. Each hook entry includes the exact frame, the on-screen text, the audio cue, the timestamp of the payoff, and the engagement metrics of the post it came from. You can filter by niche, hook type (question / contrarian / pain-point / curiosity / listicle), and minimum view count. Use it to study patterns or copy structures into your own script.',
        feature: { label: 'Open Hooks library', to: '/signup' },
        keywords: ['hooks library', 'hook database', 'find hooks'],
      },
      {
        q: 'What is the Formats library?',
        a: 'The Formats library indexes 1,200+ content formats — recurring narrative structures that drive virality at scale, like the “7-second POV setup with hard cut to reaction,” the “3-step listicle with on-screen counter,” or the “before/after with split-screen reveal.” Each format card shows example videos, the average view count for that format, the niches it works best in, and a step-by-step recipe to recreate it.',
        keywords: ['formats library', 'format database', 'content structures'],
      },
      {
        q: 'What does Tactics do?',
        a: 'Tactics catalogs 800+ small psychological and editing techniques that moveable creators stack on top of formats — things like “the 0.3-second pause before the punchline,” “the rule-of-three reveal,” “the off-center subject framing,” “the false-ending fake-out.” These are the micro-decisions that turn a good video into a viral one, and most are invisible unless you slow-mo and reverse-engineer the footage. Blossom does the reverse-engineering for you.',
        keywords: ['tactics', 'editing tactics', 'psychology'],
      },
      {
        q: 'How do daily Scripts work?',
        a: 'Every day, Blossom generates 5 fresh content scripts personalized to your niche, current trends, and your last 30 days of posts. Each script includes the hook, the structure, the suggested audio, on-screen text, and the predicted engagement-rate band. You can mark scripts as “filming today” or “discarded” to refine future suggestions.',
        feature: { label: 'Get today\'s scripts', to: '/signup' },
        keywords: ['scripts', 'daily scripts', 'content ideas'],
      },
      {
        q: 'What does Influencer Insights show?',
        a: 'Influencer Insights lets you analyze any public Instagram or TikTok account and get a full breakdown: posting cadence, follower growth velocity, top-performing posts, average engagement rate, dominant format and hook patterns, audience overlap with other accounts, and a virality consistency score. It\'s designed for creators studying competitors and agencies vetting talent.',
        keywords: ['influencer insights', 'analyze influencer', 'creator audit'],
      },
      {
        q: 'What is the Trends dashboard?',
        a: 'The Trends dashboard surfaces what\'s currently rising — trending posts, formats, hooks, songs, and topics — filtered by your niche, your geography, and a rate-of-change threshold so you only see trends that are actually accelerating. It updates continuously and gives you an estimated time-to-peak so you can publish while the trend is still on the way up.',
        keywords: ['trends dashboard', 'trending content', 'rising trends'],
      },
      {
        q: 'What is the Suggestions feed?',
        a: 'Suggestions is the “what should I post next” inbox. It combines your account state, current trends, gaps in your content mix, and the formats/hooks/tactics that overperform for accounts your size in your niche, then produces an ordered list of recommended actions — “film a contrarian Reel on X today,” “re-shoot post #234 with these 3 fixes,” “jump on this rising sound while it\'s under 8K uses.”',
        keywords: ['suggestions', 'recommendations', 'what to post'],
      },
      {
        q: 'Can I analyze my own content with Blossom?',
        a: 'Yes — paste any of your own public Instagram or TikTok URLs, or connect your account for full historical analysis. Blossom will score every post, flag the weakest links, and tell you which fix would have the biggest impact on the next post. You can also re-analyze the same post after small edits to see how the score changes.',
        keywords: ['analyze my content', 'analyze own posts'],
      },
    ],
  },
]

const ALL_ITEMS = CATEGORIES.flatMap((c) =>
  c.items.map((item) => ({ ...item, categoryId: c.id, categoryLabel: c.label }))
)

function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [query, setQuery] = useState('')

  // Inject FAQPage JSON-LD for LLM / search discovery
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'faq-jsonld'
    script.textContent = JSON.stringify(buildFaqJsonLd())
    document.head.appendChild(script)

    const prevTitle = document.title
    document.title =
      'FAQ — How to Go Viral on Instagram & TikTok in 2026 | Blossom'

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const prevDesc = metaDesc?.content
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content =
      'Definitive 2026 answers to the most-searched creator questions: how to go viral, why my videos get no views, how the Instagram and TikTok algorithm works, best hooks, best posting times, shadowbans, monetization, and how Blossom analyzes it all.'

    return () => {
      document.getElementById('faq-jsonld')?.remove()
      document.title = prevTitle
      if (metaDesc && prevDesc !== undefined) metaDesc.content = prevDesc
    }
  }, [])

  const visibleCategories = useMemo(() => {
    if (activeCategory === 'all' && !query.trim()) return CATEGORIES
    const q = query.trim().toLowerCase()
    return CATEGORIES.map((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) return null
      if (!q) return cat
      const filtered = cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          (item.keywords || []).some((k) => k.includes(q))
      )
      if (filtered.length === 0) return null
      return { ...cat, items: filtered }
    }).filter(Boolean) as FaqCategory[]
  }, [activeCategory, query])

  const totalVisible = visibleCategories.reduce((n, c) => n + c.items.length, 0)
  const totalAll = CATEGORIES.reduce((n, c) => n + c.items.length, 0)

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function expandAll() {
    const all = new Set<string>()
    visibleCategories.forEach((cat) =>
      cat.items.forEach((_, idx) => all.add(`${cat.id}-${idx}`))
    )
    setOpenItems(all)
  }

  function collapseAll() {
    setOpenItems(new Set())
  }

  return (
    <div className="min-h-screen bg-[#050508] overflow-x-hidden">
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
      <section className="relative pt-36 sm:pt-44 pb-16 px-4 sm:px-6 text-center z-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-8 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z" />
            </svg>
            FREQUENTLY ASKED QUESTIONS
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-display mb-6 leading-[1.1] tracking-tight uppercase">
            EVERY CREATOR
            <br />
            QUESTION,
            <br />
            <span className="gradient-text">ONE ANSWER.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 font-medium">
            How to go viral on Instagram Reels and TikTok in 2026, why your views tanked,
            how the algorithm actually ranks you, and how Blossom turns the answers into
            posts that hit.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-3">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 60+ questions — hooks, algorithm, shadowban, monetization…"
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
              Showing {totalVisible} of {totalAll} questions across {CATEGORIES.length} topics
            </p>
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <section className="px-4 sm:px-6 relative z-10 sticky top-24 sm:top-28">
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
                All Topics
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
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

      {/* Categories + Questions */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
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
            <div key={cat.id} id={cat.id} className="scroll-mt-44">
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
                  return (
                    <div
                      key={key}
                      className={`glass-card rounded-2xl transition-all duration-300 ${
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
                          {item.feature && (
                            <Link
                              to={item.feature.to}
                              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-widest transition-all"
                            >
                              {item.feature.label}
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
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
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {card.desc}
                </p>
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
