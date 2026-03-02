import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'

interface UserSummary {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  banned_until: string | null
  is_sso_user: boolean
  raw_user_meta_data: Record<string, any> | null
  full_name: string | null
  avatar_url: string | null
  user_type: string | null
  sub_status: string | null
  paddle_subscription_id: string | null
  paddle_customer_id: string | null
  current_billing_period_start: string | null
  current_billing_period_end: string | null
  canceled_at: string | null
  payment_failure_count: number | null
  last_payment_error: string | null
  plan_name: string | null
  plan_slug: string | null
  price_amount: number | null
  vip_credits_total: number | null
  vip_credits_used: number | null
}

interface UserDetail {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  banned_until: string | null
  is_sso_user: boolean
  raw_user_meta_data: Record<string, any> | null
  raw_app_meta_data: Record<string, any> | null
  full_name: string | null
  avatar_url: string | null
  user_type: string | null
  profile_created_at: string | null
  profile_updated_at: string | null
  sub_id: number | null
  sub_status: string | null
  paddle_subscription_id: string | null
  paddle_customer_id: string | null
  paddle_transaction_id: string | null
  current_billing_period_start: string | null
  current_billing_period_end: string | null
  canceled_at: string | null
  effective_cancel_at: string | null
  payment_failure_count: number | null
  last_payment_error: string | null
  subscription_data: any
  sub_created_at: string | null
  sub_updated_at: string | null
  plan_name: string | null
  plan_slug: string | null
  price_amount: number | null
  price_currency: string | null
  billing_interval: string | null
}

interface BillingEvent {
  id: number
  paddle_event_id: string
  event_type: string
  paddle_subscription_id: string | null
  paddle_customer_id: string | null
  processed: boolean
  error_message: string | null
  created_at: string
}

interface UsageStats {
  uploads: number
  analyses: number
  social_accounts: number
}

interface VipConfig {
  credits_total: number
  credits_used: number
  notes: string | null
  created_at: string
}

interface Stats {
  total: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  noSubscription: number
  vip: number
}

interface InviteLink {
  id: string
  token: string
  email: string | null
  expires_at: string
  used_at: string | null
  used_by_email: string | null
  created_by_email: string | null
  credits: number
  status: string
  effective_status: string
  created_at: string
}

interface Category {
  id: number
  title: string
  description: string | null
  icon: string | null
}

interface Domain {
  keyword_id: number
  keyword: string
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

const statusColors: Record<string, string> = {
  active: 'bg-teal-400/10 text-teal-400',
  trialing: 'bg-orange-400/10 text-orange-400',
  past_due: 'bg-red-400/10 text-red-400',
  paused: 'bg-yellow-400/10 text-yellow-400',
  canceled: 'bg-red-400/10 text-red-400',
  none: 'bg-slate-400/10 text-slate-500',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy() }}
      className="ml-1.5 text-slate-600 hover:text-slate-400 transition-colors"
      title="Copy"
    >
      <i className={`fas ${copied ? 'fa-check text-teal-400' : 'fa-copy'} text-[10px]`} />
    </button>
  )
}

function generatePassword(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let pass = ''
  for (let i = 0; i < 16; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
  return pass
}

export default function Users() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [updatingUserType, setUpdatingUserType] = useState(false)

  // VIP detail state
  const [vipConfig, setVipConfig] = useState<VipConfig | null>(null)
  const [editingCredits, setEditingCredits] = useState(false)
  const [editCreditsValue, setEditCreditsValue] = useState(0)
  const [savingCredits, setSavingCredits] = useState(false)

  // Create VIP modal state
  const [createVipOpen, setCreateVipOpen] = useState(false)
  const [creatingVip, setCreatingVip] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [domainsByCategory, setDomainsByCategory] = useState<Record<number, Domain[]>>({})
  const [vipForm, setVipForm] = useState({
    email: '',
    password: generatePassword(),
    full_name: '',
    category_id: 0,
    domain_ids: [] as number[],
    credits: 100,
  })

  // Invite state
  const [invites, setInvites] = useState<InviteLink[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [showInvites, setShowInvites] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    expires_at: '',
    credits: 100,
  })

  const fetchUsers = async (searchTerm = '') => {
    try {
      const qs = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const res = await authFetch(`/api/admin/users${qs}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error('Error fetching users:', err)
      setErrorMsg('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true)
    setShowEvents(false)
    setVipConfig(null)
    try {
      const res = await authFetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUserDetail(data.user)
      setBillingEvents(data.billingEvents || [])
      setUsageStats(data.usageStats || null)
      setVipConfig(data.vipConfig || null)
    } catch (err) {
      console.error('Error fetching user detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(
      setTimeout(() => {
        setLoading(true)
        fetchUsers(value)
      }, 400)
    )
  }

  const handleRowClick = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      setUserDetail(null)
    } else {
      setExpandedUserId(userId)
      fetchUserDetail(userId)
    }
  }

  const handleUserTypeChange = async (userId: string, newType: string) => {
    setUpdatingUserType(true)
    try {
      const res = await authFetch(`/api/admin/users/${userId}/user-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: newType }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to update user type')
        return
      }
      // Update local state
      if (userDetail) setUserDetail({ ...userDetail, user_type: newType })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, user_type: newType } : u))
      )
      // Refetch detail to get VIP config if changed to VIP
      if (newType === 'vip') fetchUserDetail(userId)
    } catch (err) {
      console.error('Error updating user type:', err)
      setErrorMsg('Failed to update user type')
    } finally {
      setUpdatingUserType(false)
    }
  }

  const handleSaveCredits = async (userId: string) => {
    setSavingCredits(true)
    try {
      const res = await authFetch(`/api/admin/users/${userId}/vip-credits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits_total: editCreditsValue }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to update credits')
        return
      }
      const data = await res.json()
      setVipConfig(data.vipConfig)
      setEditingCredits(false)
    } catch (err) {
      console.error('Error updating VIP credits:', err)
      setErrorMsg('Failed to update credits')
    } finally {
      setSavingCredits(false)
    }
  }

  const openCreateVipModal = async () => {
    setCreateVipOpen(true)
    setVipForm({ email: '', password: generatePassword(), full_name: '', category_id: 0, domain_ids: [], credits: 100 })
    try {
      const res = await authFetch('/api/onboarding/admin/simulation/data')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data.categories || [])
      setDomainsByCategory(data.domainsByCategory || {})
    } catch (err) {
      console.error('Error fetching simulation data:', err)
      setErrorMsg('Failed to load categories')
    }
  }

  const handleCreateVip = async () => {
    if (!vipForm.email || !vipForm.password || !vipForm.full_name || !vipForm.category_id) {
      setErrorMsg('Please fill in all required fields')
      return
    }
    setCreatingVip(true)
    try {
      const res = await authFetch('/api/admin/users/create-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vipForm),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to create VIP user')
        return
      }
      setCreateVipOpen(false)
      setSuccessMsg('VIP user created successfully')
      setTimeout(() => setSuccessMsg(null), 4000)
      fetchUsers(search)
    } catch (err) {
      console.error('Error creating VIP user:', err)
      setErrorMsg('Failed to create VIP user')
    } finally {
      setCreatingVip(false)
    }
  }

  // ─── Invite functions ───────────────────────────────────────

  const fetchInvites = async () => {
    setInvitesLoading(true)
    try {
      const res = await authFetch('/api/admin/invites')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (err) {
      console.error('Error fetching invites:', err)
      setErrorMsg('Failed to load invites')
    } finally {
      setInvitesLoading(false)
    }
  }

  const openInviteModal = () => {
    // Default expiration: 7 days from now
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const localIso = defaultExpiry.toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm
    setInviteForm({ email: '', expires_at: localIso, credits: 100 })
    setGeneratedInviteUrl(null)
    setInviteModalOpen(true)
  }

  const handleCreateInvite = async () => {
    if (!inviteForm.expires_at) {
      setErrorMsg('Please set an expiration date')
      return
    }
    setCreatingInvite(true)
    try {
      const res = await authFetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email || undefined,
          expires_at: new Date(inviteForm.expires_at).toISOString(),
          credits: inviteForm.credits,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to create invite')
        return
      }
      const data = await res.json()
      setGeneratedInviteUrl(data.inviteUrl)
      setSuccessMsg('Invite link created')
      setTimeout(() => setSuccessMsg(null), 4000)
      // Refresh invites list if it's visible
      if (showInvites) fetchInvites()
    } catch (err) {
      console.error('Error creating invite:', err)
      setErrorMsg('Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await authFetch(`/api/admin/invites/${inviteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to revoke invite')
        return
      }
      setInvites((prev) =>
        prev.map((inv) => inv.id === inviteId ? { ...inv, status: 'revoked', effective_status: 'revoked' } : inv)
      )
      setSuccessMsg('Invite revoked')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Error revoking invite:', err)
      setErrorMsg('Failed to revoke invite')
    }
  }

  const getAuthProvider = (meta: Record<string, any> | null): string => {
    if (!meta) return 'email'
    if (meta.iss?.includes('google')) return 'Google'
    if (meta.provider === 'google') return 'Google'
    if (meta.providers?.includes('google')) return 'Google'
    return 'Email'
  }

  const currentDomains = vipForm.category_id ? (domainsByCategory[vipForm.category_id] || []) : []

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded">
            Management
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black font-display tracking-tighter mb-2">
          User <span className="gradient-text">Management</span>
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium">
          View all users, subscriptions, billing events, and debug user state.
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center justify-between">
          <span>
            <i className="fas fa-exclamation-circle mr-2" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400/60 hover:text-red-400">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold flex items-center justify-between">
          <span>
            <i className="fas fa-check-circle mr-2" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-teal-400/60 hover:text-teal-400">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Total Users', value: stats.total, icon: 'fa-users', color: 'text-white' },
            { label: 'Active', value: stats.active, icon: 'fa-check-circle', color: 'text-teal-400' },
            { label: 'Trialing', value: stats.trialing, icon: 'fa-clock', color: 'text-orange-400' },
            { label: 'Past Due', value: stats.pastDue, icon: 'fa-exclamation-triangle', color: 'text-red-400' },
            { label: 'Canceled', value: stats.canceled, icon: 'fa-ban', color: 'text-red-400' },
            { label: 'No Sub', value: stats.noSubscription, icon: 'fa-minus-circle', color: 'text-slate-500' },
            { label: 'VIP', value: stats.vip, icon: 'fa-crown', color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                <i className={`fas ${s.icon} mr-1`} />
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Create VIP */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3 glass-input px-4 py-2.5 md:px-5 md:py-3 rounded-2xl w-full md:max-w-md focus-within:border-white/20 transition-all">
          <i className="fas fa-search text-slate-500 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by email or name..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); fetchUsers('') }}
              className="text-slate-500 hover:text-slate-300"
            >
              <i className="fas fa-times text-xs" />
            </button>
          )}
        </div>
        <button
          onClick={openInviteModal}
          className="flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 whitespace-nowrap"
        >
          <i className="fas fa-paper-plane text-xs" />
          <span className="hidden md:inline">Invite Beta Tester</span>
          <span className="md:hidden">Invite</span>
        </button>
        <button
          onClick={openCreateVipModal}
          className="flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <i className="fas fa-crown text-xs" />
          <span className="hidden md:inline">Create VIP</span>
          <span className="md:hidden">VIP</span>
        </button>
      </div>

      {/* ═══════════ Invite Links Section ═══════════ */}
      <div className="mb-6">
        <button
          onClick={() => { setShowInvites(!showInvites); if (!showInvites && invites.length === 0) fetchInvites() }}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors mb-3"
        >
          <i className={`fas fa-chevron-right transition-transform ${showInvites ? 'rotate-90' : ''}`} />
          <i className="fas fa-paper-plane mr-1" />
          Invite Links
        </button>

        {showInvites && (
          <div className="glass-card rounded-2xl overflow-hidden">
            {invitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-6 text-center">
                No invite links created yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 bg-white/[0.03]">
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Expires</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Used By</th>
                      <th className="text-left py-3 px-4">Credits</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const statusColor: Record<string, string> = {
                        pending: 'bg-violet-400/10 text-violet-400',
                        used: 'bg-teal-400/10 text-teal-400',
                        expired: 'bg-slate-400/10 text-slate-500',
                        revoked: 'bg-red-400/10 text-red-400',
                      }
                      const inviteUrl = `${window.location.origin}/signup?invite=${inv.token}`
                      return (
                        <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="text-xs font-medium text-slate-300">
                              {inv.email || <span className="text-slate-600 italic">Any email</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-400">{formatDate(inv.expires_at)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor[inv.effective_status] || statusColor.pending}`}>
                              {inv.effective_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-400">{inv.used_by_email || '—'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-amber-400">{inv.credits}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-500">{timeAgo(inv.created_at)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.effective_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(inviteUrl); setSuccessMsg('Link copied!'); setTimeout(() => setSuccessMsg(null), 2000) }}
                                    className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-bold hover:bg-violet-500/20 transition-colors"
                                    title="Copy invite link"
                                  >
                                    <i className="fas fa-copy mr-1" /> Copy
                                  </button>
                                  <button
                                    onClick={() => handleRevokeInvite(inv.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                                    title="Revoke invite"
                                  >
                                    <i className="fas fa-ban mr-1" /> Revoke
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="glass-card rounded-2xl overflow-hidden">
            {/* User Row */}
            <button
              onClick={() => handleRowClick(user.id)}
              className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 text-left hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors"
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                user.user_type === 'vip'
                  ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-amber-900'
                  : 'bg-gradient-to-br from-pink-500 to-orange-400'
              }`}>
                {user.user_type === 'vip' ? (
                  <i className="fas fa-crown text-sm" />
                ) : (
                  (user.full_name || user.email || '?').charAt(0).toUpperCase()
                )}
              </div>

              {/* Name & Email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">
                    {user.full_name || user.email?.split('@')[0] || 'Unknown'}
                  </span>
                  {user.user_type === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400">
                      Admin
                    </span>
                  )}
                  {user.user_type === 'vip' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400">
                      <i className="fas fa-crown mr-0.5 text-[8px]" /> VIP
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium truncate">{user.email}</div>
              </div>

              {/* Subscription Status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* VIP credits indicator */}
                {user.user_type === 'vip' && user.vip_credits_total !== null && (
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-amber-400 font-bold">
                      {(user.vip_credits_total ?? 0) - (user.vip_credits_used ?? 0)} credits
                    </div>
                    <div className="text-[10px] text-amber-400/50">
                      of {user.vip_credits_total}
                    </div>
                  </div>
                )}

                {user.user_type !== 'vip' && (
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-slate-400 font-medium">
                      {user.plan_name || 'No plan'}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {user.price_amount ? `${formatPrice(user.price_amount)}/mo` : ''}
                    </div>
                  </div>
                )}

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${
                    user.user_type === 'vip'
                      ? 'bg-amber-400/10 text-amber-400'
                      : statusColors[user.sub_status || 'none'] || statusColors.none
                  }`}
                >
                  {user.user_type === 'vip' ? 'VIP' : (user.sub_status || 'None')}
                </span>

                {(user.payment_failure_count ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-black" title="Payment failures">
                    <i className="fas fa-exclamation-triangle mr-0.5" />
                    {user.payment_failure_count}
                  </span>
                )}

                <div className="text-right hidden lg:block min-w-[80px]">
                  <div className="text-[10px] text-slate-600 font-medium">Last seen</div>
                  <div className="text-xs text-slate-400 font-semibold">
                    {timeAgo(user.last_sign_in_at)}
                  </div>
                </div>

                <div className="text-right hidden lg:block min-w-[80px]">
                  <div className="text-[10px] text-slate-600 font-medium">Signed up</div>
                  <div className="text-xs text-slate-400 font-semibold">
                    {timeAgo(user.created_at)}
                  </div>
                </div>

                <i
                  className={`fas fa-chevron-down text-slate-600 text-xs transition-transform ${
                    expandedUserId === user.id ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Expanded Detail */}
            {expandedUserId === user.id && (
              <div className="border-t border-white/5 p-4 md:p-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : userDetail ? (
                  <div className="space-y-6">
                    {/* Auth Info */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                        <i className="fas fa-shield-halved mr-1" /> Auth Info
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="User ID">
                          <span className="font-mono text-xs">{userDetail.id}</span>
                          <CopyButton text={userDetail.id} />
                        </Field>
                        <Field label="Email">{userDetail.email}</Field>
                        <Field label="Auth Provider">{getAuthProvider(userDetail.raw_user_meta_data)}</Field>
                        <Field label="Email Confirmed">{formatDate(userDetail.email_confirmed_at)}</Field>
                        <Field label="Last Sign-In">{formatDate(userDetail.last_sign_in_at)}</Field>
                        <Field label="Created At">{formatDate(userDetail.created_at)}</Field>
                        <Field label="SSO User">{userDetail.is_sso_user ? 'Yes' : 'No'}</Field>
                        <Field label="Banned Until">
                          {userDetail.banned_until ? (
                            <span className="text-red-400">{formatDate(userDetail.banned_until)}</span>
                          ) : (
                            <span className="text-slate-500">Not banned</span>
                          )}
                        </Field>
                      </div>
                    </div>

                    {/* Profile */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-3">
                        <i className="fas fa-user mr-1" /> Profile
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Full Name">{userDetail.full_name || '—'}</Field>
                        <Field label="User Type">
                          <select
                            value={userDetail.user_type || 'user'}
                            onChange={(e) => handleUserTypeChange(userDetail.id, e.target.value)}
                            disabled={updatingUserType}
                            className="glass-input rounded-lg px-2.5 py-1 text-sm font-semibold outline-none cursor-pointer hover:border-white/20 focus:border-indigo-500/50 transition-colors appearance-none disabled:opacity-50"
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="vip">vip</option>
                          </select>
                          {updatingUserType && (
                            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin ml-2" />
                          )}
                        </Field>
                        <Field label="Avatar URL">
                          {userDetail.avatar_url ? (
                            <span className="text-xs truncate block max-w-[200px]" title={userDetail.avatar_url}>
                              {userDetail.avatar_url}
                            </span>
                          ) : '—'}
                        </Field>
                        <Field label="Profile Created">{formatDate(userDetail.profile_created_at)}</Field>
                        <Field label="Profile Updated">{formatDate(userDetail.profile_updated_at)}</Field>
                      </div>
                    </div>

                    {/* VIP Credits */}
                    {userDetail.user_type === 'vip' && vipConfig && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">
                          <i className="fas fa-crown mr-1" /> VIP Credits
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-xl font-black text-amber-400">
                              {vipConfig.credits_total - vipConfig.credits_used}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Remaining
                            </div>
                          </div>
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-xl font-black text-white">{vipConfig.credits_used}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Used
                            </div>
                          </div>
                          <div className="glass-card rounded-xl p-4 text-center">
                            {editingCredits ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={editCreditsValue}
                                  onChange={(e) => setEditCreditsValue(parseInt(e.target.value) || 0)}
                                  min={0}
                                  className="w-20 px-2 py-1 rounded-lg glass-input text-center text-lg font-black outline-none"
                                  style={{ colorScheme: 'dark' }}
                                />
                                <button
                                  onClick={() => handleSaveCredits(userDetail.id)}
                                  disabled={savingCredits}
                                  className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-bold hover:bg-teal-500/30 disabled:opacity-50"
                                >
                                  {savingCredits ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                                </button>
                                <button
                                  onClick={() => setEditingCredits(false)}
                                  className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10"
                                >
                                  <i className="fas fa-times" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-xl font-black text-white">{vipConfig.credits_total}</div>
                                <button
                                  onClick={() => { setEditingCredits(true); setEditCreditsValue(vipConfig.credits_total) }}
                                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 hover:text-amber-400 transition-colors"
                                >
                                  Total <i className="fas fa-pen text-[8px] ml-1" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {vipConfig.notes && (
                          <div className="mt-3 text-xs text-slate-500 italic">
                            <i className="fas fa-sticky-note mr-1" /> {vipConfig.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subscription */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-3">
                        <i className="fas fa-credit-card mr-1" /> Subscription
                      </div>
                      {userDetail.sub_status ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <Field label="Plan">
                            {userDetail.plan_name}{' '}
                            <span className="text-xs text-slate-600 font-mono">({userDetail.plan_slug})</span>
                          </Field>
                          <Field label="Status">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                statusColors[userDetail.sub_status] || statusColors.none
                              }`}
                            >
                              {userDetail.sub_status}
                            </span>
                          </Field>
                          <Field label="Price">
                            {formatPrice(userDetail.price_amount)}/{userDetail.billing_interval || 'mo'}
                            <span className="text-slate-600 ml-1">{userDetail.price_currency}</span>
                          </Field>
                          <Field label="Paddle Subscription ID">
                            {userDetail.paddle_subscription_id ? (
                              <>
                                <span className="font-mono text-xs">{userDetail.paddle_subscription_id}</span>
                                <CopyButton text={userDetail.paddle_subscription_id} />
                              </>
                            ) : '—'}
                          </Field>
                          <Field label="Paddle Customer ID">
                            {userDetail.paddle_customer_id ? (
                              <>
                                <span className="font-mono text-xs">{userDetail.paddle_customer_id}</span>
                                <CopyButton text={userDetail.paddle_customer_id} />
                              </>
                            ) : '—'}
                          </Field>
                          <Field label="Paddle Transaction ID">
                            {userDetail.paddle_transaction_id ? (
                              <>
                                <span className="font-mono text-xs">{userDetail.paddle_transaction_id}</span>
                                <CopyButton text={userDetail.paddle_transaction_id} />
                              </>
                            ) : '—'}
                          </Field>
                          <Field label="Billing Period Start">{formatDate(userDetail.current_billing_period_start)}</Field>
                          <Field label="Billing Period End">{formatDate(userDetail.current_billing_period_end)}</Field>
                          <Field label="Canceled At">{formatDate(userDetail.canceled_at)}</Field>
                          <Field label="Effective Cancel">
                            {userDetail.effective_cancel_at ? (
                              <span className="text-red-400">{formatDate(userDetail.effective_cancel_at)}</span>
                            ) : '—'}
                          </Field>
                          <Field label="Payment Failures">
                            <span className={(userDetail.payment_failure_count ?? 0) > 0 ? 'text-red-400 font-bold' : ''}>
                              {userDetail.payment_failure_count ?? 0}
                            </span>
                          </Field>
                          <Field label="Last Payment Error">
                            {userDetail.last_payment_error ? (
                              <span className="text-red-400 text-xs">{userDetail.last_payment_error}</span>
                            ) : '—'}
                          </Field>
                          <Field label="Sub Created">{formatDate(userDetail.sub_created_at)}</Field>
                          <Field label="Sub Updated">{formatDate(userDetail.sub_updated_at)}</Field>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          {userDetail.user_type === 'vip' ? 'VIP user — no subscription needed' : 'No subscription record'}
                        </div>
                      )}
                    </div>

                    {/* Usage Stats */}
                    {usageStats && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-3">
                          <i className="fas fa-chart-bar mr-1" /> Usage Stats
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-xl font-black text-white">{usageStats.uploads}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Uploads
                            </div>
                          </div>
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-xl font-black text-white">{usageStats.analyses}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Analyses
                            </div>
                          </div>
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-xl font-black text-white">{usageStats.social_accounts}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              Social Accounts
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing Events */}
                    <div>
                      <button
                        onClick={() => setShowEvents(!showEvents)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:text-yellow-300 transition-colors mb-3"
                      >
                        <i className={`fas fa-chevron-right transition-transform ${showEvents ? 'rotate-90' : ''}`} />
                        <i className="fas fa-receipt mr-1" />
                        Billing Events ({billingEvents.length})
                      </button>

                      {showEvents && (
                        <div className="overflow-x-auto">
                          {billingEvents.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 bg-white/[0.03]">
                                  <th className="text-left py-2 pr-4">Event Type</th>
                                  <th className="text-left py-2 pr-4">Event ID</th>
                                  <th className="text-left py-2 pr-4">Processed</th>
                                  <th className="text-left py-2 pr-4">Error</th>
                                  <th className="text-left py-2">Timestamp</th>
                                </tr>
                              </thead>
                              <tbody>
                                {billingEvents.map((ev) => (
                                  <tr key={ev.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                    <td className="py-2.5 pr-4">
                                      <span className="px-2 py-0.5 rounded bg-white/5 text-xs font-mono font-medium">
                                        {ev.event_type}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      <span className="text-xs font-mono text-slate-400">{ev.paddle_event_id}</span>
                                      <CopyButton text={ev.paddle_event_id} />
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      {ev.processed ? (
                                        <span className="text-teal-400">
                                          <i className="fas fa-check-circle" />
                                        </span>
                                      ) : (
                                        <span className="text-red-400">
                                          <i className="fas fa-times-circle" />
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      {ev.error_message ? (
                                        <span className="text-red-400 text-xs">{ev.error_message}</span>
                                      ) : (
                                        <span className="text-slate-600">—</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 text-xs text-slate-400">
                                      {formatDate(ev.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-sm text-slate-500 italic py-4">No billing events</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Raw Metadata (debug) */}
                    <div>
                      <details className="group">
                        <summary className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">
                          <i className="fas fa-chevron-right transition-transform group-open:rotate-90" />
                          <i className="fas fa-code mr-1" />
                          Raw Metadata
                        </summary>
                        <div className="mt-3 space-y-3">
                          {userDetail.raw_user_meta_data && Object.keys(userDetail.raw_user_meta_data).length > 0 && (
                            <div>
                              <div className="text-[10px] font-black text-slate-600 mb-1">user_meta_data</div>
                              <pre className="bg-black/30 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto">
                                {JSON.stringify(userDetail.raw_user_meta_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {userDetail.raw_app_meta_data && Object.keys(userDetail.raw_app_meta_data).length > 0 && (
                            <div>
                              <div className="text-[10px] font-black text-slate-600 mb-1">app_meta_data</div>
                              <pre className="bg-black/30 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto">
                                {JSON.stringify(userDetail.raw_app_meta_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {userDetail.subscription_data && (
                            <div>
                              <div className="text-[10px] font-black text-slate-600 mb-1">subscription_data</div>
                              <pre className="bg-black/30 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto">
                                {JSON.stringify(userDetail.subscription_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && users.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <i className="fas fa-users text-3xl text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">
            {search ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      )}

      {/* ═══════════ Create VIP User Modal ═══════════ */}
      {createVipOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !creatingVip && setCreateVipOpen(false)}
        >
          <div
            className="glass-card rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto dashboard-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <i className="fas fa-crown text-amber-900" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Create VIP User</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Beta Tester Access</p>
                </div>
              </div>
              <button
                onClick={() => setCreateVipOpen(false)}
                disabled={creatingVip}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Email + Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={vipForm.email}
                    onChange={(e) => setVipForm({ ...vipForm, email: e.target.value })}
                    placeholder="vip@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Password *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={vipForm.password}
                      onChange={(e) => setVipForm({ ...vipForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-mono font-medium outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    />
                    <button
                      onClick={() => setVipForm({ ...vipForm, password: generatePassword() })}
                      className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Generate password"
                    >
                      <i className="fas fa-rotate text-sm" />
                    </button>
                    <CopyButton text={vipForm.password} />
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={vipForm.full_name}
                  onChange={(e) => setVipForm({ ...vipForm, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Content Category *
                </label>
                <select
                  value={vipForm.category_id}
                  onChange={(e) => setVipForm({ ...vipForm, category_id: parseInt(e.target.value), domain_ids: [] })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer appearance-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value={0}>Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Domains */}
              {vipForm.category_id > 0 && currentDomains.length > 0 && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Domains / Topics
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentDomains.map((d) => {
                      const selected = vipForm.domain_ids.includes(d.keyword_id)
                      return (
                        <button
                          key={d.keyword_id}
                          onClick={() => {
                            setVipForm({
                              ...vipForm,
                              domain_ids: selected
                                ? vipForm.domain_ids.filter((id) => id !== d.keyword_id)
                                : [...vipForm.domain_ids, d.keyword_id],
                            })
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            selected
                              ? 'bg-amber-500/15 border-2 border-amber-500/40 text-amber-300'
                              : 'bg-white/[0.04] border-2 border-transparent text-slate-400 hover:bg-white/[0.08]'
                          }`}
                        >
                          {selected && <i className="fas fa-check mr-1 text-[10px]" />}
                          {d.keyword}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Credits */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Usage Credits
                </label>
                <input
                  type="number"
                  value={vipForm.credits}
                  onChange={(e) => setVipForm({ ...vipForm, credits: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full md:w-40 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  style={{ colorScheme: 'dark' }}
                />
                <p className="text-[10px] text-slate-600 mt-1">General usage credits covering all operations</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setCreateVipOpen(false)}
                disabled={creatingVip}
                className="px-5 py-2.5 rounded-2xl bg-white/[0.06] text-slate-400 text-sm font-bold hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVip}
                disabled={creatingVip || !vipForm.email || !vipForm.password || !vipForm.full_name || !vipForm.category_id}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:hover:scale-100"
              >
                {creatingVip ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-crown mr-2" />
                    Create VIP User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════ Invite Beta Tester Modal ═══════════ */}
      {inviteModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !creatingInvite && setInviteModalOpen(false)}
        >
          <div
            className="glass-card rounded-3xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <i className="fas fa-paper-plane text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Invite Beta Tester</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">One-Time Invite Link</p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                disabled={creatingInvite}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            {generatedInviteUrl ? (
              /* Success State — show generated link */
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <i className="fas fa-check text-teal-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-black mb-1">Invite Link Created</h3>
                  <p className="text-sm text-slate-400 font-medium">Share this link with the beta tester</p>
                </div>

                <div className="flex items-center gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="flex-1 bg-transparent text-sm font-mono text-violet-300 outline-none truncate"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(generatedInviteUrl); setSuccessMsg('Copied!'); setTimeout(() => setSuccessMsg(null), 2000) }}
                    className="flex-shrink-0 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm font-bold hover:bg-violet-500/30 transition-colors"
                  >
                    <i className="fas fa-copy mr-1.5" /> Copy
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setInviteModalOpen(false); setGeneratedInviteUrl(null) }}
                    className="px-5 py-2.5 rounded-2xl bg-white/[0.06] text-slate-400 text-sm font-bold hover:text-white hover:bg-white/10 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form State */
              <div className="p-6 space-y-5">
                {/* Email (optional) */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Email <span className="text-slate-700">(optional — restricts invite to this email)</span>
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="Leave empty for any email"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Expires At *
                  </label>
                  <input
                    type="datetime-local"
                    value={inviteForm.expires_at}
                    onChange={(e) => setInviteForm({ ...inviteForm, expires_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Credits */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    VIP Credits
                  </label>
                  <input
                    type="number"
                    value={inviteForm.credits}
                    onChange={(e) => setInviteForm({ ...inviteForm, credits: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full md:w-40 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-[10px] text-slate-600 mt-1">Credits granted to the user upon registration</p>
                </div>
              </div>
            )}

            {/* Modal Footer (only show for form state) */}
            {!generatedInviteUrl && (
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => setInviteModalOpen(false)}
                  disabled={creatingInvite}
                  className="px-5 py-2.5 rounded-2xl bg-white/[0.06] text-slate-400 text-sm font-bold hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvite}
                  disabled={creatingInvite || !inviteForm.expires_at}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:hover:scale-100"
                >
                  {creatingInvite ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link mr-2" />
                      Generate Invite Link
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">{label}</div>
      <div className="text-sm text-slate-300 font-medium flex items-center">{children}</div>
    </div>
  )
}
