import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

/* ── Helpers ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

interface TopicKeyword {
  id: number
  name: string
  category: string
  description: string | null
  icon: string | null
  total_video_count: number
  recent_video_count: number
  recent_avg_views: number
  recent_avg_engagement: number
  trend_velocity: number | null
  lifecycle_stage: string | null
  sample_thumbnails: string[] | null
  rank: number
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
  topic:    { label: 'Topic',    icon: 'fa-hashtag',       color: 'text-blue-400',    bgColor: 'bg-blue-500/10',    borderColor: 'border-blue-500/20' },
  style:    { label: 'Style',    icon: 'fa-palette',       color: 'text-purple-400',  bgColor: 'bg-purple-500/10',  borderColor: 'border-purple-500/20' },
  audience: { label: 'Audience', icon: 'fa-users',         color: 'text-amber-400',   bgColor: 'bg-amber-500/10',   borderColor: 'border-amber-500/20' },
  niche:    { label: 'Niche',    icon: 'fa-crosshairs',    color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  format:   { label: 'Format',   icon: 'fa-film',          color: 'text-orange-400',  bgColor: 'bg-orange-500/10',  borderColor: 'border-orange-500/20' },
  trend:    { label: 'Trend',    icon: 'fa-arrow-trend-up', color: 'text-cyan-400',   bgColor: 'bg-cyan-500/10',    borderColor: 'border-cyan-500/20' },
  emotion:  { label: 'Emotion',  icon: 'fa-heart',         color: 'text-yellow-400',  bgColor: 'bg-yellow-500/10',  borderColor: 'border-yellow-500/20' },
}

const CATEGORY_ORDER = ['topic', 'style', 'audience', 'niche', 'format', 'trend', 'emotion']

const DAY_OPTIONS = [
  { value: 2, label: '48h' },
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
]

export default function TrendingTopicDetail() {
  const [categories, setCategories] = useState<Record<string, TopicKeyword[]>>({})
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/trends/topics-detail?days=${days}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCategories(data.categories || {})
    } catch {
      toast.error('Failed to load trending topics detail')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  // Only count keywords from categories we actually render
  const renderedCategories = CATEGORY_ORDER.filter(cat => CATEGORY_META[cat] && categories[cat]?.length)
  const totalKeywords = renderedCategories.reduce((sum, cat) => sum + (categories[cat]?.length ?? 0), 0)
  const activeCategoryCount = renderedCategories.length

  return (
    <>
      <Link to="/dashboard/trends" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-pink-400 transition-colors mb-4">
        <i className="fas fa-arrow-left text-[9px]" /> Back to Trends
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-glass text-violet-400 font-black">
            Topics
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-display tracking-tighter mb-2">Trending Topics</h1>
            <p className="text-slate-500 text-sm font-medium">
              Top 10 keywords per category ranked by usage.
              {totalKeywords > 0 && (
                <span className="text-slate-400 ml-1">
                  {totalKeywords} keywords across {activeCategoryCount} categories
                </span>
              )}
            </p>
          </div>
          {/* Time Window Selector */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  days === opt.value
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totalKeywords === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-cloud text-violet-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Trending Topics</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No keyword data found for the selected time period. Try expanding the time window.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map((catKey) => {
            const keywords = categories[catKey]
            if (!keywords || keywords.length === 0) return null
            const meta = CATEGORY_META[catKey]
            if (!meta) return null

            return (
              <div key={catKey} className={`glass-card rounded-2xl overflow-hidden border ${meta.borderColor}`}>
                {/* Category Header */}
                <div className={`px-5 py-4 ${meta.bgColor} border-b ${meta.borderColor}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${meta.bgColor} flex items-center justify-center`}>
                      <i className={`fas ${meta.icon} ${meta.color} text-sm`} />
                    </div>
                    <div>
                      <h2 className={`text-sm font-black ${meta.color} uppercase tracking-wider`}>{meta.label}</h2>
                      <p className="text-[10px] text-slate-500 font-medium">{keywords.length} keyword{keywords.length !== 1 ? 's' : ''} trending</p>
                    </div>
                  </div>
                </div>

                {/* Ranked List */}
                <div className="divide-y divide-white/[0.04]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 px-5 py-2.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4 sm:col-span-3">Keyword</div>
                    <div className="col-span-3 sm:col-span-2 text-right">Videos</div>
                    <div className="col-span-4 sm:col-span-3 text-right">Avg Views</div>
                    <div className="hidden sm:block col-span-2 text-right">Engagement</div>
                    <div className="hidden sm:block col-span-2 text-right">Preview</div>
                  </div>

                  {keywords.map((kw) => {
                    const thumbs = (kw.sample_thumbnails || []).map(getStorageUrl).filter(Boolean)

                    return (
                      <div
                        key={kw.id}
                        className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Rank */}
                        <div className="col-span-1">
                          <span className={`text-sm font-black ${
                            kw.rank === 1 ? meta.color :
                            kw.rank <= 3 ? 'text-slate-300' :
                            'text-slate-500'
                          }`}>
                            {kw.rank}
                          </span>
                        </div>

                        {/* Keyword Name */}
                        <div className="col-span-4 sm:col-span-3 min-w-0">
                          <div className="text-sm font-bold text-white capitalize truncate group-hover:text-pink-300 transition-colors">
                            {kw.name}
                          </div>
                          {kw.description && (
                            <div className="text-[9px] text-slate-600 font-medium truncate">{kw.description}</div>
                          )}
                        </div>

                        {/* Video Count */}
                        <div className="col-span-3 sm:col-span-2 text-right">
                          <span className="text-xs font-bold text-slate-300">{kw.recent_video_count}</span>
                          <span className="text-[9px] text-slate-600 ml-1">/ {kw.total_video_count}</span>
                        </div>

                        {/* Avg Views */}
                        <div className="col-span-4 sm:col-span-3 text-right">
                          <span className={`text-xs font-black ${
                            kw.recent_avg_views >= 1_000_000 ? 'text-emerald-400' :
                            kw.recent_avg_views >= 100_000 ? 'text-blue-400' :
                            'text-slate-300'
                          }`}>
                            {fmt(kw.recent_avg_views)}
                          </span>
                        </div>

                        {/* Engagement */}
                        <div className="hidden sm:block col-span-2 text-right">
                          <span className="text-xs font-bold text-slate-400">
                            {Number(kw.recent_avg_engagement).toFixed(1)}%
                          </span>
                        </div>

                        {/* Thumbnails */}
                        <div className="hidden sm:flex col-span-2 justify-end gap-0.5">
                          {thumbs.length > 0 ? thumbs.slice(0, 3).map((t, i) => (
                            <img key={i} src={t!} alt="" className="w-7 h-7 rounded object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          )) : (
                            <span className="text-[9px] text-slate-700">-</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
