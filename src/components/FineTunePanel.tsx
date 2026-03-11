import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface FineTuneVideo {
  id: number
  source_url: string
  platform: string | null
  thumbnail_url: string | null
  username: string | null
  caption: string | null
  views: number
  status: string
}

interface FineTuneData {
  id: number
  item_type: string
  item_id: number
  status: string
  video_count: number
  example_video_count: number
  custom_analysis: any
  error_message: string | null
  created_at: string
  updated_at: string
  videos?: FineTuneVideo[]
}

interface FineTunePanelProps {
  itemType: 'format' | 'hook' | 'tactic'
  itemId: number
  itemName: string
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10', icon: 'fa-clock' },
  processing: { label: 'Processing', color: 'text-amber-400 bg-amber-500/10', icon: 'fa-spinner fa-spin' },
  completed: { label: 'Ready', color: 'text-emerald-400 bg-emerald-500/10', icon: 'fa-check' },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-500/10', icon: 'fa-xmark' },
}

export default function FineTunePanel({ itemType, itemId, itemName }: FineTunePanelProps) {
  const { userType, planSlug } = useAuth()
  const canFineTune = userType === 'admin' || planSlug === 'premium' || planSlug === 'platin'

  const [fineTune, setFineTune] = useState<FineTuneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [urls, setUrls] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingVideos, setAddingVideos] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUrls, setNewUrls] = useState<string[]>([''])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [limits, setLimits] = useState<Record<string, number | null>>({})

  const fetchFineTune = useCallback(() => {
    authFetch(`/api/analysis/fine-tunes/for-item/${itemType}/${itemId}`)
      .then(r => r.json())
      .then(data => {
        if (data.fine_tune) {
          setFineTune(data.fine_tune)
        } else {
          setFineTune(null)
        }
        if (data.counts) setCounts(data.counts)
        if (data.limits) setLimits(data.limits)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemType, itemId])

  useEffect(() => {
    if (!canFineTune) { setLoading(false); return }
    fetchFineTune()
  }, [fetchFineTune, canFineTune])

  // Poll when processing
  useEffect(() => {
    if (!fineTune || (fineTune.status !== 'processing' && fineTune.status !== 'pending')) return
    const interval = setInterval(() => {
      authFetch(`/api/analysis/fine-tunes/for-item/${itemType}/${itemId}`)
        .then(r => r.json())
        .then(data => {
          if (data.fine_tune) setFineTune(data.fine_tune)
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [fineTune, itemType, itemId])

  if (!canFineTune || loading) return null

  const limit = limits[itemType]
  const count = counts[itemType] || 0
  const atLimit = limit !== null && limit !== undefined && count >= limit

  const isValidUrl = (url: string) => {
    const trimmed = url.trim()
    return trimmed.includes('instagram.com') || trimmed.includes('tiktok.com')
  }

  const handleCreate = async () => {
    const validUrls = urls.map(u => u.trim()).filter(isValidUrl)
    if (validUrls.length === 0) {
      toast.error('Add at least one Instagram or TikTok URL')
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch('/api/analysis/fine-tunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: itemType, item_id: itemId, urls: validUrls }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create fine-tune')
        return
      }
      setFineTune(data.fine_tune)
      setShowForm(false)
      setUrls([''])
      toast.success('Fine-tune started!')
    } catch {
      toast.error('Failed to create fine-tune')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddVideos = async () => {
    if (!fineTune) return
    const validUrls = newUrls.map(u => u.trim()).filter(isValidUrl)
    if (validUrls.length === 0) {
      toast.error('Add at least one Instagram or TikTok URL')
      return
    }
    setAddingVideos(true)
    try {
      const res = await authFetch(`/api/analysis/fine-tunes/${fineTune.id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add videos')
        return
      }
      setShowAddForm(false)
      setNewUrls([''])
      fetchFineTune()
      toast.success('Videos added!')
    } catch {
      toast.error('Failed to add videos')
    } finally {
      setAddingVideos(false)
    }
  }

  const handleRegenerate = async () => {
    if (!fineTune) return
    setRegenerating(true)
    try {
      const res = await authFetch(`/api/analysis/fine-tunes/${fineTune.id}/regenerate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to regenerate')
        return
      }
      setFineTune(data.fine_tune)
      toast.success('Regeneration started!')
    } catch {
      toast.error('Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRemoveVideo = async (videoId: number) => {
    if (!fineTune) return
    try {
      const res = await authFetch(`/api/analysis/fine-tunes/${fineTune.id}/videos/${videoId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to remove video')
        return
      }
      fetchFineTune()
      toast.success('Video removed')
    } catch {
      toast.error('Failed to remove video')
    }
  }

  const handleDelete = async () => {
    if (!fineTune) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/analysis/fine-tunes/${fineTune.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete fine-tune')
        return
      }
      setFineTune(null)
      setShowDeleteConfirm(false)
      toast.success('Fine-tune deleted')
    } catch {
      toast.error('Failed to delete fine-tune')
    } finally {
      setDeleting(false)
    }
  }

  const addUrlField = (urlList: string[], setUrlList: (urls: string[]) => void) => {
    if (urlList.length >= 20) return
    setUrlList([...urlList, ''])
  }

  const removeUrlField = (urlList: string[], setUrlList: (urls: string[]) => void, index: number) => {
    if (urlList.length <= 1) return
    setUrlList(urlList.filter((_, i) => i !== index))
  }

  const updateUrl = (urlList: string[], setUrlList: (urls: string[]) => void, index: number, value: string) => {
    const updated = [...urlList]
    updated[index] = value
    setUrlList(updated)
  }

  const renderUrlForm = (
    urlList: string[],
    setUrlList: (urls: string[]) => void,
    onSubmit: () => void,
    isSubmitting: boolean,
    submitLabel: string,
    onCancel: () => void,
  ) => (
    <div className="space-y-3">
      {urlList.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => updateUrl(urlList, setUrlList, i, e.target.value)}
            placeholder="https://instagram.com/reel/... or https://tiktok.com/@..."
            className="flex-1 glass-input px-4 py-2.5 text-sm font-medium placeholder:text-slate-600"
          />
          {urlList.length > 1 && (
            <button
              onClick={() => removeUrlField(urlList, setUrlList, i)}
              className="text-slate-500 hover:text-red-400 transition-colors p-2"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        {urlList.length < 20 && (
          <button
            onClick={() => addUrlField(urlList, setUrlList)}
            className="text-slate-500 hover:text-white text-[11px] font-bold transition-colors"
          >
            <i className="fas fa-plus mr-1"></i> Add URL
          </button>
        )}
        <span className="text-slate-600 text-[10px]">{urlList.filter(u => u.trim()).length} / 20 max</span>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || urlList.every(u => !isValidUrl(u))}
          className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-[11px] font-black rounded-xl transition-all"
        >
          {isSubmitting ? (
            <><i className="fas fa-spinner fa-spin mr-1.5"></i> Processing...</>
          ) : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-white text-[11px] font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  // No fine-tune exists yet — show create button
  if (!fineTune) {
    if (showForm) {
      return (
        <div className="glass-card rounded-3xl p-5 md:p-8 mb-8 md:mb-12 border border-pink-500/20">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-sliders text-pink-400"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Fine-tune: {itemName}</h3>
              <p className="text-[10px] text-slate-500 font-bold">
                Add Instagram or TikTok URLs as example videos
                {limit !== null && limit !== undefined && (
                  <span className="ml-2 text-slate-600">({count} / {limit} {itemType} fine-tunes used)</span>
                )}
              </p>
            </div>
          </div>
          {renderUrlForm(urls, setUrls, handleCreate, submitting, 'Start Fine-tune', () => { setShowForm(false); setUrls(['']) })}
        </div>
      )
    }

    return (
      <button
        onClick={() => {
          if (atLimit) {
            toast.error(`You've reached your ${itemType} fine-tune limit (${limit})`)
            return
          }
          setShowForm(true)
        }}
        className="mb-6 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-[11px] font-black rounded-xl transition-all border border-pink-500/20 hover:border-pink-500/30"
      >
        <i className="fas fa-sliders mr-1.5 text-[10px]"></i>
        FINE-TUNE
        {limit !== null && limit !== undefined && (
          <span className="ml-2 text-pink-400/60">({count}/{limit})</span>
        )}
      </button>
    )
  }

  // Fine-tune exists — show management panel
  const status = statusConfig[fineTune.status] ?? { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10', icon: 'fa-clock' }
  const analysis = fineTune.custom_analysis

  return (
    <div className="glass-card rounded-3xl p-5 md:p-8 mb-8 md:mb-12 border border-pink-500/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-sliders text-pink-400"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Your Fine-tuned Analysis
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${status.color}`}>
                <i className={`fas ${status.icon} mr-1`}></i>
                {status.label}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">
              {fineTune.example_video_count || fineTune.video_count} example video{(fineTune.example_video_count || fineTune.video_count) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || fineTune.status === 'processing'}
            className="text-slate-500 hover:text-white text-[10px] font-black transition-colors disabled:opacity-30"
            title="Regenerate analysis"
          >
            <i className={`fas fa-rotate ${regenerating ? 'fa-spin' : ''}`}></i>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-slate-500 hover:text-red-400 text-[10px] font-black transition-colors"
            title="Delete fine-tune"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
          <span className="text-red-400 text-xs font-bold">Delete this fine-tune? This cannot be undone.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg transition-all disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-slate-500 hover:text-white text-[10px] font-bold px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {fineTune.status === 'failed' && fineTune.error_message && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-[11px] font-bold">
            <i className="fas fa-exclamation-triangle mr-1.5"></i>
            {fineTune.error_message}
          </p>
        </div>
      )}

      {/* Custom Analysis Display */}
      {fineTune.status === 'completed' && analysis && (
        <div className="mb-5 md:mb-6">
          {analysis.class_description && (
            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-4">{analysis.class_description}</p>
          )}
          {analysis.tactic_description && (
            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-4">{analysis.tactic_description}</p>
          )}

          {/* Blueprint from custom analysis */}
          {analysis.blueprint && (
            <div className="mb-4">
              <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2">Your Blueprint</h4>
              <ul className="space-y-2">
                {(Array.isArray(analysis.blueprint) ? analysis.blueprint : analysis.blueprint?.steps || []).slice(0, 5).map((step: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400 font-medium leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5 font-black">
                      {i + 1}
                    </span>
                    <span>{typeof step === 'string' ? step : step.instruction || step.text || step.name || ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gold standard from custom analysis */}
          {analysis.gold_standard_tactics && analysis.gold_standard_tactics.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2">Gold Standard</h4>
              <div className="space-y-2">
                {analysis.gold_standard_tactics.slice(0, 4).map((t: any, i: number) => (
                  <div key={i} className="p-3 bg-white/[0.02] rounded-xl border-l-2 border-l-teal-500">
                    <span className="text-[11px] font-bold text-white">{typeof t === 'string' ? t : t.name || t.tactic}</span>
                    {t.description && <p className="text-[10px] text-slate-500 mt-1">{t.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing indicator */}
      {(fineTune.status === 'processing' || fineTune.status === 'pending') && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-amber-500/5 rounded-xl">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-amber-400 text-[11px] font-bold">
            Generating your personalized analysis... This may take a minute.
          </p>
        </div>
      )}

      {/* Example Videos */}
      {fineTune.videos && fineTune.videos.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Example Videos</h4>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {fineTune.videos.map((video) => (
              <div key={video.id} className="flex-shrink-0 w-20 group relative">
                <div className="aspect-[9/16] bg-slate-900 rounded-lg overflow-hidden border border-white/5">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.username || 'Video'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-film text-slate-700 text-sm"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-1.5">
                    {video.username && (
                      <span className="text-[7px] font-black text-white truncate">@{video.username}</span>
                    )}
                    {video.views > 0 && (
                      <span className="text-[7px] font-black text-slate-400">{formatNumber(video.views)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveVideo(video.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times text-[6px] text-white"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add More Videos */}
      {showAddForm ? (
        <div className="border-t border-white/5 pt-4 mt-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Add More Videos</h4>
          {renderUrlForm(newUrls, setNewUrls, handleAddVideos, addingVideos, 'Add Videos', () => { setShowAddForm(false); setNewUrls(['']) })}
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="text-slate-500 hover:text-pink-400 text-[11px] font-bold transition-colors mt-2"
        >
          <i className="fas fa-plus mr-1"></i> Add Videos
        </button>
      )}
    </div>
  )
}
