/**
 * KeywordBlacklist — admin-only management page for the platform's
 * keyword blacklist. Filters platform-bait and generic noise out of
 * insight widgets (spoken/on-screen hooks, hashtags, etc.).
 *
 * Routes:
 *   /dashboard/admin/keyword-blacklist
 *
 * Backend contract (owned by A1):
 *   GET    /api/admin/keyword-blacklist                  -> { items: BlacklistItem[] }
 *   POST   /api/admin/keyword-blacklist                  body { keyword, reason? }
 *                                                        -> 201 { item }
 *                                                        -> 409 { error: 'already_blacklisted' }
 *                                                        -> 400 { error: 'invalid_keyword' }
 *   DELETE /api/admin/keyword-blacklist/:keyword         -> 204
 *   GET    /api/admin/keyword-candidates?limit=50        -> { candidates: { keyword, frequency, source }[] }
 *
 * Dev-mode mock fallback: when the backend returns 404/501 (endpoint
 * not yet shipped) and we're in `import.meta.env.DEV`, we surface
 * realistic placeholder data so the UI is reviewable before A1 lands.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface BlacklistItem {
  keyword: string
  reason: string | null
  added_by: string | null
  added_at: string
}

interface Candidate {
  keyword: string
  frequency: number
  source: string | null
}

type SortKey = 'keyword' | 'added_at'
type SortDir = 'asc' | 'desc'

interface ReasonOption {
  value: string
  label: string
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: '', label: 'No reason' },
  { value: 'platform_name', label: 'Platform name' },
  { value: 'algorithm_bait', label: 'Algorithm bait' },
  { value: 'generic_virality', label: 'Generic virality term' },
  { value: 'generic_engagement', label: 'Generic engagement term' },
  { value: 'generic_noise', label: 'Generic noise' },
  { value: 'other', label: 'Other' },
]

// ─────────────────────────────────────────────────────────────────
// Mock fallback (dev-only)
// ─────────────────────────────────────────────────────────────────

function buildMockItems(): BlacklistItem[] {
  const now = Date.now()
  const seed: Array<[string, string]> = [
    ['tiktok', 'platform_name'],
    ['instagram', 'platform_name'],
    ['reels', 'platform_name'],
    ['fyp', 'algorithm_bait'],
    ['foryou', 'algorithm_bait'],
    ['foryoupage', 'algorithm_bait'],
    ['viral', 'generic_virality'],
    ['trending', 'generic_virality'],
    ['explore', 'algorithm_bait'],
    ['like', 'generic_engagement'],
    ['follow', 'generic_engagement'],
    ['share', 'generic_engagement'],
    ['comment', 'generic_engagement'],
    ['lol', 'generic_noise'],
    ['omg', 'generic_noise'],
  ]
  return seed.map(([keyword, reason], i) => ({
    keyword,
    reason,
    added_by: 'system',
    added_at: new Date(now - (seed.length - i) * 86_400_000).toISOString(),
  }))
}

function buildMockCandidates(existing: Set<string>): Candidate[] {
  const seed: Array<[string, number, string]> = [
    ['subscribe', 184, 'spoken'],
    ['hashtag', 142, 'onscreen'],
    ['algorithm', 121, 'spoken'],
    ['hack', 98, 'spoken'],
    ['secret', 87, 'onscreen'],
    ['trick', 71, 'spoken'],
    ['amazing', 64, 'spoken'],
    ['crazy', 58, 'onscreen'],
    ['insane', 47, 'spoken'],
    ['must', 41, 'onscreen'],
    ['watch', 38, 'spoken'],
    ['need', 33, 'onscreen'],
    ['tutorial', 29, 'hashtag'],
    ['howto', 24, 'hashtag'],
  ]
  return seed
    .filter(([keyword]) => !existing.has(keyword))
    .map(([keyword, frequency, source]) => ({ keyword, frequency, source }))
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function fmtRelativeAdds(items: BlacklistItem[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  return items.filter((i) => {
    const t = Date.parse(i.added_at)
    return Number.isFinite(t) && t >= cutoff
  }).length
}

function reasonLabel(value: string | null): string {
  if (!value) return '—'
  const found = REASON_OPTIONS.find((o) => o.value === value)
  return found ? found.label : value
}

function fmtFrequency(n: number): string {
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

// ─────────────────────────────────────────────────────────────────
// Mock-source banner
// ─────────────────────────────────────────────────────────────────

function MockDataBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-2.5 min-w-0">
        <i className="fas fa-flask text-amber-300 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-amber-200">
            Showing mock data
          </div>
          <div className="text-[11px] text-amber-100/80 mt-0.5">
            Backend keyword-blacklist endpoints aren&apos;t live yet. This is realistic
            placeholder data so you can preview the experience.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-colors shrink-0"
      >
        <i className="fas fa-rotate-right mr-1.5 text-[9px]" />
        Try real data
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Admin-only gate (inline; renders rather than redirects)
// ─────────────────────────────────────────────────────────────────

function NotAdmin() {
  return (
    <div className="glass-card rounded-3xl p-12 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-5">
        <i className="fas fa-shield-halved text-pink-400 text-xl" />
      </div>
      <h1 className="text-2xl font-black tracking-tighter mb-2 font-display">Admin only</h1>
      <p className="text-sm text-slate-400 font-medium mb-6">
        The keyword blacklist controls platform-wide insight filtering. Only Blossom admins
        can view and modify it.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
      >
        <i className="fas fa-arrow-left text-[10px]" />
        Back to dashboard
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────

export default function KeywordBlacklist() {
  const { userType, loading: authLoading } = useAuth()

  // ── List state ─────────────────────────────────────────────────
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)
  const [filterImpact, setFilterImpact] = useState<number | null>(null)

  // ── Sort + search ──────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>('keyword')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [search, setSearch] = useState('')

  // ── Add form state ─────────────────────────────────────────────
  const [newKeyword, setNewKeyword] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)

  // ── Delete in-flight tracking ──────────────────────────────────
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // ── Candidates state ───────────────────────────────────────────
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [candidatesEnabled, setCandidatesEnabled] = useState(true)
  const [pendingCandidate, setPendingCandidate] = useState<string | null>(null)

  // ── Loaders ────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/admin/keyword-blacklist')
      if (res.status === 404 || res.status === 501) {
        if (import.meta.env.DEV) {
          const mock = buildMockItems()
          setItems(mock)
          setUsingMock(true)
          setFilterImpact(null)
          return
        }
        setItems([])
        setUsingMock(false)
        return
      }
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
      setFilterImpact(typeof data?.filter_impact === 'number' ? data.filter_impact : null)
      setUsingMock(false)
    } catch (e) {
      if (import.meta.env.DEV) {
        // Network / unknown failure in dev — fall back to mock so the UI is still
        // reviewable. Production gets a toast and an empty state.
        setItems(buildMockItems())
        setUsingMock(true)
        setFilterImpact(null)
      } else {
        console.error('Failed to load keyword blacklist:', e)
        toast.error('Failed to load keyword blacklist')
        setItems([])
        setUsingMock(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCandidates = useCallback(async (existing: Set<string>) => {
    setCandidatesLoading(true)
    try {
      const res = await authFetch('/api/admin/keyword-candidates?limit=50')
      if (res.status === 404 || res.status === 501) {
        if (import.meta.env.DEV) {
          setCandidates(buildMockCandidates(existing))
          setCandidatesEnabled(true)
          return
        }
        // Endpoint not shipped — hide the section in production.
        setCandidates([])
        setCandidatesEnabled(false)
        return
      }
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setCandidates(Array.isArray(data?.candidates) ? data.candidates : [])
      setCandidatesEnabled(true)
    } catch (e) {
      if (import.meta.env.DEV) {
        setCandidates(buildMockCandidates(existing))
        setCandidatesEnabled(true)
      } else {
        console.error('Failed to load keyword candidates:', e)
        setCandidates([])
        setCandidatesEnabled(false)
      }
    } finally {
      setCandidatesLoading(false)
    }
  }, [])

  // Initial load (only when authenticated as admin)
  useEffect(() => {
    if (authLoading) return
    if (userType !== 'admin') return
    loadList()
  }, [authLoading, userType, loadList])

  // Reload candidates whenever the blacklist changes — server should
  // ideally already exclude blacklisted keywords, but we also de-dupe
  // client-side as a defensive net.
  useEffect(() => {
    if (authLoading) return
    if (userType !== 'admin') return
    const existing = new Set(items.map((i) => i.keyword.toLowerCase()))
    loadCandidates(existing)
    // We intentionally depend on items length + first/last keyword to avoid
    // reload churn on identity changes that don't actually mutate the set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userType, items.length, items[0]?.keyword, items[items.length - 1]?.keyword])

  // ── Derived: filtered + sorted items ───────────────────────────
  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    let list = items
    if (needle) list = list.filter((i) => i.keyword.toLowerCase().includes(needle))
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'keyword') {
      list = [...list].sort((a, b) => a.keyword.localeCompare(b.keyword) * dir)
    } else {
      list = [...list].sort((a, b) => {
        const ta = Date.parse(a.added_at) || 0
        const tb = Date.parse(b.added_at) || 0
        return (ta - tb) * dir
      })
    }
    return list
  }, [items, search, sortKey, sortDir])

  const recentAdds = useMemo(() => fmtRelativeAdds(items), [items])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'keyword' ? 'asc' : 'desc')
    }
  }

  // ── Add handler ────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (adding) return
    const keyword = newKeyword.trim().toLowerCase()
    if (!keyword) {
      toast.error('Enter a keyword')
      return
    }
    setAdding(true)
    try {
      const res = await authFetch('/api/admin/keyword-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, reason: newReason || undefined }),
      })

      if (res.status === 409) {
        toast.error('Already blacklisted')
        return
      }
      if (res.status === 400) {
        const body = await res.json().catch(() => null)
        toast.error(body?.error === 'invalid_keyword' ? 'Invalid keyword' : 'Could not add keyword')
        return
      }
      // Dev mock path — backend not shipped.
      if ((res.status === 404 || res.status === 501) && import.meta.env.DEV) {
        if (items.some((i) => i.keyword.toLowerCase() === keyword)) {
          toast.error('Already blacklisted')
          return
        }
        setItems((prev) => [
          {
            keyword,
            reason: newReason || null,
            added_by: 'you (mock)',
            added_at: new Date().toISOString(),
          },
          ...prev,
        ])
        setNewKeyword('')
        setNewReason('')
        toast.success(`Blacklisted "${keyword}"`)
        return
      }
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json().catch(() => null)
      const added: BlacklistItem | null = data?.item ?? null
      if (added) {
        setItems((prev) => [added, ...prev.filter((i) => i.keyword !== added.keyword)])
      } else {
        // Fallback: refetch the list
        await loadList()
      }
      setNewKeyword('')
      setNewReason('')
      toast.success(`Blacklisted "${keyword}"`)
    } catch (e) {
      console.error('Failed to blacklist keyword:', e)
      toast.error('Could not add keyword')
    } finally {
      setAdding(false)
    }
  }

  // ── Delete handler ─────────────────────────────────────────────
  async function handleDelete(keyword: string) {
    if (deletingKey) return
    const confirmed = window.confirm(
      `Remove "${keyword}" from the blacklist?\n\nIt will start appearing in insight widgets again.`,
    )
    if (!confirmed) return
    setDeletingKey(keyword)
    // Optimistic remove
    const snapshot = items
    setItems((prev) => prev.filter((i) => i.keyword !== keyword))
    try {
      const res = await authFetch(
        `/api/admin/keyword-blacklist/${encodeURIComponent(keyword)}`,
        { method: 'DELETE' },
      )
      if ((res.status === 404 || res.status === 501) && import.meta.env.DEV) {
        // Mock path — optimistic remove already applied.
        toast.success(`Removed "${keyword}"`)
        return
      }
      if (!res.ok && res.status !== 204) {
        throw new Error(`API ${res.status}`)
      }
      toast.success(`Removed "${keyword}"`)
    } catch (e) {
      console.error('Failed to remove keyword:', e)
      toast.error('Could not remove keyword')
      // Rollback
      setItems(snapshot)
    } finally {
      setDeletingKey(null)
    }
  }

  // ── Candidate blacklist (one-click) ───────────────────────────
  async function handleBlacklistCandidate(c: Candidate) {
    if (pendingCandidate) return
    setPendingCandidate(c.keyword)
    // Optimistic UI: remove from candidates, add to list
    const candidatesSnapshot = candidates
    const itemsSnapshot = items
    setCandidates((prev) => prev.filter((x) => x.keyword !== c.keyword))
    const optimisticItem: BlacklistItem = {
      keyword: c.keyword,
      reason: 'admin_pick',
      added_by: 'you',
      added_at: new Date().toISOString(),
    }
    setItems((prev) => [optimisticItem, ...prev])
    try {
      const res = await authFetch('/api/admin/keyword-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: c.keyword, reason: 'admin_pick' }),
      })
      if ((res.status === 404 || res.status === 501) && import.meta.env.DEV) {
        toast.success(`Blacklisted "${c.keyword}"`)
        return
      }
      if (res.status === 409) {
        // Already there — keep optimistic state, just notify.
        toast.success(`"${c.keyword}" is already blacklisted`)
        return
      }
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json().catch(() => null)
      const added: BlacklistItem | null = data?.item ?? null
      if (added) {
        setItems((prev) => [added, ...prev.filter((i) => i.keyword !== added.keyword)])
      }
      toast.success(`Blacklisted "${c.keyword}"`)
    } catch (e) {
      console.error('Failed to blacklist candidate:', e)
      toast.error(`Could not blacklist "${c.keyword}"`)
      // Rollback
      setItems(itemsSnapshot)
      setCandidates(candidatesSnapshot)
    } finally {
      setPendingCandidate(null)
    }
  }

  // ── Auth gate (inline render — see brief: don't redirect) ──────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (userType !== 'admin') return <NotAdmin />

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded">
            Management
          </span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-2 font-display">
              <span className="gradient-text">Keyword Blacklist</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
              Filter platform-bait and generic noise from insight widgets. Affects spoken
              and on-screen hook keywords, whitespace, and hashtag surfaces dashboard-wide.
            </p>
          </div>
        </div>
      </div>

      {/* Mock-mode banner */}
      {usingMock && <MockDataBanner onRetry={loadList} />}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-2xl sm:text-3xl font-black text-white">
            {loading ? '—' : items.length.toLocaleString()}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            <i className="fas fa-ban mr-1.5 text-pink-400" />
            Total blacklisted
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {loading ? '—' : recentAdds.toLocaleString()}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            <i className="fas fa-clock mr-1.5 text-amber-400" />
            Added (24h)
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {filterImpact != null
              ? fmtFrequency(filterImpact)
              : usingMock
                ? '—'
                : loading
                  ? '—'
                  : '—'}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            <i className="fas fa-filter mr-1.5 text-emerald-400" />
            Filter impact
          </div>
        </div>
      </div>

      {/* Table + Add form */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Current Blacklist Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5 flex-wrap">
              <div>
                <h2 className="text-base font-black text-white">Current Blacklist</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Click the ✕ to remove. Sort by clicking column headers.
                </p>
              </div>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 glass-input rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Table body */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-ban text-violet-400 text-lg" />
                </div>
                <h3 className="text-sm font-black text-white mb-1">
                  {search ? 'No matching keywords.' : 'No blacklisted keywords yet.'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {search
                    ? 'Try a different search term.'
                    : 'Add a keyword on the right to filter it out of insight widgets.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.03]">
                      <th
                        onClick={() => toggleSort('keyword')}
                        className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors select-none"
                      >
                        Keyword{' '}
                        {sortKey === 'keyword' && (
                          <i
                            className={`fas fa-arrow-${sortDir === 'asc' ? 'up' : 'down'} ml-1 text-[9px]`}
                          />
                        )}
                      </th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Reason
                      </th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Added by
                      </th>
                      <th
                        onClick={() => toggleSort('added_at')}
                        className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors select-none"
                      >
                        Added{' '}
                        {sortKey === 'added_at' && (
                          <i
                            className={`fas fa-arrow-${sortDir === 'asc' ? 'up' : 'down'} ml-1 text-[9px]`}
                          />
                        )}
                      </th>
                      <th className="px-3 py-3 w-10" aria-label="Remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr
                        key={item.keyword}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 font-bold text-white">{item.keyword}</td>
                        <td className="px-5 py-3 text-slate-400 text-xs">
                          {reasonLabel(item.reason)}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {item.added_by || '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-500 text-xs">
                          {fmtDate(item.added_at)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.keyword)}
                            disabled={deletingKey === item.keyword}
                            aria-label={`Remove ${item.keyword}`}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {deletingKey === item.keyword ? (
                              <i className="fas fa-spinner fa-spin text-[10px]" />
                            ) : (
                              <i className="fas fa-xmark text-xs" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Keyword Form */}
        <div className="col-span-12 lg:col-span-4">
          <form
            onSubmit={handleAdd}
            className="glass-card rounded-2xl p-5 sm:p-6 lg:sticky lg:top-4"
          >
            <h2 className="text-base font-black text-white mb-1">Add Keyword</h2>
            <p className="text-[11px] text-slate-500 font-medium mb-5">
              Auto-lowercased and trimmed on submit. Affects insight widgets immediately.
            </p>

            <label
              htmlFor="kb-keyword"
              className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
            >
              Keyword
            </label>
            <input
              id="kb-keyword"
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              disabled={adding}
              placeholder="e.g. fyp"
              className="w-full px-3 py-2.5 glass-input rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 mb-4"
            />

            <label
              htmlFor="kb-reason"
              className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
            >
              Reason (optional)
            </label>
            <select
              id="kb-reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              disabled={adding}
              className="w-full px-3 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50 mb-5 appearance-none cursor-pointer"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={adding || !newKeyword.trim()}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1.5 text-[10px]" />
                  Adding...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-1.5 text-[10px]" />
                  Blacklist Keyword
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Candidates section — hidden when the endpoint isn't shipped (prod) */}
      {candidatesEnabled && (
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
            <div>
              <h2 className="text-base font-black text-white mb-1">
                Top Non-Blacklisted Keywords
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Most-used keywords across insights that aren&apos;t filtered yet. One-click
                to add.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              <i className="fas fa-list-ol mr-1.5 text-violet-400" />
              {candidatesLoading ? '—' : candidates.length} candidates
            </span>
          </div>

          {candidatesLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-10 px-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-circle-check text-emerald-400 text-lg" />
              </div>
              <h3 className="text-sm font-black text-white mb-1">
                Nothing left to review
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Your blacklist is comprehensive.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => {
                const isPending = pendingCandidate === c.keyword
                const sourceColor =
                  c.source === 'spoken'
                    ? 'text-pink-300'
                    : c.source === 'onscreen'
                      ? 'text-cyan-300'
                      : c.source === 'hashtag'
                        ? 'text-violet-300'
                        : 'text-slate-400'
                return (
                  <div
                    key={c.keyword}
                    className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <span className="text-xs font-bold text-white">{c.keyword}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {fmtFrequency(c.frequency)}
                    </span>
                    {c.source && (
                      <span className={`text-[9px] font-black uppercase ${sourceColor}`}>
                        {c.source}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBlacklistCandidate(c)}
                      disabled={isPending}
                      aria-label={`Blacklist ${c.keyword}`}
                      className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <i className="fas fa-spinner fa-spin text-[9px]" />
                      ) : (
                        <>
                          Blacklist <i className="fas fa-arrow-right text-[8px] ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
