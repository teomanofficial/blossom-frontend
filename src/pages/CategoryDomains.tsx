import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface Category {
  id: number
  title: string
  icon: string | null
  domains: { id: number; name: string; icon: string | null }[]
}

interface Domain {
  id: number
  name: string
  icon: string | null
  category: string | null
  video_count: number
  is_active: boolean
}

type FilterMode = 'all' | 'selected' | 'unselected'

export default function CategoryDomains() {
  const { id } = useParams<{ id: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [allDomains, setAllDomains] = useState<Domain[]>([])
  const [linkedIds, setLinkedIds] = useState<Set<number>>(new Set())
  const [initialIds, setInitialIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [catRes, domainsRes] = await Promise.all([
        authFetch(`/api/management/categories/${id}`),
        authFetch('/api/management/domains?limit=500&sort_by=name&order=asc'),
      ])
      const catData = await catRes.json()
      const domainsData = await domainsRes.json()
      setCategory(catData)
      setAllDomains(domainsData.domains || [])
      const ids = new Set<number>((catData.domains || []).map((d: { id: number }) => d.id))
      setLinkedIds(ids)
      setInitialIds(new Set<number>(ids))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const toggle = (domainId: number) => {
    setLinkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(domainId)) next.delete(domainId)
      else next.add(domainId)
      return next
    })
  }

  const selectAll = () => {
    setLinkedIds(new Set(allDomains.map((d) => d.id)))
  }

  const deselectAll = () => {
    setLinkedIds(new Set())
  }

  const selectFiltered = () => {
    setLinkedIds((prev) => {
      const next = new Set(prev)
      filtered.forEach((d) => next.add(d.id))
      return next
    })
  }

  const deselectFiltered = () => {
    setLinkedIds((prev) => {
      const next = new Set(prev)
      filtered.forEach((d) => next.delete(d.id))
      return next
    })
  }

  const save = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/management/categories/${id}/domains`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword_ids: Array.from(linkedIds) }),
      })
      if (res.ok) {
        setInitialIds(new Set(linkedIds))
        setMessage({ type: 'success', text: 'Domains updated successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save domains' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save domains' })
    } finally {
      setSaving(false)
    }
  }

  // Derive unique domain categories for the filter dropdown
  const domainCategories = Array.from(
    new Set(allDomains.map((d) => d.category).filter(Boolean))
  ).sort() as string[]

  // Filter logic
  const filtered = allDomains.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterMode === 'selected' && !linkedIds.has(d.id)) return false
    if (filterMode === 'unselected' && linkedIds.has(d.id)) return false
    if (categoryFilter && d.category !== categoryFilter) return false
    return true
  })

  const hasChanges = (() => {
    if (linkedIds.size !== initialIds.size) return true
    for (const id of linkedIds) {
      if (!initialIds.has(id)) return true
    }
    return false
  })()

  const selectedInFiltered = filtered.filter((d) => linkedIds.has(d.id)).length
  const allFilteredSelected = filtered.length > 0 && selectedInFiltered === filtered.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <h3 className="font-black text-lg mb-2">Category not found</h3>
        <Link to="/dashboard/categories" className="text-pink-400 text-sm font-bold hover:underline">
          Back to Categories
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link
            to="/dashboard/categories"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors mb-4"
          >
            <i className="fas fa-arrow-left text-xs"></i>
            Back to Categories
          </Link>
          <h1 className="text-3xl font-black font-display tracking-tighter mb-1">
            {category.icon && <span className="mr-2">{category.icon}</span>}
            {category.title}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage which domains belong to this category.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 glass-card rounded-xl border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected</div>
            <div className="text-xl font-black text-white">{linkedIds.size}</div>
          </div>
          <div className="px-5 py-3 glass-card rounded-xl border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</div>
            <div className="text-xl font-black text-white">{allDomains.length}</div>
          </div>
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

      {/* Toolbar */}
      <div className="glass-card rounded-2xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center gap-3 glass-input px-4 py-2.5 rounded-xl">
            <i className="fas fa-search text-slate-500 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
          </div>

          {/* Filter: selected/unselected/all */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(['all', 'selected', 'unselected'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filterMode === mode
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode === 'all' && `All (${allDomains.length})`}
                {mode === 'selected' && `Selected (${linkedIds.size})`}
                {mode === 'unselected' && `Unselected (${allDomains.length - linkedIds.size})`}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {domainCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none"
            >
              <option value="">All Types</option>
              {domainCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1">Bulk</span>
          <button
            onClick={allFilteredSelected ? deselectFiltered : selectFiltered}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {allFilteredSelected ? 'Deselect' : 'Select'} filtered ({filtered.length})
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Select all
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Deselect all
          </button>
          <div className="flex-1"></div>
          <span className="text-[11px] font-bold text-slate-500">
            {filtered.length} showing &middot; {selectedInFiltered} selected in view
          </span>
        </div>
      </div>

      {/* Domain Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-search text-slate-500"></i>
          </div>
          <h3 className="font-black text-sm mb-1">No domains match</h3>
          <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((domain) => {
            const isLinked = linkedIds.has(domain.id)
            return (
              <button
                key={domain.id}
                onClick={() => toggle(domain.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
                  isLinked
                    ? 'bg-pink-500/10 border border-pink-500/25 hover:bg-pink-500/15'
                    : 'glass-card border border-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                  isLinked ? 'bg-pink-500 text-white' : 'bg-white/10 text-transparent'
                }`}>
                  <i className="fas fa-check"></i>
                </div>
                <div className="w-8 h-8 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center text-sm">
                  {domain.icon || <i className="fas fa-layer-group text-slate-500 text-xs"></i>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{domain.name}</div>
                  <div className="flex items-center gap-2">
                    {domain.category && (
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{domain.category}</span>
                    )}
                    <span className="text-[9px] font-bold text-slate-600">{domain.video_count} videos</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
          <div className="max-w-5xl mx-auto glass-card rounded-2xl p-4 border border-white/10 shadow-2xl flex items-center justify-between gap-4">
            <div className="text-sm font-bold text-slate-300">
              <span className="text-pink-400">{linkedIds.size} domains</span> selected
              <span className="text-slate-500 ml-2">
                ({linkedIds.size - initialIds.size > 0 ? '+' : ''}{linkedIds.size - initialIds.size} change{Math.abs(linkedIds.size - initialIds.size) !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setLinkedIds(new Set(initialIds)) }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-pink-500 hover:bg-pink-400 disabled:opacity-50 transition-colors"
              >
                {saving ? <i className="fas fa-spinner fa-spin"></i> : `Save (${linkedIds.size} domains)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
