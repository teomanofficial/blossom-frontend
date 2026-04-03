import { useState, useEffect, useRef, useCallback } from 'react'
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

interface MediaItem {
  file: File
  preview: string
  type: 'image' | 'video'
}

const MAX_IMAGE_SIZE = 8 * 1024 * 1024      // 8MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024     // 300MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']

function getMediaType(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: unsupported format. Use JPEG, PNG, MP4, or MOV.`
  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) return `${file.name}: image exceeds 8MB limit`
  if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) return `${file.name}: video exceeds 300MB limit`
  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function PlatformPostCreate() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const mediaItemsRef = useRef<MediaItem[]>([])

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

  // Keep ref in sync for cleanup
  useEffect(() => { mediaItemsRef.current = mediaItems }, [mediaItems])

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => { mediaItemsRef.current.forEach(m => { if (m.preview) URL.revokeObjectURL(m.preview) }) }
  }, [])

  // Auto-detect content type only on initial file add (0→N transition)
  const prevMediaCount = useRef(0)
  useEffect(() => {
    if (prevMediaCount.current === 0 && mediaItems.length > 0) {
      const hasVideo = mediaItems.some(m => m.type === 'video')
      if (mediaItems.length === 1 && !hasVideo) {
        setForm(f => ({ ...f, content_type: 'post' }))
      } else if (mediaItems.length === 1 && hasVideo) {
        setForm(f => ({ ...f, content_type: 'reel' }))
      } else if (mediaItems.length >= 2) {
        setForm(f => ({ ...f, content_type: 'carousel' }))
      }
    }
    prevMediaCount.current = mediaItems.length
  }, [mediaItems])

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const newItems: MediaItem[] = []

    for (const file of fileArr) {
      const err = validateFile(file)
      if (err) { toast.error(err); continue }
      newItems.push({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        type: getMediaType(file),
      })
    }

    setMediaItems(prev => {
      const combined = [...prev, ...newItems]
      if (combined.length > 10) {
        toast.error('Maximum 10 media items')
        return prev
      }
      return combined
    })
  }, [])

  const removeMedia = useCallback((index: number) => {
    setMediaItems(prev => {
      const item = prev[index]
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleSave = async (publish = false) => {
    if (!form.account_id) return toast.error('Select an account')
    if (!form.caption.trim()) return toast.error('Caption is required')
    if (publish && mediaItems.length === 0) return toast.error('Add at least one photo or video to publish')

    // Validate media count for content type
    if (publish) {
      if (form.content_type === 'carousel' && mediaItems.length < 2) {
        return toast.error('Carousel requires at least 2 items')
      }
      if (['post', 'reel', 'video'].includes(form.content_type) && mediaItems.length > 1) {
        return toast.error(`${form.content_type} allows only 1 media item`)
      }
    }

    const action = publish ? setPublishing : setSaving
    action(true)

    try {
      // Step 1: Create the post
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
        throw new Error(err.error || 'Failed to create post')
      }

      const post = await createRes.json()

      // Step 2: Upload media files
      if (mediaItems.length > 0) {
        setUploadingMedia(true)
        const formData = new FormData()
        mediaItems.forEach(m => formData.append('media', m.file))

        const uploadRes = await authFetch(`/api/social/posts/${post.id}/media`, {
          method: 'POST',
          body: formData,
        })

        setUploadingMedia(false)

        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          toast.error(err.error || 'Media upload failed — post saved as draft')
          navigate('/dashboard/platforms/posts')
          return
        }
      }

      // Step 3: Publish if requested
      if (publish) {
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
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      action(false)
      setUploadingMedia(false)
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
      <div className="glass-card rounded-3xl p-12 text-center">
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
  const maxChars = 2200
  const isBusy = saving || publishing || uploadingMedia

  const contentTypeLabels: Record<string, { label: string; icon: string }> = {
    post: { label: 'Photo', icon: 'fa-image' },
    carousel: { label: 'Carousel', icon: 'fa-images' },
    reel: { label: 'Reel', icon: 'fa-film' },
    video: { label: 'Video', icon: 'fa-video' },
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard/platforms/posts" className="text-slate-500 hover:text-white transition-colors">
          <i className="fas fa-arrow-left text-xs" />
        </Link>
        <h1 className="text-xl font-black tracking-tighter font-display">Create Post</h1>
      </div>

      <div className="max-w-2xl">
        <div className="glass-card rounded-3xl p-5 sm:p-7 space-y-5">
          {/* Account Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Account</label>
            <select
              value={form.account_id}
              onChange={(e) => setForm(f => ({ ...f, account_id: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
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
              {Object.entries(contentTypeLabels).map(([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, content_type: key }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    form.content_type === key
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <i className={`fas ${icon} text-[10px]`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Media
              <span className="text-slate-600 font-normal ml-1">
                ({mediaItems.length}/10)
              </span>
            </label>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <i className="fas fa-cloud-upload-alt text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Drop files here or click to browse</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG, MP4, MOV — Images up to 8MB, Videos up to 300MB</p>
                </div>
              </div>
            </div>

            {/* Media Previews */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {mediaItems.map((item, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    {item.type === 'image' ? (
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2">
                        <i className="fas fa-video text-pink-400 text-lg" />
                        <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{item.file.name}</span>
                        <span className="text-[9px] text-slate-500">{formatFileSize(item.file.size)}</span>
                      </div>
                    )}
                    {/* Order badge */}
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{idx + 1}</span>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMedia(idx) }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-md bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-times text-[8px] text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Content type hint */}
            {mediaItems.length > 0 && (
              <p className="text-[10px] text-slate-500 mt-2">
                {form.content_type === 'post' && 'Single photo post'}
                {form.content_type === 'carousel' && `Carousel with ${mediaItems.length} items`}
                {form.content_type === 'reel' && 'Vertical video reel (9:16 ratio recommended)'}
                {form.content_type === 'video' && 'Video post'}
              </p>
            )}
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
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={(e) => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white"
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
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            <button
              onClick={() => handleSave(false)}
              disabled={isBusy}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2" />Saving...</> : <><i className="fas fa-save mr-2" />{form.scheduled_for ? 'Schedule' : 'Save Draft'}</>}
            </button>
            {selectedAccount?.has_oauth && (
              <button
                onClick={() => handleSave(true)}
                disabled={isBusy}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              >
                {uploadingMedia ? <><i className="fas fa-spinner fa-spin mr-2" />Uploading media...</>
                  : publishing ? <><i className="fas fa-spinner fa-spin mr-2" />Publishing...</>
                  : <><i className="fas fa-paper-plane mr-2" />Publish Now</>}
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
