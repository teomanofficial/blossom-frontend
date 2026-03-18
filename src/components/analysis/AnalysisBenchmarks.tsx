import { formatNumber } from './helpers'
import { VideoCarousel } from './ExampleVideos'

export interface AnalysisBenchmarksProps {
  benchmarks: any
  virality: any
  topFormatVideos: any[]
  topHookVideos: any[]
  onOpenCarousel: (videos: any[], index: number) => void
}

export default function AnalysisBenchmarks({
  benchmarks,
  virality,
  topFormatVideos,
  topHookVideos,
  onOpenCarousel,
}: AnalysisBenchmarksProps) {
  if (!benchmarks?.format_name && !benchmarks?.hook_name) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {benchmarks?.format_name && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <i className="fas fa-tags text-pink-400 text-xs"></i>Format Class
            </h3>
            {benchmarks.format_lifecycle && (
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                benchmarks.format_lifecycle === 'emerging' ? 'bg-teal-500/15 text-teal-400' :
                benchmarks.format_lifecycle === 'rising' ? 'bg-lime-500/15 text-lime-400' :
                benchmarks.format_lifecycle === 'peaking' ? 'bg-orange-500/15 text-orange-400' :
                benchmarks.format_lifecycle === 'stable' ? 'bg-blue-500/15 text-blue-400' :
                'bg-red-500/15 text-red-400'
              }`}>{benchmarks.format_lifecycle}</span>
            )}
          </div>
          <p className="text-lg font-black text-white mb-3 capitalize">{benchmarks.format_name}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Videos</div>
              <div className="text-lg font-black text-white">{formatNumber(benchmarks.format_video_count || 0)}</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Views</div>
              <div className="text-lg font-black text-white">{formatNumber(benchmarks.format_avg_views || 0)}</div>
            </div>
          </div>
          {benchmarks.format_avg_engagement != null && (
            <div className="mt-3 bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Engagement</div>
              <div className="text-lg font-black text-white">{Number(benchmarks.format_avg_engagement).toFixed(1)}%</div>
            </div>
          )}
          {virality?.benchmark_comparison?.views_vs_format_avg && (
            <div className="mt-4 mb-2 text-xs font-bold text-slate-400">
              <i className="fas fa-chart-line mr-1 text-[9px]"></i>
              {virality.benchmark_comparison.views_vs_format_avg}
            </div>
          )}
          {topFormatVideos && topFormatVideos.length > 0 && (
            <div className="mt-auto pt-5 border-t border-white/5" style={{ marginTop: 'auto' }}>
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                <i className="fas fa-crown mr-1.5 text-pink-400/50"></i>Top by views
              </div>
              <VideoCarousel videos={topFormatVideos} onOpenCarousel={onOpenCarousel} />
            </div>
          )}
        </div>
      )}
      {benchmarks?.hook_name && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <i className="fas fa-magnet text-purple-400 text-xs"></i>Hook Class
            </h3>
            {benchmarks.hook_lifecycle && (
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                benchmarks.hook_lifecycle === 'emerging' ? 'bg-teal-500/15 text-teal-400' :
                benchmarks.hook_lifecycle === 'rising' ? 'bg-lime-500/15 text-lime-400' :
                benchmarks.hook_lifecycle === 'peaking' ? 'bg-orange-500/15 text-orange-400' :
                benchmarks.hook_lifecycle === 'stable' ? 'bg-blue-500/15 text-blue-400' :
                'bg-red-500/15 text-red-400'
              }`}>{benchmarks.hook_lifecycle}</span>
            )}
          </div>
          <p className="text-lg font-black text-white mb-3 capitalize">{benchmarks.hook_name}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Videos</div>
              <div className="text-lg font-black text-white">{formatNumber(benchmarks.hook_video_count || 0)}</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Views</div>
              <div className="text-lg font-black text-white">{formatNumber(benchmarks.hook_avg_views || 0)}</div>
            </div>
          </div>
          {benchmarks.hook_avg_engagement != null && (
            <div className="mt-3 bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Engagement</div>
              <div className="text-lg font-black text-white">{Number(benchmarks.hook_avg_engagement).toFixed(1)}%</div>
            </div>
          )}
          {topHookVideos && topHookVideos.length > 0 && (
            <div className="mt-auto pt-5 border-t border-white/5" style={{ marginTop: 'auto' }}>
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                <i className="fas fa-crown mr-1.5 text-purple-400/50"></i>Top by views
              </div>
              <VideoCarousel videos={topHookVideos} onOpenCarousel={onOpenCarousel} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
