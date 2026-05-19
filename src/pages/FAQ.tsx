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
        q: 'What actually makes a video go viral on Instagram Reels and TikTok in 2026?',
        a: 'Virality in 2026 is engineered, not lucky. A video goes viral when four mechanics fire in sequence: a 3-second hook that holds 60%+ of viewers, completion above the ~70% threshold both platforms now use to trigger wider distribution, an emotional payload strong enough to push share rate past 1%, and an audio choice that either rides a sound under 5,000 Reels deep or lands an original beat-drop inside the cut. Miss the hook and reach collapses 5–10× before the algorithm even tests you. Miss the emotion and shares stay near zero — and shares, not likes, are the #1 ranking signal Adam Mosseri confirmed for Reels this year. The reason copying a viral video almost never works is that the visible format is downstream of these four ingredients; the original creator nailed the underlying pattern, the copy only mimics the surface. This is the gap Blossom\'s 5-dimension scoring is built to close — every analyzed video gets a visual, audio, narrative, engagement, and strategy score, so you see exactly which ingredient your draft is missing instead of guessing why a near-identical clip flopped.',
        details: [
          { label: 'Hook (first 3 seconds)', text: '63% of top-performing videos deliver their main message inside the first 3 seconds. Reels with a strong 3-second hold rate (above 60%) get 5–10× the total reach of weak ones.' },
          { label: 'Completion rate', text: 'The 2026 viral threshold sits around 70% completion — up from roughly 50% in 2024. 7–15 second videos average ~74% completion; 30–60 second clips average ~49%.' },
          { label: 'Emotional payload', text: 'Berger and Milkman\'s research found high-arousal emotions (awe, anger, surprise, indignation) drive sharing. Sadness shares 16% less than neutral; surprise and humor up to 34% more.' },
          { label: 'Audio timing', text: 'Trending sounds give the biggest algorithmic lift in the first 24–48 hours after they start climbing. Original audio works when the cut lands on a beat drop inside the first three seconds.' },
          { label: 'Share rate over likes', text: 'A share rate above 1% (one share per 100 views) is the modern signal of viral-worthy content. A 25K-view Reel with 500 shares routinely beats a 200K-view Reel with none.' },
          { label: 'Why copying flops', text: 'Trends are the skeleton, not the formula. A copied Reel inherits the format but not the hook strength, emotional arousal, or audio timing that made the original work.' },
        ],
        feature: { label: 'Score your next video on all 5 dimensions', to: '/signup' },
        related: ['hooks-1', 'formats-0', 'trends-0'],
        keywords: ['viral video', 'makes viral', 'why viral', 'what makes a video viral 2026', 'viral video formula', 'why videos go viral', 'share rate viral content', 'reverse engineer viral video'],
      },
      {
        q: 'What counts as going viral in views in 2026? (How many views is viral?)',
        a: 'There\'s no universal number. "Viral" is relative to your follower count, niche, and the platform\'s reach pattern in the first 24–72 hours. As a working rule in 2026: a Reel or TikTok is going viral when views in the first three days exceed roughly 10× your follower count and a meaningful share of those views come from non-followers. By absolute numbers, most creator economy reports still treat 1M+ views in 72 hours as macro-viral, 100K–250K as mini-viral, and 10K–50K as niche-viral. The mistake small accounts make is chasing the 1M ceiling. A 30K-follower account hitting 250K views with a 35% non-follower rate typically converts followers faster per view than a 1M-view post with a low share rate. The real signal is the velocity of non-follower reach, not the headline number. The practical move: define your personal viral threshold (10× followers), watch the first 6 hours of view velocity, and double down within 24 hours while the algorithm is still pushing. Blossom monitors connected accounts and alerts you the moment a post crosses your threshold, so you can post a follow-up or boost while the window is open.',
        details: [
          { label: 'Relative viral (the one that matters)', text: 'Views in the first 72 hours exceed ~10× your follower count, with strong non-follower reach. This is the threshold that actually drives follower growth, regardless of absolute number.' },
          { label: 'Niche-viral: 10K–50K views', text: 'Common inside tight niches. Highest follower-conversion rate per view because the audience is qualified — often more valuable than a generic 100K hit.' },
          { label: 'Mini-viral: 100K–250K views', text: 'Realistic ceiling for accounts under 50K followers when a video over-indexes on shares. Usually triggers a follower spike of 1–5% of view count.' },
          { label: 'Macro-viral: 1M+ views in 72 hours', text: 'Requires the algorithm to push the video to non-followers at scale. Rare, and lower follower conversion per view than niche or mini-viral hits.' },
          { label: 'Velocity beats volume', text: 'A post hitting 50K in 6 hours is a stronger signal than 200K over two weeks. Watch the first-day curve, not the final number.' },
          { label: 'Why the first 24 hours matter', text: 'Platform distribution decisions are mostly locked in by hour 24–48. Catching a breakout early is the difference between a one-off spike and a sustained run.' },
        ],
        feature: { label: 'Set up viral alerts on your account', to: '/signup' },
        related: ['engagement-1', 'engagement-2'],
        keywords: ['viral views', 'how many views', '1 million views', 'what counts as going viral', 'how many views is viral', 'viral views threshold 2026', 'going viral follower count ratio'],
      },
      {
        q: 'Can you guarantee my video will go viral?',
        a: 'No. And anyone selling a viral guarantee is lying to you. Virality lives at the intersection of two systems no tool fully controls: the algorithm (measurable, learnable) and the human brain at a specific cultural moment (chaotic, unpredictable). Research from Berger and Milkman confirms that high-arousal emotional resonance is what tips a video over the edge, and that resonance is timing-dependent in ways no model can promise. What Blossom does instead is replace the lottery ticket with a probability engine. Every video you analyze gets a virality probability score across five weighted dimensions (visual, audio, narrative, engagement, strategy), a list of weak points with concrete fixes, and side-by-side references to viral videos in your exact niche that already won with the format you\'re attempting. You are still the one who has to post — but you stop posting blind, you stop guessing which hook works, and you start iterating with the same pattern library (1.2M+ viral videos, 50K+ hooks, 1,200+ formats) that already cleared both gates. Anyone selling a guaranteed viral video tool is selling a scam. We sell the diagnostic.',
        details: [
          { label: 'Why no tool can guarantee virality', text: 'Virality requires surviving two independent systems: algorithmic distribution (predictable from structural signals) and emotional resonance at a cultural moment (inherently unpredictable). AI can only model the first.' },
          { label: 'What you actually get', text: 'A 0–100 virality probability score across 5 dimensions, ranked weak points with concrete fixes, and references to viral videos in your niche that won with the same format.' },
          { label: 'Pattern library backing the score', text: '1.2M+ viral videos, 50K+ hooks, 1,200+ formats, and 800+ tactics already classified, so your score is calibrated against content that actually cleared both gates.' },
          { label: 'Spot a viral-guarantee scam', text: 'Red flags: hidden pricing, no public methodology, vague testimonials, pressure to act fast, no transparency about how the score is computed. Walk away.' },
          { label: 'Built for iteration, not magic', text: 'Analysis versioning lets you re-score the same idea after edits, so you see whether your fixes actually moved the probability before you publish.' },
        ],
        feature: { label: 'Run a free virality analysis', to: '/signup' },
        related: ['ai-analysis-3', 'blossom-1'],
        keywords: ['guarantee viral', 'blossom guarantee', 'guaranteed viral video', 'viral guarantee tool', 'AI predict virality', 'virality probability score'],
      },
      {
        q: 'Is it harder to go viral on Instagram and TikTok in 2026 than it was a few years ago?',
        a: 'Yes, and it isn\'t close. Buffer\'s 2026 State of Social Media Engagement report (52M+ posts analyzed) shows the average Instagram engagement rate fell from 7.3% in 2024 to 5.4% in 2025, a 26% year-over-year drop, with Reels engagement down another ~20% YoY into Q1 2026 (now ~0.50%, below carousels at 0.52%). TikTok raised the completion-rate threshold that triggers wider distribution from 50% to 70%, and both platforms now seed new uploads to existing followers first before any stranger sees them. The result is the posting paradox 62% of full-time creators report: more uploads, less reach, and 47% have considered quitting in the past six months. Going viral isn\'t dead — it\'s just gated on one thing the algorithm can measure in 60 minutes: did your hook hold attention and pull a share or save before the seed audience moved on? That\'s the bar Blossom\'s pre-scored daily scripts are built to clear. Each morning you get five filmable scripts, each scored against 1.2M+ viral videos for first-hour retention, hook strength, and share-trigger structure, so you stop guessing which idea survives the seed test.',
        details: [
          { label: 'Instagram engagement rate', text: 'Median IG engagement fell 26% YoY, from 7.3% in 2024 to 5.4% in 2025 (Buffer, 52M+ posts).' },
          { label: 'Reels reach', text: 'Reels engagement is down ~20% YoY into 2026 and now trails carousels (0.50% vs. 0.52% in Q1 2026).' },
          { label: 'TikTok bar moved', text: 'The completion-rate threshold for wider distribution jumped from 50% to 70% — weak hooks die in the seed audience.' },
          { label: 'Followers-first testing', text: 'Both platforms now test new posts on existing followers before exposing them to non-followers, making first-hour engagement the single biggest reach lever.' },
          { label: 'Likes demoted', text: 'Mosseri\'s April 2026 update officially down-weighted likes; shares, saves, watch time, and DM forwards now drive distribution.' },
          { label: 'Creator burnout', text: '62% of full-time creators report burnout and 47% have considered quitting in the past six months — posting more is no longer enough.' },
        ],
        feature: { label: 'Get 5 pre-scored scripts every morning — free', to: '/signup' },
        related: ['algorithm-0', 'algorithm-1', 'engagement-3'],
        keywords: ['harder to go viral', 'engagement rate dropping', 'harder to go viral 2026', 'instagram reach declining 2026', 'first hour engagement algorithm', 'reels engagement decline'],
      },
      {
        q: 'Why don\'t most videos go viral in 2026? (top failure modes)',
        a: 'Across Blossom\'s analysis of 50,000+ published videos, six failure modes account for 82% of zero-traction posts — and almost every one is fixable in a single re-shoot. The 2026 algorithm bar is brutal: TikTok now demands a 70%+ completion rate to trigger viral distribution (up from 50% in 2024), 70%+ of viewers decide whether to swipe in the first 3 seconds, and up to 50% drop off on Reels before your message even loads. If you\'ve done everything "right" and still stalled at 200 views, you almost certainly lost the fight in seconds 0–3, or the algorithm couldn\'t classify your account, or your retention curve dipped under the viral threshold mid-video. The painful truth: posting more rarely fixes it — one of your videos already contains the failure signal you need to fix. Blossom\'s 5-dimension scoring tells you which single failure mode is killing your reach, then maps it to a proven fix from a library of 50K+ hooks and 1,200+ formats.',
        details: [
          { label: 'Weak hook (the #1 killer)', text: '70%+ of viewers decide in the first 3 seconds; up to 50% drop off on Reels before the message lands. A static opening frame is the single biggest cause of zero-traction posts.' },
          { label: 'Sub-70% completion rate', text: 'The 2026 viral threshold jumped from 50% to 70%. Videos below it rarely break 10,000 views; videos above it can scale to millions. Most creators are pacing for 2024 rules.' },
          { label: 'Niche drift', text: 'The algorithm assigns your account to a topic cluster. Posting off-niche or jumping random trends confuses classification, and your content gets shown to the wrong viewers — who scroll past.' },
          { label: 'Slow visual pacing', text: 'Frames held longer than 1.5 seconds without a cut, zoom, or text change cause silent drop-off mid-video. The algorithm reads the resulting retention dip and stops testing the post.' },
          { label: 'No on-screen text on mute', text: 'Around 65% of first views happen sound-off. No captions or kinetic text = no comprehension = no completion = no distribution.' },
          { label: 'No comment-bait', text: 'Captions that don\'t prompt a 4+ word reply lose late-cycle distribution. The algorithm uses comment depth as a quality signal once initial retention clears.' },
          { label: 'Watermarked or recycled footage', text: 'Auto-detected and down-ranked 30–50%. Reposting TikToks to Reels with the watermark is one of the fastest ways to cap your own reach.' },
        ],
        feature: { label: 'Find your failure pattern in 60 seconds', to: '/signup' },
        related: ['low-views-0', 'hooks-5', 'formats-1'],
        keywords: ['why not viral', 'reasons not viral', 'video flop', 'why videos don\'t go viral', 'viral video mistakes 2026', 'TikTok completion rate viral', 'Reels retention drop'],
      },
      {
        q: 'Is virality random or repeatable?',
        a: 'Virality looks random because the variance is enormous, but the drivers underneath are repeatable. Studies of breakout creators in 2026 keep arriving at the same conclusion: viral videos share a small set of structural traits (3-second hook, relentless pacing, a loop or payoff that rewards rewatches), and the creators who hit them again and again are the ones running a system, not chasing inspiration. The biggest reason viral posts don\'t repeat is that most creators can\'t sustain the process behind them: idea capture, scripted hooks, batched shoots, performance review. Operators like Alex Hormozi test 30+ titles per video and Steven Bartlett tests 100+ thumbnails — that\'s not luck, that\'s a controlled-variable testing loop. The practical move is to publish 2–3 variants of the same core idea, change only the hook or opening 3–5 seconds, and double down on whichever variant pulls early signal. Blossom\'s versioned analysis is built for exactly this: re-shoot the same idea, log the new version, and watch retention, hook score, and shares move side-by-side. After 5–10 iterations the pattern stops feeling like a lottery and starts feeling like an output you control.',
        details: [
          { label: 'High variance, fixed drivers', text: 'Views per post can swing 50× on the same account, but the hook, format, and payoff structure of the winners cluster tightly — that\'s the part you can engineer.' },
          { label: 'Test one variable', text: 'Hold script, lighting, and length constant. Change only the hook or first 3–5 seconds. Anything else and you can\'t isolate what moved the needle.' },
          { label: 'Volume beats intuition', text: 'Top operators test 30–100+ hook/title variants per concept. Hit rate compounds because each test feeds the next script.' },
          { label: 'System, not streak', text: 'Repeat virality requires idea capture, scripted hooks, batching, and post-mortems — the process behind the post, not the post itself.' },
          { label: 'Version your re-shoots', text: 'Blossom tracks each iteration of the same content idea so retention, hook score, and shares are comparable across versions.' },
        ],
        feature: { label: 'Run your testing loop on Blossom', to: '/signup' },
        related: ['hooks-1', 'features-0'],
        keywords: ['random viral', 'repeatable viral', 'consistent', 'is virality random', 'repeatable viral content', 'viral content testing', 'hook A/B testing'],
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
        q: 'What is a hook in a TikTok or Reel (and why does the algorithm care)?',
        a: 'A hook is the first 1–3 seconds of a short-form video — the visual, on-screen text, sound, and opening line that has to stop a thumb mid-scroll. It is a single promise to the viewer: stay, and you\'ll get this. The reason the algorithm cares is that platforms use early retention as their cheapest signal of quality. TikTok now expects roughly 70% of viewers to stay past the 3-second mark before it expands distribution beyond the initial test audience of 200–500 users, up from a looser ~50% bar in 2024. Instagram Reels watches your first ~30 viewers: if average view duration drops under 40%, the reel gets throttled; above 70%, it moves to the next tier of about 300 users. YouTube Shorts is more forgiving on view counts (any play counts since March 2025), but only "engaged views" feed ranking and monetization, and 50–60% of drop-off happens in the first three seconds. The common failure pattern isn\'t bad production — it\'s vague curiosity, slow warm-ups, and hooks that promise something the payoff never delivers. Blossom indexes 50,000+ proven viral hooks with the exact frame, timestamp, audio cue, and engagement numbers — filterable by niche and hook type — so you can see what stops the scroll before you film.',
        details: [
          { label: 'TikTok 2026 threshold', text: '~70% retention past the 3-second mark is the working floor for expanded distribution; 71% of viewers decide to stay or swipe inside those 3 seconds.' },
          { label: 'Instagram Reels', text: 'The first ~30 viewers act as a test panel. Under 40% average view duration throttles the reel; above 70% pushes it to a wider tier of ~300 users.' },
          { label: 'YouTube Shorts', text: 'Any play counts as a view since March 2025, but only engaged views drive ranking and revenue — and 50–60% of drop-off happens in the first 3 seconds.' },
          { label: 'Why hooks fail', text: 'Most weak hooks are vague curiosity or slow warm-ups, not bad production. If the viewer can\'t tell within a second why this video is for them, distribution stalls.' },
          { label: 'Five hook archetypes', text: 'Question, contrarian, pain-point, curiosity (open loop), and listicle. The right archetype depends on your topic and audience — not a universal best.' },
          { label: 'Promise must match payoff', text: 'When the opener teases something the body never delivers, completion craters and the algorithm reads it as low-quality even if the hook itself "worked".' },
        ],
        feature: { label: 'Browse 50,000+ proven hooks in Blossom', to: '/signup' },
        related: ['hooks-1', 'algorithm-0'],
        keywords: ['what is hook', 'hook definition', '3 seconds', 'what is a hook tiktok', 'tiktok 3-second rule', 'instagram reels retention threshold', 'youtube shorts retention 2026'],
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
        q: 'How long should my hook be on TikTok, Instagram Reels, and YouTube Shorts?',
        a: 'Short answer: 1.5 seconds on TikTok, up to 3 seconds on Instagram Reels, and 3 to 5 seconds on YouTube Shorts. After that, viewers are already deciding to swipe. TikTok\'s algorithm reads the first 3 seconds as a quality signal — videos holding 70 to 85 percent of viewers at the 3-second mark earn roughly 2× more total reach than those that don\'t, so your hook needs to land its payoff inside 1.5 seconds and let the next beat reinforce it. Instagram Reels is slightly more forgiving because the in-feed autoplay preview is longer, but the same drop-off logic applies: if your intro is still warming up at 3 seconds, retention collapses. YouTube Shorts gives you the widest window — about 5 seconds — but 50 to 60 percent of viewers who bounce already left by second three. The "my hook is too long" problem is almost always a slow build: a greeting, a setup line, or context the viewer didn\'t ask for. Cut everything before the payoff. If your hook is a question, ask it in frame one. If it\'s a claim, state it before the first cut. Every hook in Blossom\'s library is timestamped to the exact frame the payoff lands, so you can see how a 1.2-second hook actually unfolds — then rebuild yours against the same clock.',
        details: [
          { label: 'TikTok', text: 'Resolve the hook within 1.5 seconds. The algorithm checks retention at the 3-second mark and benchmarks 70%+ hold rate for promotion.' },
          { label: 'Instagram Reels', text: 'Up to 3 seconds. The autoplay preview is longer, but a weak 3-second hold rate cuts reach by 5 to 10× versus a strong one.' },
          { label: 'YouTube Shorts', text: '3 to 5 seconds. Most bounces still happen by second three, so plant a curiosity gap inside the first frame.' },
          { label: 'Most common failure', text: 'A slow intro — greeting, name, channel reminder, or context — before the actual payoff. Cut it. The viewer wants the promise, not the runway.' },
          { label: 'Calibrate with timestamps', text: 'Blossom indexes every hook in 50,000+ viral videos with the exact second the payoff lands, so you can pattern-match against hooks that already cleared the 3-second test.' },
        ],
        feature: { label: 'Browse timestamped hooks free', to: '/signup' },
        related: ['hooks-0', 'production-2'],
        keywords: ['hook length', 'hook duration', 'hook seconds', 'how long should tiktok hook be', 'ideal hook duration reels', 'youtube shorts hook duration'],
      },
      {
        q: 'Visual vs verbal hook: which works better on Reels and TikTok?',
        a: 'Both, in sync. The strongest 2026 hooks pair a visual pattern interrupt with on-screen text in the first second, because most viewers start watching with the sound off. Meta and TikTok have both reported for years that the majority of mobile feed views begin muted, and TikTok\'s own creative guidance recommends captions and on-screen text as a baseline for retention. If your hook is audio-only, you are betting your watch-time on whether a stranger unmutes a stranger\'s video — usually they don\'t. A verbal-only hook also fails accessibility for deaf and hard-of-hearing viewers and for anyone scrolling at work, in bed, or on transit. The fix is not just slapping a caption on top. The visual frame has to interrupt the scroll (unusual angle, motion, face reaction, before/after), the on-screen text has to promise a payoff in under three words, and the spoken line has to add a layer of context rather than repeat the text. That three-channel sync is what separates a 3-second drop-off from a 30-second watch. Blossom scores each channel of a hook separately — visual, on-screen caption, and audio — so when a video flops you can see which channel actually broke instead of guessing.',
        details: [
          { label: 'Visual hook', text: 'Pattern interrupt in frame one: unusual angle, motion, reaction shot, or visible transformation. This carries muted viewers.' },
          { label: 'On-screen text', text: 'Three to six words promising a payoff. Treat it as the headline, not a transcript of what you\'re saying.' },
          { label: 'Verbal hook', text: 'Adds context the text and visual can\'t show. Should never just repeat what\'s written on screen.' },
          { label: 'Sync, not stack', text: 'All three channels should land within the first 1–2 seconds and point at the same payoff.' },
          { label: 'Diagnose, don\'t guess', text: 'When a video underperforms, check each channel separately — most flops are a single weak channel dragging the others down.' },
        ],
        feature: { label: 'Score your hook on all three channels', to: '/signup' },
        related: ['captions-2', 'production-3'],
        keywords: ['visual hook', 'verbal hook', 'on-screen text', 'muted scroll hook', 'tiktok captions retention', 'reels hook first second', 'hook pattern interrupt'],
      },
      {
        q: 'How do I know if my Instagram Reels or TikTok hook is actually working?',
        a: 'A hook is working when three retention signals move together, not just one. The first is average watch time: anything under three seconds means most viewers swiped before your hook landed. The second is the percentage of viewers who stayed past the three-second mark; once that crosses roughly 60%, the platform keeps pushing the video into new feeds. The third is rewatch rate, the share of viewers who loop the video at least once. A rewatch rate above 8% signals the payoff was strong enough to compound distribution. The problem is that TikTok and Instagram scatter these numbers across three different screens, and neither platform tells you whether your hook beat the swipe or your middle did. That gap is where most creators misdiagnose a post. Blossom pulls watch time, three-second reach, and rewatch rate from any public Reel or TikTok and collapses them into a single Hook Score per post, so you can compare hooks side by side instead of guessing which thumbnail line earned the algorithmic lift.',
        details: [
          { label: 'Average watch time > 3s', text: 'Your hook beat the swipe. Find it under Insights → Reels → Average watch time on Instagram, or Analytics → Content → Average watch time on TikTok.' },
          { label: 'Viewers past 3s > 60%', text: 'The algorithm will keep testing your video in new feeds. Pull it from the retention curve in TikTok Studio or the audience retention graph in Reels Insights.' },
          { label: 'Rewatch rate > 8%', text: 'Your payoff compounded the loop and the platform reads that as high satisfaction. Visible on TikTok as "Watched full video" and on Reels as the second peak in the retention chart.' },
          { label: 'Hook Score (single number)', text: 'Blossom merges all three signals into one score per post so you can rank hooks across a week of content without flipping between dashboards.' },
          { label: 'Compare against viral peers', text: 'Score competitor posts on the same scale and you\'ll see whether your hook lost to the swipe or to a stronger reference point in the niche.' },
        ],
        feature: { label: 'Get your Hook Score in 60 seconds', to: '/signup' },
        related: ['ai-analysis-0', 'features-0'],
        keywords: ['hook working', 'hook score', 'measure hook', 'is my hook working', 'tiktok retention analytics', 'reels hook score', 'average watch time tiktok', 'instagram reels rewatch rate'],
      },
      {
        q: 'Why do question hooks work so well in short-form video?',
        a: 'Question hooks exploit the curiosity gap — the cognitive itch your brain feels when it senses missing information. The moment a viewer hears an unanswered question that applies to them, the brain locks into involuntary attention until the gap closes, which is why videos that clear the 3-second mark are far more likely to be pushed by the algorithm. Research on short-form retention shows that strong intro hooks hold 70%+ of viewers past the opening seconds, while weak ones drop below 40%. The mechanic only works if the question passes the specificity test. Generic questions like "Want to grow on Instagram?" read as ad copy and viewers scroll. A targeted version — "Why are your Reels stuck at 1,000 views when your hooks are good?" — feels personally aimed, names a real outcome discrepancy, and rules out a yes/no answer, so the brain commits to waiting for the payoff. The 2026 playbook stacks two layers: a precise pain point plus a "one variable surprise" tail ("…and changing this one line fixed it"). Blossom\'s Hook Library indexes 50,000+ hooks you can filter by question type, niche, and view count, so you can see which specific questions are pulling 1M+ views in your category right now.',
        details: [
          { label: 'Specific beats clever', text: '"Why are your Reels stuck at 1,000 views?" outperforms "Want to grow on Instagram?" because it names the exact outcome the viewer is living.' },
          { label: 'Outcome discrepancy', text: '"Why do some TikToks go viral at 200 followers while others die at 20K?" weaponizes a frustration the audience already feels.' },
          { label: 'Self-identification trigger', text: '"Are you the creator who films 10 takes and still posts the first one?" makes the viewer feel personally called out within 2 seconds.' },
          { label: 'No yes/no escape', text: 'Force a "why" or "how" framing — yes/no questions let the brain answer silently and scroll.' },
          { label: 'Stack a curiosity tail', text: 'Pair the question with a one-line tease ("…and it\'s not the algorithm") to keep retention through second 5.' },
        ],
        feature: { label: 'Filter 50,000+ question hooks by niche', to: '/signup' },
        related: ['hooks-1'],
        keywords: ['question hook', 'rhetorical', 'curiosity', 'question hook examples', 'curiosity gap hook', 'viral hook psychology'],
      },
      {
        q: 'What are the worst hook mistakes creators make on Reels and TikTok?',
        a: 'Over 70% of viewers decide whether to keep watching inside the first 3 seconds, and a hook-drop above 25% is enough for the algorithm to throttle your reach. Most weak openings come down to the same five mistakes, and creators rarely spot them in their own footage because the brain fills in context the audience does not have. The fix is rarely a new idea — it is removing the friction in front of the idea. Bury the lede, front-load credentials, promise something vague, leave the frame static, or recycle the exact opener you used last week, and you cap your video at roughly 10,000 views before the feed gives up on it. Videos that hold 70–85% retention in those first 3 seconds pull 2.2× the total views of videos that do not. Blossom analyzes your hook against a library of 50K+ openers from videos that crossed a million views, flags which of these five mistakes is dragging you down, and gives you 5 filmable scripts a day pre-scored on hook strength.',
        details: [
          { label: 'Burying the lede', text: 'The actual hook lands at 0:04 instead of 0:00. By second 3, ~70% of the audience has already swiped — they never reach the good part.' },
          { label: 'Front-loaded credentials', text: '"Hi, I\'m a 10-year marketing veteran" is setup, not payoff. The viewer is auditioning your relevance in 1.5 seconds, not your resume.' },
          { label: 'Vague promises', text: '"Today I\'m going to talk about Reels" has no specific outcome. Hook rate on generic openers regularly falls under 20% — the algorithmic dead zone.' },
          { label: 'Static first second', text: 'A still face on a still background reads as low-effort before a word is spoken. Most viewers watch muted, so the visual has to change inside frame one.' },
          { label: 'The recycled opener', text: 'If you\'ve used the same first line 5 posts in a row, your repeat viewers have learned to scroll on sight. Stale hooks tank engagement even when the rest of the video is strong.' },
          { label: 'Promise/payoff mismatch', text: 'A hook that overpromises trains the algorithm that your content wastes time. Future distribution drops across every video, not just the one that misfired.' },
        ],
        feature: { label: 'Diagnose your hook in 60 seconds', to: '/signup' },
        related: ['hooks-1', 'hooks-4'],
        keywords: ['hook mistakes', 'bad hooks', 'hook errors', 'bad hooks tiktok', 'fix weak hook', 'reels hook mistakes', 'first 3 seconds retention'],
      },
      {
        q: 'Should I A/B test different hooks for the same video?',
        a: 'Yes — hook testing produces bigger lifts than testing entirely new concepts, because viewers decide to keep watching or scroll inside the first second. The workflow most creators land on: film the body once, then record 3–5 distinct hook takes in the same session (question, bold claim, pattern interrupt, direct address). Stitch each as a separate post and space them 24–48 hours apart, ideally at the same time slot, so the audience environment is comparable. Compare 3-second retention, average watch time, and the hook drop delta (the gap between 0s and 3s viewership) — not raw view counts, which are noisy on smaller accounts. Wait at least 24–48 hours before calling a winner; short-form performance swings wildly in the first few hours. To cut the noise further, change one variable per test. Blossom analyzes each variant on five dimensions and saves them as versioned analyses, so you can open two takes side-by-side and see exactly which line, pacing choice, or framing moved retention.',
        details: [
          { label: 'Film once, hook many', text: 'Shoot the body in a single session, then record 3–5 hook openings back-to-back. You walk away with multiple full videos for one production cycle.' },
          { label: 'Space posts 24–48h apart', text: 'Same time slot, consecutive days. This keeps the audience environment comparable so the hook is the only meaningful variable.' },
          { label: 'Track retention, not views', text: '3-second retention and hook drop delta (0s vs 3s viewership) tell you what the hook actually did. View counts are too volatile on small accounts.' },
          { label: 'One variable per test', text: 'Change the hook OR the music OR the on-screen text — never all three. Single-variable tests need smaller samples to surface a real signal.' },
          { label: 'Compare versions in Blossom', text: 'Each variant gets a versioned analysis with 5-dimension scoring. Stack two takes side-by-side and see which line, pacing, or framing earned the watch time.' },
        ],
        feature: { label: 'Test your first hook variants free', to: '/signup' },
        related: ['production-0', 'engagement-2'],
        keywords: ['a/b test hook', 'test hooks', 'hook variants', 'hook testing workflow', '3-second retention', 'hook drop delta'],
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
        a: 'The Instagram Reels algorithm in 2026 ranks content using three core signals Adam Mosseri publicly confirmed — watch time, sends per reach (DM shares), and likes per reach — layered on top of an originality score and a buyer-intent stack (saves, profile clicks, comment exchanges). Sends remain the heaviest distribution lever for non-follower reach, while watch time decides whether you ever leave your follower bubble. The hidden filter most creators miss is the originality score: visible TikTok or CapCut watermarks, minor crops, and recycled clips trigger reduced reach, and accounts that post 10+ reposts in a 30-day window are excluded from recommendations entirely under the July 2025 Meta originality rules. The other quiet killer is the 3-second drop — roughly half of viewers leave inside the first three seconds, and Reels with a 60%+ 3-second hold reach 5–10× further than those under 40%. Average organic reach fell to 10–20% of followers in 2026 (down from 28–42%), so generic hooks no longer survive the cold-start window. Blossom analyzes any public Reel against this exact signal set — watch time, DM-share potential, save and comment triggers, originality flags, and 3-second hook strength — using Google Gemini 2.5 Pro and a library of 1.2M+ viral videos.',
        details: [
          { label: 'Sends per reach', text: 'Mosseri\'s most-cited 2026 signal for reaching non-followers. DM shares are 3–5× more valuable than likes for distribution.' },
          { label: 'Watch time and completion', text: 'A 45s Reel watched to 70% completion outperforms a 15s Reel at 40%. Repeat views are an especially strong positive signal.' },
          { label: 'Originality score', text: 'TikTok/CapCut watermarks, basic reposts, and minor crops trigger reduced reach. 10+ reposts in 30 days makes the account non-recommendable.' },
          { label: '3-second hold rate', text: 'Up to 50% of viewers leave in the first three seconds. Hooks above 60% retention reach 5–10× further than hooks under 40%.' },
          { label: 'Buyer-intent signals', text: 'Saves, profile clicks, and multi-word comment exchanges in the first 20 minutes decide whether a Reel breaks past your follower bubble.' },
          { label: 'Reach baseline reset', text: 'Average organic reach dropped from 28–42% of followers to 10–20% in 2026, with original creators gaining 40–60% while aggregators lost 60–80%.' },
        ],
        feature: { label: 'Score your Reel against all six signals', to: '/signup' },
        related: ['cross-platform-3', 'engagement-2'],
        keywords: ['instagram algorithm', 'reels algorithm', 'meta algorithm', 'instagram reels algorithm 2026', 'how instagram ranks reels', 'reels algorithm explained', 'why my reels not getting views'],
      },
      {
        q: 'What is the difference between the TikTok and Instagram algorithms in 2026?',
        a: 'TikTok and Instagram run on opposite logics. TikTok is an interest graph — the For You Page actively pushes videos to people who have never heard of you, ranking on completion rate, engagement velocity, and signals from your captions, sounds, and hashtags. Follower count barely matters, which is why nano-accounts pull a median 8.1% engagement rate and 1M+ TikTok accounts still hit roughly 7.6% versus 4.5% on Reels. Instagram is a social graph — Reels lean on your existing audience, watch time, and "sends per reach" (DM shares), so consistency with followers compounds harder than novelty does. The trade-off is real: TikTok favors discovery and shares (about 1.7× more than Reels), while Reels converts viewers into followers and buyers more reliably, with roughly 1.3× higher e-commerce conversion. Cross-posting the exact same edit is the most expensive mistake — Instagram explicitly downranks Reels with visible TikTok watermarks and the suppression spills over to your other posts. The 2026 playbook is one idea, two cuts: a curiosity-gap hook for TikTok\'s cold audience, a follower-aware hook for Reels. Blossom analyzes any public Reel or TikTok in under two minutes, scores it across visual, audio, narrative, engagement, and strategy, and tells you which variation belongs on which platform.',
        details: [
          { label: 'Algorithm type', text: 'TikTok runs an interest graph that pushes to strangers; Instagram runs a social graph that rewards existing followers.' },
          { label: 'Key ranking signal', text: 'TikTok weights completion rate and engagement velocity; Reels weights watch time and sends-per-reach (DM shares).' },
          { label: 'Engagement rate (2026)', text: 'TikTok median ~8.0% vs Reels ~7.5% overall; at 1M+ followers the gap widens to 7.6% vs 4.5%.' },
          { label: 'Best for', text: 'TikTok wins on reach and shares (~1.7× Reels); Reels wins on follower conversion and e-commerce (~1.3× TikTok).' },
          { label: 'Watermark penalty', text: 'Reels with visible TikTok watermarks get downranked, and the suppression bleeds into the rest of your account.' },
          { label: 'What to do', text: 'Publish the same idea twice with platform-tuned hooks — Blossom scores each version and points you to the right home for each.' },
        ],
        feature: { label: 'Analyze a video for both platforms', to: '/signup' },
        related: ['cross-platform-0', 'cross-platform-3'],
        keywords: ['tiktok vs instagram', 'algorithm difference', 'tiktok vs instagram algorithm 2026', 'tiktok or reels', 'platform comparison short form video', 'cross-platform content strategy'],
      },
      {
        q: 'Does the social media algorithm reward consistency or virality in 2026?',
        a: 'Both, but consistency is what compounds. Buffer\'s 2026 State of Social Media analysis of 52M+ posts found creators who publish 3–5 times per week consistently grow roughly 4.5× faster than accounts chasing sporadic viral swings. The mechanism is simple: every post is a fresh signal the algorithm uses to recalibrate your distribution. Go quiet for 7+ days and Instagram and TikTok both treat your return post like a cold start, reducing initial reach until your engagement rate re-stabilizes. Virality is a multiplier on top of consistency, not a substitute for it. A creator posting four times a week with a 6% average engagement rate will out-earn one breakout hit every two months in every metric that matters: follower growth, audience trust, and ad revenue stability. The real reason most creators fail at consistency isn\'t laziness — it\'s ideation drag, staring at a blank screen trying to invent something worth posting. Lower the activation energy: build a queue of proven formats, study what\'s already working in your niche, and treat each post as iteration rather than performance. Momentum beats genius on a 90-day timeline, every time.',
        details: [
          { label: 'The 7-day cliff', text: 'Going silent for a week triggers a distribution reset on both IG and TikTok, suppressing your return post\'s reach until engagement stabilizes.' },
          { label: 'Frequency floor', text: '3–5 posts per week is the threshold where algorithmic distribution starts compounding. Below 2×/week, you\'re rebuilding signal every cycle.' },
          { label: 'Virality math', text: 'One viral hit reaching 1M views typically converts to fewer long-term followers than 20 consistent posts each reaching 50K, because trust requires repetition.' },
          { label: 'Ideation is the bottleneck', text: 'The reason most creators miss cadence isn\'t time, it\'s deciding what to film. Working from proven formats cuts decision fatigue and protects consistency.' },
          { label: 'Iterate in public', text: 'Each post is a data point. Five mediocre posts teach you more about your audience than one polished swing that takes two weeks to produce.' },
        ],
        feature: { label: 'Get 5 filmable scripts every day', to: '/signup' },
        related: ['posting-2', 'features-3'],
        keywords: ['consistency vs viral', 'posting frequency', 'posting frequency growth 2026', 'how often to post on Instagram', 'TikTok algorithm consistency', 'social media algorithm reward'],
      },
      {
        q: 'Why do likes count less than saves and shares in 2026?',
        a: 'Likes are a 0.2-second reflex. A save or DM share is a deliberate vote — and that\'s the difference Meta and TikTok now price into the algorithm. In 2026, Adam Mosseri confirmed sends per reach is the strongest signal for pushing a Reel to non-followers, with DM shares weighted 3–5× more than likes for new-audience reach (some marketers measure it closer to 1 share = 15 likes in distribution score). TikTok runs the same hierarchy: shares > saves > comments > likes, because each rung up requires more cognitive effort and more social risk. The psychology is brutal but clean — a like says "nice," a save says "I\'ll need this again," a share says "my friend needs to see this." Only the last two prove the content created value worth carrying forward. That\'s why a Reel with 100 likes and 20 DM sends now outruns one with 1,000 likes and zero shares. Blossom\'s share-probability score rates every draft you write on this exact axis — not how lovable it looks, but how likely it is to get sent. Your daily 5 filmable scripts are pre-scored on share triggers (status, identity, utility, emotion) so you stop guessing what the algorithm rewards.',
        details: [
          { label: 'Sends per reach is king', text: 'Mosseri confirmed DM sends carry 3–5× the weight of likes when Instagram decides whether to push content to non-followers. 694,000 Reels are sent via DM every minute.' },
          { label: 'The new like-to-share math', text: 'Industry analysis puts 1 DM share at roughly 15 likes in 2026 distribution scoring. Likes still register, but at about 1/10th their 2023 weight.' },
          { label: 'TikTok mirrors the shift', text: 'TikTok\'s 2025–2026 ranking update placed shares and saves above likes because they signal future intent and active redistribution, not passive approval.' },
          { label: 'Why saves outrank likes', text: 'A save is a private bookmark of value — the algorithm reads it as "this content is worth returning to," which is a stronger quality vote than a tap.' },
          { label: 'Where Blossom fits', text: 'The share-probability score grades drafts on share triggers, not vanity reach. You ship knowing which version is built to get sent.' },
        ],
        feature: { label: 'Score your next post for share probability', to: '/signup' },
        related: ['algorithm-1', 'engagement-2'],
        keywords: ['likes vs saves', 'shares matter', 'why likes demoted', 'instagram algorithm shares', 'sends per reach 2026', 'tiktok shares vs likes', 'share probability score'],
      },
      {
        q: 'How do Instagram and TikTok algorithms know what niche my account is in?',
        a: 'Algorithm niche classification runs on three layered signals. First, computer vision scans your video frames, recognizing objects, scenes, faces, and on-screen text, while NLP transcribes your audio and captions. Second, the text layer — captions, hashtags, alt text, and voiceover keywords — confirms or contradicts what the visuals say. Third, the algorithm profiles the accounts that engage with you; if their bios and watch history cluster around a topic, you inherit that category. Instagram\'s December 2025 update pushed account categorization into micro-niches based on your last 9–12 posts (e.g., "home workouts for beginners," not just "fitness"), and the new "Your Algorithm" dashboard lets users remove categories — so loose positioning means instant invisibility. TikTok\'s exploration tests work the same way: it ships your video to a micro-audience cluster, and strong retention there expands distribution. Mixing niches splits your embedding across clusters, the model "forgets" which audience to feed you, and baseline reach resets. That is the #1 reason "my account used to grow and now it doesn\'t." Blossom\'s niche classifier tags every analyzed video against 60+ categories and flags drift the moment a post strays from your declared niche.',
        details: [
          { label: 'Visual signal', text: 'Computer vision reads objects, scenes, and on-screen text frame by frame, then matches them to known content clusters.' },
          { label: 'Text signal', text: 'Captions, hashtags, alt text, and transcribed voiceovers confirm the topic — clear keywords beat clever wordplay every time.' },
          { label: 'Audience signal', text: 'The bios and interests of accounts that watch, save, and share you tell the algorithm which cluster you belong to.' },
          { label: 'Micro-niche reality', text: 'Instagram now categorizes on the last 9–12 posts into specific sub-topics, not broad verticals — one off-topic post weakens the cluster signal.' },
          { label: 'Drift cost', text: 'Mixing niches splits your content embedding, the recommender resets baseline reach, and the audience you built stops seeing you.' },
        ],
        feature: { label: 'Track your niche with Blossom', to: '/signup' },
        related: ['formats-1', 'trends-3'],
        keywords: ['niche', 'algorithm niche', 'account classification', 'algorithm niche classification', 'account categorization tiktok', 'instagram micro-niche', 'niche drift reach drop'],
      },
      {
        q: 'How does the YouTube Shorts algorithm differ from TikTok in 2026?',
        a: 'The YouTube Shorts algorithm 2026 and TikTok\'s For You Page both run an explore-and-exploit model, but they measure success differently. TikTok ranks almost entirely on swipe-level signals: completion rate (70%+ is the new viral threshold, up from 50% in 2024), rewatches, saves, and shares, all evaluated against an interest graph that ignores follower count. Shorts vs TikTok algorithm comparisons miss that YouTube weighs three signals TikTok largely doesn\'t: swipe-away rate in the first 1.7 seconds (the single biggest ranking input, with distribution throttled once swipe-aways pass roughly 40% at the one-hour mark), subscriber-from-Short conversion as a high-weight signal that no other platform tracks, and post-watch satisfaction surveys that now outrank raw watch time. Late-2025 also brought a structural change: YouTube decoupled the Shorts recommendation engine from long-form, so a viral Short no longer auto-lifts your library — but Shorts that drive subscribes still benefit indirectly, since those new subs power long-form watch sessions that earn 50–250× more per view. Watermarks from TikTok or Reels are detected and down-ranked on Shorts, same as Reels does in reverse. Blossom analyzes Instagram and TikTok natively today; YouTube Shorts is on the roadmap, not live yet.',
        details: [
          { label: 'Swipe-away beats watch time', text: 'Average swipe-away on a Short happens at 1.7 seconds; cross 40% swipe-aways in the first hour and distribution stalls. TikTok punishes early scrolls too, but completion rate is the primary lever.' },
          { label: 'Subscribe signal is Shorts-only', text: 'YouTube tracks whether a Short causes a subscribe and weights it heavily. TikTok has no equivalent — follows don\'t carry the same ranking power on the FYP.' },
          { label: 'Long-form coupling was severed', text: 'Late 2025, YouTube decoupled the Shorts feed from long-form recommendations. The carryover now runs through subscribers, not a shared recommendation graph.' },
          { label: 'Completion thresholds differ', text: 'Shorts: 50–70% completion gets broader distribution, 70%+ goes massive. TikTok: 70% is the new viral floor in 2026, up from 50% two years ago.' },
          { label: 'Blossom coverage', text: 'Instagram and TikTok are analyzed natively today. YouTube Shorts support is on the roadmap, not yet live.' },
        ],
        feature: { label: 'Analyze your IG and TikTok hooks now', to: '/signup' },
        related: ['cross-platform-3', 'algorithm-0'],
        keywords: ['youtube shorts', 'shorts algorithm', 'youtube', 'youtube shorts algorithm 2026', 'shorts vs tiktok algorithm', 'subscriber conversion shorts', 'swipe-away rate'],
      },
      {
        q: 'What is shadow distribution and is it the same as a shadowban?',
        a: 'No, they are not the same. A shadowban is a hard penalty where the platform stops recommending your account almost entirely (For You distribution drops under 5%) and typically lasts 3 to 14 days. Shadow distribution, which platforms officially call "reduced distribution" or "content distribution prioritization," is far more common and is what most creators actually experience. Your posts still go live and reach a slice of your followers, but the algorithm quietly throttles non-follower reach because of low completion rates, weak shares and saves, off-niche drift, repetitive captions, or accumulated negative signals like quick scroll-aways and mutes. Instagram in 2026 rebalanced its algorithm around DM shares, saves, Reels watch time, and profile clicks, so a post with 500 likes and zero DMs can underperform a post with 100 likes and 20 shares. The fix is not panic, it is diagnosis. Blossom\'s 5-post audit pulls your last five posts, scores them on hook, retention, format, niche fit, and engagement quality, and tells you whether reach is dropping because of soft suppression or because the content itself is not generating the signals the algorithm now rewards.',
        details: [
          { label: 'Shadowban', text: 'Hard suppression. For You reach collapses below 5%, lasts 3 to 14 days, triggered by guideline breaches or bot-like behavior. Rare.' },
          { label: 'Shadow distribution', text: 'Soft throttle. Followers still see you, non-followers do not. Triggered by low watch time, weak shares, and off-niche posts.' },
          { label: 'Signals that matter in 2026', text: 'DM shares, saves, Reels watch time, profile clicks. Likes alone keep you stuck in the follower bubble.' },
          { label: 'Account trust score', text: 'One low-retention post can drag the next four. Negative signals like swipe-aways and "not interested" taps compound.' },
          { label: 'Diagnose, do not guess', text: 'A 5-post audit isolates whether the problem is distribution or content quality so you fix the right thing.' },
        ],
        feature: { label: 'Run a free 5-post audit', to: '/signup' },
        related: ['low-views-1', 'low-views-2', 'algorithm-5'],
        keywords: ['shadow distribution', 'soft suppression', 'reach throttle', 'reduced distribution', 'shadowban vs shadow distribution', 'instagram reach drop 2026'],
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
        a: 'The strongest global window in 2026 is Sunday at 9 AM in your audience\'s local time, per Buffer\'s analysis of 7.1M posts. Monday 1 PM and Sunday 1 PM round out the top three, evening prime time (6–11 PM) lifts views across most niches, and Sprout Social\'s read on ~2B engagements points to Tuesday–Thursday 2–6 PM. But here\'s why those windows fail most small creators: they\'re medians across millions of accounts. If your followers skew Pacific time and you publish on Eastern, you split your early-velocity signal in half — and TikTok\'s algorithm rewards concentrated engagement in the first hour, not totals. "Sunday 9 AM" is also the most crowded slot of the week, so a niche cooking or finance audience often performs better at an off-peak hour when their specific cluster is awake and scrolling. The fix is to stop optimizing for a global average and start posting against your own follower activity. Blossom builds a personalized posting heatmap from your connected IG/TikTok, weighted by where your followers actually live, so you can see your real peak windows by day and hour instead of guessing from a benchmark.',
        details: [
          { label: 'Sunday 9 AM local', text: 'Buffer\'s #1 window across 7.1M posts — but only if your audience is concentrated in one timezone.' },
          { label: 'Tuesday–Thursday 2–6 PM', text: 'Sprout Social\'s 2026 peak from ~2B engagements; the late-lunch and pre-commute scroll.' },
          { label: 'Evening 6–11 PM', text: 'Buffer found views generally peak in the evening; afternoons 12–5 PM are the weakest stretch.' },
          { label: 'Saturday is the strongest day', text: 'Highest total engagement of the week; Friday 6 PM is its standout hour.' },
          { label: 'Post against your followers\' clock', text: 'If 60%+ of your audience sits in one region, optimize for that timezone even when it\'s awkward for you.' },
          { label: 'Avoid splitting your audience', text: 'Publishing at a time that\'s half-good for two timezones dilutes early velocity. Rotate weeks instead.' },
        ],
        feature: { label: 'See your personal posting heatmap', to: '/signup' },
        related: ['posting-1', 'posting-2', 'features-4'],
        keywords: ['best time tiktok', 'when to post', 'tiktok timing', 'best time to post tiktok 2026', 'tiktok posting times', 'tiktok best time to post by timezone', 'tiktok algorithm posting time'],
      },
      {
        q: 'What is the best time to post Instagram Reels in 2026?',
        a: 'Buffer\'s State of Social Engagement 2026 report, drawn from 9.6M+ Instagram posts, names Thursday 9 AM, Wednesday 12 PM, and Wednesday 6 PM as the top three windows worldwide, with evening hours (6–11 PM) winning across most weekdays. Posting inside a peak window can boost reach 2–3× by stacking early likes, sends, and saves, which Instagram now treats as the strongest ranking signal in 2026 (Mosseri has confirmed "sends per reach" as the #1 factor for Reels). The catch: those numbers are normalized averages. If your followers live in Mumbai, Berlin, or LA, a 9 AM EST post lands while they sleep. Global benchmarks tell you which days and slots tend to win, not when your audience opens the app. Niche matters too — B2C peaks at lunch, fitness peaks at 5–6 AM, fashion peaks after 7 PM. The fix is a heatmap built on your followers\' actual timezones, not a US-weighted average. Blossom analyzes your audience\'s location distribution and active hours to surface the three windows that matter for your account, then pairs them with five filmable scripts per day.',
        details: [
          { label: 'Top global window', text: 'Thursday 9 AM — the strongest single slot across Buffer\'s 9.6M-post dataset.' },
          { label: 'Strongest day pair', text: 'Wednesday and Thursday consistently outperform Monday, Friday, and weekends for Reels.' },
          { label: 'Evening edge', text: '6–11 PM wins on most days because viewers scroll longer and send Reels to friends — the #1 algorithm signal.' },
          { label: 'Niche shifts', text: 'Fitness peaks 5–7 AM, B2C at lunch (12–1 PM), fashion and lifestyle after 7 PM. Pick the band that matches your category.' },
          { label: 'Timezone trap', text: 'Published times in reports are normalized to the audience, not your phone clock. A US-anchored 9 AM is 3 PM in Berlin and 6:30 PM in Mumbai.' },
          { label: 'First-2-hour rule', text: 'Reels are momentum-based — engagement in the first 30 min to 2 hours decides how far the algorithm pushes them.' },
        ],
        feature: { label: 'Get your personalized posting heatmap', to: '/signup' },
        related: ['posting-0', 'posting-2'],
        keywords: ['best time instagram', 'reels timing', 'instagram peak', 'best time to post instagram reels 2026', 'when to post reels', 'personalized posting heatmap'],
      },
      {
        q: 'How often should I post on TikTok in 2026 to grow?',
        a: 'For individual creators in growth mode, post 1–3 times per day. For established brands and businesses, 4 posts per week is the proven baseline. The 2026 sweet spot for a new account during its first 90 days is one high-effort post plus one medium-effort post per day — enough volume to feed TikTok\'s algorithm the data it needs to learn your niche, without forcing you into burnout-tier production. Posting fewer than 3 times per week consistently stalls growth because the For You Page can\'t build a confident profile of your content. The real failure point isn\'t frequency though — it\'s quality collapse around week 3, when creators run out of ideas and start posting filler. The fix is treating ideation as a separate problem from filming. Build a rolling script bank so you\'re never staring at a blank camera at 9pm. Blossom\'s daily script feature surfaces 5 fresh, filmable scripts every day, tuned to your niche and based on what\'s actually performing right now — which makes the 1–3/day cadence sustainable instead of soul-crushing.',
        details: [
          { label: 'Solo creator growth', text: '1–3 posts/day, with at least one high-effort post. This is the cadence the algorithm rewards on new accounts.' },
          { label: 'Established brands', text: '4 posts/week is the sustainable baseline. Quality and brand consistency matter more than raw volume once you have authority.' },
          { label: 'First 90 days', text: '1 high-effort + 1 medium-effort post per day. Mix formats (talking head, B-roll, trend remix) so the algorithm can test you across surfaces.' },
          { label: 'Burnout prevention', text: 'Batch film 5–7 videos in one session, then schedule. Separate ideation, filming, and editing into different days so no single task drains your week.' },
          { label: 'Floor to avoid', text: 'Under 3 posts/week and your reach flattens — TikTok deprioritizes accounts it can\'t learn from.' },
        ],
        feature: { label: 'Get 5 fresh scripts every day', to: '/signup' },
        related: ['posting-3', 'features-3'],
        keywords: ['how often post', 'tiktok frequency', 'daily posting', 'how often post tiktok 2026', 'tiktok posting schedule 2026', 'tiktok algorithm posting frequency'],
      },
      {
        q: 'How often should I post Instagram Reels in 2026?',
        a: '3–5 Reels per week is the documented sweet spot for 2026, and it is not a soft recommendation. Adam Mosseri has confirmed the three signals that decide Reels distribution: watch time, sends per reach, and likes per reach. Volume is not on that list. Posting 10+ times per week causes diminishing returns and burnout, and creators who drop daily mediocre Reels are routinely outperformed by accounts shipping three strong ones. Spacing matters too: Reels published less than 3–4 hours apart cannibalize each other inside the same 24-hour test window, where 80% of a Reel\'s lifetime views are decided. Stories and carousels do not count against this budget, so layer them freely. The real failure mode is inconsistency, not low volume. Most creators quit a 7×/week schedule inside a month; a 3–5× cadence is the one you can actually sustain for the 90 days the algorithm needs to learn your audience. Blossom generates 5 daily filmable scripts mined from currently viral Reels in your niche, so a 3–5/week cadence becomes a 20-minute filming session, not a content treadmill.',
        details: [
          { label: 'Sweet spot', text: '3–5 Reels per week. Daily Reels deliver 40% more reach than 2×/week, but only if quality holds — most creators cannot sustain it.' },
          { label: 'Don\'t double up', text: 'Two Reels in under 3–4 hours split reach inside the same 24-hour algorithmic test window. Wait, or post tomorrow.' },
          { label: 'Watch time wins', text: 'A 14-second Reel watched twice outperforms a 60-second Reel watched once. The first 1.7 seconds decide if viewers stay.' },
          { label: 'Sends > likes for growth', text: 'Mosseri confirmed sends per reach is the strongest signal for unconnected reach. Hook for shareability, not just likes.' },
          { label: 'Layer the formats', text: 'Stories and carousels do not compete with Reels reach. Use them daily to stay top-of-mind between Reels drops.' },
        ],
        feature: { label: 'Get 5 daily Reels scripts free', to: '/signup' },
        related: ['posting-2', 'formats-3'],
        keywords: ['reels frequency', 'instagram how often', 'how often post reels 2026', 'instagram reels posting frequency', 'reels reach 24 hour window', 'reels per week sweet spot'],
      },
      {
        q: 'Does deleting a flopping post hurt your account? Archive vs delete on Instagram and TikTok',
        a: 'Yes — deleting hurts more than the flop itself. Instagram and TikTok don\'t issue an official "delete penalty," but the practical damage is real. When you delete, you lose every signal the post earned: watch time, saves, comments, profile visits. The algorithm reads the gap as inconsistency, and repeat deletions look like spam behavior that can trigger distribution throttling. Creator data from 2026 shows reposted videos only outperform the original 20–30% of the time, and 3–5 consecutive flops in a row still won\'t tank your next upload — so the "delete to reset" instinct usually costs more than it saves. The fix is simple: archive on Instagram (Settings → Archive) or switch the post to "Private / Only me" on TikTok. Both options hide the content from your profile while preserving the engagement data the algorithm uses to score your account. Don\'t delete and repost the same idea within 24–48 hours either — duplicate-content flags throttle the second upload. Blossom watches every post you publish and flags underperformers inside the first few hours, when you still have time to boost, edit the caption, or quietly archive — instead of panic-deleting at 2 a.m.',
        details: [
          { label: 'Instagram: archive, don\'t delete', text: 'Archiving hides the post from your grid but keeps likes, comments, and watch-time signals attached to your account. Instagram explicitly does not penalize archived content, and you can restore it later.' },
          { label: 'TikTok: set to "Private"', text: 'Switching a video to "Only me" removes it from your profile without erasing its performance history. TikTok doesn\'t "forget" a deleted video either — the algorithm keeps the data, so deletion only hurts the public-facing side.' },
          { label: 'Never delete-and-repost within 48 hours', text: 'Duplicate-content detection on both platforms throttles the second upload. Reposts beat the original only 20–30% of the time; 70–80% perform the same or worse.' },
          { label: 'One flop is not a death sentence', text: 'Creator data shows 3–5 consecutive underperformers won\'t crater your next post. The algorithm scores account-level patterns, not single videos.' },
          { label: 'Catch flops in hours, not days', text: 'Blossom monitors every post against your own baseline and surfaces the 5-dimension reason it stalled — hook, pacing, retention, CTA, or distribution — so you can act while the post is still salvageable.' },
        ],
        feature: { label: 'Catch flops early with Blossom', to: '/signup' },
        related: ['low-views-4', 'algorithm-7'],
        keywords: ['delete post', 'flop post', 'archive vs delete', 'delete post penalty', 'tiktok delete algorithm 2026', 'instagram archive reels', 'underperforming post'],
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
        q: 'Why are my TikTok videos getting no views in 2026?',
        a: 'There is a finite list of causes — about seven — and almost all of them are diagnosable from a single video URL. If you\'re posting daily and watching your views shrink, you\'re not invisible to the algorithm; you\'re being measured against a stricter 2026 bar that most creators don\'t know exists. The platform now needs 70%+ completion rate to push beyond your follower base (up from ~50% in 2024), and signal velocity dropping below the distribution threshold causes the overnight cliff people call a shadowban — a 70–95% drop across every post at once. A weak 3-second hook, an imported watermark (TikTok and YouTube both auto-detect them), a flagged caption, or posting across 3+ unrelated topics (the 2026 cross-niche penalty drops reach ~45%) will each kill a video on its own. Deleting and reposting almost never fixes it because the underlying signal hasn\'t changed. The faster path: paste your underperforming TikTok URL into Blossom, and our 5-dimension Gemini-powered diagnosis tells you the exact reason — weak hook frame, watermark detected, niche drift, banned phrase, or wrong audience window — in 30 to 120 seconds. Then you re-shoot the one thing that actually broke, not all seven.',
        details: [
          { label: 'Weak hook in first 3 seconds', text: 'If 60%+ of viewers swipe before the 3-second mark, distribution stalls under 500 views. Videos that hold 70–85% retention in those 3 seconds get 2–7× more impressions.' },
          { label: 'Completion below the 2026 viral threshold', text: 'TikTok now requires ~70% completion to trigger non-follower distribution, up from 50% in 2024. Videos under 60% completion get minimal algorithmic push regardless of hashtags.' },
          { label: 'Watermarked or recycled content', text: 'TikTok and YouTube both run frame-level watermark and metadata detection. Reposting a CapCut-watermarked or cross-platform clip caps reach immediately.' },
          { label: 'Caption or audio flagged', text: 'Banned phrases, engagement bait, coded slurs, or a copyright-flagged sound quietly suppress the post. Check Profile → TikTok Studio → Account Check for active restrictions.' },
          { label: 'Signal velocity collapse (the "overnight zero")', text: 'When recent posts drop below the platform\'s distribution floor, every post crashes 70–95% at once. Recovery typically takes 2–4 weeks of daily, original, in-app uploads.' },
          { label: 'Cross-niche drift', text: 'Accounts posting across 3+ unrelated topics see ~45% less reach than single-niche accounts. The algorithm loses confidence in which audience to test you on.' },
          { label: 'New-account calibration', text: 'First 2–24 hours of a new account often show zero impressions while TikTok verifies trust and clusters your niche. Don\'t delete, don\'t switch niches.' },
        ],
        feature: { label: 'Diagnose my last post', to: '/signup' },
        related: ['low-views-1', 'low-views-3', 'hooks-6'],
        keywords: ['tiktok no views', 'zero views', 'why no views', 'why my tiktok not getting views', 'tiktok 0 views fix', 'tiktok views dropped', 'tiktok shadowban 2026', 'tiktok completion rate'],
      },
      {
        q: 'Am I shadowbanned on Instagram or TikTok? How to check in 2026',
        a: 'You\'re likely shadowbanned if four signals stack at once: views collapse 70%+ overnight with no content change, your last few posts don\'t appear in hashtag search when checked from a logged-out account, native analytics show near-zero "For You" (TikTok) or "Non-followers" (Instagram) traffic, and you recently used a flagged hashtag, posted near-policy content, reposted a watermarked clip, or got a copyright strike. One signal alone usually means a weak post. All four together is a pattern. Start with the official sources before any third-party "checker": TikTok Studio → Account check and Instagram Settings → Account Status will show active restrictions and removed posts. Then post a video with an invented hashtag and search it from a second, non-following account 30 minutes later. If it\'s missing, your reach is being suppressed. The frustrating part is ruling out the algorithm vs. ruling out your content. Before assuming a shadowban, paste your last 5 posts into Blossom — our AI runs each one through a 5-dimension audit and flags the exact issues platforms quietly penalize: TikTok or other watermarks, niche drift, weak hooks, banned-hashtag exposure, and audio that competes with your voiceover. If the audit is clean and the four signals above still match, you\'re probably restricted, not under-performing.',
        details: [
          { label: 'Sudden 70%+ view drop with no content change', text: 'The most reliable single signal. Compare your last 5 posts to your trailing 30-day median, not your best post.' },
          { label: 'Missing from hashtag search (logged-out test)', text: 'Post with a unique invented hashtag, wait 30 minutes, then search it from an account that doesn\'t follow you. If your post is nowhere, reach is being suppressed.' },
          { label: 'Native analytics confirm it', text: 'TikTok: Analytics → Reach → "For You" traffic at or near 0%. Instagram: Insights show reach almost entirely from existing followers, with Explore and non-follower Reels near zero.' },
          { label: 'Check the official status pages first', text: 'TikTok Studio → Account check and Instagram Settings → Account Status reveal removed posts, reduced distribution, and active restrictions before any third-party tool will.' },
          { label: 'Common 2026 triggers', text: 'Reposting clips with TikTok or other platform watermarks, banned or over-aggressive hashtags, unlicensed audio, OCR-flagged on-screen text, mass follow/unfollow, or a recent community guideline strike.' },
          { label: 'What to do next', text: 'Stop posting for 48–72 hours, delete any post tied to a strike, switch hashtag sets, and rule out content issues with an objective audit before you assume the worst.' },
        ],
        feature: { label: 'Audit my last 5 posts free', to: '/signup' },
        related: ['low-views-2', 'algorithm-7'],
        keywords: ['shadowban', 'shadow ban', 'shadowbanned', 'am I shadowbanned', 'instagram shadowban check 2026', 'tiktok shadowban test', 'how to know if shadowbanned', 'tiktok for you page traffic 0%'],
      },
      {
        q: 'How do I fix a shadowban on Instagram or TikTok in 2026?',
        a: 'No one can force-lift a shadowban — not you, not Instagram support, and definitely not the $99 "shadowban removal" services you\'ll see advertised. Ignore those; they\'re scams. What you can control is how quickly the platform\'s spam systems re-trust your account. Natural recovery in 2026 takes anywhere from 24 hours to 2 weeks, with most accounts clearing in 3–7 days if you stop signaling spammy behavior. Start by removing any post that may have triggered a guideline review (banned hashtags, copyrighted audio, borderline captions). Then pause posting for 24–48 hours to break the suspicious-activity pattern the algorithm flagged. When you re-engage, go gentle — reply to existing comments, post a Story or two, and avoid follow/unfollow loops and third-party schedulers entirely. The single biggest mistake creators make is panicking through the reset and then posting weak content the moment they feel "unbanned," which restarts the cycle. Before your comeback Reel goes live, audit your last 5 posts in Blossom to confirm whether reach actually collapsed (a real shadowban) or whether the content itself underperformed — and to make sure the next one you publish is your strongest, not your fastest.',
        details: [
          { label: 'Stop the signal', text: 'Pause posting for 24–48 hours and delete anything that could have tripped a guideline review — banned hashtags, copyrighted audio, or captions flirting with policy violations.' },
          { label: 'Skip the scams', text: 'No service, agency, or DM bot can manually remove a shadowban. Anyone charging for it is selling you the wait you\'d get for free.' },
          { label: 'Re-engage gently', text: 'Reply to existing comments, post a Story, and DM a few warm followers before you publish a new Reel or TikTok. Sudden bursts of activity look like the spam you\'re trying to escape.' },
          { label: 'Cut the automation', text: 'Disconnect any third-party scheduler, follow/unfollow tool, or engagement-pod app. Repeat shadowbans almost always trace back to one of these.' },
          { label: 'Audit before you relaunch', text: 'Run your last 5 posts through Blossom to separate "reach dropped from a shadowban" vs. "the content underperformed." The two look identical in your insights tab but need opposite fixes.' },
          { label: 'Come back strong', text: 'Lead with your strongest niche format to your warmest audience — not a quick experiment. Your first post post-reset teaches the algorithm what to trust again.' },
        ],
        feature: { label: 'Audit your last 5 posts in Blossom', to: '/signup' },
        related: ['low-views-1'],
        keywords: ['fix shadowban', 'remove shadowban', 'shadowban recovery 2026', 'instagram shadowban fix', 'how long does a shadowban last', 'shadowban removal service scam'],
      },
      {
        q: 'Why does my new TikTok account get 0 views (or stuck at 50-300)?',
        a: 'Your account is in calibration, not shadowbanned. Every fresh TikTok account spends roughly 7 to 14 days in a distribution sandbox while the algorithm figures out who you are, who your viewers should be, and whether your content stays in one lane. During this window, views typically sit between 50 and 300 per post, even on strong content. That ceiling is the test, not the verdict. The biggest mistake is deleting the account and starting over on day 3 or 4: you reset the clock and lose every signal TikTok had started collecting. The second biggest mistake is switching niches when a post underperforms, which scrambles the classification entirely. Treat the first 14 days as data collection. Post daily, stay strictly on-niche, and let TikTok build a clean profile of your account. Once the algorithm locks in your category, distribution opens up and the same content style starts reaching 1,000+ viewers it could not find before. The accounts that break out of 0 views are the ones that look obvious to the algorithm within the first 10 posts.',
        details: [
          { label: 'Days 1-3: Set the lane', text: 'Post once per day. Use a consistent topic, framing, and on-screen text style so the first three posts read as the same creator to the algorithm.' },
          { label: 'Days 4-7: Stay on-niche', text: 'Do not pivot when views feel low. Calibration penalizes inconsistency far more than slow growth. Keep all posts inside one clearly identifiable category.' },
          { label: 'Hashtags and sound', text: 'Use 2 to 3 niche-specific hashtags, not 10 broad ones. Pick sounds already trending inside your niche so TikTok groups you with similar creators.' },
          { label: 'Seed the graph', text: 'Spend 10 to 15 minutes daily commenting on 5 to 10 established accounts in your niche. This signals which neighborhood you belong to.' },
          { label: 'Days 8-14: Hold the line', text: 'Keep posting daily even if numbers feel flat. A noticeable jump usually arrives between post 8 and post 15 once classification settles.' },
          { label: 'Audit before you blame the algorithm', text: 'Run your first 10 posts through Blossom\'s niche classifier to see if any are drifting off-topic. One off-niche post in week one can delay calibration by days.' },
        ],
        feature: { label: 'Check if your first posts are on-niche', to: '/signup' },
        related: ['low-views-0', 'algorithm-5'],
        keywords: ['new account no views', 'tiktok calibration', 'fresh account 0 views', 'new tiktok account 50 views', 'tiktok 7 to 14 days', 'tiktok algorithm new account'],
      },
      {
        q: 'Why did my views suddenly drop after going viral, and is the "viral hangover" real?',
        a: 'Yes, the viral hangover is real, and 2026 data makes it measurable. When a Reel or TikTok crosses its breakout threshold, the algorithm pushes it to colder, broader audiences far outside your niche. Those viewers don\'t watch, save, or share at your normal rate, so your account-level engagement rate gets diluted, sometimes by 40% within days as low-fit followers unfollow. Your next 2–3 posts then get tested against those same cold audiences, which is why views drop sharply post-viral. On top of that, TikTok now requires a 70%+ completion rate in 2026 to re-trigger viral distribution, and Instagram demoted likes as a ranking signal in April 2026 — so recovering reach depends on shares, saves, DMs, and watch time, not vanity metrics. The fix is counterintuitive: do not chase the wider audience that fueled the viral hit. Double down on your strongest niche content within 24–48 hours while the algorithm is still re-evaluating you. Blossom analyzes your viral video against your last 30 posts, isolates the hook, format, and tactics that triggered the breakout, and tells you exactly which patterns to repeat (not switch from) during the recovery window.',
        details: [
          { label: 'Cold-audience dilution', text: 'Post-viral, TikTok and Instagram retest your content on colder viewers outside your niche, lowering watch time and reach on the next 2–3 posts.' },
          { label: 'Unfollow spike', text: 'Documented viral moments show up to a 40% unfollow increase within days as misfit followers churn, hurting your account-wide engagement rate.' },
          { label: '2026 70% rule', text: 'TikTok\'s 2026 algorithm requires 70%+ completion to re-trigger viral distribution — higher than previous years.' },
          { label: 'Likes demoted', text: 'Instagram\'s April 2026 update officially demoted likes as a ranking signal. Shares, saves, and DM sends now drive Reels reach.' },
          { label: '24–48 hour window', text: 'Post follow-up niche content within 1–2 days while viewers are still warm — don\'t pause or pivot to chase the broader audience.' },
          { label: 'Blossom playbook', text: 'Blossom\'s last-30-posts monitoring identifies which hooks and formats triggered your viral hit so you can repeat the pattern, not gamble on a style change.' },
        ],
        feature: { label: 'Get my post-viral playbook', to: '/signup' },
        related: ['posting-4', 'engagement-3'],
        keywords: ['viral hangover', 'views dropped', 'after viral', 'post viral reach drop', 'why views dropped after viral video', 'post-viral algorithm reset'],
      },
      {
        q: 'What is "ghost engagement" on Instagram and TikTok — and how do I stop getting views but no follows?',
        a: 'Ghost engagement is when a post pulls views and passive likes but almost no saves, shares, sends, or follows — the active signals algorithms actually weigh in 2026. It happens when your content reaches the wrong audience pool: people who\'ll watch a few seconds, maybe double-tap, then bounce. Both platforms read that pattern as "low-relevance content" and throttle distribution. The shift is severe — after Instagram\'s December 2025 update, likes drive roughly 5% of reach while DM shares matter 3–5× more, and TikTok\'s 2026 leak revealed a -45% reach penalty for accounts that drift across more than three unrelated topics. The fix is niche discipline plus disqualifying-filter hooks that repel the wrong viewer in the first second: "This is for first-time founders raising under $1M. Everyone else, skip." That tanks vanity views but lifts the save/share/follow ratio the algorithm rewards. Blossom analyzes any viral video in 30–120 seconds, classifies its niche, scores it across 5 dimensions, and surfaces the exact disqualifying-filter hook templates top creators in your category are using.',
        details: [
          { label: 'The real signal', text: 'Saves rank highest, then shares/sends, then comments. Likes are now passive noise — a post watched to completion by 200 people can outperform one liked by 2,000 who bounced at 3 seconds.' },
          { label: 'The niche penalty', text: 'TikTok\'s 2026 algorithm quarantines new posts to existing followers for the first 48 hours and applies a -45% reach penalty for accounts posting across 3+ unrelated topics.' },
          { label: 'Why views ≠ follows', text: 'Instagram tests every post on non-followers before it worries about conversion. If your hook doesn\'t filter for your ICP in the first 2 seconds, you get views from people who\'ll never follow — and the algorithm reads that as a relevance failure.' },
          { label: 'The disqualifying-filter fix', text: 'Open with a hook that names exactly who the content is for ("If you\'re a SaaS founder under $10K MRR…"). It cuts impressions but lifts save-rate, share-rate, and follow-rate.' },
        ],
        feature: { label: 'Find your niche\'s filter hooks — Sign up free', to: '/signup' },
        related: ['engagement-3', 'formats-1'],
        keywords: ['ghost engagement', 'fake engagement', 'wrong audience', 'views but no follows', 'disqualifying filter hook', 'niche misclassification'],
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
        a: 'In 2026, the median engagement rate is 3.70% on TikTok (up 49% year-over-year), 0.48% on Instagram (basically flat), 0.15% on Facebook, and 0.12% on X. Instagram Reels sit around 0.50% when measured against followers, but jump to roughly 2.7% when measured against reach. "Good" only means something once you anchor it to your niche and follower band: higher-education accounts average 2.43%, sports 1.57%, beauty 1.26%, fashion 0.99%, food 0.63%, and health & wellness 0.40% — so a 1.5% fashion creator is crushing it while a 1.5% higher-ed account is underperforming. Size matters just as much. Nano accounts under 10K routinely run 4%+, micro creators 3%+, macro 1.5%+, and mega 1M+ around 1%. Watching your rate drop from 6% to 2% as you scale isn\'t decline — it\'s gravity. The number worth tracking is your rate against creators in your exact niche and tier. Blossom benchmarks every video against that specific cohort, not a global average that lumps a finance B2B page in with a dance creator.',
        details: [
          { label: 'Platform medians', text: 'TikTok 3.70%, Instagram 0.48%, Facebook 0.15%, X 0.12%. TikTok engagement grew 49% YoY while Instagram stayed flat.' },
          { label: 'Reels math is weird', text: 'Reels look low (0.50%) because the denominator is followers. Measured against reach they sit near 2.7% — same content, different math.' },
          { label: 'Niche beats global', text: 'Higher-ed 2.43%, sports 1.57%, beauty 1.26%, fashion 0.99%, food 0.63%, health 0.40%. A global median tells you nothing about your category.' },
          { label: 'Bigger account, smaller rate', text: 'Nano (under 10K) averages 4%+, micro 3%+, macro 1.5%+, mega 1M+ around 1%. The drop as you grow is structural, not a content problem.' },
          { label: 'Brand minimum', text: 'Most brand partnerships filter for 2%+ at minimum, with consistent engagement weighted heavier than raw follower count.' },
        ],
        feature: { label: 'See how your videos rank in your niche', to: '/signup' },
        related: ['engagement-1', 'engagement-2'],
        keywords: ['engagement rate', 'good engagement', 'benchmark', 'good engagement rate 2026', 'average engagement rate instagram', 'tiktok engagement rate benchmark', 'instagram reels engagement rate', 'engagement rate by niche 2026'],
      },
      {
        q: 'How fast can I realistically grow from 0 to 10K followers on TikTok or Instagram?',
        a: 'For a niche-focused creator posting 4–7 times per week, 0 to 10K is realistic in 45 to 90 days on TikTok and 90 to 120 days on Instagram Reels in 2026. Creators running all five working levers (consistent niche signal, hook-first editing, 4–7×/week cadence, trend timing, daily posting windows) grow 2–3× faster than creators using fewer than three. The single biggest accelerator is one breakout video: at roughly a 1% view-to-follow conversion rate, a single 100K-view post adds about 1,000 followers in 24–72 hours, and most creators who cross 10K do so on the back of one post that spiked 20–40× their average. The problem is most accounts quit before that breakout lands, usually around day 30–45 when posts plateau under 1K views. Blossom is built for exactly this window: the suggestion engine ranks every script idea by breakout probability, scores it across 5 dimensions (hook, format, niche fit, trend timing, retention shape), and gives you 5 filmable scripts a day so you keep shipping the iterations that compound into your breakout.',
        details: [
          { label: 'Realistic TikTok timeline', text: '45–90 days at 4–7 posts/week in a single tight niche. 30 days is possible but rare; 180+ days signals inconsistent posting or oversaturated niche.' },
          { label: 'Realistic Instagram Reels timeline', text: '90–120 days. Reels still get the biggest non-follower reach push, but Instagram\'s follow conversion is slower than TikTok\'s.' },
          { label: 'Breakout math', text: '~1% of viewers follow on a viral post, so one 100K-view video ≈ 1,000 new followers. Most creators cross 10K because of one post that hit 20–40× their average views.' },
          { label: 'Why most creators quit early', text: 'The plateau between day 30 and day 45 is when posts stall under 1K views. Creators who keep shipping breakout-optimized scripts through that window are the ones who hit 10K.' },
          { label: 'What Blossom changes', text: 'Every script idea is scored on breakout probability across 5 dimensions before you film, so your daily output is biased toward the post that actually breaks out.' },
        ],
        feature: { label: 'Get 5 breakout-scored scripts daily — start free', to: '/signup' },
        related: ['going-viral-6', 'posting-2'],
        keywords: ['grow 10k followers', 'fast growth', '0 to 10k', 'how to grow tiktok 2026', 'instagram reels growth timeline', 'breakout video followers'],
      },
      {
        q: 'How do I increase my engagement rate on Instagram and TikTok in 2026?',
        a: 'If your engagement rate is sliding, the cause is almost always format mix and signal mix, not posting frequency. Average Instagram engagement sat around 0.48% in 2026, and the platforms rewrote distribution around four signals: sends per reach (DM shares), saves, watch time, and profile clicks. Likes and follower count now carry almost no weight. Pull these four levers in order: (1) Rebalance to roughly 60–70% Reels and 20–30% carousels — carousels still earn about 12% more engagement than Reels, while Reels get 36% more reach. (2) Earn the first three seconds — half of viewers drop off before then, and Reels that hold above a 60% three-second rate outperform weak hooks by 5–10× in reach. (3) Engineer one share-worthy moment per post — a Sends-per-Reach above 3.5% is the threshold for non-follower distribution. (4) Reply to every comment inside the first 60 minutes to extend the post\'s active window. Before you publish, audit drafts against these levers. Blossom scores any draft on share probability and breaks the score across five dimensions, so you fix the weak lever before the algorithm punishes it.',
        details: [
          { label: 'Mix shift', text: 'Target 4 Reels + 2 carousels + 1 single image per week. Carousels still lead engagement at roughly 0.52% while Reels lead reach.' },
          { label: 'Three-second hook', text: 'Half of Reel viewers leave before second three. A 60%+ three-second hold rate is the line between a flat post and a 5–10× reach lift.' },
          { label: 'Engineer the share', text: 'DM shares are weighted 3–5× higher than likes — one share is worth roughly 15 likes in distribution. Build one moment per post a viewer would send to a specific friend.' },
          { label: 'Save trigger', text: 'Saves now triple the weight of likes. Carousels with a numbered list, script template, or checklist outperform aesthetic-only carousels.' },
          { label: 'First-60-minute reply rate', text: 'Reply to 100% of comments inside the first hour. The algorithm reads it as engagement extension and keeps your post in feeds longer.' },
          { label: 'Rewatch cue', text: 'End every Reel with a verbal pointer back to the opening frame ("watch it again — the answer\'s in the background"). Doubled loop rate doubles distribution.' },
        ],
        feature: { label: 'Score a draft on share probability — free', to: '/signup' },
        related: ['captions-0', 'formats-3'],
        keywords: ['increase engagement', 'higher engagement', 'how to increase engagement rate', 'boost instagram engagement', 'increase reels engagement 2026', 'sends per reach', 'share probability score'],
      },
      {
        q: 'Why aren\'t my followers seeing my Instagram posts in 2026?',
        a: 'Instagram\'s 2026 algorithm shows the average post to only 3–7% of your followers, not the ~25% creators remember from a few years ago. Socialinsider clocks median feed reach at roughly 3–4%, and accounts under 100K average 6.8% (down from 12% in 2023). The shrinkage compounds when your engagement rate sits below your niche median — median brand engagement collapsed from 2.94% in Jan 2024 to 0.61% in Jan 2026, and the system progressively narrows distribution to a smaller test pool every post you under-perform on. Mosseri has confirmed shares (DM sends) and saves are now the top-3 ranking signals, while likes are effectively a vanity metric. Recovery playbook: post 2–3 pieces back-to-back engineered to drive sends — a controversial take, a save-worthy micro-tutorial, and an identity statement your audience will DM to a friend. Blossom\'s share-probability score grades every draft against the format/hook patterns currently triggering reach expansion, so you ship the share-bait before you post, not after the impressions die.',
        details: [
          { label: 'Default reach in 2026', text: '3–7% of followers per post; accounts under 100K average 6.8% (Socialinsider).' },
          { label: 'Why it shrinks', text: 'Median engagement fell 79% in 24 months (2.94% to 0.61%); below-median posts trigger a smaller initial test audience next time.' },
          { label: 'Top ranking signals', text: 'DM sends and saves now outweigh likes and comments per Mosseri\'s 2025 confirmations.' },
          { label: 'First 20 minutes', text: 'Sends, saves, watch time, and profile clicks in the opening window decide whether your post escapes the follower bubble.' },
          { label: 'Recovery moves', text: 'Two to three back-to-back posts built for shares: controversial take, micro-tutorial, identity statement.' },
        ],
        feature: { label: 'Score your next post\'s share probability', to: '/signup' },
        related: ['algorithm-1', 'low-views-5'],
        keywords: ['followers not seeing', 'reach dropping', 'followers not seeing posts instagram', 'instagram organic reach 2026', 'instagram reach declining', 'instagram algorithm 2026 shares'],
      },
      {
        q: 'Is it ever worth it to buy followers in 2026?',
        a: 'No. The math has flipped permanently against buying followers. Meta\'s May 2026 "Great Purge" wiped millions of bot, spam, and inactive accounts in a single six-hour overnight sweep — Kylie Jenner lost ~14M, Ariana Grande ~7M, and accounts built on cheap bulk services dropped 30–60% of their entire base. Both Instagram and TikTok now run AI-driven sweeps that target accounts linked to third-party growth services and click farms, and they happen without warning. Beyond the purges, bought followers don\'t engage, so your engagement rate sinks below the 2026 niche median (~0.43% overall, ~3.86% for micro). Instagram\'s algorithm reads that as low-quality content and throttles distribution to your real followers — you pay to shrink your own reach. On the brand side, 81% of marketers encountered influencer fraud in 2026 and HypeAuditor-class tools detect bot followers on Instagram with 90%+ accuracy. Sponsors now audit before they sign, and 19.2% of influencer spend is already written off as fraud waste — meaning anyone with a suspicious follower curve gets ghosted, not negotiated with. Blossom\'s audience-quality score runs the same audit your would-be sponsors run, on you and on every competitor in your niche.',
        details: [
          { label: 'Quarterly purges are now permanent', text: 'Meta removed 10.9M+ scam-center-linked accounts in 2025 alone, then executed the May 6–7, 2026 overnight sweep. Bought followers are a liability with a known expiration date.' },
          { label: 'Algorithm penalty compounds', text: 'Bots don\'t like, save, or rewatch. Low ER signals "low quality" to the ranking model, which then shows your posts to fewer real followers — a self-reinforcing loop.' },
          { label: 'Brand audits catch you', text: '37.2% of influencer followers show fake/inauthentic signals across a 100K-account sample. Brands run a 30-second HypeAuditor check before any deal — a clean 5K beats a fake 50K.' },
          { label: 'Detection is asymmetric', text: 'Audit tools hit ~90% accuracy on Instagram and 70–75% on TikTok. Even "high quality" bot services from 2023 are now legible to ML detectors.' },
          { label: 'The honest play scales', text: 'Nano and micro accounts post 3.86–5%+ ER in 2026 — higher than mega creators. Real 2K followers in a tight niche out-earn fake 100K every time.' },
        ],
        feature: { label: 'Audit your account and your competitors', to: '/signup' },
        related: ['engagement-0', 'monetization-5'],
        keywords: ['buy followers', 'fake followers', 'buy followers 2026', 'bot follower purge', 'audience quality score', 'influencer fraud detection'],
      },
      {
        q: 'How do I convert viewers into actual followers in 2026?',
        a: 'Follower conversion from a viral video sits at roughly 0.5–2% on TikTok and 0.3–1.5% on Reels in 2026, with a single Reel topping out around 2,000–3,000 new followers and TikTok hitting 5,000+ on strong days. To push toward the high end, three things have to land in sequence. First, prove identity or value in the opening 3–5 seconds, because videos anchored to viewer identity see 50–80% higher engagement and pull better-fit followers. Second, give a reason to expect more of the same, so a stranger can predict what they\'ll get if they follow. Third, fire a profile-visit trigger before the loop ends, like "follow for part 2" or a niche-specific promise, since vague "follow for more" CTAs have been declining in effectiveness. Then the profile has to finish the job: a bio that names exactly who you serve in one specific line ("Daily videos for first-gen investors" beats "sharing my journey"), and a pinned top row of your three most follow-worthy Reels, which lifts follower conversion 15–25% versus an unpinned grid.',
        details: [
          { label: 'Identity hook in 5 seconds', text: 'Open by naming who the video is for or what value they get. Identity-anchored hooks pull 50–80% higher engagement than generic curiosity opens.' },
          { label: 'Specific bio, not vibes', text: 'One sentence: who you serve + what they get. "Short cooking tutorials for people who hate cooking" converts; "live laugh love" does not.' },
          { label: 'Pin a 3-post top row', text: 'Pin the three posts that best preview what following you delivers, not your newest or favorites. Curated pins lift follower conversion 15–25%.' },
          { label: 'Part-2 CTA beats "follow for more"', text: 'Specific verbal hooks like "follow for part 2" or "follow for daily [niche] tactics" self-select your ideal viewer and outperform vague CTAs.' },
          { label: 'Profile-visit trigger', text: 'End with a visual or verbal cue that sends viewers to the profile (a tease, a "full list in bio", a multi-part promise) rather than asking for the follow directly.' },
        ],
        feature: { label: 'Get 5 daily filmable scripts with profile-CTA templates', to: '/signup' },
        related: ['hooks-1', 'formats-0'],
        keywords: ['follower conversion', 'turn views into followers', 'follower conversion 2026', 'instagram bio convert', 'profile visit to follow rate', 'viral video to followers'],
      },
      {
        q: 'Which social media metrics should I ignore (and which actually predict growth in 2026)?',
        a: 'Three vanity metrics now mislead more than they inform: raw like count, raw view count, and follower count in isolation. Likes are still tracked but carry almost no algorithmic weight on Instagram or TikTok in 2026, raw views inflate when a clip lands on one large For You feed without driving any downstream action, and follower count is less predictive than ever because both platforms push content far beyond followers and AI-generated engagement plus coordinated pods make surface numbers easy to fake. The four signals that actually correlate with sustained growth are share rate (a strong benchmark is 2%+ of views), save rate, video completion percentage (TikTok\'s virality bar moved from ~50% in 2024 to ~70% in 2026), and follower conversion per 1,000 views. Instagram\'s 2026 ranking weights DM shares, saves, watch time, and profile clicks above likes; TikTok ranks completion rate and shares above everything else. Blossom tracks share rate, save rate, completion %, and follower conversion per 1,000 views on every video you analyze, so you stop optimizing for screenshots and start optimizing for what the algorithms actually reward.',
        details: [
          { label: 'Ignore: raw likes', text: 'Instagram and TikTok both confirm likes no longer carry meaningful ranking weight in 2026.' },
          { label: 'Ignore: raw views', text: 'A view can be a 0.5-second scroll. Without completion % attached, view count says nothing about quality.' },
          { label: 'Ignore: follower count alone', text: 'Platforms now distribute mostly to non-followers, and AI bots plus engagement pods inflate counts cheaply.' },
          { label: 'Track: share rate', text: 'DM and story shares are Instagram\'s top distribution signal. Aim for 2%+ of views.' },
          { label: 'Track: completion %', text: 'TikTok\'s viral threshold is now roughly 70% average completion, up from ~50% two years ago.' },
          { label: 'Track: follower conversion per 1K views', text: 'The only metric that ties reach to audience growth. A viral video with 0.1% conversion is a dead end.' },
        ],
        feature: { label: 'Track the metrics that actually grow accounts', to: '/signup' },
        related: ['engagement-2', 'features-4'],
        keywords: ['vanity metrics', 'metrics to ignore', 'important metrics', 'real growth metrics 2026', 'share rate vs likes', 'TikTok completion rate', 'follower conversion per 1000 views'],
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
        q: 'What types of content go viral most often on TikTok and Instagram Reels in 2026?',
        a: 'Five formats dominate viral short-form video in 2026: POV scenarios with a hard cut to payoff, micro-listicles ("3 things…" or "How to X in 60 seconds"), contrarian talking-head takes, before/after transformations with on-screen labels, and reactive duets/stitches with a personal twist. Two newer structures crossed the million-view line this year — the two-person walk lip-sync (sparked by JENNIE\'s "Dracula" remix, 300K+ Reels) and the "Top 5" list-flick set to nostalgic audio. But here is the part most guides skip: format is the wrapper, not the engine. Creators who copy a structure they saw on the For You page usually flop because they inherit the shape without the hook strength, niche fit, or pacing the original had. A POV that crushes for a finance creator ("POV: your bank account after one good month") will die for a fitness coach unless the payoff is rebuilt for that audience. The 2026 winners model what works in their niche, then rebuild it from scratch. Blossom indexes 1,200+ recurring viral formats with example videos, average view counts, niche fit, and a step-by-step recipe you can film today.',
        details: [
          { label: 'POV with a hard cut', text: 'Relatable setup, sharp cut, satisfying reaction. Works when the payoff lands in under 2 seconds.' },
          { label: 'Micro-listicle', text: '"3 things…" or "How to X in 60s" with an on-screen counter. Bite-sized, screenshot-able, search-friendly.' },
          { label: 'Contrarian talking head', text: 'Face-to-camera, bold claim in the first 3 seconds, evidence, payoff. Lives or dies on the hook line.' },
          { label: 'Before/after transformation', text: 'Clear labels, visible change, satisfying reveal. Strong across fitness, design, beauty, and home niches.' },
          { label: 'Reactive duet or stitch', text: 'Respond to trending content with your own framing. Borrows reach from the original while adding your voice.' },
          { label: 'Two-person walk and Top 5 list', text: 'New 2026 entries — lip-sync walk trends and audio-driven list flicks that travel across niches with minor tweaks.' },
        ],
        feature: { label: 'Browse the Formats library', to: '/signup' },
        related: ['formats-1', 'features-1'],
        keywords: ['viral formats', 'content formats', 'video types', 'viral content formats 2026', 'tiktok video types viral', 'instagram reels formats that work', 'short form video formats'],
      },
      {
        q: 'Should I niche down on Instagram and TikTok in 2026, or post about everything?',
        a: 'Niche down, hard. In 2026 the algorithm classifies your account by the topics it consistently detects across your recent posts, then serves you to people who engage with that topic. When you mix unrelated niches, the classifier weakens, your content gets shown to a less-relevant audience, and reach drops sharply — creators consistently report this as the single biggest cause of stalled growth. The fix is not posting about one boring thing forever. It\'s one niche per account with sub-topic variation inside it. A fitness account can run training tips, mobility, nutrition, gym fails, and athlete interviews — same classification, infinite content angles. What kills you is jumping from fitness to travel vlogs to crypto on the same handle. If you genuinely have two passions, run two accounts. The cross-niche penalty is real and compounds fast: once the algorithm loses confidence in what you\'re about, recovery takes weeks of focused posting. Sub-niching beats broad every time because it makes the classifier\'s job easy and your audience\'s decision to follow obvious. Pick the niche, mine it deep, then expand sub-topics — that\'s the 2026 playbook.',
        details: [
          { label: 'One niche, many sub-topics', text: 'Fitness alone splits into training, mobility, nutrition, recovery, mindset, athlete profiles, gear reviews — that\'s months of content without ever drifting.' },
          { label: 'The boredom fix', text: 'Variety lives inside the niche, not across niches. Change format, hook angle, and sub-topic — not the topic itself.' },
          { label: 'Two passions, two accounts', text: 'If you can\'t combine them under one clear theme, split them. One handle per classification beats one diluted handle every time.' },
          { label: 'Recovery is slow', text: 'Once the algorithm misclassifies your account, it takes weeks of focused, on-topic posting to rebuild confidence — much easier to stay consistent from day one.' },
          { label: 'Know when you\'re drifting', text: 'Blossom tags every video you analyze by niche, so you can see at a glance whether your content stays inside your lane or starts pulling in mixed signals.' },
        ],
        feature: { label: 'Check your niche consistency on Blossom', to: '/signup' },
        related: ['algorithm-5', 'formats-2'],
        keywords: ['niche down', 'choose niche', 'multiple niches', 'niche vs broad tiktok', 'cross-niche penalty 2026', 'should I niche down instagram tiktok', 'sub-niche content strategy'],
      },
      {
        q: 'What\'s the best content niche to start on TikTok or Instagram in 2026?',
        a: 'There is no universal "best niche" — the right one sits where your existing knowledge overlaps a category with rising audience velocity in your country. Picking a trending niche you know nothing about is the #1 reason creators burn out at 30 videos. Use data, not vibes. The fastest-growing niches heading into 2026 (by audience growth and engagement) are practical AI tools and workflows, longevity and healthspan, personal finance for Gen Z, micro-fitness or "snack-sized" workouts, budget home cooking, sustainability and going-analogue content, and parenting in the screen era. Platform context matters: TikTok engagement sits at 3.70% (up 49% YoY) while Instagram averages 0.48%, so TikTok still rewards new entrants faster, especially in sub-30-second formats with 72% completion. Emerging niches typically have an 18–36 month window before saturation, and early movers in those windows grow roughly 340% faster than creators entering plateaued categories. Stop polling Reddit threads and watch the data — Blossom\'s Trend dashboard indexes 60+ niches and surfaces which ones are rising in your specific geography this week.',
        details: [
          { label: 'Practical AI tools & workflows', text: 'Novelty AI art is over. Non-technical "use this tool to do X" content is the fastest-growing educational sub-niche on TikTok and Reels in 2026.' },
          { label: 'Longevity & healthspan', text: '60% of Americans cite longevity as their top wellness motivator. Sleep, mobility, metabolic health, and supplements are moving from biohacker fringe to mainstream feed.' },
          { label: 'Gen Z personal finance', text: 'Finance commands $12–$22 CPM. Creators simplifying budgeting, investing, and "making money online" for under-30s are scaling to millions of followers.' },
          { label: 'Micro-fitness (5-min workouts)', text: 'Snack-sized movement, resistance bands, and desk-friendly routines outperform 45-minute gym content with time-starved audiences.' },
          { label: 'Budget home cooking', text: '$20-grocery-haul and pantry-stretch recipes are surging as cost-of-living pressure stays high — high save and share rates.' },
          { label: 'Analogue & screen-detox living', text: 'Going-analogue, eco-minimalism, and hand-crafted hobbies are 2026\'s counter-trend to AI fatigue, with strong watch-time on long-form Reels.' },
          { label: 'Parenting in the screen era', text: 'Tactics for managing kids\' phone use, attention, and AI exposure is one of the fastest-growing parenting sub-niches.' },
        ],
        feature: { label: 'See rising niches in your country on the Trend dashboard', to: '/signup' },
        related: ['features-5', 'trends-0'],
        keywords: ['best niche', 'what niche', 'starting niche', 'best niche tiktok 2026', 'trending niches instagram 2026', 'rising content categories 2026'],
      },
      {
        q: 'Do Instagram carousels still work in 2026 (and how many slides should I use)?',
        a: 'Yes — definitively. Carousels are quietly winning 2026: they hold the highest engagement rate of any feed format at roughly 0.52% (vs. 0.50% for Reels and 0.45% for static images), and on a per-impression basis they generate about 2× the saves of Reels. They\'re also the only post type Instagram re-serves to followers who didn\'t swipe the first time, typically 24–48 hours after posting — a free second shot at engagement that Reels and single images don\'t get. The 2026 sweet spot is 8–10 slides: engagement dips after slide 3 and climbs again past slide 8, so structure as Hook (slide 1 carries ~80% of the weight, must be readable in 2 seconds) → 2–3 context/value slides → 4–6 payoff slides → CTA slide. A closing CTA slide alone lifts engagement 20–30%. Blossom analyzes carousels with the same 5-dimension scoring as Reels: hook strength, slide-to-slide retention, payoff, save-trigger, and CTA. Paste any Instagram carousel URL and we\'ll grade each slide, flag the drop-off point, and suggest re-orderings based on what\'s actually saving in your niche.',
        details: [
          { label: 'Save rate', text: 'Carousels generate ~2× the saves per impression of Reels, the strongest signal for IG\'s 2026 ranking model.' },
          { label: 'Algorithmic re-serve', text: 'Instagram re-shows carousels 24–48 hours later to followers who didn\'t swipe through — a second chance no other format gets.' },
          { label: 'Slide count', text: '8–10 slides is the proven sweet spot; engagement drops after slide 3, recovers at slide 8+, falls again past 13.' },
          { label: 'Hook weight', text: 'Slide 1 drives ~80% of swipe-through. Use high contrast, bold text, readable in under 2 seconds.' },
          { label: 'CTA lift', text: 'A dedicated closing CTA slide increases engagement 20–30% vs. carousels that end on a value slide.' },
          { label: 'Format spec', text: '4:5 portrait (1080×1350) — keep every slide on the same aspect ratio; mixing ratios kills swipe-through.' },
        ],
        feature: { label: 'Score your carousel free', to: '/signup' },
        related: ['engagement-2', 'formats-4'],
        keywords: ['carousels', 'carousel posts', 'instagram carousel', 'do carousels work instagram 2026', 'carousel save rate', 'instagram carousel slides', 'carousel vs reels 2026'],
      },
      {
        q: 'Should I post Reels or feed posts more often on Instagram in 2026?',
        a: 'Post both, but weight your mix toward Reels for reach and feed posts for retention. Reels reach roughly 5–8× the audience of a single image or carousel because Instagram pushes them to non-followers through the Reels tab and Explore, while feed posts (especially carousels) hold attention longer from followers who already know you. The 2026 sweet spot for most creators and brands is 4 Reels + 2 carousels + 1 single image per week — Reels drive discovery, carousels drive saves and shares, and the single image anchors your grid aesthetic. Abandoning the feed entirely is one of the most common mistakes: feed-only followers convert better to email lists, DMs, and paid offers than Reels viewers. Run Reels on Tuesday, Wednesday, Thursday, and Saturday when watch-through tends to peak, and slot carousels on Monday and Friday for working-hour scrolls. Blossom\'s content mix audit grades your last 30 days against this 4/2/1 distribution.',
        details: [
          { label: 'Weekly target', text: '4 Reels + 2 carousels + 1 single image — adjust by ±1 based on which format your audience saves most.' },
          { label: 'Reach multiplier', text: 'Reels reach roughly 5–8× a feed post because they\'re served to non-followers; feed posts mostly reach existing followers.' },
          { label: 'Why keep the feed', text: 'Carousels lead in saves and shares per impression, and feed-only followers convert better to email, DMs, and paid offers.' },
          { label: 'Posting cadence', text: 'Reels Tue/Wed/Thu/Sat, carousels Mon/Fri, single image Sun — keeps the grid varied without daily Reels burnout.' },
          { label: 'Common mistake', text: 'Going Reels-only kills your save rate and weakens follower loyalty within 60–90 days.' },
        ],
        feature: { label: 'Audit your content mix free', to: '/signup' },
        related: ['engagement-2', 'formats-3'],
        keywords: ['reels vs feed', 'content mix', 'reels vs feed posts', 'instagram content mix 2026', 'balanced posting instagram'],
      },
      {
        q: 'Does faceless content actually work in 2026?',
        a: 'Yes — the data is decisive. Faceless accounts now make up 38% of all new creator monetization ventures (up from 12% in 2022), and over 30% of viral videos across TikTok, Instagram, and YouTube come from accounts that never show a creator. On Instagram alone, #facelessmarketing has crossed 650,000 posts, and 72% of Gen Z viewers say they care more about content quality than seeing a face. The faceless categories that consistently top charts in 2026 are explainer animation, ASMR and satisfying loops, screen-recording tutorials, voiceover storytelling, personal finance ($10–15 RPM), and AI-generated visuals with original audio. The real tradeoff isn\'t reach — it\'s conversion. Faceless accounts attract topic-focused viewers rather than personality-focused fans, so they typically need 2–3× the views to hit the same follower count as a face-on-camera creator. The fix is structural: research from Feb 2025 found that brief face presence in the opening seconds (a hand, a B-roll cameo, even a logo) acts as a trust bootstrap and lifts conversion without compromising the faceless format. Blossom indexes 60+ niches, and the majority of categories we track — including ASMR, finance, AI visuals, and explainer — are dominated by faceless top performers, so you can study what\'s working in your exact format before you shoot.',
        details: [
          { label: 'Market share', text: 'Faceless = 38% of new monetized creators in 2026, vs 12% in 2022 (a 217% jump).' },
          { label: 'Viral share', text: '30%+ of all viral short-form videos across TikTok, IG, and YouTube are faceless.' },
          { label: 'Audience signal', text: '72% of Gen Z prioritize content quality over seeing the creator; 86% rate faceless as more authentic.' },
          { label: 'Conversion gap', text: 'Faceless accounts need 2–3× the views per follower — fix with a 1–2 second trust bootstrap at the hook.' },
          { label: 'Top-paying niches', text: 'Personal finance ($10–15 RPM), education ($9–14), true crime ($8–13), animated storytelling ($9–13).' },
          { label: 'Highest retention', text: 'ASMR and miniature/object loops hold viewers 20–60 minutes per session — rare in short-form.' },
        ],
        feature: { label: 'Find your faceless format on Blossom', to: '/signup' },
        related: ['formats-0', 'production-4'],
        keywords: ['faceless content', 'no face', 'faceless creator', 'faceless content 2026', 'no face tiktok instagram', 'faceless niches'],
      },
      {
        q: 'How do I plan a content calendar that actually grows my Instagram or TikTok?',
        a: 'Skip the color-coded 30-day grid — it\'s the fastest path to burnout. Harvard found 62% of digital creators report high or extreme burnout, and creators on strict day-by-day calendars post less consistently long-term than those who batch. Use the 70/20/10 rule (originally Google\'s innovation budget, now the dominant social framework in 2026): 70% bread-and-butter format you know converts, 20% tactical experiments testing one variable at a time (new hook, new audio, new edit), 10% pure swings on trends or formats outside your lane. Track the three buckets in separate columns so winning experiments graduate into the 70%, and losing swings die fast instead of polluting your baseline. Batch-film once a week — one session covering 4–7 posts beats daily scrambling and protects the 78% of successful creators who run documented strategies (they grow 3.2× faster than ad-hoc posters). The friction isn\'t the calendar template; it\'s deciding what to film. Blossom\'s Suggestions feed orders your next five actions by predicted lift and drops five filmable scripts every morning, so the 70/20/10 mix gets filled in for you instead of staring at an empty Notion doc on Sunday night.',
        details: [
          { label: '70% — Proven format', text: 'Your highest-retention hook + format combo from the last 90 days. Repeat the structure, swap the topic. This is the floor that keeps the algorithm fed while experiments cook.' },
          { label: '20% — Single-variable tests', text: 'Change one thing per post — hook style, opening shot, audio, CTA placement. Anything that wins for 3+ posts gets promoted into the 70%.' },
          { label: '10% — Swings', text: 'Trending audio, format jumps, collabs, formats you\'d normally skip. Most will flop. One will reset your ceiling.' },
          { label: 'Batch, don\'t drip', text: 'Film a week in one 2-hour session. Daily filming is the #1 predictor of creators quitting within 18 months.' },
          { label: 'Track buckets separately', text: 'Don\'t average a viral swing into your 70% baseline — it hides what\'s actually working day-to-day.' },
        ],
        feature: { label: 'Get 5 filmable scripts every morning', to: '/signup' },
        related: ['features-6', 'posting-2'],
        keywords: ['content calendar', 'content plan', 'schedule', '70/20/10 content rule', 'batch filming workflow', 'content planning 2026'],
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
        q: 'What is the ideal Instagram caption length in 2026, and how long should TikTok captions be?',
        a: 'Captions live in a bimodal sweet spot. Aim for either 8 to 15 words (the fast hook) or 70 to 120 words (the context caption). The middle stretch, 16 to 69 words, consistently underperforms because it is too long to read in a swipe and too short to deliver a payoff. Choose by niche, not by mood. Entertainment, fashion, and beauty Reels carry the visual, so a single punchy line wins. Education, finance, B2B, and personal storytelling earn the longer cut because viewers will read for value. On TikTok, lean shorter inside the 8 to 15 word window since the caption competes with on-screen text and a stickier comment culture. On Reels, the longer window pulls more saves and shares when the first line states the payoff before the "more" fold. The hardest part is not the length but the blank page. If you stare at the caption box every upload, study captions from videos that actually went viral in your niche, then write yours against that pattern. Blossom analyzes any public IG or TikTok video in under two minutes, scores caption length, comment-bait quality, and keyword placement, and ships five filmable scripts a day with captions already written for your niche.',
        details: [
          { label: '8 to 15 words', text: 'Pair with a strong visual hook. One line, no line breaks, ends on a curiosity beat or a clean punchline.' },
          { label: '70 to 120 words', text: 'Open with the payoff in line one so the "more" cut lands on tension. Add context, a specific example, and a soft comment prompt.' },
          { label: 'Avoid 16 to 69 words', text: 'Too long to scan, too short to teach. Either tighten to a single line or expand past 70 with real substance.' },
          { label: 'Entertainment, fashion, beauty', text: 'Stay in the short window. The visual is doing the work, the caption is the mic drop.' },
          { label: 'Education, finance, B2B', text: 'Use the long window. Readers want the takeaway, the proof, and a reason to save.' },
        ],
        feature: { label: 'Generate captions that fit the window', to: '/signup' },
        related: ['hooks-1', 'engagement-2'],
        keywords: ['caption length', 'caption words', 'how long caption', 'ideal caption length instagram 2026', 'tiktok caption length', 'best caption length for engagement', 'long vs short instagram captions'],
      },
      {
        q: 'How many hashtags should you use on Instagram and TikTok in 2026?',
        a: 'Use 3–5 hashtags on Instagram and 3–5 on TikTok. On December 18, 2025, Instagram capped hashtags at five per post or Reel — splitting them between caption and comments does not unlock more slots. TikTok still allows more, but creator data and TikTok\'s own algorithm guidance point to the same 3–5 sweet spot; piling on tags dilutes relevance and signals low-intent content. Adam Mosseri has stated on the record that hashtags do not increase reach on Instagram — they categorize content and feed search, nothing more. The old advice to stuff 30 tags is now actively harmful: it can flag your post as spam, and a single banned or restricted hashtag (Instagram quietly restricts a rotating list including everyday words like #alone and #pushups) can suppress the entire post. The rule for 2026: 3–5 niche-specific hashtags under 1M posts, layered with one mid-tier and one broad tag for context. Avoid #fyp, #foryou, #viral, #explore — they classify nothing. Blossom analyzes the full caption and hashtag set of any viral Instagram or TikTok video as part of its 5-dimension scoring, so you can see which tag mix is actually correlated with reach in your niche before you post.',
        details: [
          { label: 'Instagram', text: 'Hard cap of 5 hashtags per post or Reel as of December 18, 2025. Aim for 3–5 niche-specific tags placed in the caption.' },
          { label: 'TikTok', text: '3–5 hashtags is the data-backed sweet spot. Layer 1–2 niche, 1–2 mid-tier, and 1 broad tag — total under 6.' },
          { label: 'The 30-hashtag myth', text: 'Mosseri has confirmed hashtags don\'t boost reach. Stuffing tags now reads as a spam signal and can suppress distribution.' },
          { label: 'Niche over broad', text: 'Pick hashtags under 1M posts that describe your exact subject. Skip #fyp, #foryou, #viral, #explore — they add zero classification value.' },
          { label: 'Banned tags risk', text: 'Instagram restricts a rotating list of 115,000+ hashtags, including innocuous ones. One bad tag can drop a post\'s engagement 80–95%.' },
          { label: 'What actually drives reach', text: 'Watch time, shares, and saves outweigh tags. Treat hashtags as a labeling system, not a growth lever.' },
        ],
        feature: { label: 'Analyze a viral video\'s caption and hashtag mix', to: '/signup' },
        related: ['captions-2', 'algorithm-5'],
        keywords: ['hashtags 2026', 'how many hashtags', 'how many hashtags instagram 2026', 'tiktok hashtag count 2026', 'instagram 5 hashtag limit', 'banned instagram hashtags 2026'],
      },
      {
        q: 'Do hashtags still work in 2026 on Instagram Reels and TikTok?',
        a: 'Yes, but only as a classification signal — not as a discovery channel. In December 2025, Instagram capped Reels and posts at five hashtags after Adam Mosseri publicly stated that hashtags "don\'t improve visibility" and exist mainly to "let people know what a post is about." Internal tests showed that more than five tags signal low-intent content, which suppresses reach. Hashtag-driven traffic now contributes roughly 10–20% of total Reels reach, and posts without hashtags have measured 23% higher reach than hashtag-heavy posts. Keyword-rich captions generated about 30% more reach and 2× more likes than tag-stuffed posts in 2026 — captions are now indexed as a primary search signal. On TikTok, ByteDance\'s own CapCut docs recommend 3–5 hashtags so the algorithm doesn\'t get mixed signals, and targeted caption keywords boost visibility 20–40%. The takeaway: write 3–5 specific tags that tell the algorithm which "side" of the feed you belong on, then put your effort into a search-optimized caption. Blossom scores both your caption and your hashtag mix as part of its 5-dimension viral analysis.',
        details: [
          { label: '5-tag hard limit', text: 'Instagram enforces a 5-hashtag cap on Reels and posts as of December 2025. Going over signals low-intent content to the algorithm and reduces distribution.' },
          { label: 'Mosseri on the record', text: 'Instagram\'s head said in 2026 that hashtags are "not a way to get more reach" — they help search and categorization, not feed distribution.' },
          { label: 'Captions beat tags', text: 'Keyword-rich captions produced ~30% more reach and 2× more likes vs. hashtag-heavy posts. Instagram and TikTok now index captions, on-screen text, and audio as primary search signals.' },
          { label: 'TikTok 3–5 rule', text: 'ByteDance\'s CapCut guidance is 3–5 specific hashtags. More than that confuses topic classification; relevant tags can lift engagement up to 30%.' },
          { label: 'Use tags to pick your audience', text: 'Choose niche, format, and topic tags (10K–500K post range) to tell the algorithm which community you serve — not generic #fyp or #viral spam.' },
        ],
        feature: { label: 'Score your caption + hashtags with Blossom', to: '/signup' },
        related: ['captions-1', 'captions-3'],
        keywords: ['do hashtags work', 'hashtag effectiveness', 'do hashtags work 2026', 'instagram 5 hashtag limit', 'tiktok hashtag strategy 2026', 'mosseri hashtags reach'],
      },
      {
        q: 'What is TikTok SEO and Instagram SEO in 2026, and how do I rank for in-app search?',
        a: 'TikTok and Instagram now operate full keyword-based search engines layered on top of their recommendation feeds. Roughly 40% of Gen Z users skip Google entirely and search TikTok first for product reviews, recipes, restaurants, and how-to content, making in-app search a discovery channel that rivals the For You page. Instagram followed suit in 2024–2025 by upgrading its search ranking signals and surfacing Reels in keyword results. The mechanic is the same on both platforms: the algorithm reads three signals to decide what your video is about and which queries it should rank for. First, the caption, where the opening 80 characters carry the most search weight. Second, the on-screen text, which both platforms\' image models can parse frame by frame. Third, the spoken transcript, which is auto-generated and indexed within minutes of upload. Videos that place the same primary keyword in all three locations consistently outrank videos that bury the keyword in hashtags alone. The mistake most creators still make in 2026 is treating captions as an afterthought and ignoring on-screen text entirely, leaving the algorithm to guess the topic from visuals. Blossom\'s 5-dimension scoring includes a keyword placement audit that flags missing placements across caption, on-screen text, and transcript, and the Trends dashboard surfaces which search queries are actually winning in your niche right now.',
        details: [
          { label: 'Caption', text: 'The first 80 characters carry the most search weight — front-load your primary keyword.' },
          { label: 'On-screen text', text: 'Both TikTok and Instagram\'s image models read overlay text frame by frame, so a keyword on screen reinforces ranking.' },
          { label: 'Spoken transcript', text: 'Auto-generated captions are indexed for search within minutes of upload — say your keyword out loud.' },
          { label: 'One primary keyword per video', text: 'Pick a single search phrase and place it in all three locations rather than chasing five loosely related terms.' },
          { label: 'Search beats hashtags', text: 'With 40% of Gen Z using TikTok as a search engine, ranking for a query now drives more views than trending hashtags.' },
        ],
        feature: { label: 'Audit your keyword placement free', to: '/signup' },
        related: ['captions-1', 'captions-2'],
        keywords: ['tiktok seo', 'instagram seo', 'keywords', 'tiktok seo 2026', 'instagram seo creators', 'social search', 'gen z search behavior'],
      },
      {
        q: 'Should I put keywords in my Instagram and TikTok captions?',
        a: 'Yes — and the first line decides whether your caption helps or wastes ranking weight. Both platforms tokenize captions for in-app search, and the opening 80 characters carry the heaviest weight because that\'s what appears before the "more" truncation on feed and Reels. Lead with the keyword phrase you want to rank for, then add context. Compare "Best TikTok hooks for finance creators (5 examples)" against "Hey guys, today I want to share something cool." The first version signals topic, intent, and audience inside the visible preview; the second burns the most valuable real estate on filler. Treat the caption like a search snippet: primary keyword in the first 5–7 words, secondary phrase before character 80, and 3–5 niche hashtags appended at the end (not stuffed mid-sentence). Avoid keyword repetition — TikTok\'s search index downranks captions that read as stuffed, and Instagram\'s 2024 search update favors natural phrasing over hashtag walls. Blossom\'s caption audit scans every video you analyze, flags weak openers, checks whether your target keyword lands in the first 80 characters, and benchmarks your captions against the top-ranked videos in your niche.',
        details: [
          { label: 'First 80 characters rule', text: 'Instagram and TikTok truncate captions around 80–125 characters in-feed; keywords placed after the "more" cutoff get indexed but lose click-weight.' },
          { label: 'Front-load the primary keyword', text: 'Put the exact phrase you want to rank for in the first 5–7 words. "Best TikTok hooks for finance" beats "Today I\'m going to show you the best TikTok hooks."' },
          { label: 'Avoid stuffing and greetings', text: 'Skip "Hey guys," "So today," and repeated keyword variations. TikTok\'s 2024 search update penalizes unnatural phrasing; Instagram favors descriptive captions over hashtag chains.' },
          { label: 'Hashtags at the end, niche over broad', text: 'Append 3–5 specific hashtags (#tiktokhookideas) after the caption body. Generic tags like #fyp add no ranking signal and crowd out keyword tokens.' },
        ],
        feature: { label: 'Audit your caption keywords with Blossom', to: '/signup' },
        related: ['captions-3', 'hooks-1'],
        keywords: ['keywords caption', 'caption seo', 'caption keywords instagram tiktok', 'caption seo first line', 'first 80 characters caption'],
      },
      {
        q: 'Which hashtags should I avoid on Instagram and TikTok in 2026?',
        a: 'Three categories quietly destroy reach in 2026. First, saturated generics: #fyp, #foryou, #foryoupage, #viral, #trending, #followforfollow, and #likeforlike are all on TikTok\'s soft-restricted list — the algorithm reads them as spam signals and caps distribution. Second, the unofficial Instagram ban list, which now covers over 115,000 hashtags and is never published by Meta. It includes blandly innocent terms hijacked by spam or policy-violating posts: #adulting, #boho, #besties, #desk, #eggplant, #pushups, #alone, #brain, #single, #skateboarding, #workflow, #kansas, and #elevator have all been flagged at various points. Third, anything tied to gore, self-harm, eating disorders, adult content, or trademarked brand terms — these are permanent bans and can restrict your whole account, not just the post. The damage is real: posts using banned tags see engagement drop 80–95%, and TikTok shadowbans typically last 2–4 weeks. Because the lists change weekly and Meta won\'t publish them, manual checking is the only safeguard. Search the tag on Instagram — if you see "Recent posts are hidden" or only top posts, it\'s restricted. Better, run your full caption through a banned-hashtag audit before publishing.',
        details: [
          { label: 'Saturated generics (TikTok suppresses these)', text: '#fyp, #foryou, #foryoupage, #viral, #trending, #followforfollow, #likeforlike — soft-restricted and read as spam signals, capping distribution.' },
          { label: 'Innocent words hijacked by spam', text: '#adulting, #boho, #besties, #desk, #pushups, #single, #workflow, #elevator — flagged after bot or off-topic content overran them. Status changes weekly without notice.' },
          { label: 'Permanent policy bans', text: 'Anything tied to gore, self-harm, eating disorders, adult content, hate speech, or drug use. Using one can restrict your entire account, not just the single post.' },
          { label: 'The engagement cost', text: 'Posts containing a banned tag see 80–95% engagement drops on Instagram. On TikTok, shadowbans triggered by repeat use typically last 2–4 weeks with near-zero FYP placement.' },
          { label: 'How to verify before posting', text: 'Search the tag on Instagram — "Recent posts from #tag are currently hidden" means it\'s restricted. The full ban list exceeds 115,000 tags and Meta never publishes it.' },
        ],
        feature: { label: 'Audit your hashtags with Blossom — Sign up free', to: '/signup' },
        related: ['captions-1', 'low-views-1'],
        keywords: ['banned hashtags', 'avoid hashtags', 'fyp hashtag', 'banned hashtags 2026', 'instagram shadowban hashtags', 'tiktok banned hashtag list'],
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
        q: 'What is the ideal video length for TikTok, Reels, and Shorts in 2026?',
        a: 'The 2026 data is clear: platform algorithms reward retention curves, not arbitrary durations. TikTok\'s For You Page surfaces videos in the 21–34 second range most aggressively for cold-start reach, but creators chasing maximum watch time should target 60–90 seconds with a hard re-hook at the 15-second mark to survive the average mid-roll drop-off. Instagram Reels behaves differently: 7–15 seconds generates the highest viral coefficient because completion percentage still weights heavier than absolute watch time, while 30–60 seconds is the educational sweet spot where saves and shares spike. YouTube Shorts now ranks 45–60 second videos highest because the algorithm explicitly rewards retention-time-per-impression over completion rate, and anything under 30 seconds caps your AVD ceiling. Universal rule: every 15 seconds past the hook, you need a pattern interrupt — a cut, a zoom, a question, or a visual reset — or retention collapses past 40%. Blossom\'s pacing and retention audit analyzes your existing videos frame-by-frame, identifies the exact second viewers drop off, and flags missing re-hooks against the ideal video length 2026 benchmarks for TikTok, Reels, and Shorts.',
        details: [
          { label: 'TikTok — dual sweet spot', text: '21–34 seconds for FYP virality, 60–90 seconds for watch-time-driven distribution.' },
          { label: 'Instagram Reels', text: '7–15 seconds for viral spread, 30–60 seconds for educational saves and shares.' },
          { label: 'YouTube Shorts', text: '45–60 seconds ranks highest — algorithm rewards retention time over completion percentage.' },
          { label: 'The 15-second re-hook rule', text: 'Past the opening hook, insert a pattern interrupt every ~15 seconds or retention drops below 40%.' },
          { label: 'Floor warning', text: 'Sub-7-second clips on Reels burn impressions; sub-30-second Shorts cap your average view duration ceiling.' },
        ],
        feature: { label: 'Audit my pacing', to: '/signup' },
        related: ['hooks-2', 'production-5'],
        keywords: ['video length', 'how long video', 'duration', 'ideal video length 2026', 'tiktok reels shorts length', 'retention by duration', 're-hook rule'],
      },
      {
        q: 'What is the minimum creator gear budget that actually moves retention in 2026?',
        a: 'Honest answer: under $150 total. The audio-first stack — a $50–$80 lavalier mic, your existing phone, window light, and a $25 tripod — outperforms a $2,000 DSLR rig for short-form content. Audio is the leverage point most beginners miss: viewers will tolerate soft 1080p footage but they swipe within 2 seconds on tinny, room-echo audio. A wired lav like the Boya BY-M1 ($20) or wireless Hollyland Lark M2 ($89) cuts ambient noise and pushes voice clarity into the range that holds attention through the hook. Phones from the last 3 years shoot perfectly usable 1080p/60 — the iPhone 12 and Pixel 6 era is the floor, not the ceiling. Skip the ring light unless you film after sunset; a window between 10 AM and 2 PM is free and flatters skin tones better than most LED panels under $100. Blossom\'s 5-dimension audio scoring quantifies exactly how much your audio quality is costing you in completion rate, so you can A/B a $25 mic against a $90 one with real retention data instead of guessing.',
        details: [
          { label: 'Audio ($50–$90) — the only non-negotiable', text: 'Wired: Boya BY-M1 ($20) or Rode SmartLav+ ($79). Wireless: Hollyland Lark M2 ($89) or DJI Mic Mini ($89). Clear voice audio correlates with 15–25% higher completion rates on TikTok and Reels.' },
          { label: 'Phone ($0 — use what you have)', text: 'iPhone 12 / Pixel 6 or newer shoots 1080p/60 that\'s indistinguishable from flagship video on a 6-inch screen. Don\'t upgrade until your audio and lighting are dialed.' },
          { label: 'Light ($0–$35)', text: 'Window light, 10 AM–2 PM, facing the window. Night filming: $30 Neewer 10" ring light or $35 Lume Cube panel. Avoid overhead room lights — they cast nostril shadows.' },
          { label: 'Tripod ($20–$40)', text: 'Manfrotto PIXI ($25) for tabletop, UBeesize 51" ($30) for full-body. A wobbly $8 tripod will cost you more in reshoots than a stable $25 one ever will.' },
          { label: 'Skip these in year one', text: '4K cameras, gimbals, teleprompters, $200 softboxes, lens kits. None of them move retention. Spend that $500 on 50 hours of editing practice instead.' },
        ],
        feature: { label: 'See how your audio scores — free analysis', to: '/signup' },
        related: ['production-2', 'production-3'],
        keywords: ['gear creator', 'starter equipment', 'creator setup', 'creator gear starter 2026', 'best mic tiktok instagram', 'lavalier microphone creators'],
      },
      {
        q: 'What are the best video editing apps for short-form content in 2026?',
        a: 'The best editor in 2026 is the one that matches your workflow speed, not the one with the most features. CapCut still dominates mobile-first creation with native vertical templates, auto-captions, and direct exports to TikTok, Reels, and Shorts — ideal for creators publishing 3–7 posts per week. Descript wins for talking-head content with its text-based editing, where you edit video by deleting words in a transcript, plus AI voice cloning and studio-quality captioning. Adobe Premiere Pro remains the desktop standard for higher-production content but carries a steeper learning curve and subscription cost. AI-native tools like Opus Clip and Runway are eating the mid-market by auto-generating short clips from long videos with reframing and caption baking. Here\'s the honest take: editing tools determine output speed, not content performance. A perfectly cut video with a weak hook still flops at second three. Blossom complements any editor by analyzing what actually drives retention — hook strength, pacing density, format patterns — so you script smarter before you cut.',
        details: [
          { label: 'CapCut (mobile-first, free)', text: 'Best for high-volume creators on iOS/Android. Native 9:16 templates, auto-captions in 100+ languages, direct platform exports, AI background removal. Free tier covers 90% of short-form needs.' },
          { label: 'Descript (talking-head specialist)', text: 'Edit video by editing the transcript. Studio Sound cleans audio in one click, Overdub clones your voice to fix flubs, and AI Eye Contact corrects off-camera glances. Best for podcasters, founders, and faceless creators.' },
          { label: 'Adobe Premiere Pro (desktop, pro tier)', text: 'Industry standard for higher-effort content. Generative Extend (Firefly AI), text-based editing now matches Descript, and tight After Effects integration. $22.99/month.' },
          { label: 'Opus Clip / Submagic (AI-native)', text: 'Upload one long video, get 10 short clips with auto-reframing, captions, and hook detection. Fastest path from podcast or webinar to TikTok feed.' },
          { label: 'Why the editor isn\'t the bottleneck', text: 'Most creators blame their tools, but retention dies in the first 3 seconds — a scripting problem, not an editing one. Blossom\'s 5-dimension scoring shows which patterns viral accounts in your niche actually use.' },
        ],
        feature: { label: 'See what to script before you edit — free signup', to: '/signup' },
        related: ['production-1', 'production-3'],
        keywords: ['editing apps', 'best editor', 'capcut', 'best video editor 2026', 'capcut vs descript', 'tiktok editing apps', 'ai video editor 2026'],
      },
      {
        q: 'Should I add subtitles or captions to every video in 2026?',
        a: 'Yes, without exception. The data on muted viewing has only gotten more definitive: 69% of Instagram Reels and 58% of TikToks are now watched on mute during the first scroll, and videos with accurate on-screen captions retain viewers 32% longer through the critical 3-second hook window. Beyond retention, captions improve accessibility for the 15% of US adults with hearing difficulties and boost saves by 24% according to recent creator studies. The catch: auto-generated captions still have a 12–18% word error rate, especially with brand names, slang, and accented speech. Typos visibly tank trust and watch time. Both Instagram and TikTok now offer built-in caption editors that don\'t suppress reach, so the workflow is: auto-generate, then manually edit every caption before publishing. Burned-in captions (rendered into the video file) outperform platform-overlay captions by 8% because they survive reposts and downloads. Blossom\'s 5-dimension scoring system flags videos missing on-screen text in the visual delivery dimension, so you can audit your back catalog and identify exactly which posts are leaking retention because viewers can\'t follow along silently.',
        details: [
          { label: 'Mute is the default', text: '69% of Reels and 58% of TikToks watched silently on first view in 2026.' },
          { label: 'Edit your auto-captions', text: 'Platform tools hit 82–88% accuracy; brand names and slang need manual fixes.' },
          { label: 'Burn captions into the file', text: 'Hardcoded captions outperform overlays by 8% and survive cross-platform reposts.' },
          { label: 'Position above the action bar', text: 'Place captions in the middle-third of the frame so UI elements don\'t cover them.' },
        ],
        feature: { label: 'Audit your videos for missing on-screen text', to: '/signup' },
        related: ['hooks-3', 'production-2'],
        keywords: ['subtitles', 'captions on video', 'on-screen text', 'captions reels tiktok 2026', 'muted video viewing statistics', 'auto caption accuracy'],
      },
      {
        q: 'What is the ideal aspect ratio and resolution for TikTok, Reels, and Shorts in 2026?',
        a: 'Shoot and export at 9:16 vertical, 1080×1920 minimum, at 30 or 60 FPS. This single spec is the only one all three platforms (TikTok, Instagram Reels, YouTube Shorts) treat as native full-screen — anything else gets letterboxed or pillarboxed, and those black bars sit inside the safe zone where the algorithm measures visual density. 1:1 squares and 4:5 portraits lose roughly 44% and 22% of the vertical viewport respectively on a 9:16 feed, and that wasted pixel area correlates with lower watch time because the eye drifts to UI chrome instead of the subject. Resolution-wise, 1080×1920 is the floor; 4K (2160×3840) is accepted by all three but compressed back down on delivery, so the only real gain is crop headroom in post. For FPS, 60 is now favored for sports, dance, fitness, and fast-cut edits — TikTok and Shorts both retain 60 FPS through their HEVC pipeline as of 2025, while Reels caps playback at 60 but accepts 120 FPS source for smooth slow-mo. Blossom\'s 5-dimension visual scoring flags non-9:16 aspect ratios, detects black-bar regions, and warns when your export is sub-1080p before you post.',
        details: [
          { label: '9:16 is the only safe ratio', text: '1080×1920 at 9:16 fills the entire feed on TikTok, Reels, and Shorts. 1:1 and 4:5 lose 22–44% of the viewport to black bars or auto-crops.' },
          { label: '60 FPS for motion, 30 FPS for talking heads', text: 'Shoot 60 FPS when there\'s fast motion (sports, dance, b-roll). Stick to 30 FPS for static talking-head content — higher FPS on a still subject wastes bitrate.' },
          { label: '1080×1920 minimum, 4K optional', text: 'All three platforms re-encode uploads to ~2 Mbps regardless of source. 1080p is the floor; 4K source only helps if you need crop or stabilization headroom in editing.' },
          { label: 'Blossom detects format violations automatically', text: 'Run any viral video through Blossom\'s analyzer and the visual-quality dimension surfaces aspect ratio mismatch, black-bar coverage percentage, and resolution downgrade.' },
        ],
        feature: { label: 'Audit your video specs free', to: '/signup' },
        related: ['production-0', 'production-1'],
        keywords: ['aspect ratio', 'resolution', 'vertical video', 'aspect ratio tiktok reels 2026', 'vertical video specs', '60fps tiktok', '9:16 resolution shorts'],
      },
      {
        q: 'How do I keep retention high in longer videos (60+ seconds)?',
        a: 'Longer videos die in the middle, not at the end. Without intervention, the average viewer drop-off curve falls roughly linearly: by the 30-second mark, most short-form videos have lost 40–60% of their initial audience, and completion rates for videos over 60 seconds typically sit below 25% on TikTok and Reels. The fix is the re-hook — a deliberate pattern interrupt every 12–18 seconds that resets attention before the next dip. A re-hook is a micro-disruption: a hard cut to a new camera angle, a sudden zoom, an on-screen text reveal that contradicts what you just said, a sound effect (whoosh, ding, record-scratch), a B-roll insert, a location change, or a verbal hook like "but here\'s where it gets weird" or "wait — this next part changed everything." Creators who place 4–6 re-hooks in a 60-second video routinely flatten the retention curve, keeping watch-time above 70% through the entire runtime. The hard part is knowing where your specific video loses people. Blossom analyzes your retention curve across five dimensions and pinpoints the exact seconds where viewers drop — so you know precisely where to insert the next re-hook instead of guessing.',
        details: [
          { label: 'Cut on a beat', text: 'Hard cut every 12–18 seconds, ideally aligned to an audio beat or musical drop. Visual motion at the cut (zoom punch, angle shift) compounds the attention reset.' },
          { label: 'Verbal pattern interrupt', text: 'Mid-sentence verbal hooks like "but here\'s the thing," "wait — this is the part that matters," or "most people miss this" force re-engagement before the brain disengages.' },
          { label: 'On-screen text reveal', text: 'Pop a single-line text overlay that adds new information or contradicts the voiceover. Movement plus new data resets the eye-tracking loop.' },
          { label: 'Sound design beats', text: 'Whoosh, ding, scratch, or sub-bass drop at each transition. Audio cues hit faster than visual cues and prime the next visual change.' },
          { label: 'Open-loop tease', text: 'Insert a future-reference hook at the 25–30s mark: "I\'ll show you the result in a sec" or "wait for the last one." Loops are the strongest tool for pulling viewers to the end.' },
        ],
        feature: { label: 'Find your retention drops', to: '/signup' },
        related: ['production-0', 'hooks-4'],
        keywords: ['retention', 'keep watching', 're-hook', 'video retention 2026', 're-hook video pattern interrupt', 'longer video retention'],
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
        q: 'How do I find trending sounds on TikTok and Reels in 2026?',
        a: 'There are three reliable native sources in 2026, each with a tradeoff. On TikTok, open the Creative Center and filter Top Sounds by country, industry, and time range — it sorts by usage growth, which is the only metric that matters when you\'re trying to ride a wave instead of chasing one. On Instagram, go to your profile, tap Professional Dashboard, then Tips and Resources, then Trending Audio (US pro accounts only, mobile). In both apps, the upward-arrow icon next to a sound name in the editor flags audio the algorithm has detected as accelerating — not just popular. The window that actually pays off is the breakout phase: roughly 1,000 to 50,000 uses on TikTok, where the sound is climbing fast but not yet saturated. Past 100,000 uses you\'re swimming in a crowded pool, and past 500,000 the trend is effectively dead. The hard part isn\'t the list — it\'s checking those dashboards every day, cross-referencing TikTok velocity against Reels adoption, and knowing how many days you have before a sound peaks for your niche. Blossom\'s Trends and Songs dashboards collapse that work into one view: rising sounds filtered by your niche and geography, real-time usage velocity, and a time-to-peak estimate so you publish while the sound is still climbing.',
        details: [
          { label: 'TikTok Creative Center', text: 'Open the Creative Center, go to Top Sounds, filter by country and 7-day time range, and sort by usage growth.' },
          { label: 'Instagram Professional Dashboard', text: 'Profile → Professional Dashboard → Tips and Resources → Trending Audio. Returns ~50 sounds. US pro accounts on mobile only.' },
          { label: 'The upward-arrow icon', text: 'Inside either editor, the arrow next to a sound means the algorithm detects accelerating usage — a better signal than total play count.' },
          { label: 'Catch sounds in the breakout phase', text: 'Roughly 1,000–50,000 uses on TikTok is the window where the algorithm still amplifies you. Past 100K, distribution flattens.' },
          { label: 'Cross-platform timing', text: 'Sounds usually break on TikTok first and migrate to Reels 3–10 days later. A sound past peak on TikTok can still be early on Instagram.' },
          { label: 'Geography matters', text: 'A sound trending in the US may have zero traction in the UK or India. Always filter the dashboard by your audience\'s country, not your own.' },
        ],
        feature: { label: 'See rising sounds for your niche', to: '/signup' },
        related: ['trends-1', 'features-4'],
        keywords: ['trending sounds', 'trending audio', 'find sounds', 'how to find trending sounds tiktok 2026', 'trending audio instagram reels 2026', 'tiktok creative center top sounds'],
      },
      {
        q: 'How early on a trend do I need to be on TikTok in 2026?',
        a: 'In 2026 the prime window has tightened. For sounds, under 5,000 Reels uses (Instagram) or under ~15,000 TikTok uses still counts as early; once a sound crosses ~900K creator uploads, it\'s effectively saturated — 18 of the 25 most-reused audios hit that ceiling within 30 days of breaking. For format trends (transitions, POV setups, edit styles), the catch window is 48–72 hours from breakout, with peak distribution at days 7–10 and clear algorithmic down-weighting after that. Audio trends crossing platforms also lag: Instagram Reels typically picks up TikTok sounds 3–7 days later, so monitoring TikTok velocity is the cleanest leading indicator. The bigger 2026 shift: TikTok\'s algorithm now buries low-effort, late copycat content, so timing alone isn\'t enough — you need rate-of-change data to spot trends before the FYP makes them obvious. Blossom Trends scores each format and sound by 7-day velocity and estimates time-to-peak, so you can act inside the 72-hour window instead of guessing.',
        details: [
          { label: 'Sound thresholds (2026)', text: 'Under 5K Reels uses or ~15K TikTok uses = early; ~900K+ uploads = saturated. Cross-platform lag: Reels picks up TikTok audio 3–7 days later.' },
          { label: 'Format trend window', text: '48–72 hours from breakout is prime. Peak distribution lands day 7–10; algorithm down-weights saturated formats after that.' },
          { label: 'Algorithm shift in 2026', text: 'TikTok actively buries low-effort copycat content. Being early is worthless if execution is generic — originality multiplies the timing advantage.' },
          { label: 'Why velocity beats volume', text: 'Total uses is a lagging signal. Rate-of-change (uses/day acceleration) catches trends 2–3 days before they hit the FYP for the average user.' },
        ],
        feature: { label: 'See live trend velocity in Blossom', to: '/signup' },
        related: ['trends-0', 'trends-2'],
        keywords: ['trend timing', 'jump on trend', 'early trend', 'how early on trend tiktok', 'trend timing window 2026', 'tiktok trend saturation 2026'],
      },
      {
        q: 'Do Instagram Reels and TikTok trends actually overlap, and how do I catch sounds before they peak on Reels?',
        a: 'Yes, and the overlap is your biggest arbitrage window in 2026. Sound and format trends migrate from TikTok to Instagram Reels with a 3–7 day lag on average, though high-velocity audio can cross over in as little as 48 hours. The pattern is consistent: a sound breaks on TikTok\'s For You Page, gets re-uploaded or imported to Reels by early adopters, then enters Reels\' recommendation loop a few days later. By the time most creators notice the trend on Reels, the TikTok version is already saturated and the Reels window is closing fast. The reverse migration (Reels to TikTok) is rarer and slower, usually 7–14 days when it happens at all. To spot a sound mid-migration, look for three signals: rapid TikTok velocity (sound usage doubling in 24–48 hours), under 5,000 Reels uses on Instagram, and at least one creator over 100K followers already testing it on Reels. That combination almost always precedes a Reels spike. Blossom\'s cross-platform Trends tracker flags TikTok-to-Reels sound migrations the moment they cross the velocity threshold, shows you the estimated lead time remaining, and surfaces the original TikTok creators driving the trend.',
        details: [
          { label: 'The 3–7 day migration window', text: 'Trending TikTok audio typically appears on Reels 3–7 days later, with viral sounds (1M+ TikTok uses in 48 hours) crossing over in under 72 hours.' },
          { label: 'The 5,000 Reels threshold', text: 'If a TikTok-trending sound has fewer than 5,000 Reels using it, you are still in the early adopter window. Above 25,000 Reels uses, the trend is mature.' },
          { label: 'Format vs. sound migration', text: 'Sounds migrate faster than formats. A specific audio crosses platforms in days; a format concept takes 2–4 weeks to fully cross over.' },
          { label: 'Reverse migration is rare', text: 'Only about 15–20% of viral Reels trends migrate back to TikTok, and when they do it takes 7–14 days. TikTok remains the primary trend origin platform in 2026.' },
        ],
        feature: { label: 'Track TikTok-to-Reels migrations', to: '/signup' },
        related: ['cross-platform-2', 'trends-1'],
        keywords: ['trend cross platform', 'reels tiktok trends', 'tiktok to reels lead time', 'cross platform trend tracker', 'viral sound migration window'],
      },
      {
        q: 'Can an off-niche trend hurt my account, and how badly does trend chasing damage reach in 2026?',
        a: 'Yes, definitively. The 2026 algorithm shift is the harshest version yet for off-niche trend chasing. TikTok now applies a documented -45% reach penalty to accounts that post across 3+ unrelated niches, and switching topical lanes before day 30 of a content cycle effectively resets the algorithm\'s confidence in your audience cluster. Instagram\'s transformer-based recommendation model infers your topic directly from video embeddings (not hashtags), so one off-niche viral attempt pollutes the cluster and the model "forgets" who to show your next posts to. The data is brutal: creators who keep at least 80% of posts inside one niche get compound distribution, while creators who scatter see suppression on the next 5–10 posts as the system rebuilds its classification. The rule for 2026 is simple: only ride trends you can rewrite into your niche\'s language and execute within a 24–48 hour window. Blossom\'s niche-fit score on every trend tells you in advance whether a viral format will compound your reach or trigger the reset penalty.',
        details: [
          { label: '-45% reach penalty', text: 'Posting across 3+ unrelated niches on TikTok is now the single biggest documented reach penalty on the platform in 2026.' },
          { label: 'The 80% rule', text: 'Fastest-growing accounts keep 80%+ of posts in one niche and reserve the remaining 20% for closely related themes, never random viral formats.' },
          { label: 'Embeddings beat hashtags', text: '2026 algorithms infer topic from the video itself, so you can\'t "hashtag your way back" into your niche after an off-niche post.' },
          { label: 'The 30-day reset', text: 'Switching niches before day 30 of a content cycle resets algorithmic confidence and forces the model to rebuild your audience cluster from scratch.' },
          { label: 'Niche-fit score', text: 'Blossom scores every trending hook and format against your category so you know which trends will compound reach and which will trigger suppression.' },
        ],
        feature: { label: 'Get niche-fit scores on every trend', to: '/signup' },
        related: ['algorithm-5', 'formats-1'],
        keywords: ['off niche trend', 'trend hurts account', 'trend chasing risks 2026', 'niche dilution algorithm', 'cross-niche penalty TikTok'],
      },
      {
        q: 'Should I chase every viral trend on TikTok and Instagram in 2026?',
        a: 'No. Chasing every viral trend is one of the lowest-ROI strategies for creators in 2026. The math is brutal: trend-chasing posts can pull 10× your normal views, but follower-conversion rates on those videos typically run 60–80% below your niche content because the algorithm pushes you to a broad, mismatched audience. You inherit views, not fans. Worse, repeated off-niche trend posts dilute your account\'s topical authority, which the FYP ranker uses to decide who sees your next upload — so a week of trend-chasing can suppress reach on your evergreen content for weeks after. The high-ROI pattern that\'s outperforming pure trend-chasing in 2026 is the 1-2-per-week framework: keep 80% of your output as evergreen, niche-aligned content, and layer in one or two trends per week that genuinely fit your topic. The hard part is identifying which trends actually fit before they peak. Blossom\'s trend engine surfaces only the 1–2 trends per week that align with your niche, filtering out the 95% of viral sounds and formats that would cost you more in follower-conversion than they\'d earn you in reach.',
        details: [
          { label: 'Views without follows', text: 'Off-niche viral posts convert viewers to followers at a fraction of the rate of niche-aligned content — high reach, low growth.' },
          { label: 'Algorithmic identity drift', text: 'The FYP classifier locks onto your recent topics. Off-niche trends confuse it and shrink reach on your next 3–5 uploads.' },
          { label: 'The 1–2 per week rule', text: 'Top-performing accounts in 2026 cap trend posts at 1–2 weekly, stacked on a stable evergreen cadence.' },
          { label: 'Timing beats trying everything', text: 'Trends peak in 5–10 days. Jumping on the wrong ones late costs production time with zero upside.' },
          { label: 'Niche-fit filtering with Blossom', text: 'Blossom analyzes trending hooks, formats, and sounds against your category and surfaces only the 1–2 per week worth producing.' },
        ],
        feature: { label: 'Get your weekly niche-fit trends — Sign up', to: '/signup' },
        related: ['trends-3', 'formats-6'],
        keywords: ['trend chasing', 'every trend', 'trend strategy', 'trend chasing strategy 2026', 'viral trend follower conversion', 'niche content vs trends'],
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
        q: 'How do I analyze a competitor\'s viral video and reverse engineer what makes it work?',
        a: 'A thorough competitor breakdown answers six load-bearing questions: what is the hook in the first 1.5 seconds, when does the payoff land relative to retention drop-off, what audio is used and is it currently trending on the platform, what on-screen text appears and at which timestamps, what implicit emotional trigger drives the share, and how does the caption stage the comment section. Done manually with a timeline, a notes doc, and the platform\'s native audio search, one video runs about 20 minutes — and even then, you tend to miss the patterns that only become visible across 30 or 40 reels in the same niche. Most reverse-engineering tutorials stop at "watch the first three seconds," which is roughly 10% of the work. The hard part is quantifying hook archetype, audio velocity, format reuse, and pacing in a way you can compare across videos. Blossom resolves all six questions in under 90 seconds for any public Instagram or TikTok URL: paste the link, get a frame-accurate hook transcript, a 5-dimension score (hook, payoff, audio, text overlay, emotion), trending-audio status, and the hook/format/tactic classification slotted into your library so you can see which patterns repeat across a creator\'s last 50 posts.',
        details: [
          { label: '1.5-second hook', text: 'Identify the opening line, visual, and pattern interrupt before the 1.5-second mark — this is the window where TikTok and Reels decide whether to keep serving the video.' },
          { label: 'Payoff timing', text: 'Mark the timestamp where the promised payoff lands. Viral shorts typically deliver between seconds 8–25; payoff after 30s correlates with steeper drop-off.' },
          { label: 'Audio + trend status', text: 'Capture the audio ID and check whether it\'s currently trending. On TikTok, trending sounds can lift reach significantly versus original audio.' },
          { label: 'On-screen text timeline', text: 'Log every text overlay with its in/out timestamp. Reinforcement text in the first 3 seconds is one of the highest-correlated factors with watch-time retention.' },
          { label: 'Emotional trigger', text: 'Name the implicit emotion driving the share — curiosity gap, validation, outrage, awe, relatability. Shares (not likes) are the strongest predictor of distribution.' },
          { label: 'Caption + comment setup', text: 'Read the caption as a comment-section prompt, not a description. Captions that ask a polarizing or low-effort question lift comment volume.' },
        ],
        feature: { label: 'Analyze a competitor URL in 90s', to: '/signup' },
        related: ['ai-analysis-0', 'features-0'],
        keywords: ['competitor analysis', 'analyze viral', 'reverse engineer', 'analyze competitor viral video', 'viral video breakdown', 'tiktok hook analysis'],
      },
      {
        q: 'Which creators should I actually study to grow my account in 2026?',
        a: 'Skip the 10M+ giants. Their growth playbook stopped applying years ago, and what worked for them in 2019–2022 won\'t replicate on a cold start algorithm in 2026. Instead, build your study list around mid-tier creators with 50K–300K followers who are still posting 5%+ monthly follower growth. This range matters: accounts in the 50K–300K band consistently post the highest average engagement rates on Instagram and TikTok (often 2–4× the rate of 1M+ accounts), and they\'re small enough that their tactics aren\'t backed by paid amplification, brand deals, or legacy reach. What you see them doing is what\'s actually working. Pair that follower range with a growth velocity filter, because a stagnant 200K account is studying a ceiling, not a path. Blossom\'s influencer discovery lets you filter creators by both follower range AND month-over-month growth rate, so you can build a study list of accounts that are demonstrably winning right now in your niche. From there, run their top videos through Blossom\'s hook, format, and tactic analysis to extract the patterns you can replicate this week.',
        details: [
          { label: 'Why 50K–300K is the sweet spot', text: 'Engagement rates peak in the mid-tier band (often 2–4× larger accounts) and tactics aren\'t masked by paid reach, brand deals, or legacy audience loyalty.' },
          { label: 'Growth velocity matters more than size', text: 'A 200K account growing 8% month-over-month is using current tactics. A 200K account flat for 12 months is teaching you a ceiling. Always filter for 5%+ monthly growth.' },
          { label: 'Avoid the 10M+ trap', text: 'Mega-creators benefit from algorithm whitelisting, cross-promotion, and audiences built years ago. Their hooks and formats often won\'t trigger discovery on a cold account.' },
          { label: 'Niche-match beats raw size', text: 'A growing 80K creator in your exact category is more replicable than a 2M creator one niche over. Filter by category first, then size, then velocity.' },
          { label: 'Study the patterns, not the personality', text: 'Run their top performers through hook, format, and tactic analysis. The goal is to extract repeatable structures, not mimic individual voice.' },
        ],
        feature: { label: 'Find creators worth studying with Blossom', to: '/signup' },
        related: ['features-5', 'monetization-3'],
        keywords: ['who to study', 'which creators', 'mid sized creators', 'mid-tier creators tactics', 'influencer discovery by growth rate', 'replicable creator tactics 2026'],
      },
      {
        q: 'Is it plagiarism to copy a viral TikTok or Instagram format?',
        a: 'Copying a viral format is not plagiarism or copyright infringement under US law. Copyright protects fixed creative expression, not ideas, methods, or structures. The US Copyright Office explicitly excludes "ideas, procedures, methods, systems, processes, concepts, principles, or discoveries" from protection (17 U.S.C. § 102(b)). That means the format itself — "before/after with hard cut," "POV walking shot," "three-tip carousel," or "day-in-the-life voiceover" — is fair game. What is protected is the specific footage, the original voiceover script, on-screen text written verbatim, and music that isn\'t cleared through TikTok\'s Commercial Music Library or Instagram\'s licensed catalog. Replicating a format with your own footage, your own words, and a platform-licensed sound is how creator economies work — every trend on TikTok scales precisely because thousands of creators rebuild the same structure. Original creator backlash is a social signal, not a legal one; credit when the structure is distinctive, but you owe no license fee for a pattern. Blossom\'s Format library is built around this exact line: we reverse-engineer the structural patterns so you can rebuild them with original assets.',
        details: [
          { label: 'Ideas aren\'t copyrightable', text: '17 U.S.C. § 102(b) excludes procedures, methods, and concepts — a video "format" is a method.' },
          { label: 'Assets are protected', text: 'Original footage, voiceover scripts, verbatim on-screen text, and uncleared music are the copyrightable layers.' },
          { label: 'Use platform-licensed sounds', text: 'TikTok\'s Commercial Music Library and Instagram\'s licensed catalog cover commercial use without separate clearance.' },
          { label: 'Credit is etiquette, not law', text: 'Tagging the originator avoids backlash on platforms where creators publicly call out un-credited replication.' },
        ],
        feature: { label: 'Browse the Formats library', to: '/signup' },
        related: ['competitor-3', 'ai-analysis-5'],
        keywords: ['copy format', 'plagiarism', 'is it copying', 'copy viral format legal', 'viral format copyright'],
      },
      {
        q: 'Duet vs stitch vs inspiration: which TikTok/Reels remix actually wins?',
        a: 'Duets, stitches, and pure inspiration each solve a different problem, and picking the wrong one is the difference between borrowed reach and a flat post. Duet vs stitch on TikTok: a duet plays your video side-by-side with the original (best for reactions, harmonies, or commentary on dead-space audio with single-speaker framing). A stitch lets you clip up to 5 seconds of the original and continue the thought (best for hot takes, corrections, or adding expert context). Both preserve the original creator\'s handle, ride the existing engagement signal, and surface to that creator\'s audience graph, so they are the move when the source video is already trending and you want reach borrowed from a larger account. Inspiration content for Reels and TikTok (replicating the format, hook, or structure with your own footage) is the right call when you want authority in your niche, are bigger than the original, or the source has IP, music, or face risk you cannot ride on. The trap: creators default to inspiration because it feels safer, then miss the reach window entirely. Blossom\'s 5-dimension analysis flags every viral video as duet-friendly, stitch-friendly, or pure-inspiration based on audio dead-space, speaker count, framing, and IP signals.',
        details: [
          { label: 'Duet for reach borrow', text: 'Use when the original has dead-space audio, single-speaker framing, and is climbing in the last 24–72 hours.' },
          { label: 'Stitch for hot takes', text: 'Use the 5-second clip to set up a contrarian point, correction, or expert deepen.' },
          { label: 'Inspiration for authority', text: 'Replicate the format with your own footage when you want to own the niche, outgrow the source, or avoid IP and face-rights friction.' },
          { label: 'The reach window', text: 'Duet and stitch decay fast — if the source is older than 5–7 days the algorithmic lift collapses and inspiration becomes the better play.' },
          { label: 'How Blossom flags it', text: 'The 5-dimension analyzer tags each viral as duet-friendly, stitch-friendly, or inspiration-only based on audio gaps, speaker count, framing, and source virality stage.' },
        ],
        feature: { label: 'Find duet-friendly virals', to: '/signup' },
        related: ['competitor-2', 'cross-platform-4'],
        keywords: ['duet vs stitch', 'inspiration', 'remix content', 'duet vs stitch tiktok', 'tiktok remix strategy', 'reach borrow tiktok'],
      },
      {
        q: 'How many videos should I study before posting in a new niche?',
        a: 'Study 20–30 top-performing videos across 5–10 different creators before your first post. This sample size is the sweet spot: large enough to expose recurring hook patterns, format conventions, and pacing rules, but small enough to avoid the research paralysis that traps new creators for weeks. Watching fewer than 15 videos leaves you guessing about which elements drive views versus which are stylistic choices from a single creator. Watching 50+ delivers diminishing returns — the dominant patterns in a niche typically stabilize after roughly 25 examples. Spreading study across 5–10 creators is non-negotiable: creators who model a single influencer plateau faster than those who synthesize from multiple sources, because the algorithm rewards differentiation within a proven format. Track three things per video: the first 3 seconds (hook), the structural beats, and the caption-to-content relationship. Blossom\'s niche dashboard auto-curates this study set the moment you pick a category — surfacing the top-performing videos, mapping their hooks and formats, and flagging the tactics shared across multiple creators so you skip the manual scraping and jump straight to pattern recognition.',
        details: [
          { label: 'The 20–30 rule', text: 'Sample size where dominant hook and format patterns stabilize without diminishing returns from over-watching.' },
          { label: '5–10 creators minimum', text: 'Multi-source study prevents single-creator imitation and surfaces patterns the algorithm rewards as differentiation.' },
          { label: 'Three data points per video', text: 'Track the opening hook, structural beats, and caption-content relationship — the variables most correlated with retention.' },
          { label: 'Auto-curated study sets', text: 'Blossom\'s niche dashboard pulls top performers per category and pre-tags hooks, formats, and shared tactics.' },
        ],
        feature: { label: 'Build your niche study set', to: '/signup' },
        related: ['competitor-1', 'features-5'],
        keywords: ['study videos', 'how many to watch', 'research', 'how many videos to study viral', 'competitive research creator', 'viral video pattern analysis'],
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
        q: 'How do I repost TikToks to Instagram Reels in 2026 without getting downranked?',
        a: 'Yes, but the 2026 rules are unforgiving. Instagram\'s April 2026 Originality update introduced visual fingerprinting that flags Reels retaining 70%+ of footage or audio from another platform, even when the TikTok watermark is cropped out. Aggregator-flagged accounts have logged 60–80% reach drops, while accounts posting genuinely original Reels have seen 40–60% increases. Re-export from CapCut or your TikTok draft, never download the published version — the embedded TikTok and CapCut logos trigger an automatic Aggregator Penalty that suppresses every future post on the account, not just the offending Reel. Stagger uploads 20–30 minutes apart so the platforms index in sequence, swap the TikTok audio for an Instagram-library track, change the first frame, and rewrite the caption from scratch. Wait 24–48 hours before mirroring to the second platform when the clip is long-form, and run a watermark check before you hit publish — a single missed corner logo is enough to demote the account for weeks. Blossom\'s video analyzer scores every clip on a 5-dimension rubric that includes watermark/source-attribution detection, so you see the originality risk before Instagram does.',
        details: [
          { label: 'Export clean, never download', text: 'Pull the master file from CapCut or your TikTok drafts. Downloads from the live TikTok carry the username watermark Instagram flags within seconds.' },
          { label: 'Re-edit past the 70% threshold', text: 'Change the opening 1.5 seconds, swap to Instagram-native audio, and adjust on-screen text placement. Speed changes alone don\'t count as transformation under the 2026 rules.' },
          { label: 'Stagger by 20–30 minutes minimum', text: 'Posting simultaneously triggers cross-platform fingerprint matches. Space uploads and target each platform\'s peak window separately.' },
          { label: 'Rewrite the caption — never copy-paste', text: 'Reels rewards hook-front captions with 8–15 word leads; TikTok hooks read flat on IG. Recycled captions are part of the originality signal.' },
          { label: 'Audit watermarks before every publish', text: 'Run a corner-frame check at 0:00, 0:01, and the closing frame. Blossom\'s 5-dim score flags residual logos before Instagram\'s fingerprint scan does.' },
        ],
        feature: { label: 'Score your Reel for watermark risk', to: '/signup' },
        related: ['cross-platform-3', 'algorithm-1'],
        keywords: ['repost tiktok instagram', 'crosspost', 'reuse content', 'repost tiktok to reels 2026', 'instagram originality score', 'aggregator penalty reels'],
      },
      {
        q: 'Should I run separate accounts for TikTok and Instagram, or post the same content on both?',
        a: 'Yes — keep separate accounts per platform, and keep the content separate too. The audiences split by behavior, not just demographics: TikTok\'s recommendation engine drives 85% of video views and rewards raw, trend-driven clips, while Instagram\'s Explore/Reels feed accounts for 57% and favors polished, visually consistent posts that compound through saves, shares, and profile clicks. Engagement also looks different — TikTok is broad and shallow (watch, tap, scroll), Instagram is deeper, with longer comments, DMs, and higher purchase intent after research. Uploading the same file to both is the real trap. In 2026, Instagram\'s Originality Score down-ranks watermarked content by 30–50%, and content fingerprinting suppresses cross-posted duplicates even after the watermark is stripped. Watermarked Reels can lose up to 72% of their reach. The fix is not fresh concepts for every channel — it\'s per-platform adaptation of the same idea: re-export the master file, swap the audio for an in-app track, change the opening frame, adjust text placement, and tune captions and hashtags to each algorithm. Same niche, same brand voice, two front doors built for two different feeds.',
        details: [
          { label: 'Audience overlap is smaller than it looks', text: 'TikTok skews 55.7% male with 40.3% of users aged 25–34. Instagram is more gender-balanced. Even when ages overlap, intent differs — TikTok users impulse-buy, Instagram users research first.' },
          { label: 'Cross-posting raw files gets throttled', text: 'Instagram detects TikTok watermarks and applies a 30–50% reach penalty, with content fingerprinting catching duplicates without watermarks. Repurpose the concept, not the file.' },
          { label: 'Algorithms reward different signals', text: 'TikTok\'s For You page ranks by interest graph and watch time on cold traffic. Instagram weighs DM shares, saves, watch time, and profile clicks, which compound for accounts posting 3–5× weekly.' },
          { label: 'Workload is manageable with a system', text: 'Shoot once, edit twice. Capture vertical footage once, then cut a TikTok version (faster pacing, native audio, trend-driven hook) and an Instagram version (cleaner edit, library audio, save-worthy payoff).' },
        ],
        feature: { label: 'Analyze both platforms separately + cross-platform analysis', to: '/signup' },
        related: ['cross-platform-0', 'algorithm-2'],
        keywords: ['separate accounts', 'one account both', 'cross post account', 'separate accounts tiktok instagram', 'tiktok instagram cross-posting penalty', 'instagram originality score 2026'],
      },
      {
        q: 'Which short-form platform should I focus on first if I\'m starting from zero in 2026?',
        a: 'Pick one platform for 90 days based on your starting state, not all three. Mastering one algorithm is a multi-month project, and 47% of creators have considered quitting in the past six months due to burnout from spreading too thin. TikTok still gives unknown accounts the fastest cold-start: 42% of viral TikToks (1M+ views) come from accounts under 10K followers, and 18% from accounts under 1,000. But YouTube Shorts has quietly become the best-kept secret for small channels — creators with 1,000–5,000 followers average 2,600 views per Short versus 660 on TikTok and 600 on Reels at the same follower count, plus Shorts pay $2–$8 per 1,000 views through the Partner Program (TikTok pays roughly a tenth of that). Instagram Reels rewards creators who already have an audience to convert, since the algorithm weighs sends-per-reach and saves heavily. Decision rule: zero audience and zero long-form plans, start TikTok. Want monetization and search longevity, start YouTube Shorts. Already have an IG following, start Reels. Add a second platform only after you hit 10K on the first.',
        details: [
          { label: 'Zero audience, fastest discovery', text: 'Start TikTok. The For You algorithm tests every video on 200–500 strangers in the first 1–3 hours regardless of follower count. Best odds of a cold viral hit.' },
          { label: 'Small-creator reach advantage', text: 'Start YouTube Shorts. Accounts with 1K–5K followers average 2,600 views per Short — roughly 4× TikTok and Reels at the same size.' },
          { label: 'Monetization-first', text: 'Start YouTube Shorts. The Partner Program pays $2–$8 per 1K views versus TikTok\'s Creator Rewards Program paying a fraction of that. Shorts also drive subscribers to long-form.' },
          { label: 'Existing Instagram audience', text: 'Start Reels. Instagram weaves Reels into feed, Explore, and DMs, so your existing followers amplify reach. Optimize for sends-per-reach and watch-time.' },
          { label: 'When to expand', text: 'Hit 10K on your primary platform first. Repurpose winners (use Blossom to identify which hooks and formats actually traveled) before adding platform #2.' },
        ],
        feature: { label: 'See which of your hooks travel across platforms', to: '/signup' },
        related: ['cross-platform-1', 'algorithm-2'],
        keywords: ['which platform first', 'tiktok or reels', 'which platform focus first 2026', 'youtube shorts vs tiktok for new creators', 'best platform for new creators 2026'],
      },
      {
        q: 'How do I crosspost between TikTok and Instagram without triggering the watermark reach penalty in 2026?',
        a: 'Crossposted videos carrying a competitor\'s watermark face a documented 30–50% reach reduction on both TikTok and Instagram Reels, with the penalty applied through two parallel detection systems that operate independently of each other. The first layer is visual: computer vision models scan every frame for logo signatures, including TikTok\'s username overlay (even when blurred or covered with stickers), Instagram\'s Reels burn-in, and YouTube Shorts identifiers. The second layer is metadata fingerprinting, where platforms inspect MP4 atoms, encoder strings, and EXIF tags that third-party "watermark removers" routinely fail to scrub. Follow two strict rules. First, never download a published video from one platform to repost on another, since the export pipeline embeds platform-specific identifiers that survive cropping, mirroring, and re-encoding. Second, always export the master file directly from your editing app (CapCut, Premiere, Descript, DaVinci Resolve) before any platform sees it. If you must work from a published clip, re-edit at minimum 1.5× speed with new audio and overlaid graphics covering at least 30% of the frame. Blossom\'s analysis pipeline flags watermark risk in its 5-dimension scoring system, identifying detectable platform signatures before you post.',
        details: [
          { label: 'Detection is dual-layer', text: 'Visual matching catches logos and UI overlays even when partially obscured; metadata fingerprinting reads MP4 atoms and encoder tags that watermark-remover apps leave intact.' },
          { label: 'Penalty range', text: 'Crossposted videos with detected watermarks lose 30–50% of organic reach versus clean exports of identical content, based on creator A/B tests reported across 2025–2026.' },
          { label: 'Master file workflow', text: 'Export from your editor (CapCut, Premiere, Descript) at the platform\'s native spec — 1080×1920, 30fps, H.264 — and upload that file directly. Never round-trip through a published feed.' },
          { label: 'Repurposing from published clips', text: 'If the original master is gone, re-edit at 1.5× or faster, replace audio, and add overlays covering 30%+ of the frame. A workaround, not a substitute for keeping master files.' },
        ],
        feature: { label: 'Catch watermarks before you post', to: '/signup' },
        related: ['cross-platform-0', 'algorithm-1'],
        keywords: ['watermark penalty', 'remove watermark', 'tiktok logo', 'tiktok watermark penalty 2026', 'how to repost without watermark', 'metadata fingerprinting video'],
      },
      {
        q: 'Can I duet or stitch a TikTok on Instagram?',
        a: 'No — Instagram does not support duets or stitches of TikTok videos natively. Instagram\'s Remix feature (its built-in equivalent of TikTok\'s Duet and Stitch) only works on existing Reels, Feed videos, photos, and Live broadcasts posted to Instagram — not on content hosted on TikTok or other external platforms. There is no API, share sheet option, or in-app workflow that pulls a TikTok directly into a Remix layout. To react to a TikTok on Instagram, creators have two compliant paths: (1) screen-record the TikTok with the original creator\'s username clearly visible, post it as a standalone Reel, and then Remix your own upload — but this carries reposting and watermark risks that suppress reach in Instagram\'s algorithm; or (2) ask the original creator to cross-post the video to their own Reels, then Remix the native Instagram version with full credit. The cleanest workflow is treating cross-platform reactions as inspiration content: reference the TikTok concept, recreate the hook in your own voice, and tag the source creator in the caption. Doing so avoids takedown risk, preserves reach, and keeps attribution intact across platforms.',
        details: [
          { label: 'Remix is Reels-only', text: 'Instagram Remix works exclusively on content already published to Instagram (Reels, Feed videos, photos, Live). External URLs from TikTok, YouTube Shorts, or Snapchat Spotlight cannot be loaded into the Remix editor.' },
          { label: 'Watermarks tank reach', text: 'Instagram explicitly deprioritizes Reels containing visible TikTok watermarks in its recommendation system, so a raw screen-record will underperform a native re-upload or original recreation.' },
          { label: 'Attribution protects both creators', text: 'Tag the original TikTok creator\'s Instagram handle in the caption and on-screen — it shields you from DMCA reports and earns goodwill if the original creator decides to collaborate.' },
          { label: 'Recreate, don\'t repost', text: 'Top cross-platform accounts rebuild the hook, format, and beat structure of viral TikToks as native Reels rather than reposting — Blossom surfaces these structures so you can adapt them legally.' },
        ],
        feature: { label: 'Find Reel-ready hooks to remix', to: '/signup' },
        related: ['competitor-3'],
        keywords: ['duet across platforms', 'cross duet', 'reels remix', 'duet tiktok on instagram', 'instagram remix reels', 'cross-platform reaction content'],
      },
      {
        q: 'Do social media trends actually move between platforms like TikTok, Instagram Reels, and YouTube Shorts in 2026?',
        a: 'Yes, and the migration pattern is now well-documented. In 2026, viral trends overwhelmingly originate on TikTok and crossover to Instagram Reels within 3 to 7 days, with YouTube Shorts trailing by an additional 5 to 10 days behind Reels. Sounds and audio-driven trends move fastest because the audio asset itself can be reuploaded, while visual format trends (transitions, edit styles, hook structures) typically lag by a few extra days as creators reverse-engineer them. The cross-platform arbitrage window is real and exploitable: when a sound is trending on TikTok but has under 5,000 Reels attached on Instagram, you have a documented head start of roughly a week before the algorithm saturates that audio on Meta\'s side. Creators who post the same hook structure across all three platforms during this window consistently see 2 to 4× higher reach on the lagging platforms versus their baseline. The catch is monitoring three feeds in real time, which is where most creators give up. Blossom\'s cross-platform tracker watches TikTok, Reels, and Shorts simultaneously, surfaces sounds and formats that are spiking on one platform but underused on the others, and alerts you while the arbitrage window is still open.',
        details: [
          { label: 'TikTok originates', text: 'Roughly 70 to 80 percent of audio and format trends start on TikTok before spreading to other short-form platforms.' },
          { label: 'Reels lag: 3 to 7 days', text: 'Sounds trending on TikTok typically reach Instagram Reels within 3 to 7 days, with visual formats taking slightly longer.' },
          { label: 'Shorts lag: 5 to 10 days more', text: 'YouTube Shorts trails Reels by another 5 to 10 days, giving you a two-week window from TikTok origin to Shorts saturation.' },
          { label: 'Under 5,000 uses signal', text: 'A trending TikTok sound with fewer than 5,000 Reels attached is the textbook arbitrage opportunity — high momentum, low platform competition.' },
        ],
        feature: { label: 'Track trends across platforms', to: '/signup' },
        related: ['trends-2', 'features-4'],
        keywords: ['trends move platforms', 'cross platform trends', 'tiktok to reels arbitrage', 'cross-platform trend tracker', 'viral sound migration'],
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
        a: 'TikTok monetization in 2026 unlocks in tiers: 1,000 followers for LIVE Gifts, 5,000 followers for TikTok Shop affiliate, and 10,000 followers plus 100,000 video views in the last 30 days for the Creator Rewards Program (the replacement for the old Creator Fund). Hitting the follower count is only step one. The Creator Rewards Program also requires a Personal account, age 18+, residence in an eligible country (US, UK, Germany, Japan, South Korea, France, Mexico, or Brazil), videos longer than 60 seconds, and a clean Community Guidelines record. Most rejections come from low engagement relative to follower count, deleted-but-flagged videos, or repetitive content that TikTok flags as unoriginal. RPM in the Creator Rewards Program lands between $0.40 and $1.00 per 1,000 qualified views, so the bigger money usually sits in brand partnerships, where buyers care less about your follower number and more about engagement rate, growth pattern, and content mix. Run your account through Blossom to see the account-health score brand managers actually evaluate before signing a deal, then use the 5 daily filmable scripts to push your engagement past TikTok\'s eligibility bar.',
        details: [
          { label: '1,000 followers', text: 'Unlocks LIVE Gifts. Account must be 30+ days old, age 18+, and policy-clean.' },
          { label: '5,000 followers', text: 'Unlocks TikTok Shop affiliate (Product Marketplace). 1,000–5,000 follower creators can land in a limited 30-day pilot in some regions.' },
          { label: '10,000 followers + 100,000 monthly views', text: 'Creator Rewards Program. Requires Personal account, age 18+, eligible country, 60-second+ videos, and no guideline strikes. RPM typically $0.40–$1.00 per 1,000 qualified views.' },
          { label: 'No minimum', text: 'Affiliate links, digital products, and brand deals. Brand buyers weigh engagement rate (3%+ is the working floor) over raw follower count.' },
        ],
        feature: { label: 'Run your account-health audit', to: '/signup' },
        related: ['monetization-1', 'monetization-2'],
        keywords: ['tiktok monetize', 'how many followers tiktok', 'tiktok monetization 2026', 'tiktok creator rewards requirements', 'tiktok shop affiliate followers', 'tiktok creator rewards program eligibility'],
      },
      {
        q: 'How many followers do I need to monetize Instagram in 2026?',
        a: 'Instagram\'s 2026 monetization tiers stack: Gifts unlock at 500 followers, Reels ads and basic in-stream tools at 1,000, and Subscriptions plus the Creator Marketplace\'s higher-paying campaigns at 10,000. The classic Reels Play Bonus is now invite-only after Meta paused the open program in 2023, so most creators earn through the 55% Reels ad revenue share ($0.01–$0.05 per 1,000 views), branded partnerships, and direct Subscriptions ($0.99–$99.99/month). Branded content tools technically have no follower minimum, but brand marketplace filters typically gate deals at 1K, with rate cards jumping at 10K and again at 100K. The real ceiling isn\'t follower count, it\'s engagement and niche fit: a 30K B2B account often out-earns a 300K lifestyle account. That\'s why Blossom calculates an account-health score across hook strength, retention, posting cadence, and audience match.',
        details: [
          { label: 'Nano tier (500–1K followers)', text: 'Gifts/Stars unlock at 500 followers in eligible regions ($0.01 per Star). Affiliate links via Creator Marketplace are available. Sponsored post rates run $25–$150.' },
          { label: 'Reels-eligible tier (1K–10K followers)', text: 'Full Reels ad revenue share at 55% kicks in. Branded content tool fully usable with Paid Partnership label. Average sponsored Reel pays $50–$300.' },
          { label: 'Subscriptions tier (10K–100K followers)', text: 'Instagram Subscriptions unlock ($0.99–$99.99/month, Meta takes 0% for now). Branded content marketplace rates jump to $250–$5,000 per post.' },
          { label: 'Mid-tier (100K–500K followers)', text: 'Top-tier Creator Marketplace eligibility with priority campaign matching. Sponsored Reels typically $1,000–$10,000 each.' },
          { label: 'Macro tier (500K+ followers)', text: 'Multi-platform deal packages standard ($10,000+ per campaign). Direct outreach from Meta partner managers possible.' },
        ],
        feature: { label: 'Score your Instagram account health for brand deals', to: '/signup' },
        related: ['monetization-0', 'monetization-2'],
        keywords: ['instagram monetize', 'instagram followers needed', 'instagram monetize 2026', 'reels ad revenue share', 'creator marketplace eligibility'],
      },
      {
        q: 'What does a 100K-follower creator actually earn across all income streams in 2026?',
        a: 'A 100K-follower creator\'s 2026 income breaks into four stacked streams, and niche moves the totals far more than follower count. Sponsored posts pay $1,500–$5,000 per Instagram Reel for general lifestyle, but finance, fintech, and B2B SaaS micro-influencers regularly charge a 40–60% premium because finance CPMs run $40–$80 vs $15–$25 for lifestyle. TikTok Creator Rewards now pays $0.40–$1.00+ per 1,000 qualified views (a 20–30× jump from the retired Creator Fund), translating to $50–$500/month for most 100K–500K creators and $1,000+/month for finance, tech, and how-to channels at the top of the RPM band. Affiliate marketing adds $500–$5,000/month for general niches, with mid-tier creators in finance or beauty pulling $2,000–$15,000/month when conversion and AOV align. A one-time product or course launch to a 100K engaged audience commonly generates $10,000–$100,000 in revenue. Realistic full-time annual take, blended: $60K–$250K. Roughly 5.7% of creators clear $100K+/year, and almost all of them run three or more revenue streams with no single source above 30% of total income.',
        details: [
          { label: 'Sponsored posts — $1,500–$5,000/Reel', text: 'Finance, fintech, and B2B SaaS micros charge 40–60% more than lifestyle. CPMs: finance $40–$80, lifestyle $15–$25. Reels command 2–3× static-post rates.' },
          { label: 'TikTok Creator Rewards — $0.40–$1.00+ RPM', text: 'Entertainment/dance $0.30–$0.60, education/how-to $0.60–$1.00, finance/tech $1.00+. Most 100K–500K creators net $50–$500/month.' },
          { label: 'Affiliate — $500–$15,000/month', text: 'General niches $500–$5,000. Finance and beauty micros with strong conversion clear $2,000–$15,000. Commissions: fashion 10–15%, high-ticket 20–40%.' },
          { label: 'Product/course launch — $10K–$100K per launch', text: 'Mini-courses $97–$297 convert at 1–3%; flagship $497–$2,000+ programs at 0.5–1.5%. A 100K engaged list with one $297 launch at 1.5% = ~$44.5K gross.' },
          { label: 'Blended annual reality — $60K–$250K', text: 'Only 5.7% of creators clear $100K+/year. Those who do run 3+ revenue streams with no single source above 30% of income — diversification is the strongest predictor of full-time viability.' },
        ],
        feature: { label: 'Track which hooks and formats convert in your niche', to: '/signup' },
        related: ['monetization-1', 'monetization-4'],
        keywords: ['creator income', 'how much earn', '100k followers earnings 2026', 'sponsored post rates 2026', 'TikTok Creator Rewards RPM'],
      },
      {
        q: 'How do I get my first brand deal as a creator?',
        a: 'Most first brand deals come from outbound pitches, not inbound DMs, so readiness matters more than follower count. Brand managers vet three things before they reply: posting consistency in a single niche (30+ days, no gaps), engagement rate at or above your niche median (2%+ for nano, 3–6% for micro), and at least one post that crossed 50K views as social proof. The pitch itself is short — under 150 words, one specific content idea tied to a campaign they\'re already running, your three strongest metrics, and a sample link. The reason most creators get ghosted isn\'t the pitch wording; it\'s that the account they\'re pitching from doesn\'t pass a 30-second audit. Brand managers open your profile and scan for inconsistent cadence, comment quality, and whether your engagement is real or bot-inflated. Blossom runs the same audit on your account in seconds — engagement consistency, growth velocity, content mix, and viral hits — so you know exactly what a brand sees before you hit send. Pitch the ten brands you actually use, lead with the metric that\'s strongest, and follow up once after a week.',
        details: [
          { label: 'Readiness check', text: '30 days of consistent niche posting, engagement rate at or above your niche median, and one post above 50K views.' },
          { label: 'Pitch length', text: 'Under 150 words. One specific content idea tied to a current campaign, three best metrics, and a sample link — no media kit attachments.' },
          { label: '2026 starting rates', text: 'Nano (1–10K): $50–$500 per post. Micro (10–100K): $500–$5,000 per post. TikTok runs 10–30% below Instagram Reels at the same follower count.' },
          { label: 'Bundle pricing', text: 'Reel + Story + feed post bundles typically price at 2–3× a single post. Add usage rights and exclusivity as separate line items.' },
          { label: 'What gets you ghosted', text: 'Inconsistent posting cadence, generic comments under your top posts, and follower-to-engagement ratios that look bot-inflated.' },
          { label: 'Follow up', text: 'One follow-up after 7 days. After that, move on and pitch the next brand on your list.' },
        ],
        feature: { label: 'Run a free account-health audit', to: '/signup' },
        related: ['monetization-4', 'monetization-5'],
        keywords: ['first brand deal', 'pitch brands', 'sponsored', 'how to get first brand deal', 'pitch brands instagram', 'creator brand deal', 'micro influencer brand deal', 'influencer rates 2026'],
      },
      {
        q: 'What do brands actually look at before paying you in 2026?',
        a: 'Brand vetting in 2026 is a metrics-first audit, not a follower headcount. Marketers now run creators through five filters in this order before opening the checkbook. First, engagement rate measured against your niche median — Influencer Marketing Hub\'s 2026 benchmarks put healthy Instagram ER between 1–3% and TikTok between 5–9%, and brands flag anything more than 30% off-median as suspicious. Second, audience-buyer overlap: brands cross-reference your follower demographics, geography, and interest graph against their target customer profile, and reject creators below roughly 60% match. Third, content quality — production value, caption craft, and average view-through or retention on Reels and TikToks. Fourth, posting consistency over the trailing 90 days; ghost periods kill deals. Fifth, your last 5 sponsored posts versus your organic baseline — if branded content underperforms organic by more than 25%, brands assume your audience tunes out ads. Follower count is a distant sixth and frequently ignored entirely on tier-1 deals. Blossom audits all five of these criteria automatically: it benchmarks your engagement against your niche, tracks 90-day cadence, scores hook and retention quality on every post, and flags sponsored-vs-organic deltas so you can fix the gaps before a brand\'s vetting tool finds them.',
        details: [
          { label: 'Engagement vs niche median', text: 'Brands compare your ER to your category benchmark — IG 1–3%, TikTok 5–9% in 2026. Outliers above or below get flagged for bot or fatigue checks.' },
          { label: 'Audience-buyer match', text: 'Demographic, geographic, and interest overlap with the brand\'s customer profile. Most agencies require ~60%+ alignment before contracting.' },
          { label: 'Content quality and retention', text: 'Production, caption hook strength, and average watch-through. Sub-50% retention on short-form is the most common rejection reason.' },
          { label: '90-day posting consistency', text: 'Trailing-quarter cadence and gaps. Inconsistent or paused accounts signal risk and lose deals to steadier creators.' },
          { label: 'Sponsored vs organic delta', text: 'Your last 5 paid posts benchmarked against organic baseline. A drop steeper than ~25% indicates audience ad-fatigue and tanks repeat bookings.' },
        ],
        feature: { label: 'Audit your account on the same metrics brands use', to: '/signup' },
        related: ['monetization-3', 'engagement-0'],
        keywords: ['brands look at', 'brand requirements', 'what brands look at influencers 2026', 'brand vetting creators', 'creator account health score'],
      },
      {
        q: 'Is the creator economy still growing in 2026?',
        a: 'Yes — and the growth has accelerated, not slowed. The global creator economy hit $234B in 2026 and is on track for $528B by 2030 at a 22.5% CAGR, per Coherent Market Insights. Goldman Sachs projects $480B by 2027. U.S. creator ad spend alone is forecast at $43.9B in 2026, up 26% YoY. The bigger story: a "creator middle class" has emerged. 45.6% of creators now earn $10K–$100K annually, and mid-tier accounts (50K–250K followers) are pulling brand budgets that used to gate at 1M+. Brands report 47% of campaign wins come from this tier — because mid-sized audiences out-engage celebrity accounts and convert at higher rates. The creators winning in 2026 aren\'t shouting louder; they\'re decoding what makes a hook stop the scroll, which formats compound, and which tactics top performers reuse. Blossom is built for that exact segment.',
        details: [
          { label: 'Market size 2026', text: '$234B globally, projected $528B by 2030 (22.5% CAGR) — Coherent Market Insights.' },
          { label: 'U.S. ad spend', text: '$43.9B in 2026, up 26% YoY from $37B in 2025.' },
          { label: 'Mid-tier rates', text: '50K–75K creators now earn $1,000–$3,000 per sponsored video; 100K–500K tier commands $10K–$50K per post.' },
          { label: 'Where ROI lives', text: '47% of marketers report micro/mid-tier creators deliver their strongest campaign results — 64% have already partnered at this tier.' },
        ],
        feature: { label: 'Decode what\'s working for mid-tier creators', to: '/signup' },
        related: ['monetization-2', 'monetization-4'],
        keywords: ['creator economy', 'is creator growing', 'creator economy 2026', 'creator economy size 2026', 'mid-tier creator rates 2026'],
      },
      {
        q: 'Should a creator sign with an agency or stay independent in 2026?',
        a: 'In 2026, creator agencies typically take 15–25% of brand deal revenue, with nano-influencer agencies charging up to 35% and top-tier creators negotiating cuts as low as 10–15%. Some agencies layer on monthly retainers between $800 and $3,000 on top of commission. The math favors signing once you are earning roughly $50K+ annually from brand deals or losing 10–20 hours per week to pitching, contract review, exclusivity clauses, and net-60 invoice chasing. Below that, independence wins: you keep 100% of revenue and own the brand relationship. The honest test is not how many DMs you get, it is whether the agency\'s deal flow plus negotiated rate uplift (often 20–40% on exclusivity alone) exceeds their cut. Audit your last 90 days of brand revenue, hourly admin load, and inbound volume before you sign anything. A creator agency vs independent decision made on gut feel usually overpays the agency; a decision made on numbers usually does not.',
        details: [
          { label: 'Commission benchmark', text: 'Standard 2026 rates: 15–25% commission, with nano-tier agencies up to 35% and top creators at 10–15%.' },
          { label: 'Sign-on threshold', text: 'Agencies generally pay off once brand deal revenue clears ~$50K/year or admin work exceeds 10–20 hrs/week.' },
          { label: 'Hidden costs', text: 'Watch for $800–$3,000/month retainers stacked on top of commission and net-60 to net-90 payment terms.' },
          { label: 'Rate uplift offset', text: 'Good agents recover their cut by adding 20–40% for exclusivity and negotiating usage rights creators often miss.' },
          { label: 'Run the audit first', text: 'Pull 90 days of inbound requests, deal values, and hours spent on negotiation before signing any contract.' },
        ],
        feature: { label: 'Audit your account health for self-management or agency fit', to: '/signup' },
        related: ['monetization-3', 'monetization-4'],
        keywords: ['agency creator', 'manager', 'independent', 'creator agency vs independent', 'creator management commission 2026'],
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
        a: 'Blossom is an AI viral content analyzer for Instagram Reels and TikTok. Paste any public video URL and in 30 to 120 seconds Google Gemini 2.5 Pro breaks it down across five dimensions: visual, audio, narrative, engagement, and strategy. You see the exact hook, format, and tactic the creator used, where attention drops in the timeline, and what to change before you hit publish. Most content tools stop at vanity analytics. Blossom finishes the job by mapping every video against an index of 1.2M+ viral posts across 60+ niches, classified by 50K+ hooks, 1,200+ formats, and 800+ tactics, then turning those patterns into fresh, filmable scripts tuned to your niche. It works on non-English content, on creators with 1K followers and creators with 500K, and on any niche from finance to fitness to faceless pages. The Trends dashboard surfaces rising sounds with time-to-peak so you know when a trend is still climbing. Influencer Insights audits any public creator on demand.',
        details: [
          { label: 'Per-video breakdown', text: 'Hook, format, tactic, and a 5-dimension score (visual, audio, narrative, engagement, strategy) for any public Reel or TikTok in 30 to 120 seconds.' },
          { label: 'Pattern library', text: '1.2M+ indexed viral videos across 60+ niches, classified by 50K+ hooks, 1,200+ formats, and 800+ tactics — every score is benchmarked against what already worked.' },
          { label: 'Scripts you can shoot', text: '5 fresh, niche-tuned filmable scripts generated daily, built from the patterns Blossom sees winning right now.' },
          { label: 'Trends dashboard', text: 'Rising sounds and formats with time-to-peak signals, so you ride trends on the climb instead of after they crest.' },
          { label: 'Influencer Insights', text: 'Audit any public creator\'s catalog to see which hooks, formats, and posting cadences are actually driving their reach.' },
          { label: 'Built for working creators', text: 'For creators with 1K to 500K followers posting 3+ times a week. Free starter tier, Premium for solo creators, Platin unlocks the public API at /api/v1.' },
        ],
        feature: { label: 'Analyze your first video free', to: '/signup' },
        related: ['blossom-1', 'features-0'],
        keywords: ['what is blossom', 'blossom app', 'blossom platform', 'viral content analyzer', 'AI viral video analyzer', 'content analysis tool TikTok Instagram'],
      },
      {
        q: 'Blossom vs Virlo, Memories.ai, Viewstats, quso.ai, and ShortsNinja: what\'s actually different?',
        a: 'Most viral-content tools stop where Blossom starts. Virlo flags videos performing 12× above their niche baseline and reports on hooks, sentiment, and posting patterns. Viewstats, built by MrBeast\'s team, tracks YouTube competitors and thumbnails with a $49.99/month pro tier. Memories.ai indexes millions of hours of video with persistent chat and clip search. Quso.ai (formerly vidyo.ai) repurposes long videos into clips with CutMagic + Intelliclips. ShortsNinja automates the whole stack (script, AI visuals, voiceover, publish) on a credit pricing model. They are excellent at discovery, repurposing, or assembly. None close the loop from analysis to a script you\'d actually film. Blossom does three things those tools don\'t. First, it scores every video across five dimensions in parallel: visual, audio, narrative, engagement, and strategy, instead of a single hook or retention chart. Second, it ships a curated Format, Hook, and Tactic library so the patterns it surfaces are replicable structures, not raw analytics. Third, it generates five filmable scripts per day pre-scored against your specific niche, removing the blank-page problem. The result: comparison plus action, in one workflow.',
        details: [
          { label: '5-dimension parallel scoring', text: 'Visual, audio, narrative, engagement, and strategy are scored together. Virlo focuses on hooks and sentiment, Viewstats on thumbnails and outliers. None combine all five axes into one score.' },
          { label: 'Library of replicable structures', text: 'Hooks, Formats, and Tactics are classified by Gemini 2.5 Pro into a reusable taxonomy. Quso.ai gives you clips; Blossom gives you the structural blueprint behind the clip.' },
          { label: 'Five filmable scripts per day, pre-scored', text: 'Each script is pre-scored against your niche before you see it. Most hook generators output one-line hooks without saved history or niche scoring; Blossom outputs a full daily slate.' },
          { label: 'Influencer + trend insights tied to creation', text: 'Track an influencer or a trend, then push the pattern straight into a script. Competitor trackers stop at the dashboard. Blossom connects discovery to the next thing you film.' },
          { label: 'Versioned analysis', text: 'Re-analyze a video after an edit to see which dimension moved. Quso.ai and ShortsNinja optimize for production speed; Blossom optimizes for iteration quality.' },
        ],
        feature: { label: 'Start your free Blossom account', to: '/signup' },
        related: ['blossom-2', 'features-0'],
        keywords: ['blossom vs', 'compare blossom', 'alternative tools', 'blossom vs virlo', 'blossom vs memories.ai', 'viral analyzer comparison'],
      },
      {
        q: 'Who is Blossom for, and who is it not for?',
        a: 'Blossom is a viral analyzer for serious short-form creators on Instagram Reels and TikTok — typically accounts in the 1K–500K follower range who post 3+ times per week and want to stop guessing why one video hits and the next flops. It fits the mid-tier creator economy where 73% of brands now favor micro and mid-tier partnerships over macro deals, and where TikTok\'s algorithm has made watch time and hook strength matter more than raw follower count. If you\'re a UGC creator, faceless niche operator, social-first DTC brand, or an agency managing 5–50 creator accounts at once, Blossom is built for your workflow: hook breakdowns, format clustering, retention diagnostics, and tactic libraries that work across every account from one dashboard. Blossom is not the right tool for casual posters, creators publishing less than once a week, pure follower-growth bot users, or teams that only need scheduling and captions. It\'s also not aimed at celebrity-tier accounts with in-house data teams. If you post often, treat content like a business, and want to engineer the next viral, you\'re who Blossom was built for.',
        details: [
          { label: 'Solo creators (1K–500K followers)', text: 'Mid-tier and micro creators who post 3+ times a week on Reels or TikTok and need hook, format, and retention analysis to scale past plateaus.' },
          { label: 'Agencies and creator collectives', text: 'Teams managing 5–50 client accounts who need a single dashboard for cross-account trend detection, tactic libraries, and benchmark reporting.' },
          { label: 'Social-first brands and DTC', text: 'In-house social teams running owned creator handles or UGC programs who need to translate engagement signals into repeatable content formats.' },
          { label: 'Not built for', text: 'Casual posters, sub-weekly creators, scheduling-only users, and celebrity-tier accounts with dedicated data teams.' },
        ],
        feature: { label: 'Start analyzing your content — free signup', to: '/signup' },
        related: ['blossom-0', 'monetization-6'],
        keywords: ['who is blossom for', 'blossom audience', 'mid-tier creator analytics tool', 'tiktok hook analyzer for agencies'],
      },
      {
        q: 'How much does Blossom cost in 2026, and what\'s included in each plan?',
        a: 'Blossom uses a three-tier model designed to match where you are as a creator. The Free Starter lets you sample the AI hook, format, and tactic analysis without entering a card. Premium is built for solo creators publishing weekly on Instagram and TikTok and unlocks higher monthly analysis limits plus version tracking. Platin is the agency and operator tier and is the only plan with API access (X-API-Key), the Trend dashboard, and influencer-level insights for benchmarking competitors. Both paid tiers include a free trial with no charge at signup. Compared to short-form analytics tools that start at $49 to $82 per month with no free entry point and no included API, Blossom keeps a true free tier and reserves the API for Platin so you only pay for programmatic access if you actually need it.',
        details: [
          { label: 'Free Starter', text: 'No credit card. Limited monthly Instagram and TikTok analyses, full AI hook and format classification on each video, and access to your personal analysis history.' },
          { label: 'Premium', text: 'Free trial at signup. Higher monthly analysis quota, analysis versioning to compare reworked content against the original, tactic library, and audio breakdown.' },
          { label: 'Platin (includes API)', text: 'Free trial at signup. Everything in Premium plus influencer insights, the Trend dashboard, full public API via X-API-Key header at /api/v1, and the highest analysis limits.' },
          { label: 'Free trial details', text: 'Premium and Platin start with a trial period, you are not charged at signup, and you can cancel before the trial ends. Live pricing is on the /#pricing page.' },
        ],
        feature: { label: 'See current pricing and start a free trial', to: '/#pricing' },
        related: ['privacy-3', 'privacy-4'],
        keywords: ['pricing', 'cost', 'how much', 'blossom price 2026', 'blossom pricing tiers', 'blossom platin api'],
      },
      {
        q: 'Does Blossom analyze Instagram, TikTok, or both — and what about YouTube Shorts?',
        a: 'Both. Blossom is built natively for Instagram and TikTok — the two short-form ecosystems that drive the majority of viral video discovery today. Each integration uses a dedicated partner tier rather than scraping: HikerAPI for Instagram (Reels, carousels, image posts) and LamaTok for TikTok. That means accurate creator metadata, reliable view and engagement counts, and stable thumbnail and media URLs that won\'t break when platforms rotate signed URLs. Once a video is pulled in, the same multi-stage Gemini 2.5 Pro pipeline runs across both platforms: hook classification, format detection, tactic extraction, and audio analysis via Meyda and FFmpeg for beat drops, energy curves, and section boundaries. Results sit in one library, so you can compare an Instagram Reel hook against a TikTok hook side-by-side without switching tools or normalizing data yourself. YouTube Shorts is on the public roadmap but is not live yet — we\'d rather ship native Shorts support with the same depth than offer a thin metadata-only integration. If Shorts is a hard requirement for your workflow today, Blossom isn\'t the right fit yet; if Instagram and TikTok are where your audience lives, the cross-platform comparison is the core strength.',
        details: [
          { label: 'Instagram coverage', text: 'Reels, carousels, and image posts via HikerAPI\'s official partner tier — not browser scraping.' },
          { label: 'TikTok coverage', text: 'Full short-form video metadata, audio tracks, and engagement metrics via LamaTok.' },
          { label: 'Unified analysis layer', text: 'Same Gemini pipeline, hook taxonomy, and audio analysis run across both platforms for apples-to-apples comparison.' },
          { label: 'YouTube Shorts', text: 'Publicly on the roadmap, not currently supported — we ship native depth, not surface-level integrations.' },
        ],
        feature: { label: 'Start analyzing Instagram and TikTok', to: '/signup' },
        related: ['ai-analysis-0', 'ai-analysis-1'],
        keywords: ['instagram tiktok', 'which platforms', 'platform support', 'blossom instagram tiktok', 'viral analyzer instagram tiktok'],
      },
      {
        q: 'Do I need to connect my social accounts to use Blossom?',
        a: 'No. Connecting an Instagram or TikTok account is never required. Blossom works on any public video URL the moment you sign up — paste a link, get a full Gemini-powered breakdown of the hook, format, pacing, audio, and viral tactics. No OAuth handshake, no read or write permissions on your profile, no posting on your behalf. This matters because a 2025 Norton report found that 60% of social-media data breaches involved insecure third-party app connections, and a TechCrunch analysis the same year tracked a 30–35% jump in Instagram account restrictions tied to non-compliant tools. Survey data from Sociallyin shows 73% of TikTok users are concerned about third-party data sharing — so we built Blossom to remove that decision entirely. Public URLs only, public metadata only. If you later decide you want personalized layers — follower-active heatmaps, post-by-post benchmarking against your own back catalog, breakout-video alerts, and competitor watchlists tied to your niche — connecting an account unlocks them through official, read-only APIs with scopes you can revoke in one click.',
        details: [
          { label: 'What works with zero connection', text: 'Full hook/format/tactic analysis, audio and pacing breakdown, transcript, trend matching, and improvement suggestions — for any public Instagram Reel or TikTok URL.' },
          { label: 'What we never request', text: 'No password, no posting permission, no DMs, no follower lists, no email scraping. Public endpoints only — the same data anyone with the link can see.' },
          { label: 'What connecting later unlocks', text: 'Personalized follower-active heatmaps, post-by-post benchmarking against your own history, breakout-video alerts, and niche competitor tracking.' },
          { label: 'Revoke anytime', text: 'Connections use official read-only API scopes. One click in account settings disconnects and purges the linked feed — no support ticket, no waiting period.' },
        ],
        feature: { label: 'Sign up — no account connection needed', to: '/signup' },
        related: ['privacy-0', 'privacy-1'],
        keywords: ['connect account', 'do i need to connect', 'analyze TikTok without login', 'Instagram analysis no OAuth'],
      },
      {
        q: 'How do I get started with Blossom in 5 minutes (no credit card required)?',
        a: 'Blossom\'s quickstart is built around immediate value: you see your first full content analysis before you\'ve finished configuring your account. Sign up at /signup with just an email — no credit card required on the free trial, which removes the single biggest source of signup abandonment in SaaS funnels. From the moment you land in the app, the flow is linear: pick your niche, paste a public Instagram Reel or TikTok URL, and Blossom runs its 5-dimension analysis (hook, format, retention, tactics, audio) in under 90 seconds. You\'ll see a numeric score, a weakness breakdown explaining exactly which dimension is dragging the video down, and three concrete improvements you can apply to your next post. Step five closes the loop: Blossom generates today\'s filmable scripts personalized to your niche, so you don\'t just leave with diagnostics — you leave with content to shoot. Total time from landing page to first script: under five minutes. No setup wizard, no demo call, no payment wall before you\'ve validated the product works for your niche.',
        details: [
          { label: 'Sign up in under 30 seconds', text: 'Hit /signup, enter your email, and confirm. No credit card, no billing form, no sales-call gate on the free trial — the friction points that kill most SaaS funnels are removed.' },
          { label: 'Pick your niche once', text: 'Choose your primary niche from the category picker. This single selection personalizes scoring weights, script suggestions, and trend surfacing for the rest of your session.' },
          { label: 'Paste a public IG or TikTok URL', text: 'Drop in any public Reel or TikTok link. Blossom fetches the video, runs the full 5-dimension analysis in under 90 seconds, and returns a score with a per-dimension breakdown.' },
          { label: 'Read your weakness breakdown', text: 'Skip the dashboard tour. The analysis page surfaces your weakest dimension first and lists three specific, actionable fixes ranked by expected impact on retention.' },
          { label: 'Get 5 filmable scripts for today', text: 'Step five hands you five scripts personalized to your niche, calibrated against the patterns that won in the analyzed video. Pick one and shoot — that\'s the entire onboarding.' },
        ],
        feature: { label: 'Start free — no card required', to: '/signup' },
        related: ['blossom-0', 'features-3'],
        keywords: ['get started', 'onboarding', 'how to start', 'blossom quickstart 5 minutes', 'blossom free trial no credit card'],
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
  const tocAsideRef = useRef<HTMLElement>(null)
  const [tocFixed, setTocFixed] = useState<{ left: number; show: boolean }>({ left: 0, show: false })

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

  // Fixed TOC sidebar — pin to viewport left as user scrolls past the hero.
  // We use position: fixed (driven by JS) instead of sticky because an
  // overflow-x ancestor would otherwise break sticky positioning.
  useEffect(() => {
    function updateTocPosition() {
      if (!tocAsideRef.current) return
      const rect = tocAsideRef.current.getBoundingClientRect()
      const section = tocAsideRef.current.closest('section')
      if (!section) {
        setTocFixed({ left: rect.left, show: false })
        return
      }
      const sectionRect = section.getBoundingClientRect()
      // Show the TOC while the questions section is meaningfully in view
      const show = sectionRect.top < 180 && sectionRect.bottom > 400
      setTocFixed({ left: rect.left, show })
    }
    updateTocPosition()
    window.addEventListener('scroll', updateTocPosition, { passive: true })
    window.addEventListener('resize', updateTocPosition)
    return () => {
      window.removeEventListener('scroll', updateTocPosition)
      window.removeEventListener('resize', updateTocPosition)
    }
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
    visibleCategories.forEach((cat) =>
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
          {/* Desktop sidebar TOC — fixed-positioned for guaranteed pinning */}
          <aside
            ref={tocAsideRef}
            className="hidden lg:block w-64 flex-shrink-0"
            aria-label="Table of contents"
          >
            <div
              className={`fixed top-44 w-64 z-30 transition-opacity duration-300 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 ${
                tocFixed.show ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ left: `${tocFixed.left}px` }}
            >
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
