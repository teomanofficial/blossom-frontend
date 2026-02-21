import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

interface SocialAccount {
  id: number
  platform: string
  username: string
  avatar_url: string | null
  has_oauth: boolean
}

export default function PlatformPostCreate() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [form, setForm] = useState({
    account_id: '',
    content_type: 'reel',
    caption: '',
    scheduled_for: '',
    notes: '',
  })

  useEffect(() => {
    authFetch('/api/social/accounts')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setAccounts(data)
          if (data.length > 0) setForm(f => ({ ...f, account_id: data[0].id.toString() }))
        }
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (publish = false) => {
    if (!form.account_id) return toast.error('Select an account')
    if (!form.caption.trim()) return toast.error('Caption is required')

    const action = publish ? setPublishing : setSaving
    action(true)

    try {
      // Create the post
      const createRes = await authFetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: parseInt(form.account_id),
          content_type: form.content_type,
          caption: form.caption,
          scheduled_for: form.scheduled_for || null,
          notes: form.notes || null,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        toast.error(err.error || 'Failed to create post')
        return
      }

      const post = await createRes.json()

      if (publish) {
        // Publish immediately
        const pubRes = await authFetch(`/api/social/posts/${post.id}/publish`, { method: 'POST' })
        if (pubRes.ok) {
          toast.success('Post published!')
        } else {
          const err = await pubRes.json()
          toast.error(err.error || 'Publish failed — post saved as draft')
        }
      } else {
        toast.success(form.scheduled_for ? 'Post scheduled!' : 'Draft saved!')
      }

      navigate('/dashboard/platforms/posts')
    } catch {
      toast.error('Something went wrong')
    } finally {
      action(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-plug text-pink-400 text-xl" />
        </div>
        <p className="text-sm font-bold mb-1">No accounts connected</p>
        <p className="text-xs text-slate-500 mb-4">Connect Instagram or TikTok to create posts.</p>
        <Link to="/dashboard/account/integrations" className="text-xs font-bold text-pink-400">
          <i className="fas fa-plug mr-1" />Connect Account
        </Link>
      </div>
    )
  }

  const selectedAccount = accounts.find(a => a.id.toString() === form.account_id)
  const charCount = form.caption.length
  const maxChars = selectedAccount?.platform === 'tiktok' ? 2200 : 2200

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard/platforms/posts" className="text-slate-500 hover:text-white transition-colors">
          <i className="fas fa-arrow-left text-xs" />
        </Link>
        <h1 className="text-xl font-black tracking-tighter">Create Post</h1>
      </div>

      <div className="max-w-2xl">
        <div className="glass-card rounded-2xl p-5 sm:p-7 space-y-5">
          {/* Account Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Account</label>
            <select
              value={form.account_id}
              onChange={(e) => setForm(f => ({ ...f, account_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-pink-500/30 transition-colors"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  @{a.username} ({a.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Content Type</label>
            <div className="flex items-center gap-2">
              {['reel', 'post', 'story', 'video'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, content_type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    form.content_type === t
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caption</label>
              <span className={`text-[10px] font-bold ${charCount > maxChars ? 'text-red-400' : 'text-slate-500'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
            <textarea
              value={form.caption}
              onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Write your caption..."
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-pink-500/30 transition-colors resize-none"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={(e) => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500/30 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">Leave empty to save as draft</p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notes (internal)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-pink-500/30 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || publishing}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2" />Saving...</> : <><i className="fas fa-save mr-2" />{form.scheduled_for ? 'Schedule' : 'Save Draft'}</>}
            </button>
            {selectedAccount?.has_oauth && (
              <button
                onClick={() => handleSave(true)}
                disabled={saving || publishing}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              >
                {publishing ? <><i className="fas fa-spinner fa-spin mr-2" />Publishing...</> : <><i className="fas fa-paper-plane mr-2" />Publish Now</>}
              </button>
            )}
          </div>

          {selectedAccount && !selectedAccount.has_oauth && (
            <p className="text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
              <i className="fas fa-exclamation-triangle mr-1" />
              Direct publishing requires OAuth. Reconnect your account with full permissions to publish.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
