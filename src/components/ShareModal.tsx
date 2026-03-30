import { useEffect, useState } from 'react'
import { API_URL } from '../lib/api'
import toast from 'react-hot-toast'

interface ShareLink {
  id: string
  token: string
  upload_id: number | null
  video_id: number | null
  is_active: boolean
  has_password: boolean
  expires_at: string | null
  view_count: number
  created_at: string
}

interface ShareModalProps {
  uploadId?: number
  videoId?: number
  sessionToken: string
  onClose: () => void
}

export default function ShareModal({ uploadId, videoId, sessionToken, onClose }: ShareModalProps) {
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState<string>('')

  const fetchShares = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/shared`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const data = await resp.json()
      if (Array.isArray(data)) {
        // Filter to shares for this specific content
        const filtered = data.filter((s: ShareLink) =>
          (uploadId && s.upload_id === uploadId) || (videoId && s.video_id === videoId)
        )
        setShares(filtered)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShares()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const createShare = async () => {
    setCreating(true)
    try {
      let expiresAt: string | undefined
      if (expiresIn === '1d') expiresAt = new Date(Date.now() + 86400000).toISOString()
      else if (expiresIn === '7d') expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
      else if (expiresIn === '30d') expiresAt = new Date(Date.now() + 30 * 86400000).toISOString()

      const resp = await fetch(`${API_URL}/api/shared`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          upload_id: uploadId || undefined,
          video_id: videoId || undefined,
          password: usePassword && password ? password : undefined,
          expires_at: expiresAt,
        }),
      })

      if (resp.ok) {
        const data = await resp.json()
        setShares(prev => [data, ...prev])
        setPassword('')
        setUsePassword(false)
        setExpiresIn('')
        const url = `${window.location.origin}/share/${data.token}`
        await navigator.clipboard.writeText(url)
        toast.success('Share link created & copied!')
      } else {
        const err = await resp.json()
        toast.error(err.error || 'Failed to create share')
      }
    } catch {
      toast.error('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (share: ShareLink) => {
    try {
      const resp = await fetch(`${API_URL}/api/shared/${share.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ is_active: !share.is_active }),
      })
      if (resp.ok) {
        const updated = await resp.json()
        setShares(prev => prev.map(s => s.id === share.id ? updated : s))
        toast.success(updated.is_active ? 'Link reactivated' : 'Link deactivated')
      }
    } catch {
      toast.error('Failed to update share')
    }
  }

  const deleteShare = async (share: ShareLink) => {
    try {
      const resp = await fetch(`${API_URL}/api/shared/${share.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (resp.ok) {
        setShares(prev => prev.filter(s => s.id !== share.id))
        toast.success('Share link deleted')
      }
    } catch {
      toast.error('Failed to delete share')
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0a0a12] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-black text-white">
            <i className="fas fa-share-alt mr-2 text-pink-400"></i>
            Share Analysis
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Create new share */}
        <div className="p-5 border-b border-white/10">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Create New Link</div>

          {/* Password toggle */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setUsePassword(!usePassword)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                usePassword
                  ? 'bg-pink-500/20 border border-pink-500/30 text-pink-400'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <i className={`fas ${usePassword ? 'fa-lock' : 'fa-globe'}`}></i>
              {usePassword ? 'Password Protected' : 'Public'}
            </button>

            <select
              value={expiresIn}
              onChange={e => setExpiresIn(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 focus:outline-none focus:border-pink-500/50"
            >
              <option value="">Never expires</option>
              <option value="1d">Expires in 1 day</option>
              <option value="7d">Expires in 7 days</option>
              <option value="30d">Expires in 30 days</option>
            </select>
          </div>

          {/* Password input */}
          {usePassword && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password for this link..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 mb-3"
            />
          )}

          <button
            onClick={createShare}
            disabled={creating || (usePassword && !password)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-xl text-pink-300 hover:text-white hover:from-pink-500/30 hover:to-orange-500/30 transition-all text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
            ) : (
              <><i className="fas fa-link mr-2"></i>Create & Copy Link</>
            )}
          </button>
        </div>

        {/* Existing shares */}
        <div className="p-5">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Existing Links {shares.length > 0 && `(${shares.length})`}
          </div>

          {loading ? (
            <div className="text-center py-6 text-slate-500">
              <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-sm">
              No share links yet. Create one above.
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map(share => (
                <div
                  key={share.id}
                  className={`rounded-xl p-3 border transition-all ${
                    share.is_active
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className={`fas ${share.has_password ? 'fa-lock text-amber-400' : 'fa-globe text-teal-400'} text-xs`}></i>
                      <span className="text-xs font-mono text-slate-400 truncate">
                        /share/{share.token}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => copyLink(share.token)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        title="Copy link"
                      >
                        <i className="fas fa-copy text-xs"></i>
                      </button>
                      <button
                        onClick={() => toggleActive(share)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${
                          share.is_active ? 'text-teal-400 hover:text-teal-300' : 'text-slate-500 hover:text-white'
                        }`}
                        title={share.is_active ? 'Deactivate' : 'Reactivate'}
                      >
                        <i className={`fas ${share.is_active ? 'fa-toggle-on' : 'fa-toggle-off'} text-sm`}></i>
                      </button>
                      <button
                        onClick={() => deleteShare(share)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                    <span><i className="fas fa-eye mr-1"></i>{share.view_count} views</span>
                    <span><i className="fas fa-clock mr-1"></i>{new Date(share.created_at).toLocaleDateString()}</span>
                    {share.expires_at && (
                      <span className={new Date(share.expires_at) < new Date() ? 'text-red-400' : ''}>
                        <i className="fas fa-hourglass-half mr-1"></i>
                        {new Date(share.expires_at) < new Date() ? 'Expired' : `Expires ${new Date(share.expires_at).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
