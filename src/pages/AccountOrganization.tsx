import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface Member {
  id: number
  user_id: string
  role: string
  joined_at: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface Invite {
  id: number
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
}

interface OrgData {
  organization: {
    id: number
    name: string
    slug: string
    max_seats: number
  }
  role: string
  memberCount: number
  maxSeats: number
}

export default function AccountOrganization() {
  const { planSlug, organization, isOrgOwner, isOrgAdmin, refreshProfile } = useAuth()
  const [orgData, setOrgData] = useState<OrgData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const fetchOrgData = async () => {
    try {
      const res = await authFetch('/api/organizations/mine')
      const data = await res.json()
      if (data.organization) {
        setOrgData(data)
        // Fetch members and invites
        const [membersRes, invitesRes] = await Promise.all([
          authFetch(`/api/organizations/${data.organization.id}/members`),
          isOrgAdmin
            ? authFetch(`/api/organizations/${data.organization.id}/invites`)
            : Promise.resolve(null),
        ])
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
        if (invitesRes) {
          const invitesData = await invitesRes.json()
          setInvites(invitesData.invites || [])
        }
      } else {
        setOrgData(null)
      }
    } catch {
      toast.error('Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgData()
  }, [organization?.id])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await authFetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Organization created!')
        await refreshProfile()
        await fetchOrgData()
        setCreateName('')
      } else {
        toast.error(data.error || 'Failed to create organization')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgData) return
    setInviting(true)
    try {
      const res = await authFetch(`/api/organizations/${orgData.organization.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Invite sent to ${inviteEmail}`)
        setInviteEmail('')
        setInviteRole('member')
        await fetchOrgData()
      } else {
        toast.error(data.error || 'Failed to send invite')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = (member: Member) => {
    setConfirmAction({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${member.full_name || member.email} from the organization? They will lose access immediately.`,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/organizations/${orgData!.organization.id}/members/${member.user_id}`, {
            method: 'DELETE',
          })
          if (res.ok) {
            toast.success('Member removed')
            await fetchOrgData()
          } else {
            const data = await res.json()
            toast.error(data.error || 'Failed to remove member')
          }
        } catch {
          toast.error('An error occurred')
        }
        setConfirmAction(null)
      },
    })
  }

  const handleChangeRole = async (member: Member, newRole: 'admin' | 'member') => {
    try {
      const res = await authFetch(`/api/organizations/${orgData!.organization.id}/members/${member.user_id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        toast.success(`Role updated to ${newRole}`)
        await fetchOrgData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  const handleRevokeInvite = async (inviteId: number) => {
    try {
      const res = await authFetch(`/api/organizations/${orgData!.organization.id}/invites/${inviteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Invite revoked')
        await fetchOrgData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to revoke invite')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  const handleLeave = () => {
    setConfirmAction({
      title: 'Leave Organization',
      message: 'Are you sure you want to leave this organization? You will lose access provided by the organization subscription. Your personal data will remain intact.',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/organizations/${orgData!.organization.id}/leave`, {
            method: 'POST',
          })
          if (res.ok) {
            toast.success('You have left the organization')
            await refreshProfile()
            setOrgData(null)
            setMembers([])
            setInvites([])
          } else {
            const data = await res.json()
            toast.error(data.error || 'Failed to leave organization')
          }
        } catch {
          toast.error('An error occurred')
        }
        setConfirmAction(null)
      },
    })
  }

  const handleDissolve = () => {
    setConfirmAction({
      title: 'Dissolve Organization',
      message: 'Are you sure you want to dissolve this organization? This action cannot be undone. All members must be removed first.',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/organizations/${orgData!.organization.id}`, {
            method: 'DELETE',
          })
          if (res.ok) {
            toast.success('Organization dissolved')
            await refreshProfile()
            setOrgData(null)
            setMembers([])
            setInvites([])
          } else {
            const data = await res.json()
            toast.error(data.error || 'Failed to dissolve organization')
          }
        } catch {
          toast.error('An error occurred')
        }
        setConfirmAction(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No org and not platin — shouldn't normally reach here
  if (!orgData && planSlug !== 'platin') {
    return (
      <div>
        <div className="pb-6 mb-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-black tracking-tight">Organization</h2>
        </div>
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-building text-2xl text-violet-400" />
          </div>
          <h3 className="text-lg font-black mb-2">Organization Management</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Upgrade to the Platin plan to create an organization and invite up to 10 team members.
          </p>
        </div>
      </div>
    )
  }

  // Platin user without org — show create form
  if (!orgData && planSlug === 'platin') {
    return (
      <div>
        <div className="pb-6 mb-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-black tracking-tight">Organization</h2>
          <p className="text-slate-500 text-sm mt-1">
            Create an organization to invite team members.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
              <i className="fas fa-building text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-black">Create Organization</h3>
              <p className="text-sm text-slate-400">Invite up to 10 team members with Platin access</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Organization name"
              className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !createName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Has org — show management view
  const seatUsage = orgData!.memberCount
  const maxSeats = orgData!.maxSeats + 1 // +1 for owner
  const seatPct = Math.round((seatUsage / maxSeats) * 100)
  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <div>
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-black tracking-tight">Organization</h2>
        <p className="text-slate-500 text-sm mt-1">
          Manage your organization and team members.
        </p>
      </div>

      {/* Org Info */}
      <div className="glass-card rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <i className="fas fa-building text-xl text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black">{orgData!.organization.name}</div>
            <div className="text-sm text-slate-400 font-medium">
              Your role: <span className="capitalize text-slate-300">{organization?.role}</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-violet-400/10 text-violet-400 text-[10px] font-black uppercase tracking-widest">
            Platin
          </span>
        </div>

        {/* Seat usage bar */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              Seats
            </span>
            <span className="text-sm font-bold text-violet-300">
              {seatUsage} / {maxSeats} used
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-500"
              style={{ width: `${seatPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Invite Section */}
      {isOrgAdmin && seatUsage < maxSeats && (
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            Invite Member
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="team@example.com"
              className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
              className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {isOrgAdmin && pendingInvites.length > 0 && (
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            Pending Invites
          </h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div>
                  <div className="text-sm font-bold">{invite.email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <span className="capitalize">{invite.role}</span>
                    {' \u00b7 '}
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="glass-card rounded-3xl p-6 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
          Members
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-sm text-violet-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">
                  {member.full_name || member.email}
                </div>
                <div className="text-xs text-slate-500">{member.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {isOrgOwner && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member, e.target.value as 'admin' | 'member')}
                    className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    member.role === 'owner'
                      ? 'bg-amber-400/10 text-amber-400'
                      : member.role === 'admin'
                        ? 'bg-violet-400/10 text-violet-400'
                        : 'bg-slate-400/10 text-slate-400'
                  }`}>
                    {member.role}
                  </span>
                )}
                {isOrgAdmin && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove member"
                  >
                    <i className="fas fa-xmark text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!isOrgOwner && (
          <button
            onClick={handleLeave}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors"
          >
            Leave Organization
          </button>
        )}
        {isOrgOwner && (
          <button
            onClick={handleDissolve}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors"
          >
            Dissolve Organization
          </button>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="glass-card rounded-3xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-triangle-exclamation text-red-400" />
              </div>
              <h3 className="text-lg font-black">{confirmAction.title}</h3>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
              {confirmAction.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="px-5 py-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
