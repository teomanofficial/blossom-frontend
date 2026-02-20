import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

interface Tactic {
  id: number
  name: string
  category: string
  description: string | null
  why_it_works: string | null
  viewer_effect: string | null
  video_count: number
  avg_views_when_present: number
  avg_execution_score: number
  is_verified: boolean
  created_at: string
}

type SortField = 'video_count' | 'avg_views_when_present' | 'avg_execution_score' | 'name' | 'created_at'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

const categoryColors: Record<string, string> = {
  audio_design: 'bg-violet-500/20 text-violet-400',
  text_overlay: 'bg-cyan-500/20 text-cyan-400',
  framing_angle: 'bg-emerald-500/20 text-emerald-400',
  content_structure: 'bg-sky-500/20 text-sky-400',
  shareability: 'bg-orange-500/20 text-orange-400',
  engagement_bait: 'bg-yellow-500/20 text-yellow-400',
  trend_leverage: 'bg-lime-500/20 text-lime-400',
  identity_signal: 'bg-fuchsia-500/20 text-fuchsia-400',
  visual_storytelling: 'bg-rose-500/20 text-rose-400',
  pacing: 'bg-indigo-500/20 text-indigo-400',
  hook_technique: 'bg-pink-500/20 text-pink-400',
  emotional_trigger: 'bg-red-500/20 text-red-400',
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || 'bg-slate-500/20 text-slate-400'
}

function getCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ')
}

function getTacticIcon(category: string): string {
  const icons: Record<string, string> = {
    audio_design: 'fa-music',
    text_overlay: 'fa-font',
    framing_angle: 'fa-camera',
    content_structure: 'fa-layer-group',
    shareability: 'fa-share-nodes',
    engagement_bait: 'fa-comments',
    trend_leverage: 'fa-arrow-trend-up',
    identity_signal: 'fa-fingerprint',
    visual_storytelling: 'fa-film',
    pacing: 'fa-gauge-high',
    hook_technique: 'fa-magnet',
    emotional_trigger: 'fa-heart-pulse',
  }
  return icons[category] || 'fa-chess'
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-teal-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-slate-400'
}

export default function Tactics() {
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<SortField>('video_count')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      sort_by: sortBy,
      order,
      limit: '100',
      offset: '0',
    })
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (search) params.set('search', search)

    authFetch(`/api/analysis/tactics?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTactics(data.tactics || [])
        setTotal(data.total || 0)
      })
      .catch(() => toast.error('Failed to load tactics'))
      .finally(() => setLoading(false))
  }, [sortBy, order, categoryFilter, search])

  const categories = Array.from(new Set(tactics.map((t) => t.category))).sort()

  const globalAvgScore =
    tactics.length > 0
      ? tactics.reduce((sum, t) => sum + (Number(t.avg_execution_score) || 0), 0) / tactics.length
      : 0

  const totalVideos = tactics.reduce((sum, t) => sum + (t.video_count || 0), 0)

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder('desc')
    }
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'video_count', label: 'Videos' },
    { field: 'avg_execution_score', label: 'Exec Score' },
    { field: 'avg_views_when_present', label: 'Avg Views' },
    { field: 'name', label: 'Name' },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded">
              Engagement Playbook
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">VIRAL TACTICS</h1>
          <p className="text-slate-500 text-sm font-medium">
            The specific techniques that drive views, shares, and engagement across top-performing content.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Tactics</div>
            <div className="text-2xl font-black text-white">{total}</div>
          </div>
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Avg Exec Score</div>
            <div className={`text-2xl font-black ${getScoreColor(globalAvgScore)}`}>
              {globalAvgScore > 0 ? Math.round(globalAvgScore) : '--'}
            </div>
          </div>
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Video Uses</div>
            <div className="text-2xl font-black text-white">{formatNumber(totalVideos)}</div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <i className="fas fa-search text-slate-500 text-xs"></i>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tactics..."
              className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-slate-600 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput('') }}
                className="text-slate-500 hover:text-white text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </form>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1">Category</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              categoryFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors capitalize ${
                categoryFilter === cat ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-2">Sort by</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.field}
            onClick={() => toggleSort(opt.field)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              sortBy === opt.field ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}
            {sortBy === opt.field && (
              <i className={`fas fa-chevron-${order === 'desc' ? 'down' : 'up'} ml-1 text-[8px]`}></i>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tactics.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-chess text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Tactics Yet</h3>
          <p className="text-sm text-slate-500">
            {search ? 'No tactics match your search.' : 'Analyze videos to start discovering viral tactics.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tactics.map((tactic, index) => {
            const score = Number(tactic.avg_execution_score) || 0
            return (
              <Link
                key={tactic.id}
                to={`/dashboard/tactics/${tactic.id}`}
                className="gradient-border group cursor-pointer hover:translate-y-[-4px] transition-all duration-300"
              >
                <div className="card-inner p-7 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      <i className={`fas ${getTacticIcon(tactic.category)} text-lg text-slate-400`}></i>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getCategoryColor(tactic.category)}`}>
                        {getCategoryLabel(tactic.category)}
                      </span>
                      {tactic.is_verified && (
                        <span className="text-teal-400 text-xs" title="Verified">
                          <i className="fas fa-check-circle"></i>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black mb-2 tracking-tight group-hover:text-amber-400 transition-colors uppercase leading-tight">
                    {tactic.name}
                  </h3>
                  {tactic.description && (
                    <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed line-clamp-2">
                      {tactic.description}
                    </p>
                  )}

                  {/* Execution Score Bar */}
                  {score > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Score</span>
                        <span className={`text-sm font-black ${getScoreColor(score)}`}>{Math.round(score)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            score >= 70 ? 'bg-teal-400' : score >= 40 ? 'bg-yellow-400' : 'bg-slate-500'
                          }`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  <div className="mt-auto grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
                    <div>
                      <div className="metric-label">Videos</div>
                      <div className="metric-value">{tactic.video_count}</div>
                    </div>
                    <div>
                      <div className="metric-label">Avg Views</div>
                      <div className="metric-value">{formatNumber(Math.round(Number(tactic.avg_views_when_present) || 0))}</div>
                    </div>
                    <div>
                      <div className="metric-label">Rank</div>
                      <div className="metric-value text-amber-400">#{index + 1}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Discover More Card */}
          <div className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-plus text-slate-500"></i>
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
              {total} Tactics Indexed
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-2">
              Analyze more videos to discover new engagement techniques.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
