/* ── Dashboard Section Skeletons ── */
import type { CSSProperties } from 'react'

function Pulse({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} style={style} />
}

export function FeaturedSuggestionSkeleton() {
  return (
    <div className="glass-card p-5 sm:p-8 lg:p-10 mb-8 lg:mb-12 animate-pulse">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Pulse className="h-3 w-32 rounded-full" />
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <Pulse className="h-8 sm:h-10 w-3/4 mb-3 sm:mb-4 rounded-lg" />
      <Pulse className="h-4 w-full mb-2 rounded" />
      <Pulse className="h-4 w-2/3 mb-5 sm:mb-8 rounded" />
      <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
        <Pulse className="h-6 w-16 rounded-full" />
        <Pulse className="h-6 w-24 rounded-full" />
        <Pulse className="h-6 w-20 rounded-full" />
      </div>
      <Pulse className="h-12 sm:h-14 w-48 rounded-2xl" />
    </div>
  )
}

export function TopVideosSkeleton() {
  return (
    <div className="glass-card p-5 sm:p-7 mb-8 lg:mb-12 animate-pulse">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <Pulse className="w-4 h-4 rounded" />
          <Pulse className="h-5 w-40 rounded" />
        </div>
        <Pulse className="h-3 w-16 rounded" />
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-hidden -mx-5 px-5 sm:-mx-7 sm:px-7">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="shrink-0 w-[130px] sm:w-[160px]">
            <Pulse className="aspect-[9/16] rounded-2xl" />
            <Pulse className="h-2.5 w-20 mt-1.5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 px-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Pulse className="w-5 h-3 rounded" />
        <Pulse className="h-3.5 w-32 sm:w-48 rounded" />
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <Pulse className="h-3 w-12 rounded" />
        <Pulse className="h-3 w-10 rounded" />
      </div>
    </div>
  )
}

function ListSectionSkeleton({ icon, iconBg, title }: { icon: string; iconBg: string; title: string }) {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center`}>
            <i className={`fas ${icon} text-xs opacity-30`} />
          </div>
          <span className="text-sm sm:text-base font-bold opacity-30">{title}</span>
        </div>
        <Pulse className="h-2.5 w-14 rounded" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }, (_, i) => <ListRowSkeleton key={i} />)}
      </div>
    </div>
  )
}

export function FormatsListSkeleton() {
  return <ListSectionSkeleton icon="fa-fire" iconBg="bg-orange-500/20" title="Formats" />
}

export function HooksListSkeleton() {
  return <ListSectionSkeleton icon="fa-magnet" iconBg="bg-purple-500/20" title="Winning Hooks" />
}

export function TrendingSoundsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-music text-xs opacity-30" />
          </div>
          <span className="text-sm sm:text-base font-bold opacity-30">Trending Sounds</span>
        </div>
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 px-3">
            <Pulse className="w-10 h-10 rounded-lg shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-28 sm:w-36 rounded" />
              <Pulse className="h-2.5 w-20 rounded" />
            </div>
            <div className="text-right space-y-1 shrink-0">
              <Pulse className="h-3 w-12 rounded" />
              <Pulse className="h-2.5 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TacticsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-bullseye text-xs opacity-30" />
          </div>
          <span className="text-sm sm:text-base font-bold opacity-30">Proven Tactics</span>
        </div>
        <Pulse className="h-2.5 w-14 rounded" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-32 sm:w-44 rounded" />
              <Pulse className="h-2.5 w-16 rounded" />
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <Pulse className="h-3 w-12 rounded" />
              <Pulse className="h-3 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KeywordCloudSkeleton() {
  const widths = [60, 45, 80, 55, 70, 40, 90, 50, 65, 75, 48, 85]
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-cloud text-xs opacity-30" />
          </div>
          <span className="text-sm sm:text-base font-bold opacity-30">Trending Topics</span>
        </div>
        <Pulse className="h-2.5 w-14 rounded" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-2">
        {widths.map((w, i) => (
          <Pulse key={i} className="h-5 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  )
}

export function AccountsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-chart-line text-xs opacity-30" />
        </div>
        <span className="text-sm sm:text-base font-bold opacity-30">Your Accounts</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white/[0.04] rounded-2xl p-4 space-y-2">
          <Pulse className="h-2.5 w-20 rounded" />
          <Pulse className="h-7 w-8 rounded" />
        </div>
        <div className="bg-white/[0.04] rounded-2xl p-4 space-y-2">
          <Pulse className="h-2.5 w-20 rounded" />
          <Pulse className="h-7 w-16 rounded" />
        </div>
      </div>
      <Pulse className="h-4 w-32 mx-auto mt-4 rounded" />
    </div>
  )
}

export function HashtagsSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-5 sm:p-7 animate-pulse">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-hashtag text-xs opacity-30" />
        </div>
        <span className="text-sm sm:text-base font-bold opacity-30">Top Hashtags</span>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-white/[0.04] rounded-xl px-3 py-2 space-y-1.5">
            <Pulse className="h-3.5 w-16 sm:w-20 rounded" />
            <Pulse className="h-2.5 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
