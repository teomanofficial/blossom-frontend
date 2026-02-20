import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'

export default function AccountProfile() {
  const { user, profile, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setWebsite(profile.website || '')
      setLocation(profile.location || '')
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, bio, website, location }),
      })
      if (res.ok) {
        await refreshProfile()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await authFetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        await refreshProfile()
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const email = user?.email || ''
  const initial = (fullName || email).charAt(0).toUpperCase()

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-black tracking-tight">Public profile</h2>
      </div>

      <div className="flex gap-8">
        {/* Form */}
        <div className="flex-1 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself"
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-600 mt-1.5">
              Email is managed through your authentication provider.
            </p>
          </div>

          {/* Save */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
            >
              {saving ? 'Saving...' : 'Update profile'}
            </button>
            {saved && (
              <span className="text-sm font-semibold text-teal-400 flex items-center gap-1.5">
                <i className="fas fa-check text-xs"></i>
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Avatar column */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Avatar
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group w-[200px] h-[200px] rounded-full overflow-hidden shadow-xl shadow-pink-500/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-5xl font-black text-white">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <i className="fas fa-spinner fa-spin text-white text-xl"></i>
              ) : (
                <div className="text-center">
                  <i className="fas fa-camera text-white text-xl mb-1"></i>
                  <p className="text-white text-xs font-bold">Change avatar</p>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
