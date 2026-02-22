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

interface Stats {
  total: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  noSubscription: number
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
  const [updatingUserType, setUpdatingUserType] = useState(false)

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
    try {
      const res = await authFetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUserDetail(data.user)
      setBillingEvents(data.billingEvents || [])
      setUsageStats(data.usageStats || null)
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
    } catch (err) {
      console.error('Error updating user type:', err)
      setErrorMsg('Failed to update user type')
    } finally {
      setUpdatingUserType(false)
    }
  }

  const getAuthProvider = (meta: Record<string, any> | null): string => {
    if (!meta) return 'email'
    if (meta.iss?.includes('google')) return 'Google'
    if (meta.provider === 'google') return 'Google'
    if (meta.providers?.includes('google')) return 'Google'
    return 'Email'
  }

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
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-2">
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

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Users', value: stats.total, icon: 'fa-users', color: 'text-white' },
            { label: 'Active', value: stats.active, icon: 'fa-check-circle', color: 'text-teal-400' },
            { label: 'Trialing', value: stats.trialing, icon: 'fa-clock', color: 'text-orange-400' },
            { label: 'Past Due', value: stats.pastDue, icon: 'fa-exclamation-triangle', color: 'text-red-400' },
            { label: 'Canceled', value: stats.canceled, icon: 'fa-ban', color: 'text-red-400' },
            { label: 'No Sub', value: stats.noSubscription, icon: 'fa-minus-circle', color: 'text-slate-500' },
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

      {/* Search */}
      <div className="mb-6">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl w-full md:max-w-md focus-within:border-white/20 transition-all">
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
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
                </div>
                <div className="text-xs text-slate-500 font-medium truncate">{user.email}</div>
              </div>

              {/* Subscription Status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-slate-400 font-medium">
                    {user.plan_name || 'No plan'}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {user.price_amount ? `${formatPrice(user.price_amount)}/mo` : ''}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${
                    statusColors[user.sub_status || 'none'] || statusColors.none
                  }`}
                >
                  {user.sub_status || 'None'}
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
                            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-semibold outline-none cursor-pointer hover:border-white/20 focus:border-indigo-500/50 transition-colors appearance-none disabled:opacity-50"
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
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
                        <div className="text-sm text-slate-500 italic">No subscription record</div>
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
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5">
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
