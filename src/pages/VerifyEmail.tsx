import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const emailFromState = (location.state as { email?: string })?.email
  const email = user?.email ?? emailFromState ?? ''

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)


  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setResent(false)

    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setResending(false)
    setResent(true)
  }

  const handleCheckVerification = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] relative">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold gradient-text">Blossom</span>
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold font-display mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm mb-2">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-white font-medium mb-6">{email}</p>
          )}
          <p className="text-gray-400 text-sm mb-8">
            Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 transition-all font-medium text-sm"
            >
              I've verified my email
            </button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-300 disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>

          {resent && (
            <p className="mt-4 text-sm text-green-400">Verification email resent!</p>
          )}

          <p className="mt-6 text-sm text-gray-500">
            Wrong email?{' '}
            <Link to="/signup" className="text-pink-400 hover:text-pink-300 transition-colors">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
