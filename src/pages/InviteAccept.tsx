import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiFetch, authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface InviteInfo {
  orgName: string
  orgSlug: string
  inviterName: string
  role: string
  email: string
  expiresAt: string
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, organization, loading: authLoading, refreshProfile } = useAuth()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    if (!token) return
    apiFetch(`/api/invites/${token}/validate`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok && data.valid) {
          setInvite(data)
        } else {
          setError(data.reason || 'Invalid invite')
        }
      })
      .catch(() => setError('Failed to validate invite'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    try {
      const res = await authFetch(`/api/invites/${token}/accept`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Welcome to ${invite?.orgName}!`)
        await refreshProfile()
        navigate('/dashboard')
      } else {
        toast.error(data.error || 'Failed to accept invite')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!token) return
    setDeclining(true)
    try {
      const res = await authFetch(`/api/invites/${token}/decline`, { method: 'POST' })
      if (res.ok) {
        toast.success('Invite declined')
        navigate(user ? '/dashboard' : '/')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to decline invite')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setDeclining(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-xmark text-2xl text-red-400" />
          </div>
          <h1 className="text-xl font-black mb-2">Invalid Invite</h1>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <Link
            to={user ? '/dashboard' : '/'}
            className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
        </div>
      </div>
    )
  }

  if (!invite) return null

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-building text-2xl text-violet-400" />
          </div>
          <h1 className="text-xl font-black mb-2">You're Invited!</h1>
          <p className="text-sm text-slate-400 mb-1">
            <span className="text-white font-bold">{invite.inviterName}</span> has invited you to join
          </p>
          <p className="text-lg font-black text-violet-300 mb-1">{invite.orgName}</p>
          <p className="text-xs text-slate-500 mb-6">
            as a <span className="capitalize">{invite.role}</span>
          </p>

          <p className="text-sm text-slate-400 mb-6">
            Log in or create an account to accept this invite.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to={`/login?redirect=/invite/${token}`}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 text-center"
            >
              Log In
            </Link>
            <Link
              to={`/signup?redirect=/invite/${token}`}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors text-center"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Already in an org
  if (organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-triangle-exclamation text-2xl text-yellow-400" />
          </div>
          <h1 className="text-xl font-black mb-2">Already in an Organization</h1>
          <p className="text-sm text-slate-400 mb-6">
            You're currently a member of <span className="text-white font-bold">{organization.name}</span>.
            You need to leave your current organization before you can accept this invite.
          </p>
          <Link
            to="/dashboard/account/organization"
            className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
          >
            Go to Organization Settings
          </Link>
        </div>
      </div>
    )
  }

  // Logged in, no org — show accept/decline
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-building text-2xl text-violet-400" />
        </div>
        <h1 className="text-xl font-black mb-2">You're Invited!</h1>
        <p className="text-sm text-slate-400 mb-1">
          <span className="text-white font-bold">{invite.inviterName}</span> has invited you to join
        </p>
        <p className="text-lg font-black text-violet-300 mb-1">{invite.orgName}</p>
        <p className="text-xs text-slate-500 mb-6">
          as a <span className="capitalize">{invite.role}</span>
        </p>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 text-left">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
            What you'll get
          </div>
          <ul className="space-y-1.5">
            {['Full Platin-level access', 'All analysis & discovery features', 'Your own independent workspace'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <i className="fas fa-check text-violet-400 text-xs" />
                <span className="text-slate-300 font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={declining}
            className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {declining ? 'Declining...' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {accepting ? 'Accepting...' : 'Accept Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
