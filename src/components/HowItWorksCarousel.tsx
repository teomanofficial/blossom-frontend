import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

interface ExampleVideo {
  id: number
  platform: string
  username: string
  thumbnail_url: string
  views: number
  engagement_rate: number
}

interface ExampleVideosData {
  format: ExampleVideo[]
  hook: ExampleVideo[]
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const DEMO_DATA = {
  step1: {
    url: 'instagram.com/reel/CxK9mN2...',
    creator: '@lifestyle.sarah',
    caption: 'Morning routine that changed my life...',
    duration: '0:34',
    views: '12K',
  },
  step2: {
    viralityScore: 55,
    optimizationScore: 52,
    scores: {
      hook_power: 22,
      retention_strength: 45,
      emotional_impact: 68,
      shareability: 41,
      tactic_execution: 57,
    },
    formatClass: 'Comedy Sketch',
    formatClassId: 678,
    hookClass: 'Curiosity Gap',
    hookClassId: 745,
    formatLifecycle: 'rising' as const,
    hookLifecycle: 'peaking' as const,
    tabs: [
      { name: 'Improvements', icon: '🚀', count: 12 },
      { name: 'Hook', icon: '🧲' },
      { name: 'Structure', icon: '📐' },
      { name: 'Tactics', icon: '♟️', count: 8 },
      { name: 'Emotions', icon: '❤️' },
      { name: 'Virality', icon: '🔥' },
      { name: 'Weaknesses', icon: '⚠️', count: 5 },
      { name: 'Comments', icon: '💬' },
    ],
    tactics: [
      { name: 'Pattern Interrupt', category: 'hook_visual', score: 82 },
      { name: 'Curiosity Gap', category: 'hook_text', score: 34 },
      { name: 'Fast Cuts', category: 'pacing', score: 71 },
      { name: 'Emotional Payoff', category: 'emotional', score: 63 },
      { name: 'Text Hook', category: 'text_overlay', score: 45 },
    ],
    weakness: {
      title: 'Lack of clear narrative or story',
      impact: 'The video lacks a compelling narrative hook, which limits deeper engagement.',
      fix: 'Incorporate a brief personal anecdote to add a relatable element.',
    },
    beforeAfter: {
      section: 'Hook',
      before: '"Hey guys, so today I wanted to talk about..."',
      after: '"I lost 50K followers in one week. Here\'s what I learned."',
    },
  },
  step3: {
    title: 'The 3-Second Pattern Interrupt That Gets 2M Views',
    hook: 'Start with an unexpected close-up of the final result, hold for 1.5 seconds, then smash-cut to the very beginning of the process. Add a text overlay: "Wait for it..."',
    format: 'Reveal',
    difficulty: 'Easy',
    viralProbability: 'HIGH',
    sourceCount: 876,
  },
}

const steps = [
  {
    number: '01',
    tab: 'Drop a Link',
    headline: 'Your last post had 12 fixable mistakes',
    description:
      "Paste any Instagram Reel or TikTok URL. That's it. In 60 seconds, you'll see every hidden mistake that's costing you views.",
  },
  {
    number: '02',
    tab: 'See Every Mistake',
    headline: 'We found 12 things killing your views',
    description:
      '8 layers of AI analysis. Hook power, retention curves, emotional architecture, tactic execution, virality signals — each scored, benchmarked, and rewritten for you.',
  },
  {
    number: '03',
    tab: 'Get Your Playbook',
    headline: 'Your competitors already use these patterns',
    description:
      "Get ready-to-film scripts, trending hooks, and format blueprints — all based on what's actually going viral in your niche right now.",
  },
]

function ScoreGauge({ score, animate }: { score: number; animate: boolean }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!animate) {
      setCurrent(0)
      return
    }
    let start = 0
    const increment = score / (1500 / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= score) {
        setCurrent(score)
        clearInterval(timer)
      } else {
        setCurrent(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [score, animate])

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (current / 100) * circumference

  return (
    <div className="relative w-16 h-16 sm:w-28 sm:h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-100"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl sm:text-3xl font-black text-white">{current}</span>
        <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">/100</span>
      </div>
    </div>
  )
}

function ProgressBar({ animate, onComplete }: { animate: boolean; onComplete?: () => void }) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  const stages = [
    { label: 'Upload', done: true },
    { label: 'Video', done: true },
    { label: 'Hook', done: false },
    { label: 'Score', done: false },
  ]

  useEffect(() => {
    if (!animate) {
      setProgress(0)
      setCurrentStage(0)
      return
    }
    let p = 0
    const timer = setInterval(() => {
      p += 0.4
      if (p >= 100) {
        setProgress(100)
        setCurrentStage(4)
        clearInterval(timer)
        if (onComplete) setTimeout(onComplete, 800)
      } else {
        setProgress(Math.floor(p))
        if (p > 75) setCurrentStage(3)
        else if (p > 50) setCurrentStage(2)
        else if (p > 25) setCurrentStage(1)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [animate])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 font-bold flex items-center gap-2">
          {progress < 100 ? (
            <svg className="w-4 h-4 text-pink-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {progress < 100 ? 'Analyzing Hook Patterns...' : 'Analysis Complete!'}
        </span>
        <span className={`font-mono text-[11px] ${progress >= 100 ? 'text-emerald-400 font-black' : 'text-slate-500'}`}>{progress}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-1">
            {i > 0 && <div className="w-4 sm:w-6 h-px bg-white/10" />}
            <div className="flex items-center gap-1">
              {i < currentStage ? (
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : i === currentStage ? (
                <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              )}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${i < currentStage ? 'text-green-400/70' : i === currentStage ? 'text-white/70' : 'text-slate-600'}`}
              >
                {stage.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step1Mockup({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span className="text-sm text-white/60 font-medium truncate">{DEMO_DATA.step1.url}</span>
        <button className="ml-auto px-4 py-1.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-black rounded-xl flex-shrink-0 shadow-lg shadow-pink-500/20">
          Analyze
        </button>
      </div>

      {/* Video Preview Card */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          <img src="/landing-cover.jpg" alt="" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60" />
          <svg className="w-5 h-5 text-white relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white/90 truncate">{DEMO_DATA.step1.creator}</div>
          <div className="text-xs text-slate-500 font-medium truncate">{DEMO_DATA.step1.caption}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-slate-600">▶ {DEMO_DATA.step1.duration}</span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] font-bold text-slate-600">{DEMO_DATA.step1.views} views</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
        <ProgressBar animate={active} onComplete={onComplete} />
      </div>
    </div>
  )
}

function ScoreBar({ label, value, animate, delay = 0 }: { label: string; value: number; animate: boolean; delay?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!animate) { setCurrent(0); return }
    const timeout = setTimeout(() => {
      let start = 0
      const inc = value / (800 / 16)
      const timer = setInterval(() => {
        start += inc
        if (start >= value) { setCurrent(value); clearInterval(timer) }
        else setCurrent(Math.floor(start))
      }, 16)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, animate, delay])

  const color = current >= 70 ? 'from-emerald-500 to-teal-400' : current >= 45 ? 'from-amber-500 to-orange-400' : 'from-red-500 to-orange-500'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-[10px] font-bold text-slate-500 w-16 sm:w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-300`} style={{ width: `${current}%` }} />
      </div>
      <span className="text-[10px] font-black text-white/70 w-6 text-right">{current}</span>
    </div>
  )
}

const tacticCategoryColors: Record<string, string> = {
  hook_visual: 'bg-pink-500/20 text-pink-400',
  hook_text: 'bg-blue-500/20 text-blue-400',
  pacing: 'bg-teal-500/20 text-teal-400',
  emotional: 'bg-rose-500/20 text-rose-400',
  text_overlay: 'bg-cyan-500/20 text-cyan-400',
}

function ExampleVideoRow({ videos, label }: { videos: ExampleVideo[]; label: string }) {
  if (!videos || videos.length === 0) return null
  return (
    <div className="mt-1.5 sm:mt-2">
      <div className="text-[6px] sm:text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</div>
      <div className="flex gap-1 sm:gap-1.5 overflow-hidden">
        {videos.slice(0, 4).map((v) => {
          const src = getStorageUrl(v.thumbnail_url)
          return (
            <div key={v.id} className="relative w-8 h-8 sm:w-12 sm:h-12 rounded sm:rounded-lg overflow-hidden flex-shrink-0 group">
              {src ? (
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/[0.06]" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[6px] sm:text-[7px] font-black text-white">{formatViewCount(v.views)}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-0.5 hidden sm:block">
                <span className="text-[6px] font-bold text-white/80 truncate block">@{v.username}</span>
              </div>
            </div>
          )
        })}
        {videos.length > 4 && (
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded sm:rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <span className="text-[7px] sm:text-[8px] font-bold text-slate-500">+{videos.length - 4}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Step2Mockup({ active, exampleVideos }: { active: boolean; exampleVideos?: ExampleVideosData }) {
  const d = DEMO_DATA.step2
  const formatVideos = exampleVideos?.format || []
  const hookVideos = exampleVideos?.hook || []
  return (
    <div className="space-y-2.5">
      {/* Row 1: Dual Scores + Format/Hook Classification */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {/* Virality Score */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
          <ScoreGauge score={d.viralityScore} animate={active} />
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[9px] font-black text-orange-400 uppercase tracking-widest">Virality</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">Average</div>
          </div>
        </div>
        {/* Optimization Score */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
          <ScoreGauge score={d.optimizationScore} animate={active} />
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[9px] font-black text-violet-400 uppercase tracking-widest truncate">Optimize</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 truncate">Room to grow</div>
          </div>
        </div>
        {/* Format Class */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">⊞ Format</div>
          <div className="text-[11px] sm:text-xs font-black text-white/90 truncate">{d.formatClass}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[7px] sm:text-[8px] font-bold text-emerald-400/80 capitalize">{d.formatLifecycle}</span>
            <span className="text-[7px] sm:text-[8px] text-slate-600 ml-auto">278</span>
          </div>
          <ExampleVideoRow videos={formatVideos} label="Review Examples" />
        </div>
        {/* Hook Class */}
        <div className="p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">⊞ Hook</div>
          <div className="text-[11px] sm:text-xs font-black text-white/90 truncate">{d.hookClass}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[7px] sm:text-[8px] font-bold text-amber-400/80 capitalize">{d.hookLifecycle}</span>
            <span className="text-[7px] sm:text-[8px] text-slate-600 ml-auto">189</span>
          </div>
          <ExampleVideoRow videos={hookVideos} label="Review Examples" />
        </div>
      </div>

      {/* Row 2: Score Breakdown + Analysis Tabs side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Score Breakdown */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Score Breakdown</div>
          <ScoreBar label="Hook" value={d.scores.hook_power} animate={active} delay={200} />
          <ScoreBar label="Retention" value={d.scores.retention_strength} animate={active} delay={350} />
          <ScoreBar label="Emotion" value={d.scores.emotional_impact} animate={active} delay={500} />
          <ScoreBar label="Share" value={d.scores.shareability} animate={active} delay={650} />
          <ScoreBar label="Tactics" value={d.scores.tactic_execution} animate={active} delay={800} />
        </div>
        {/* Analysis Tabs + Before/After */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Deep Dive Analysis</div>
            <div className="flex flex-wrap gap-1">
              {d.tabs.map((tab, i) => (
                <div
                  key={tab.name}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-bold ${
                    i === 0 ? 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30' : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <span className="text-[10px]">{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.count && (
                    <span className={`ml-0.5 px-1 py-0.5 rounded text-[7px] font-black ${
                      i === 0 ? 'bg-pink-500/20 text-pink-300' : 'bg-white/[0.06] text-slate-500'
                    }`}>{tab.count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Before/After Rewrite */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Before / After</div>
              <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-violet-500/15 text-violet-400">{d.beforeAfter.section}</span>
            </div>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-red-500/8 border border-red-500/15">
                <span className="text-[8px] font-black text-red-400 uppercase tracking-wider">Before</span>
                <p className="text-[10px] text-red-300/70 font-medium mt-0.5 leading-snug">{d.beforeAfter.before}</p>
              </div>
              <div className="p-2 rounded-lg bg-teal-500/8 border border-teal-500/15">
                <span className="text-[8px] font-black text-teal-400 uppercase tracking-wider">After</span>
                <p className="text-[10px] text-teal-300/70 font-medium mt-0.5 leading-snug">{d.beforeAfter.after}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Tactics — full width, compact horizontal */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detected Tactics</div>
          <span className="text-[8px] font-bold text-slate-600">{d.tactics.length} of 15 categories</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-1.5">
          {d.tactics.map((t) => (
            <div key={t.name} className="flex items-center gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg bg-white/[0.02]">
              <span className={`px-1 py-0.5 rounded text-[6px] sm:text-[7px] font-black uppercase tracking-wider flex-shrink-0 ${tacticCategoryColors[t.category] || 'bg-white/10 text-slate-400'}`}>
                {t.category.replace('_', ' ')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/80 truncate">{t.name}</span>
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                <div className="w-6 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${t.score >= 70 ? 'bg-emerald-400' : t.score >= 45 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${t.score}%` }} />
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-500">{t.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3Mockup({ active }: { active: boolean }) {
  const d = DEMO_DATA.step3
  return (
    <div className="space-y-4">
      {/* Suggestion Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        {/* Top badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 text-[10px] font-black uppercase tracking-wider">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
            Trending
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            Viral: {d.viralProbability}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base sm:text-lg font-black text-white/95 leading-snug">{d.title}</h4>

        {/* Hook Script */}
        <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2">Suggested Hook</div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">{d.hook}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs font-bold text-slate-300">
            Format: {d.format}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-xs font-bold text-teal-400">
            Difficulty: {d.difficulty}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs font-bold text-slate-400">
            Based on {d.sourceCount} viral videos
          </span>
        </div>

        {/* Script dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i < 3
                  ? 'w-2 h-2 bg-pink-400/60'
                  : `w-2 h-2 bg-white/10 ${active ? 'animate-pulse' : ''}`
              } ${i === 0 ? 'bg-pink-400' : ''}`}
            />
          ))}
          <span className="text-[9px] font-bold text-slate-600 ml-1">3 of 5 scripts</span>
        </div>
      </div>

      {/* CTA */}
      <a
        href="/signup"
        className="block w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-black text-sm sm:text-base rounded-2xl text-center glow-button shadow-xl shadow-pink-500/20 hover:scale-[1.02] transition-transform"
      >
        Get Viral Free
        <svg className="w-4 h-4 inline-block ml-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
        </svg>
      </a>
      <p className="text-emerald-400/80 text-xs font-medium text-center flex items-center justify-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        No payment due now
      </p>
    </div>
  )
}

export default function HowItWorksCarousel() {
  const [activeStep, setActiveStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [exampleVideos, setExampleVideos] = useState<ExampleVideosData>()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { formatClassId, hookClassId } = DEMO_DATA.step2
    apiFetch(`/api/landing/example-videos?formatId=${formatClassId}&hookId=${hookClassId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setExampleVideos(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const switchStep = (idx: number) => {
    if (idx === activeStep || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setActiveStep(idx)
      setTimeout(() => setTransitioning(false), 50)
    }, 200)
  }

  const mockups = [
    <Step1Mockup active={isVisible && activeStep === 0} onComplete={() => switchStep(1)} />,
    <Step2Mockup active={isVisible && activeStep === 1} exampleVideos={exampleVideos} />,
    <Step3Mockup active={isVisible && activeStep === 2} />,
  ]

  return (
    <section id="system" className="py-16 sm:py-24 md:py-32 px-3 sm:px-6 bg-white/[0.02] relative z-10" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">THE SYSTEM</h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-medium">
            Three steps. Zero guesswork. Maximum influence.
          </p>
        </div>

        {/* Main Container */}
        <div
          className={`glass-card rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] p-3 sm:p-6 md:p-10 relative overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Background glow */}
          <div
            className="absolute -inset-4 pointer-events-none transition-all duration-700"
            style={{
              background:
                activeStep === 0
                  ? 'radial-gradient(circle at 70% 50%, rgba(168,85,247,0.08) 0%, transparent 60%)'
                  : activeStep === 1
                    ? 'radial-gradient(circle at 70% 50%, rgba(239,68,68,0.08) 0%, transparent 60%)'
                    : 'radial-gradient(circle at 70% 50%, rgba(244,114,182,0.08) 0%, transparent 60%)',
            }}
          />

          {/* Tab Navigation */}
          <div className="relative mb-4 sm:mb-8 md:mb-10">
            <div className="flex overflow-x-auto no-scrollbar gap-0.5 sm:gap-2">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => switchStep(idx)}
                  className={`flex-1 px-2 sm:px-5 py-2 sm:py-4 rounded-lg sm:rounded-2xl text-left transition-all duration-300 relative ${
                    activeStep === idx
                      ? 'bg-white/[0.06]'
                      : 'bg-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-3 justify-center sm:justify-start">
                    <span
                      className={`text-base sm:text-2xl font-black transition-colors duration-300 ${
                        activeStep === idx ? 'gradient-text' : 'text-slate-700'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span
                      className={`text-[10px] sm:text-sm font-bold transition-colors duration-300 whitespace-nowrap ${
                        activeStep === idx ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {step.tab}
                    </span>
                  </div>
                  {/* Active indicator line */}
                  {activeStep === idx && (
                    <div className="absolute bottom-0 left-2 right-2 sm:left-5 sm:right-5 h-[2px] bg-gradient-to-r from-pink-500 to-orange-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area — Step 2 uses full width, Steps 1 & 3 use split layout */}
          {activeStep === 1 ? (
            /* Step 2: Full-width layout */
            <div className={`transition-all duration-300 ${transitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
              {/* Inline header */}
              <div className="mb-4 sm:mb-5">
                <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white/95">
                  {steps[activeStep]!.headline}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1 sm:mt-1.5 max-w-lg">
                  {steps[activeStep]!.description}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    8 dimensions
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Before/after rewrites
                  </div>
                </div>
              </div>
              {mockups[activeStep]}
            </div>
          ) : (
            /* Steps 1 & 3: Split layout */
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-12">
              {/* Left: Text */}
              <div
                className={`w-full lg:w-5/12 space-y-4 sm:space-y-5 transition-all duration-300 ${transitioning ? 'opacity-0 -translate-x-3' : 'opacity-100 translate-x-0'}`}
              >
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white/95">
                  {steps[activeStep]!.headline}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
                  {steps[activeStep]!.description}
                </p>

                {/* Step-specific detail */}
                <div className="pt-2">
                  {activeStep === 0 && (
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-[#0a0a12] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                          </svg>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#0a0a12] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.12V9.01a6.27 6.27 0 00-1-.08A6.27 6.27 0 003 15.2a6.27 6.27 0 006.28 6.28 6.27 6.27 0 006.28-6.28V8.78a8.18 8.18 0 004.03 1.05v-3.4s-1.8.17-4-.74z" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-xs font-bold">Works with Instagram & TikTok</span>
                    </div>
                  )}
                  {activeStep === 2 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      5 fresh scripts generated daily
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Mockup */}
              <div
                className={`w-full lg:w-7/12 transition-all duration-300 ${transitioning ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'}`}
              >
                {mockups[activeStep]}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
