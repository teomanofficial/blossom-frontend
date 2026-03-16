import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'
import { trackEvent, trackConversion } from '../lib/analytics'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        console.error('Auth callback error:', error)
        navigate('/login')
        return
      }

      // Check for invite token from URL params, localStorage, or user metadata (survives email redirect)
      const inviteToken = searchParams.get('invite')
        || localStorage.getItem('blossom_invite_token')
        || data.session.user?.user_metadata?.invite_token

      if (inviteToken) {
        try {
          const res = await fetch(`${API_URL}/api/auth/invites/${inviteToken}/claim`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          })

          if (res.ok) {
            // Clean up token only after successful claim
            localStorage.removeItem('blossom_invite_token')
            // Refresh profile so AuthContext knows user is now VIP
            await refreshProfile()
            // VIP users skip plan selection — go to category selection then onboarding
            navigate('/choose-category')
            return
          }
          // Claim failed (expired, already used, etc.) — fall through to normal flow
          console.warn('Invite claim failed:', await res.json())
        } catch (err) {
          console.warn('Invite claim error:', err)
        }
        // Clean up token on failure too
        localStorage.removeItem('blossom_invite_token')
      }

      // Track OAuth signup conversion (only for new users, not returning logins)
      const createdAt = data.session.user?.created_at
      if (createdAt) {
        const accountAge = Date.now() - new Date(createdAt).getTime()
        if (accountAge < 60_000) { // created less than 60 seconds ago
          trackEvent('signup_completed', 'conversion', { method: 'google' })
          trackConversion()
        }
      }

      navigate('/choose-category')
    }

    handleCallback()
  }, [navigate, searchParams, refreshProfile])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
