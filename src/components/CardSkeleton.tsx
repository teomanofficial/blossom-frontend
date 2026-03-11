export function FormatHookCardSkeleton() {
  return (
    <div className="gradient-border">
      <div className="card-inner p-5 md:p-7 flex flex-col h-full animate-pulse">
        <div className="flex justify-between items-start mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl" />
          <div className="w-14 h-10 bg-white/5 rounded-lg" />
        </div>
        <div className="h-5 md:h-6 bg-white/5 rounded-lg w-3/4 mb-2 md:mb-3" />
        <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
        <div className="h-3 bg-white/5 rounded w-2/3 mb-4 md:mb-8" />
        <div className="mt-auto grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4 pt-4 md:pt-6 border-t border-white/5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-2 bg-white/5 rounded w-16 mb-2" />
              <div className="h-4 bg-white/5 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TacticCardSkeleton() {
  return (
    <div className="gradient-border">
      <div className="card-inner p-5 md:p-7 flex flex-col h-full animate-pulse">
        <div className="flex justify-between items-start mb-5">
          <div className="w-12 h-12 bg-white/5 rounded-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-20 h-5 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-5 bg-white/5 rounded-lg w-4/5 mb-2" />
        <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
        <div className="h-3 bg-white/5 rounded w-1/2 mb-4" />
        {/* Score bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <div className="h-2 bg-white/5 rounded w-24" />
            <div className="h-4 bg-white/5 rounded w-8" />
          </div>
          <div className="h-1.5 bg-white/5 rounded-full" />
        </div>
        <div className="mt-auto grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-2 bg-white/5 rounded w-12 mb-2" />
              <div className="h-4 bg-white/5 rounded w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count, type }: { count: number; type: 'format-hook' | 'tactic' }) {
  const Skeleton = type === 'tactic' ? TacticCardSkeleton : FormatHookCardSkeleton
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={`skeleton-${i}`} />
      ))}
    </>
  )
}
