import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, userType, onboardingCompleted } = useAuth()
  const [subStatus, setSubStatus] = useState<string | null>(null)
  const [subLoading, setSubLoading] = useState(true)

  const isAdmin = userType === 'admin'
  const isVip = userType === 'vip'

  useEffect(() => {
    if (!user) return
    // Admins and VIP users bypass subscription check entirely
    if (isAdmin || isVip) {
      setSubStatus('active')
      setSubLoading(false)
      return
    }
    authFetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((data) => setSubStatus(data.status || 'none'))
      .catch(() => setSubStatus('none'))
      .finally(() => setSubLoading(false))
  }, [user, isAdmin, isVip])

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if email user hasn't verified their email
  const isEmailProvider = user.app_metadata.provider === 'email'
  if (isEmailProvider && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />
  }

  // Redirect to choose plan if no active subscription (admins and VIP bypass this)
  if (!isAdmin && !isVip && subStatus === 'none') {
    return <Navigate to="/choose-plan" replace />
  }

  // Redirect to onboarding if not completed
  if (onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
