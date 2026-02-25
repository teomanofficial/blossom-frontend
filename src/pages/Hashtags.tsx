import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

interface CategoryBadge {
  id: number
  title: string
  icon: string | null
}

interface Hashtag {
  id: number
  name: string
  platform: string
  platform_id: string | null
  platform_video_count: number
  platform_view_count: number
  is_tracked: boolean
  trending_hashtag_id: number | null
  categories: CategoryBadge[]
  created_at: string
  updated_at: string
}

interface ContextMenuState {
  x: number
  y: number
  hashtag: Hashtag
}

interface CategoryOption {
  id: number
  title: string
  icon: string | null
}

const PAGE_SIZE = 50

export default function Hashtags() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<string>('')

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Category modal
  const [categoryModal, setCategoryModal] = useState<Hashtag | null>(null)
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set())
  const [savingCategories, setSavingCategories] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (platform) params.set('platform', platform)
      const res = await authFetch(`/api/analysis/hashtags?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setHashtags(data.hashtags || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load hashtags')
    } finally {
      setLoading(false)
    }
  }, [page, search, platform])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(0) }, [search, platform])

  // Close context menu on click-away or Escape
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [contextMenu])

  function handleContextMenu(e: React.MouseEvent, hashtag: Hashtag) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, hashtag })
  }

  async function handleTrackHashtag(hashtag: Hashtag) {
    setContextMenu(null)
    try {
      const res = await authFetch(`/api/analysis/hashtags/${hashtag.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to track')
      toast.success(`#${hashtag.name} added to tracked hashtags`)
      fetchData()
    } catch {
      toast.error('Failed to track hashtag')
    }
  }

  async function openCategoryModal(hashtag: Hashtag) {
    setContextMenu(null)
    setCategoryModal(hashtag)
    setLoadingCategories(true)
    try {
      const res = await authFetch(`/api/analysis/hashtags/${hashtag.id}/categories`)
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setAllCategories(data.all_categories || [])
      setSelectedCategoryIds(new Set((data.linked_categories || []).map((c: any) => c.id)))
    } catch {
      toast.error('Failed to load categories')
      setCategoryModal(null)
    } finally {
      setLoadingCategories(false)
    }
  }

  async function saveCategories() {
    if (!categoryModal) return
    setSavingCategories(true)
    try {
      const res = await authFetch(`/api/analysis/hashtags/${categoryModal.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_ids: Array.from(selectedCategoryIds) }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Categories updated')
      setCategoryModal(null)
      fetchData()
    } catch {
      toast.error('Failed to save categories')
    } finally {
      setSavingCategories(false)
    }
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded">
            Management
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Hashtags</h1>
            <p className="text-slate-500 text-sm font-medium">
              All discovered hashtags with platform stats. Right-click for actions.{' '}
              {total > 0 && <span className="text-slate-400">{total.toLocaleString()} hashtags</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {[
                { value: '', label: 'All' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'instagram', label: 'Instagram' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    platform === opt.value
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search hashtags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hashtags.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-hashtag text-violet-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Hashtags Found</h3>
          <p className="text-sm text-slate-500">
            {search ? 'Try a different search term.' : 'Hashtags will appear here as videos are discovered.'}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hashtag</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Videos</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Views</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Added</th>
                </tr>
              </thead>
              <tbody>
                {hashtags.map((h, i) => (
                  <tr
                    key={h.id}
                    onContextMenu={(e) => handleContextMenu(e, h)}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-context-menu"
                  >
                    <td className="px-5 py-3 text-slate-500 font-bold">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">#{h.name}</span>
                        {h.is_tracked && (
                          <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase tracking-wider rounded">
                            Tracked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        h.platform === 'tiktok'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-pink-500/10 text-pink-400'
                      }`}>
                        <i className={h.platform === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'} />
                        {h.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {h.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {h.categories.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-bold rounded"
                            >
                              {c.icon && <span className="text-[10px]">{c.icon}</span>}
                              {c.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-black text-white">{fmt(h.platform_video_count)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-400">{fmt(h.platform_view_count)}</td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-slate-500 font-medium">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number
                  if (totalPages <= 7) {
                    p = i
                  } else if (page < 4) {
                    p = i
                  } else if (page > totalPages - 5) {
                    p = totalPages - 7 + i
                  } else {
                    p = page - 3 + i
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-white/5 text-slate-500 hover:text-white'
                      }`}
                    >
                      {p + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[220px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              #{contextMenu.hashtag.name}
            </p>
          </div>

          {/* Add to Category */}
          <button
            onClick={() => openCategoryModal(contextMenu.hashtag)}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
          >
            <i className="fas fa-folder-plus text-violet-400 text-xs w-4 text-center" />
            <span>Add to Category</span>
            {contextMenu.hashtag.categories.length > 0 && (
              <span className="ml-auto text-[10px] font-bold text-violet-400/70">
                {contextMenu.hashtag.categories.length} linked
              </span>
            )}
          </button>

          {/* Track Hashtag */}
          <button
            onClick={() => !contextMenu.hashtag.is_tracked && handleTrackHashtag(contextMenu.hashtag)}
            disabled={contextMenu.hashtag.is_tracked}
            className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2.5 ${
              contextMenu.hashtag.is_tracked
                ? 'text-slate-600 cursor-default'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className={`fas ${contextMenu.hashtag.is_tracked ? 'fa-check-circle text-teal-500/50' : 'fa-crosshairs text-teal-400'} text-xs w-4 text-center`} />
            <span>{contextMenu.hashtag.is_tracked ? 'Already Tracked' : 'Track Hashtag'}</span>
          </button>
        </div>
      )}

      {/* Category Modal */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">Add to Category</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Select categories for <span className="text-pink-400 font-bold">#{categoryModal.name}</span>
              </p>
            </div>

            {/* Category List */}
            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              {loadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : allCategories.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No categories found. Create categories first.</p>
              ) : (
                <div className="space-y-1">
                  {allCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedCategoryIds.has(cat.id)
                          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedCategoryIds.has(cat.id)
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        {selectedCategoryIds.has(cat.id) && <i className="fas fa-check text-[9px]" />}
                      </div>
                      {cat.icon && <span className="text-sm">{cat.icon}</span>}
                      <span className="font-bold">{cat.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                onClick={() => setCategoryModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCategories}
                disabled={savingCategories || loadingCategories}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingCategories ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
