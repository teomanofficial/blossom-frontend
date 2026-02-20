import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AccountSecurity() {
  const { user } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleChangePassword = async () => {
    setError('')
    setSaved(false)

    if (!currentPassword) {
      setError('Current password is required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setSaving(false)
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSaved(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const authProvider = user?.app_metadata?.provider
  const isPasswordAuth = !authProvider || authProvider === 'email'

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-black tracking-tight">Security</h2>
      </div>

      {/* Change password */}
      <div className="max-w-lg">
        <h3 className="text-sm font-bold text-white mb-1">Change password</h3>
        <p className="text-xs text-slate-500 mb-5">
          Update the password associated with your account.
        </p>

        {!isPasswordAuth && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-5">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-yellow-400 text-sm mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-yellow-300">OAuth account</p>
                <p className="text-xs text-yellow-400/80 mt-0.5">
                  Your account is linked to <span className="font-semibold capitalize">{authProvider}</span>. You can still set a password to enable email/password sign-in.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5 flex items-center gap-2">
            <i className="fas fa-times-circle text-xs"></i>
            {error}
          </div>
        )}

        {saved && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-5 flex items-center gap-2">
            <i className="fas fa-check-circle text-xs"></i>
            Password updated successfully
          </div>
        )}

        <div className="space-y-4">
          {isPasswordAuth && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
            />
          </div>
        </div>

        <div className="pt-5 border-t border-white/[0.06] mt-5 flex items-center gap-3">
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
          >
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>

      {/* Active sessions info */}
      <div className="mt-10 pt-6 border-t border-white/[0.06]">
        <h3 className="text-sm font-bold text-white mb-1">Sessions</h3>
        <p className="text-xs text-slate-500 mb-4">
          Your current active session information.
        </p>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <i className="fas fa-desktop text-teal-400 text-xs"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Current session</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-500/10 text-teal-400">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
