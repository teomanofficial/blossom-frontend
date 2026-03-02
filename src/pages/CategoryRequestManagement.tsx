import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '../lib/api'
import toast from 'react-hot-toast'

interface CategoryRequest {
  id: number
  user_id: string
  requested_name: string
  requested_description: string | null
  status: string
  admin_notes: string | null
  approved_category_id: number | null
  approved_category_title: string | null
  email: string
  profile_name: string | null
  created_at: string
  updated_at: string
  reviewed_at: string | null
}

interface Stats {
  total: string
  pending: string
  approved: string
  rejected: string
}

interface Category {
  id: number
  title: string
  description: string | null
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-400/10 text-yellow-400'
    case 'approved': return 'bg-teal-400/10 text-teal-400'
    case 'rejected': return 'bg-red-400/10 text-red-400'
    default: return 'bg-slate-400/10 text-slate-500'
  }
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

export default function CategoryRequestManagement() {
  const [requests, setRequests] = useState<CategoryRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Approve modal state
  const [approveRequest, setApproveRequest] = useState<CategoryRequest | null>(null)
  const [approveMode, setApproveMode] = useState<'existing' | 'new'>('existing')
  const [existingCategories, setExistingCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [approving, setApproving] = useState(false)

  // Reject modal state
  const [rejectRequest, setRejectRequest] = useState<CategoryRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await authFetch(`/api/onboarding/admin/category-requests?${params}`)
      const data = await res.json()
      setRequests(data.requests || [])
      setStats(data.stats || null)
    } catch {
      toast.error('Failed to load category requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const fetchCategories = async () => {
    try {
      const res = await authFetch('/api/onboarding/categories')
      setExistingCategories(await res.json())
    } catch { /* ignore */ }
  }

  const openApproveModal = (req: CategoryRequest) => {
    setApproveRequest(req)
    setApproveMode('existing')
    setSelectedCategoryId(null)
    setNewCategoryName(req.requested_name)
    setNewCategoryDescription(req.requested_description || '')
    fetchCategories()
  }

  const handleApprove = async () => {
    if (!approveRequest) return
    setApproving(true)
    try {
      const body: Record<string, any> = {}
      if (approveMode === 'existing') {
        if (!selectedCategoryId) {
          toast.error('Select a category')
          setApproving(false)
          return
        }
        body.categoryId = selectedCategoryId
      } else {
        if (!newCategoryName.trim()) {
          toast.error('Category name is required')
          setApproving(false)
          return
        }
        body.createCategory = true
        body.categoryName = newCategoryName.trim()
        body.categoryDescription = newCategoryDescription.trim()
      }

      const res = await authFetch(`/api/onboarding/admin/category-requests/${approveRequest.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to approve')
        return
      }
      toast.success('Request approved')
      setApproveRequest(null)
      fetchRequests()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectRequest) return
    setRejecting(true)
    try {
      const res = await authFetch(`/api/onboarding/admin/category-requests/${rejectRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject')
        return
      }
      toast.success('Request rejected')
      setRejectRequest(null)
      setRejectReason('')
      fetchRequests()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setRejecting(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Category Requests</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage category requests from users
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Approved', value: stats.approved, color: 'text-teal-400' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusFilter === f.key
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email, name, or category..."
            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/40 focus:outline-none"
            onBlur={() => setSearch(searchInput)}
          />
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-500 font-medium">
          No category requests found
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Requested Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-white">{req.profile_name || '\u2014'}</div>
                    <div className="text-xs text-slate-500">{req.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-white">{req.requested_name}</div>
                    {req.requested_description && (
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{req.requested_description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                    {req.status === 'approved' && req.approved_category_title && (
                      <div className="text-xs text-slate-500 mt-1">&rarr; {req.approved_category_title}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {timeAgo(req.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openApproveModal(req)}
                          className="px-3 py-1.5 bg-teal-500/10 text-teal-400 rounded-lg text-xs font-bold hover:bg-teal-500/20 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectRequest(req); setRejectReason('') }}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Modal */}
      {approveRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setApproveRequest(null)}>
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-2">Approve Request</h3>
            <p className="text-sm text-slate-400 mb-6">
              &ldquo;{approveRequest.requested_name}&rdquo; from {approveRequest.email}
            </p>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setApproveMode('existing')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  approveMode === 'existing' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                Map to Existing
              </button>
              <button
                onClick={() => setApproveMode('new')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  approveMode === 'new' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                Create New
              </button>
            </div>

            {approveMode === 'existing' ? (
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Select Category
                </label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-pink-500/40 focus:outline-none"
                >
                  <option value="">Choose a category...</option>
                  {existingCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-pink-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-pink-500/40 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setApproveRequest(null)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-6 py-3 bg-teal-500 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all hover:bg-teal-400"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectRequest(null)}>
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-2">Reject Request</h3>
            <p className="text-sm text-slate-400 mb-6">
              &ldquo;{rejectRequest.requested_name}&rdquo; from {rejectRequest.email}
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request was rejected..."
                rows={3}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/40 focus:outline-none resize-none"
              />
              <p className="text-xs text-slate-600 mt-2">
                The user will see this message and can submit a new request.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRejectRequest(null)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="px-6 py-3 bg-red-500 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all hover:bg-red-400"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
