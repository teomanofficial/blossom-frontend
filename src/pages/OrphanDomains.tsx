import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface OrphanDomain {
  id: number
  name: string
  category: string | null
  icon: string | null
  video_count: number
  avg_views_when_present: number | null
  avg_engagement_rate: number | null
  created_at: string
}

type SortField = 'video_count' | 'name' | 'avg_views' | 'avg_engagement' | 'created_at'

const PAGE_SIZE = 50

export default function OrphanDomains() {
  const [domains, setDomains] = useState<OrphanDomain[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('video_count')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryTypes, setCategoryTypes] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Auto-match state
  const [autoMatching, setAutoMatching] = useState(false)

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        sort_by: sortBy,
        order,
      })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await authFetch(`/api/management/domains/orphans?${params}`)
      const data = await res.json()
      setDomains(data.domains ?? [])
      setTotal(data.total ?? 0)
      if (data.category_types) setCategoryTypes(data.category_types)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, order, categoryFilter])

  useEffect(() => { fetchDomains() }, [fetchDomains])
  useEffect(() => { setPage(0) }, [search, sortBy, order, categoryFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder(field === 'name' ? 'asc' : 'desc')
    }
  }

  const runAutoMatch = async () => {
    setAutoMatching(true)
    try {
      const res = await authFetch('/api/management/domains/auto-match-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || `Matched ${data.matched} domains` })
        fetchDomains()
      } else {
        setMessage({ type: 'error', text: data.error || 'Auto-match failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Auto-match failed' })
    } finally {
      setAutoMatching(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const formatNum = (v: number | null) => {
    if (v == null) return '—'
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return String(Math.round(v))
  }

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'video_count', label: 'Videos' },
    { field: 'name', label: 'Name' },
    { field: 'avg_views', label: 'Avg Views' },
    { field: 'avg_engagement', label: 'Avg Eng.' },
    { field: 'created_at', label: 'Created' },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link to="/dashboard/categories" className="text-slate-500 hover:text-white transition-colors text-xs font-bold">
              <i className="fas fa-arrow-left mr-1"></i> Categories
            </Link>
            <span className="text-slate-600">/</span>
            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded">
              Orphan Domains
            </span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tighter mb-2">ORPHAN DOMAINS</h1>
          <p className="text-slate-500 text-sm font-medium">
            Domains not linked to any content category — invisible to category-based discovery.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-orange-400/70 uppercase mb-1 tracking-widest">Orphans</div>
            <div className="text-2xl font-black text-orange-400">{total.toLocaleString()}</div>
          </div>
          <button
            onClick={runAutoMatch}
            disabled={autoMatching || total === 0}
            className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group disabled:opacity-30"
          >
            <div className="text-[10px] font-black text-orange-400/70 uppercase mb-1 tracking-widest">
              {autoMatching ? 'Matching...' : 'Auto-Match All'}
            </div>
            <div className="text-2xl font-black text-orange-400 group-hover:text-orange-300 transition-colors">
              {autoMatching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
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
          <div className="flex-1 flex items-center gap-3 glass-input px-4 py-2.5 rounded-xl">
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

        {categoryTypes.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none"
          >
            <option value="">All Types</option>
            {categoryTypes.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        )}
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

      {/* Domain List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : domains.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-500/10 rounded-full flex items-center justify-center">
            <i className="fas fa-check text-teal-400 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Orphan Domains</h3>
          <p className="text-sm text-slate-500">
            {search || categoryFilter ? 'No matches found.' : 'All domains are linked to a category.'}
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Domain</th>
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Type</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Videos</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Avg Views</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Avg Eng.</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/domain-management/${d.id}`}
                        className="flex items-center gap-3 hover:text-pink-400 transition-colors"
                      >
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                          {d.icon || <i className="fas fa-globe text-slate-500 text-xs"></i>}
                        </div>
                        <span className="text-sm font-bold text-white">{d.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {d.category ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/5 text-slate-400">
                          {d.category}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-black text-white">{d.video_count.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-slate-400">{formatNum(d.avg_views_when_present)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-slate-400">
                        {d.avg_engagement_rate != null ? `${Number(d.avg_engagement_rate).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[10px] font-bold text-slate-600">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </>
  )
}
