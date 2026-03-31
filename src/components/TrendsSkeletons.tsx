import { type ComponentType } from 'react'

/* ── Post Card Skeleton (9:16 portrait) ── */
export function PostCardSkeleton() {
  return (
    <div className="shrink-0 w-[130px] sm:w-[160px]">
      <div className="aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/5 animate-pulse">
        <div className="w-full h-full bg-white/5 relative">
          <div className="absolute top-2 left-2 w-10 h-4 bg-white/5 rounded" />
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5">
            <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
            <div className="flex gap-2">
              <div className="h-2.5 bg-white/5 rounded w-10" />
              <div className="h-2.5 bg-white/5 rounded w-8" />
            </div>
          </div>
        </div>
      </div>
      <div className="h-2.5 bg-white/5 rounded w-2/3 mt-1.5 mx-1 animate-pulse" />
    </div>
  )
}

/* ── Format Card Skeleton ── */
export function FormatCardSkeleton() {
  return (
    <div className="shrink-0 w-[200px] sm:w-[220px] glass-card rounded-xl p-4 border border-white/5 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 bg-white/5 rounded" />
        <div className="h-4 bg-white/5 rounded-full w-16" />
      </div>
      <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
      <div className="flex items-center gap-3 mt-2">
        <div className="h-2.5 bg-white/5 rounded w-14" />
        <div className="h-2.5 bg-white/5 rounded w-14" />
      </div>
    </div>
  )
}

/* ── Hook Card Skeleton (same layout as format) ── */
export function HookCardSkeleton() {
  return (
    <div className="shrink-0 w-[200px] sm:w-[220px] glass-card rounded-xl p-4 border border-white/5 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 bg-white/5 rounded" />
        <div className="h-4 bg-white/5 rounded-full w-16" />
      </div>
      <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
      <div className="flex items-center gap-3 mt-2">
        <div className="h-2.5 bg-white/5 rounded w-14" />
        <div className="h-2.5 bg-white/5 rounded w-14" />
      </div>
    </div>
  )
}

/* ── Content Card Skeleton (thumbnail collage + text) ── */
export function ContentCardSkeleton() {
  return (
    <div className="shrink-0 w-[180px] sm:w-[200px] glass-card rounded-xl overflow-hidden border border-white/5 animate-pulse">
      <div className="h-[100px] bg-white/5 relative">
        <div className="absolute bottom-2 left-2">
          <div className="h-3 bg-white/5 rounded w-12" />
        </div>
      </div>
      <div className="p-3">
        <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
        <div className="flex items-center gap-3">
          <div className="h-2.5 bg-white/5 rounded w-16" />
          <div className="h-2.5 bg-white/5 rounded w-10" />
        </div>
      </div>
    </div>
  )
}

/* ── Song Card Skeleton (square cover + text) ── */
export function SongCardSkeleton() {
  return (
    <div className="shrink-0 w-[170px] sm:w-[190px] glass-card rounded-xl overflow-hidden border border-white/5 animate-pulse">
      <div className="aspect-square bg-white/5 relative">
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="w-5 h-4 bg-white/5 rounded" />
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
          <div className="h-3 bg-white/5 rounded w-16" />
          <div className="h-3 bg-white/5 rounded w-12" />
        </div>
      </div>
      <div className="p-3">
        <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
        <div className="h-2.5 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  )
}

/* ── Skeleton Carousel wrapper ── */
export function SkeletonCarousel({ count, Skeleton }: { count: number; Skeleton: ComponentType }) {
  return (
    <div className="flex gap-2.5 sm:gap-3 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  )
}
