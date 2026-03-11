import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authFetch, setImpersonatedUserId } from '../lib/api'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'blossom_impersonation'

interface ImpersonationState {
  userId: string
  email: string
  displayName: string
  userType: string
  planSlug: string | null
}

interface ImpersonationContextType {
  impersonating: ImpersonationState | null
  startImpersonation: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
  isImpersonating: boolean
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { refreshProfile, userType } = useAuth()
  const [impersonating, setImpersonating] = useState<ImpersonationState | null>(() => {
    // Initialize from sessionStorage synchronously
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored) as ImpersonationState
    } catch { /* ignore */ }
    return null
  })

  // Clear impersonation state if user is no longer admin (e.g. signed out)
  useEffect(() => {
    if (userType && userType !== 'admin') {
      // Non-admin user, ensure no stale impersonation state
      setImpersonatedUserId(null)
      sessionStorage.removeItem(STORAGE_KEY)
      setImpersonating(null)
    }
  }, [userType])

  const startImpersonation = useCallback(async (userId: string) => {
    const res = await authFetch(`/api/admin/impersonate/${userId}`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to start impersonation')
    }
    const data = await res.json()

    const state: ImpersonationState = {
      userId,
      email: data.user.email || '',
      displayName: data.profile?.full_name || data.user.email || 'User',
      userType: data.profile?.user_type || 'user',
      planSlug: data.planSlug,
    }

    setImpersonatedUserId(userId)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setImpersonating(state)

    await refreshProfile()
  }, [refreshProfile])

  const stopImpersonation = useCallback(async () => {
    setImpersonatedUserId(null)
    sessionStorage.removeItem(STORAGE_KEY)
    setImpersonating(null)

    // refreshProfile will re-fetch /api/auth/me without the impersonation header
    await refreshProfile()
  }, [refreshProfile])

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating,
        startImpersonation,
        stopImpersonation,
        isImpersonating: impersonating !== null,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (context === undefined) {
    throw new Error('useImpersonation must be used within ImpersonationProvider')
  }
  return context
}
