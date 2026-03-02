import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/api'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        console.error('Auth callback error:', error)
        navigate('/login')
        return
      }

      // Check for invite token from URL params or localStorage
      const inviteToken = searchParams.get('invite') || localStorage.getItem('blossom_invite_token')

      if (inviteToken) {
        // Always clean up localStorage
        localStorage.removeItem('blossom_invite_token')

        try {
          const res = await fetch(`${API_URL}/api/auth/invites/${inviteToken}/claim`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          })

          if (res.ok) {
            // Successfully claimed — skip plan selection, go to onboarding
            navigate('/onboarding')
            return
          }
          // Claim failed (expired, already used, etc.) — fall through to normal flow
          console.warn('Invite claim failed:', await res.json())
        } catch (err) {
          console.warn('Invite claim error:', err)
        }
      }

      navigate('/choose-category')
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
