import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/api'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  user_type: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  userType: string | null
  planSlug: string | null
  onboardingCompleted: boolean | null
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const fetchProfile = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.profile)
      setUserType(data.profile?.user_type || 'user')
      setPlanSlug(data.planSlug || null)

      // Fetch onboarding status (admins skip onboarding)
      if (data.profile?.user_type === 'admin') {
        setOnboardingCompleted(true)
      } else {
        try {
          const obRes = await fetch(`${API_URL}/api/onboarding/status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (obRes.ok) {
            const obData = await obRes.json()
            setOnboardingCompleted(obData.isCompleted)
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
      if (session?.access_token) {
        await fetchProfile(session.access_token)
      }
      initialLoadDone.current = true
      setLoading(false)
    })

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        setOnboardingCompleted(null)
      }
    })

    return () => subscription.unsubscribe()
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

  return (
    <AuthContext.Provider value={{ user, session, profile, userType, planSlug, onboardingCompleted, loading, signOut, refreshProfile }}>
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
