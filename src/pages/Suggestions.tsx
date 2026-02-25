import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface SuggestionStats {
  today_count: number
  active_topics: number
  total_upvotes: number
  videos_analyzed: number
  last_generated_at: string | null
  total_active: number
}

interface FilterOption {
  id: number
  name: string
}

interface Suggestion {
  id: number
  title: string
  description: string
  keyword_name: string | null
  keyword_category: string | null
  format_name: string | null
  source_video_count: number
  avg_views: number
  trend_strength: number
  platform_hint: string | null
  difficulty: string | null
  upvote_count: number
  save_count: number
  approved_count: number
  created_at: string
  has_voted: boolean
  has_saved: boolean
  has_approved: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function difficultyColor(d: string | null): string {
  switch (d) {
    case 'easy': return 'bg-teal-500/10 text-teal-400'
    case 'medium': return 'bg-amber-500/10 text-amber-400'
    case 'hard': return 'bg-red-500/10 text-red-400'
    default: return 'bg-slate-500/10 text-slate-400'
  }
}

export default function Suggestions() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionsTotal, setSuggestionsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<'all' | 'saved' | 'approved'>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [keywordFilter, setKeywordFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [filterKeywords, setFilterKeywords] = useState<FilterOption[]>([])
  const [filterFormats, setFilterFormats] = useState<FilterOption[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadSuggestions() }, [tab, sortBy, keywordFilter, formatFilter])

  async function loadAll() {
    try {
      setLoading(true)
      const [statsRes, filtersRes, prefsRes] = await Promise.all([
        authFetch('/api/analysis/suggestions/stats').then(r => r.json()),
        authFetch('/api/analysis/suggestions/filters').then(r => r.json()),
        authFetch('/api/onboarding/preferences').then(r => r.json()),
      ])
      setStats(statsRes)
      setFilterKeywords(filtersRes.keywords || [])
      setFilterFormats(filtersRes.formats || [])
      setCategoryName(prefsRes.category?.title || null)
      await loadSuggestions()
    } catch (error) {
      console.error('Failed to load suggestions data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSuggestions() {
    try {
      const params = new URLSearchParams({
        tab,
        sort_by: sortBy,
        limit: '50',
        offset: '0',
      })
      if (keywordFilter) params.set('keyword_id', keywordFilter)
      if (formatFilter) params.set('format_id', formatFilter)
      const data = await authFetch(`/api/analysis/suggestions?${params}`).then(r => r.json())
      setSuggestions(data.suggestions || [])
      setSuggestionsTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true)
      await authFetch('/api/analysis/suggestions/generate', { method: 'POST' })
      await loadAll()
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setGenerating(false)
    }
  }

  async function toggleVote(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    try {
      const res = await authFetch(`/api/analysis/suggestions/${id}/vote`, { method: 'POST' })
      const data = await res.json()
      setSuggestions(prev => prev.map(s =>
        s.id === id ? { ...s, upvote_count: data.upvote_count, has_voted: data.voted } : s
      ))
    } catch (error) {
      console.error('Failed to toggle vote:', error)
    }
  }

  async function toggleSave(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    try {
      const res = await authFetch(`/api/analysis/suggestions/${id}/save`, { method: 'POST' })
      const data = await res.json()
      setSuggestions(prev => prev.map(s =>
        s.id === id ? { ...s, save_count: data.save_count, has_saved: data.saved } : s
      ))
    } catch (error) {
      console.error('Failed to toggle save:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <span className="badge-glass text-pink-400 font-black">
              AI Powered
            </span>
            {categoryName && (
              <span className="badge-glass text-purple-400 font-black">
                {categoryName}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-black font-display tracking-tighter mb-1 md:mb-2">CONTENT SUGGESTIONS</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Daily content ideas based on trending patterns{categoryName ? ` in ${categoryName}` : ''}. Film them today.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`h-fit px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            generating
              ? 'bg-amber-500/10 text-amber-400 cursor-wait'
              : 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90'
          }`}
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              GENERATING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <i className="fas fa-lightbulb"></i> GENERATE NOW
            </span>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Today's Ideas</div>
          <div className="text-xl md:text-2xl font-black text-pink-400">{stats?.today_count ?? 0}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1 hidden md:block">{stats?.total_active ?? 0} active total</div>
        </div>
        <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Active Topics</div>
          <div className="text-xl md:text-2xl font-black text-purple-400">{stats?.active_topics ?? 0}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1 hidden md:block">keyword clusters</div>
        </div>
        <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Upvotes</div>
          <div className="text-xl md:text-2xl font-black text-cyan-400">{formatNumber(stats?.total_upvotes ?? 0)}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1 hidden md:block">across all ideas</div>
        </div>
        <div className="px-4 py-3 md:px-6 md:py-4 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Videos Analyzed</div>
          <div className="text-xl md:text-2xl font-black text-teal-400">{formatNumber(stats?.videos_analyzed ?? 0)}</div>
          <div className="text-[10px] font-bold text-slate-600 mt-1 hidden md:block">source videos</div>
        </div>
        <div className="col-span-2 md:col-span-1 px-4 py-3 md:px-6 md:py-4 glass-card rounded-3xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Last Generated</div>
          <div className="text-lg font-black text-white mt-1">{timeAgo(stats?.last_generated_at ?? null)}</div>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          {(['all', 'saved', 'approved'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'all' ? 'All Ideas' : t === 'saved' ? 'Saved' : 'My Ideas'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
            className="glass-input px-3 py-1.5 text-[10px] font-bold text-white"
          >
            <option value="">All Topics</option>
            {filterKeywords.map(k => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="glass-input px-3 py-1.5 text-[10px] font-bold text-white"
          >
            <option value="">All Formats</option>
            {filterFormats.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-3 py-1.5 text-[10px] font-bold text-white"
          >
            <option value="trend_strength">Trending</option>
            <option value="upvotes">Most Upvoted</option>
            <option value="approved">Most Approved</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Suggestions List - Reddit-style compact */}
      {suggestions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-lightbulb text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Suggestions Yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            {tab === 'all'
              ? 'Run a trending scan first, then click "Generate Now" to create content ideas.'
              : tab === 'saved'
              ? 'Save suggestions you want to revisit later.'
              : 'Approve suggestions you plan to create.'}
          </p>
          {tab === 'all' && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <i className="fas fa-lightbulb mr-2"></i> GENERATE NOW
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-6 py-3 border-b border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {suggestionsTotal} suggestion{suggestionsTotal !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {suggestions.map(s => (
              <div
                key={s.id}
                onClick={() => navigate(`/dashboard/suggestions/${s.id}`)}
                className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3.5 md:py-4 hover:bg-white/[0.02] active:bg-white/[0.03] cursor-pointer transition-colors"
              >
                {/* Upvote column */}
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-8 md:w-10">
                  <button
                    onClick={(e) => toggleVote(e, s.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      s.has_voted
                        ? 'text-pink-400 bg-pink-500/10'
                        : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <i className="fas fa-arrow-up text-xs"></i>
                  </button>
                  <span className={`text-xs font-black ${s.has_voted ? 'text-pink-400' : 'text-slate-500'}`}>
                    {s.upvote_count}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {s.keyword_name && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 tracking-wider">
                        {s.keyword_name}
                      </span>
                    )}
                    {s.format_name && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 tracking-wider">
                        {s.format_name}
                      </span>
                    )}
                    {s.difficulty && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${difficultyColor(s.difficulty)}`}>
                        {s.difficulty}
                      </span>
                    )}
                    {s.platform_hint && s.platform_hint !== 'both' && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                        s.platform_hint === 'tiktok' ? 'bg-pink-500/10 text-pink-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {s.platform_hint}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-black text-white mb-0.5 truncate">{s.title}</h3>

                  {/* Description - truncated */}
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {s.description.length > 250 ? s.description.slice(0, 250) + '...' : s.description}
                  </p>

                  {/* Bottom meta */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-600">
                    <span>{s.source_video_count} videos</span>
                    <span className="text-slate-700">|</span>
                    <span>{formatNumber(s.avg_views)} avg views</span>
                    <span className="text-slate-700">|</span>
                    <span>{timeAgo(s.created_at)}</span>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {/* Save button — hidden on small mobile */}
                  <button
                    onClick={(e) => toggleSave(e, s.id)}
                    className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-lg transition-all ${
                      s.has_saved
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                    }`}
                    title={s.has_saved ? 'Saved' : 'Save'}
                  >
                    <i className="fas fa-bookmark text-xs"></i>
                  </button>

                  {/* Trend score */}
                  <div className="text-right">
                    <div className={`text-sm font-black ${
                      s.trend_strength >= 70 ? 'text-teal-400' :
                      s.trend_strength >= 40 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {Math.round(s.trend_strength)}
                    </div>
                    <div className="text-[8px] font-bold text-slate-600 uppercase">trend</div>
                  </div>

                  {/* Arrow */}
                  <i className="fas fa-chevron-right text-slate-700 text-[10px]"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
