import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

interface CategoryDomainSummary {
  id: number
  name: string
  icon: string | null
}

interface CategoryStats {
  video_count: number
  format_count: number
  tactic_count: number
  hook_count: number
  avg_views: number
  avg_engagement: number
}

interface Category {
  id: number
  title: string
  title_normalized: string
  description: string | null
  icon: string | null
  thumbnail_url: string | null
  is_active: boolean
  display_order: number
  domain_count: number
  domains: CategoryDomainSummary[]
  created_at: string
  updated_at: string
}

type SortField = 'title' | 'domain_count' | 'display_order' | 'created_at'

const PAGE_SIZE = 30

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortField>('display_order')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', icon: '', display_order: '0' })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Navigation
  const navigate = useNavigate()

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Stats
  const [stats, setStats] = useState<Record<number, CategoryStats>>({})

  // Auto-match state
  const [autoMatching, setAutoMatching] = useState(false)
  const [orphanCount, setOrphanCount] = useState<number | null>(null)
  const [showBackfillConfirm, setShowBackfillConfirm] = useState(false)

  // Fetch category stats (cached server-side)
  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/management/categories/stats')
      const data = await res.json()
      setStats(data.stats ?? {})
    } catch {
      // stats are optional, fail silently
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Fetch orphan domain count
  const fetchOrphanCount = useCallback(async () => {
    try {
      const res = await authFetch('/api/management/domains?limit=1&offset=0')
      const data = await res.json()
      const totalDomains = data.total ?? 0

      // Sum domain_count across all categories to estimate linked domains
      const catRes = await authFetch('/api/management/categories?limit=100&offset=0')
      const catData = await catRes.json()
      const linkedCount = (catData.categories ?? []).reduce((sum: number, c: any) => sum + (c.domain_count || 0), 0)

      setOrphanCount(Math.max(0, totalDomains - linkedCount))
    } catch {
      setOrphanCount(null)
    }
  }, [])

  useEffect(() => { fetchOrphanCount() }, [fetchOrphanCount])

  const runAutoMatch = async () => {
    setShowBackfillConfirm(false)
    setAutoMatching(true)
    try {
      const res = await authFetch('/api/management/domains/auto-match-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || `Matched ${data.matched} domains` })
        fetchCategories()
        fetchOrphanCount()
      } else {
        setMessage({ type: 'error', text: data.error || 'Auto-match failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Auto-match failed' })
    } finally {
      setAutoMatching(false)
    }
  }

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        order,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (activeFilter) params.set('is_active', activeFilter)

      const res = await authFetch(`/api/management/categories?${params}`)
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, order, page, search, activeFilter])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { setPage(0) }, [sortBy, order, search, activeFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setOrder(field === 'title' || field === 'display_order' ? 'asc' : 'desc')
    }
  }

  const toggleActive = async (id: number) => {
    setTogglingId(id)
    try {
      const res = await authFetch(`/api/management/categories/${id}/toggle-active`, { method: 'PATCH' })
      if (res.ok) {
        const updated = await res.json()
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: updated.is_active } : c)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  // ---- Create / Edit Modal ----

  const openCreate = () => {
    setEditingCategory(null)
    setFormData({ title: '', description: '', icon: '', display_order: '0' })
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setShowModal(true)
  }

  const openEdit = async (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      title: cat.title,
      description: cat.description || '',
      icon: cat.icon || '',
      display_order: String(cat.display_order),
    })
    setThumbnailFile(null)
    setThumbnailPreview(cat.thumbnail_url)
    setShowModal(true)
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description)
      fd.append('icon', formData.icon)
      fd.append('display_order', formData.display_order)
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile)

      const url = editingCategory
        ? `/api/management/categories/${editingCategory.id}`
        : '/api/management/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await authFetch(url, { method, body: fd })
      if (res.ok) {
        setShowModal(false)
        setMessage({ type: 'success', text: editingCategory ? 'Category updated' : 'Category created' })
        fetchCategories()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save category' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save category' })
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete ----

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await authFetch(`/api/management/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Category deleted' })
        fetchCategories()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete category' })
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'display_order', label: 'Order' },
    { field: 'title', label: 'Title' },
    { field: 'domain_count', label: 'Domains' },
    { field: 'created_at', label: 'Created' },
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
          <h1 className="text-4xl font-black font-display tracking-tighter mb-2">CONTENT CATEGORIES</h1>
          <p className="text-slate-500 text-sm font-medium">
            Group content domains into high-level categories for discovery and organization.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total</div>
            <div className="text-2xl font-black text-white">{total}</div>
          </div>
          {orphanCount !== null && orphanCount > 0 && (
            <button
              onClick={() => setShowBackfillConfirm(true)}
              disabled={autoMatching}
              className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group relative"
            >
              <div className="text-[10px] font-black text-orange-400/70 uppercase mb-1 tracking-widest">
                Backfill Domains
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-black text-orange-400 group-hover:text-orange-300 transition-colors">
                  {autoMatching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {autoMatching ? 'Matching...' : `${orphanCount} orphan${orphanCount !== 1 ? 's' : ''}`}
                </span>
              </div>
            </button>
          )}
          <button
            onClick={openCreate}
            className="px-6 py-4 glass-card rounded-[1.5rem] border-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">New Category</div>
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
          <div className="flex-1 flex items-center gap-3 glass-input px-4 py-2.5 rounded-xl">
            <i className="fas fa-search text-slate-500 text-sm"></i>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search categories..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/15 transition-colors">
            Search
          </button>
        </form>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}
          className="glass-input px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
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

      {/* Category Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <i className="fas fa-folder-tree text-slate-500 text-xl"></i>
          </div>
          <h3 className="font-black text-lg mb-2">No Categories Found</h3>
          <p className="text-sm text-slate-500">
            {search || activeFilter ? 'Try adjusting your filters.' : 'Create your first category to start organizing domains.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="glass-card rounded-2xl overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                {/* Thumbnail */}
                {cat.thumbnail_url && (
                  <div className="h-36 overflow-hidden">
                    <img
                      src={getStorageUrl(cat.thumbnail_url) || ''}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">
                        {cat.icon || <i className="fas fa-folder-tree text-slate-500"></i>}
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight group-hover:text-pink-400 transition-colors">
                          {cat.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500">
                          {cat.domain_count} domain{cat.domain_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${cat.is_active ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}


                  {/* Stats */}
                  {(() => {
                    const s = stats[cat.id]
                    return (
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Videos</div>
                          <div className="text-sm font-black text-white">{s?.video_count?.toLocaleString() ?? '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Formats</div>
                          <div className="text-sm font-black text-white">{s?.format_count ?? '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactics</div>
                          <div className="text-sm font-black text-white">{s?.tactic_count ?? '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hooks</div>
                          <div className="text-sm font-black text-white">{s?.hook_count ?? '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Views</div>
                          <div className="text-sm font-black text-white">
                            {s?.avg_views != null ? (s.avg_views >= 1000 ? `${(s.avg_views / 1000).toFixed(1)}K` : s.avg_views) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Eng.</div>
                          <div className="text-sm font-black text-white">
                            {s?.avg_engagement != null ? `${s.avg_engagement}%` : '—'}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Actions */}
                <div className="px-6 pb-4 flex gap-2">
                  <button
                    onClick={() => toggleActive(cat.id)}
                    disabled={togglingId === cat.id}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                      cat.is_active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                    }`}
                  >
                    {togglingId === cat.id ? <i className="fas fa-spinner fa-spin"></i> : cat.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/categories/${cat.id}/domains`)}
                    className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    Domains
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    {deletingId === cat.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                  </button>
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black tracking-tight mb-6">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Fashion, Fitness, Tech"
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g. an emoji"
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: e.target.value }))}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Thumbnail</label>
                <div className="flex items-center gap-4">
                  {thumbnailPreview && (
                    <img src={thumbnailPreview} alt="Preview" className="w-20 h-14 object-cover rounded-lg border border-white/10" />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <i className="fas fa-cloud-upload-alt text-slate-500"></i>
                    <span className="text-sm font-medium text-slate-400">
                      {thumbnailFile ? thumbnailFile.name : 'Choose image'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-pink-500 hover:bg-pink-400 disabled:opacity-50 transition-colors"
                >
                  {saving ? <i className="fas fa-spinner fa-spin"></i> : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backfill Confirmation Modal */}
      {showBackfillConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBackfillConfirm(false)}>
          <div className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto mb-5 bg-orange-500/10 rounded-2xl flex items-center justify-center">
              <i className="fas fa-wand-magic-sparkles text-orange-400 text-xl"></i>
            </div>
            <h2 className="text-xl font-black tracking-tight text-center mb-2">Backfill Domains</h2>
            <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
              AI will analyze <span className="text-white font-bold">{orphanCount}</span> unassigned domain{orphanCount !== 1 ? 's' : ''} and match each to the best-fit content category. This may take a moment.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackfillConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runAutoMatch}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-colors"
              >
                <i className="fas fa-wand-magic-sparkles mr-2"></i>
                Run Backfill
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
