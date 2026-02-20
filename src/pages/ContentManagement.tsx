import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface Domain {
  id: number
  name: string
  name_normalized: string
  category: string | null
  description: string | null
  icon: string | null
  is_active: boolean
  display_order: number
  hashtags: string[]
  video_count: number
  avg_views_when_present: number
  avg_engagement_rate: number
  user_count: number
  influencer_count: number
  merged_into_id: number | null
  created_at: string
  updated_at: string
}

type SortField = 'video_count' | 'user_count' | 'influencer_count' | 'name' | 'created_at' | 'avg_views' | 'avg_engagement'

const PAGE_SIZE = 30

const CATEGORIES = ['topic', 'style', 'aesthetic', 'audience', 'niche', 'format', 'trend', 'product', 'emotion']

const CATEGORY_COLORS: Record<string, string> = {
  topic: 'bg-blue-500/10 text-blue-400',
  style: 'bg-purple-500/10 text-purple-400',
  aesthetic: 'bg-pink-500/10 text-pink-400',
  audience: 'bg-green-500/10 text-green-400',
  niche: 'bg-orange-500/10 text-orange-400',
  format: 'bg-teal-500/10 text-teal-400',
  trend: 'bg-red-500/10 text-red-400',
  product: 'bg-yellow-500/10 text-yellow-400',
  emotion: 'bg-indigo-500/10 text-indigo-400',
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

export default function ContentManagement() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortField>('video_count')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Create domain modal
  const [showCreate, setShowCreate] = useState(false)
  const [newDomain, setNewDomain] = useState({ name: '', category: 'topic', description: '', icon: '' })
  const [creating, setCreating] = useState(false)

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        order,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (activeFilter) params.set('is_active', activeFilter)

      const res = await authFetch(`/api/management/domains?${params}`)
      const data = await res.json()
      setDomains(data.domains ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, order, page, search, categoryFilter, activeFilter])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  useEffect(() => {
    setPage(0)
  }, [sortBy, order, search, categoryFilter, activeFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder('desc')
    }
  }

  const toggleActive = async (id: number) => {
    setTogglingId(id)
    try {
      const res = await authFetch(`/api/management/domains/${id}/toggle-active`, { method: 'PATCH' })
      if (res.ok) {
        const updated = await res.json()
        setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: updated.is_active } : d)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.name.trim()) return
    setCreating(true)
    try {
      const res = await authFetch('/api/management/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDomain),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewDomain({ name: '', category: 'topic', description: '', icon: '' })
        setMessage({ type: 'success', text: 'Domain created successfully' })
        fetchDomains()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to create domain' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create domain' })
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'video_count', label: 'Videos' },
    { field: 'influencer_count', label: 'Influencers' },
    { field: 'user_count', label: 'Users' },
    { field: 'avg_views', label: 'Avg Views' },
    { field: 'avg_engagement', label: 'Engagement' },
    { field: 'name', label: 'Name' },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded">
              Management
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">CONTENT DOMAINS</h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage content domains extracted from analyzed videos. Domains power user personalization and content discovery.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Domains</div>
            <div className="text-2xl font-black text-white">{total}</div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">New Domain</div>
            <div className="text-2xl font-black text-white group-hover:text-pink-400 transition-colors">
              <i className="fas fa-plus"></i>
            </div>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <i className="fas fa-search text-slate-500 text-sm"></i>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search domains..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/15 transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}
            className="bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
              sortBy === opt.field
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}
            {sortBy === opt.field && (
              <i className={`fas fa-chevron-${order === 'desc' ? 'down' : 'up'} ml-1 text-[8px]`}></i>
            )}
          </button>
        ))}
      </div>

      {/* Domain Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : domains.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-layer-group text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Domains Found</h3>
          <p className="text-sm text-slate-500">
            {search || categoryFilter || activeFilter
              ? 'Try adjusting your filters.'
              : 'Analyze some videos to start extracting content domains.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {domains.map((domain) => (
              <div key={domain.id} className="glass-card rounded-2xl overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                <Link to={`/dashboard/content-management/${domain.id}`} className="block p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">
                        {domain.icon || <i className="fas fa-layer-group text-slate-500"></i>}
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight group-hover:text-pink-400 transition-colors">
                          {domain.name}
                        </h3>
                        {domain.category && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-0.5 ${CATEGORY_COLORS[domain.category] || 'bg-white/5 text-slate-400'}`}>
                            {domain.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {domain.merged_into_id && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[9px] font-black rounded uppercase">
                          Merged
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${domain.is_active ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {domain.description && (
                    <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">
                      {domain.description}
                    </p>
                  )}

                  {/* Hashtags */}
                  {domain.hashtags && domain.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {domain.hashtags.slice(0, 3).map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] font-bold rounded">
                          {h}
                        </span>
                      ))}
                      {domain.hashtags.length > 3 && (
                        <span className="px-2 py-0.5 text-slate-500 text-[10px] font-bold">
                          +{domain.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Videos</div>
                      <div className="text-sm font-black text-white">{domain.video_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Influencers</div>
                      <div className="text-sm font-black text-white">{domain.influencer_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Users</div>
                      <div className="text-sm font-black text-white">{domain.user_count}</div>
                    </div>
                  </div>

                  {/* Secondary stats */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Views</div>
                      <div className="text-sm font-black text-white">{formatNumber(Math.round(domain.avg_views_when_present || 0))}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engagement</div>
                      <div className="text-sm font-black text-white">
                        {domain.avg_engagement_rate ? Number(domain.avg_engagement_rate).toFixed(1) + '%' : '--'}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="px-6 pb-4 flex gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); toggleActive(domain.id) }}
                    disabled={togglingId === domain.id}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                      domain.is_active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                    }`}
                  >
                    {togglingId === domain.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : domain.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    to={`/dashboard/content-management/${domain.id}`}
                    className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-center"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="px-4 py-2 text-sm font-bold text-slate-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Domain Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card rounded-2xl p-8 w-full max-w-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black tracking-tight mb-6">Create New Domain</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Name</label>
                <input
                  type="text"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. fitness, cooking, tech reviews"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                <select
                  value={newDomain.category}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Icon (emoji)</label>
                <input
                  type="text"
                  value={newDomain.icon}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="e.g. a relevant emoji"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                <textarea
                  value={newDomain.description}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this domain..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newDomain.name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-pink-500 hover:bg-pink-400 disabled:opacity-50 transition-colors"
                >
                  {creating ? <i className="fas fa-spinner fa-spin"></i> : 'Create Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
