import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authFetch, setAccessToken } from '../lib/api'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  user_type: string
}

export interface VipCredits {
  credits_total: number
  credits_used: number
}

export interface ProCredits {
  used: number
  limit: number
}

export interface Organization {
  id: number
  name: string
  slug: string
  avatar_url: string | null
  role: string  // 'owner' | 'admin' | 'member'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  userType: string | null
  planSlug: string | null
  categoryIds: number[]
  categoryStatus: string | null
  onboardingCompleted: boolean | null
  vipCredits: VipCredits | null
  proCredits: ProCredits | null
  organization: Organization | null
  isOrgOwner: boolean
  isOrgAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [planSlug, setPlanSlug] = useState<string | null>(null)
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [categoryStatus, setCategoryStatus] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [vipCredits, setVipCredits] = useState<VipCredits | null>(null)
  const [proCredits, setProCredits] = useState<ProCredits | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const fetchProfile = async (_accessToken?: string) => {
    try {
      const res = await authFetch('/api/auth/me')
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.profile)
      setUserType(data.profile?.user_type || 'user')
      setPlanSlug(data.planSlug || null)
      setCategoryStatus(data.profile?.category_status || null)
      setVipCredits(data.vipCredits || null)
      setProCredits(data.proCredits || null)
      setOrganization(data.organization || null)

      // Fetch onboarding status (only admins skip onboarding; VIP users go through it)
      if (data.profile?.user_type === 'admin') {
        setOnboardingCompleted(true)
        setCategoryStatus('selected')
      } else {
        try {
          const obRes = await authFetch('/api/onboarding/status')
          if (obRes.ok) {
            const obData = await obRes.json()
            setOnboardingCompleted(obData.isCompleted)
            setCategoryIds(obData.data?.categoryIds || [])
          } else {
            setOnboardingCompleted(true) // fail open
          }
        } catch {
          setOnboardingCompleted(true) // fail open
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e)
    }
  }

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session?.access_token) {
        await fetchProfile(session.access_token)
      }
      initialLoadDone.current = true
      setLoading(false)
    })

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Always keep the cached token in sync (even during initial load)
      setAccessToken(session?.access_token ?? null)

      // Skip the INITIAL_SESSION event — already handled by getSession() above
      if (!initialLoadDone.current) return

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        await fetchProfile(session.access_token)
      } else {
        setProfile(null)
        setUserType(null)
        setPlanSlug(null)
        setCategoryIds([])
        setCategoryStatus(null)
        setOnboardingCompleted(null)
        setVipCredits(null)
        setProCredits(null)
        setOrganization(null)
      }
    })

    // Proactively refresh the session when the tab regains focus.
    // This prevents stale tokens after the browser throttles background tabs
    // and avoids the gotrue-js lock deadlock on visibility change.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.access_token) {
            setAccessToken(session.access_token)
          }
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.access_token) {
      await fetchProfile(s.access_token)
    }
  }

  const isOrgOwner = organization?.role === 'owner'
  const isOrgAdmin = organization?.role === 'owner' || organization?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, session, profile, userType, planSlug, categoryIds, categoryStatus, onboardingCompleted, vipCredits, proCredits, organization, isOrgOwner, isOrgAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
