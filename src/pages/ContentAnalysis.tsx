import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'

// === Helper Functions ===

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB'
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(0) + ' KB'
  return bytes + ' B'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// === Analysis Steps for Progress Stepper ===

const ANALYSIS_STEPS = [
  { key: 'upload', label: 'Upload Complete', subtitle: 'Uploading your content...' },
  { key: 'full_analysis', label: 'Format Analysis', subtitle: 'Analyzing viral format...' },
  { key: 'hook_analysis', label: 'Hook Analysis', subtitle: 'Analyzing first 3.05 seconds...' },
  { key: 'virality_scores', label: 'Virality Scoring', subtitle: 'Calculating engagement metrics...' },
  { key: 'improvement', label: 'Generating Improvements', subtitle: null },
]

const IMPROVEMENT_SUBTITLES = [
  'Comparing with viral contents in same formats...',
  'Extracting patterns...',
  'Generating improvements...',
]

// === History Item Interface ===

interface HistoryItem {
  id: number
  source_type: string
  platform: string
  source_url: string | null
  thumbnail_path: string | null
  title: string | null
  caption: string | null
  username: string | null
  views: number
  likes: number
  comments_count: number
  shares: number
  saves: number
  engagement_rate: number
  status: string
  error_message: string | null
  optimization_score: number | null
  created_at: string
  version_group_id: string | null
  version_number: number | null
}

export default function ContentAnalysis() {
  const { session, planSlug, proCredits } = useAuth()
  const navigate = useNavigate()

  // Upload state
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Analysis state
  const [uploadId, setUploadId] = useState<number | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<any>(null)

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set())
  const historyLimit = 20

  // Video thumbnail for loading screen
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)

  // Improvement step subtitle cycling (sequential, no loop)
  const [improvementSubtitleIdx, setImprovementSubtitleIdx] = useState(0)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // === History Fetching ===

  const fetchHistory = useCallback(async (currentOffset: number, silent = false) => {
    if (!session?.access_token) return
    if (!silent) setHistoryLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis?limit=${historyLimit}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await resp.json()
      if (resp.ok && data.uploads && Array.isArray(data.uploads)) {
        setHistory(data.uploads)
        setHistoryTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      if (!silent) setHistoryLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    fetchHistory(historyOffset)
  }, [fetchHistory, historyOffset])

  // Auto-refresh when there are processing items
  useEffect(() => {
    const hasProcessing = history.some(h => h.status === 'analyzing' || h.status === 'pending')
    if (!hasProcessing) return
    const interval = setInterval(() => fetchHistory(historyOffset, true), 30000)
    return () => clearInterval(interval)
  }, [history, fetchHistory, historyOffset])

  // === Polling ===

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback((id: number) => {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      if (!session?.access_token) return
      try {
        const resp = await fetch(`${API_URL}/api/content-analysis/${id}/status`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await resp.json()
        if (!resp.ok) return
        setAnalysisStatus(data)

        if (data.status === 'completed') {
          stopPolling()
          fetchHistory(historyOffset, true)
          // Navigate to the detail page
          navigate(`/dashboard/analyze/${id}`)
        } else if (data.status === 'error') {
          stopPolling()
          setUploadError(data.error || 'Analysis failed')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)
  }, [session?.access_token, stopPolling, fetchHistory, historyOffset, navigate])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // === Submit Handler ===

  const handleSubmit = async () => {
    if (mode === 'url' && !url.trim()) return
    if (mode === 'upload' && !file) return

    setUploading(true)
    setUploadError(null)
    setAnalysisStatus(null)

    try {
      let resp: Response
      if (mode === 'url') {
        resp = await fetch(`${API_URL}/api/content-analysis/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ url }),
        })
      } else {
        const formData = new FormData()
        formData.append('video', file!)
        resp = await fetch(`${API_URL}/api/content-analysis/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        })
      }
      const data = await resp.json()
      if (!resp.ok || data.error) throw new Error(data.error || 'Upload failed')
      // Set thumbnail from backend response for URL mode (Instagram/TikTok cover image)
      if (mode === 'url' && data.thumbnail) {
        setVideoThumbnail(data.thumbnail)
      }
      setUploadId(data.id)
      startPolling(data.id)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // === Reset to Upload Form ===

  const handleReset = () => {
    stopPolling()
    setUploadId(null)
    setAnalysisStatus(null)
    setUploadError(null)
    setUrl('')
    setFile(null)
    setVideoThumbnail(null)
  }

  // === History Retry ===

  const handleRetry = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation()
    if (!session?.access_token) return
    setRetryingIds(prev => new Set(prev).add(itemId))
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis/${itemId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (resp.ok) {
        setHistory(prev => prev.map(h => h.id === itemId ? { ...h, status: 'analyzing', error_message: null } : h))
      }
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  // === Extract first frame from video file ===

  const extractVideoThumbnail = useCallback((videoFile: File) => {
    const videoEl = document.createElement('video')
    videoEl.preload = 'metadata'
    videoEl.muted = true
    videoEl.playsInline = true
    const objectUrl = URL.createObjectURL(videoFile)
    videoEl.src = objectUrl
    videoEl.onloadeddata = () => {
      videoEl.currentTime = 0.1 // seek to first frame
    }
    videoEl.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = videoEl.videoWidth
      canvas.height = videoEl.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0)
        setVideoThumbnail(canvas.toDataURL('image/jpeg', 0.8))
      }
      URL.revokeObjectURL(objectUrl)
    }
    videoEl.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [])

  // === Drag & Drop Handlers ===

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile)
      setUploadError(null)
      extractVideoThumbnail(droppedFile)
    } else {
      setUploadError('Please drop a video file')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadError(null)
      extractVideoThumbnail(selectedFile)
    }
  }

  // === URL Platform Detection ===

  const detectedPlatform = url.includes('tiktok') ? 'tiktok' : url.includes('instagram') || url.includes('instagr.am') ? 'instagram' : null

  // === Improvement subtitle cycling (sequential, stops at last) ===
  const improvementStepStatus = analysisStatus?.steps?.improvement
  useEffect(() => {
    if (improvementStepStatus !== 'running') {
      setImprovementSubtitleIdx(0)
      return
    }
    if (improvementSubtitleIdx >= IMPROVEMENT_SUBTITLES.length - 1) return
    const timer = setTimeout(() => {
      setImprovementSubtitleIdx(prev => Math.min(prev + 1, IMPROVEMENT_SUBTITLES.length - 1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [improvementStepStatus, improvementSubtitleIdx])

  // === Progress Step Status ===

  const getStepStatus = (stepIndex: number): 'done' | 'running' | 'pending' | 'error' => {
    if (!analysisStatus?.steps) return stepIndex === 0 ? 'done' : 'pending'
    const stepKey = ANALYSIS_STEPS[stepIndex]?.key
    if (!stepKey) return 'pending'
    const stepState = analysisStatus.steps[stepKey]
    if (stepState === 'done') return 'done'
    if (stepState === 'running') return 'running'
    if (stepState === 'error') return 'error'
    return 'pending'
  }

  // === Render ===

  const isAnalyzing = uploadId !== null && analysisStatus?.status !== 'error'

  const totalPages = Math.ceil(historyTotal / historyLimit)
  const currentPage = Math.floor(historyOffset / historyLimit) + 1

  return (
    <>
      {/* Page Header */}
      <div className={`mb-6 ${isAnalyzing ? 'sm:mb-6' : 'sm:mb-12'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="badge-glass text-pink-400 font-black text-xs sm:text-sm">
                Virality Check
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tighter mb-1 sm:mb-2">
              Check <span className="gradient-text">Your Content</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Upload a video or paste a URL to get AI-powered analysis and improvement suggestions.
            </p>
            {planSlug === 'pro' && proCredits && (
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${proCredits.used >= proCredits.limit ? 'bg-red-500/10 border border-red-400/20 text-red-400' : 'bg-blue-500/10 border border-blue-400/20 text-blue-300'}`}>
                <i className="fas fa-bolt text-[10px]" />
                {proCredits.limit - proCredits.used}/{proCredits.limit} monthly analyses remaining
              </div>
            )}
          </div>
          {isAnalyzing && (
            <button
              onClick={handleReset}
              aria-label="New check"
              className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-bold flex-shrink-0"
            >
              <i className="fas fa-plus sm:mr-2"></i>
              <span className="hidden sm:inline">New Check</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-hidden">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">

          {isAnalyzing ? (
            /* === PROGRESS STEPPER — Content Deconstruction === */
            <div className="relative">
              {/* Ambient glow spheres */}
              <div className="absolute -top-10 -left-10 w-[300px] h-[300px] rounded-full bg-purple-700/10 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

              <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center relative z-10">
                {/* LEFT: Phone Scanner */}
                <div className="flex justify-center">
                  <div className="analysis-phone-frame w-full max-w-[240px] max-h-[420px] rounded-[32px] relative overflow-hidden flex items-center justify-center">
                    {/* Video thumbnail background */}
                    {videoThumbnail && (
                      <img
                        src={videoThumbnail}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Dark overlay on top of thumbnail for contrast */}
                    <div className={`absolute inset-0 ${videoThumbnail ? 'bg-black/20' : 'bg-black/40'}`} />

                    {/* Subtle grid texture */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)' }} />

                    {/* Laser scanning beam */}
                    <div className="absolute inset-x-0 analysis-laser-beam z-30" />
                    <div className="absolute inset-x-0 analysis-laser-glow z-20" />

                    {/* Pinging AI nodes */}
                    <div className="analysis-node top-[25%] left-[35%]" style={{ animationDelay: '0.2s' }} />
                    <div className="analysis-node top-[55%] left-[65%]" style={{ animationDelay: '0.9s' }} />
                    <div className="analysis-node top-[78%] left-[40%]" style={{ animationDelay: '1.5s' }} />

                    {/* Center icon */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 backdrop-blur-md">
                        <svg className="w-6 h-6 text-pink-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-[8px] font-mono tracking-[0.4em] uppercase text-white/30">Neural Engine v4</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Analysis Steps + Progress */}
                <div className="space-y-5">
                  {/* Header */}
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                      Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Deconstruction</span>
                    </h2>
                    <p className="text-slate-500 text-xs max-w-sm">Our neural clusters are extracting engagement DNA from your video to predict virality performance.</p>
                  </div>

                  {/* Vertical stepper */}
                  <div className="space-y-0 relative">
                    {ANALYSIS_STEPS.map((step, idx) => {
                      const status = getStepStatus(idx)
                      const isLast = idx === ANALYSIS_STEPS.length - 1
                      const isPending = status === 'pending'

                      return (
                        <div key={step.key} className={`flex items-start gap-4 pb-5 relative transition-opacity duration-500 ${isPending ? 'opacity-30' : ''}`}>
                          {/* Connector line */}
                          {!isLast && (
                            <div
                              className={`absolute left-[13px] top-[28px] bottom-0 w-[2px] transition-all duration-500 ${
                                status === 'done'
                                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-500/20'
                                  : 'bg-white/5'
                              }`}
                            />
                          )}

                          {/* Step circle */}
                          <div
                            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                              status === 'done'
                                ? 'bg-emerald-500/20 border border-emerald-500'
                                : status === 'running'
                                ? 'bg-pink-500/20 border border-pink-500 analysis-active-step'
                                : status === 'error'
                                ? 'bg-red-500/20 border border-red-500'
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            {status === 'done' ? (
                              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : status === 'running' ? (
                              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
                            ) : status === 'error' ? (
                              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <div className="w-1 h-1 bg-white/20 rounded-full" />
                            )}
                          </div>

                          {/* Step text */}
                          <div className="pt-0.5 min-w-0">
                            <h4
                              className={`font-bold text-[13px] tracking-wide transition-all ${
                                status === 'done'
                                  ? 'text-emerald-500'
                                  : status === 'running'
                                  ? 'text-white'
                                  : status === 'error'
                                  ? 'text-red-400'
                                  : 'text-white'
                              }`}
                            >
                              {step.label}
                            </h4>
                            {status === 'running' && (
                              <p className="text-[11px] text-slate-400 mt-0.5 transition-all duration-300">
                                {step.key === 'improvement'
                                  ? IMPROVEMENT_SUBTITLES[improvementSubtitleIdx]
                                  : step.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Error retry */}
                  {analysisStatus?.status === 'error' && (
                    <div className="text-center pt-2">
                      <p className="text-red-400 text-sm mb-3">{analysisStatus.error || 'Analysis failed. Please try again.'}</p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={async () => {
                            if (!uploadId || !session?.access_token) return
                            try {
                              const resp = await fetch(`${API_URL}/api/content-analysis/${uploadId}/retry`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${session.access_token}` },
                              })
                              if (resp.ok) {
                                setAnalysisStatus({ status: 'analyzing', steps: { upload: 'done', full_analysis: 'pending', hook_analysis: 'pending', virality_scores: 'pending', improvement: 'pending' } })
                                startPolling(uploadId)
                              }
                            } catch (err) {
                              console.error('Retry failed:', err)
                            }
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all"
                        >
                          <i className="fas fa-redo mr-2"></i>
                          Retry Check
                        </button>
                        <button
                          onClick={handleReset}
                          className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 text-sm font-bold rounded-xl hover:bg-white/10 transition-all"
                        >
                          Start Over
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          ) : (
            /* === UPLOAD FORM + HISTORY === */
            <div className="space-y-10">
              {/* Upload Form */}
              <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                {/* Mode Toggle Pills */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
                  <button
                    onClick={() => { setMode('url'); setUploadError(null) }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      mode === 'url'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fas fa-link mr-2"></i>
                    Paste URL
                  </button>
                  <button
                    onClick={() => { setMode('upload'); setUploadError(null) }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      mode === 'upload'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fas fa-cloud-upload-alt mr-2"></i>
                    Upload File
                  </button>
                </div>

                {/* URL Mode */}
                {mode === 'url' && (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Platform icon */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        {detectedPlatform === 'tiktok' ? (
                          <i className="fab fa-tiktok text-lg"></i>
                        ) : detectedPlatform === 'instagram' ? (
                          <i className="fab fa-instagram text-lg text-pink-400"></i>
                        ) : (
                          <i className="fas fa-link text-lg"></i>
                        )}
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setUploadError(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) handleSubmit() }}
                        placeholder="Paste a TikTok or Instagram URL..."
                        className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 w-full focus:border-pink-500/50 focus:outline-none transition-all text-sm"
                      />
                      {url && detectedPlatform && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                            detectedPlatform === 'tiktok'
                              ? 'bg-white/10 text-white'
                              : 'bg-pink-500/10 text-pink-400'
                          }`}>
                            {detectedPlatform}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={uploading || !url.trim()}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-wand-magic-sparkles mr-2"></i>
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Upload Mode */}
                {mode === 'upload' && (
                  <div className="space-y-4">
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                        dragOver
                          ? 'border-pink-500/50 bg-pink-500/5'
                          : file
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
                      {file ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10">
                            <i className="fas fa-file-video text-2xl text-green-400"></i>
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{file.name}</p>
                            <p className="text-slate-500 text-xs mt-1">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setFile(null) }}
                            className="text-xs text-slate-500 hover:text-red-400 transition-all"
                          >
                            <i className="fas fa-times mr-1"></i>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5">
                            <i className="fas fa-cloud-upload-alt text-2xl text-slate-500"></i>
                          </div>
                          <div>
                            <p className="text-slate-300 font-bold text-sm">
                              Drop your video here or{' '}
                              <span className="text-pink-400">browse</span>
                            </p>
                            <p className="text-slate-600 text-xs mt-1">MP4, MOV, WebM up to 500MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={uploading || !file}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-wand-magic-sparkles mr-2"></i>
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
                    <div>
                      <p className="text-red-400 text-sm font-bold">Upload failed</p>
                      <p className="text-red-400/70 text-xs mt-0.5">{uploadError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* HISTORY LIST                                                */}
              {/* ═══════════════════════════════════════════════════════════ */}

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-3xl p-5">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Checks</div>
                  <div className="text-2xl font-black text-white">{historyTotal}</div>
                </div>
                <div className="glass-card rounded-3xl p-5">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Completed</div>
                  <div className="text-2xl font-black text-green-400">
                    {history.filter(h => h.status === 'completed').length}
                  </div>
                </div>
                <div className="glass-card rounded-3xl p-5">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Score</div>
                  <div className="text-2xl font-black text-pink-400">
                    {(() => {
                      const scored = history.filter(h => h.optimization_score != null)
                      if (scored.length === 0) return '—'
                      const avg = scored.reduce((sum, h) => sum + (Number(h.optimization_score) || 0), 0) / scored.length
                      return Math.round(avg)
                    })()}
                  </div>
                </div>
              </div>

              {/* History List */}
              {historyLoading ? (
                <div className="flex items-center justify-center py-20">
                  <i className="fas fa-spinner fa-spin text-2xl text-pink-400 mr-3"></i>
                  <span className="text-slate-400">Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="glass-card rounded-3xl p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
                    <i className="fas fa-inbox text-3xl text-slate-600"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 mb-2">No analyses yet</h3>
                  <p className="text-slate-600 text-sm">Start by analyzing a video above to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.status === 'completed') {
                          navigate(`/dashboard/analyze/${item.id}`)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && item.status === 'completed') { e.preventDefault(); navigate(`/dashboard/analyze/${item.id}`); } }}
                      className={`w-full text-left glass-card rounded-3xl p-5 transition-all group border border-transparent ${
                        item.status === 'completed'
                          ? 'hover:bg-white/[0.06] hover:border-white/10 cursor-pointer'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        {/* Thumbnail */}
                        <div className="w-20 h-28 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.thumbnail_path ? (
                            <img
                              src={item.thumbnail_path.startsWith('http') ? item.thumbnail_path : `/media/${item.thumbnail_path.split('/').pop()}`}
                              alt=""
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <i className={`fab fa-${item.platform === 'tiktok' ? 'tiktok' : item.platform === 'instagram' ? 'instagram' : 'video'} text-xl ${
                              item.platform === 'tiktok' ? 'text-white' : item.platform === 'instagram' ? 'text-pink-400' : 'text-slate-500'
                            }`}></i>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                              item.platform === 'tiktok'
                                ? 'bg-white/10 text-white'
                                : item.platform === 'instagram'
                                ? 'bg-pink-500/10 text-pink-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {item.platform || 'upload'}
                            </span>
                            {item.username && (
                              <span className="text-xs text-slate-500">@{item.username}</span>
                            )}
                            {item.version_number != null && item.version_number > 1 && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                v{item.version_number}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-600 ml-auto">{formatDate(item.created_at)}</span>
                          </div>

                          {/* Title (primary) — fallback to caption, then filename hint */}
                          <p className="text-sm font-bold text-white truncate mb-1">
                            {item.title || item.caption || 'Untitled'}
                          </p>

                          {/* Caption (secondary, if different from title) */}
                          {item.caption && item.title && item.caption !== item.title && (
                            <p className="text-xs text-slate-500 truncate mb-1.5">{item.caption}</p>
                          )}

                          {/* Stats row */}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {item.views > 0 && (
                              <span><i className="fas fa-eye mr-1"></i>{formatNumber(item.views)}</span>
                            )}
                            {item.likes > 0 && (
                              <span><i className="fas fa-heart mr-1"></i>{formatNumber(item.likes)}</span>
                            )}
                            {item.comments_count > 0 && (
                              <span><i className="fas fa-comment mr-1"></i>{formatNumber(item.comments_count)}</span>
                            )}
                            {item.shares > 0 && (
                              <span><i className="fas fa-share mr-1"></i>{formatNumber(item.shares)}</span>
                            )}
                          </div>
                        </div>

                        {/* Score + Status */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {item.optimization_score != null && (
                            <div className={`text-center px-3 py-2 rounded-xl ${
                              item.optimization_score >= 80
                                ? 'bg-green-500/10'
                                : item.optimization_score >= 50
                                ? 'bg-yellow-500/10'
                                : 'bg-red-500/10'
                            }`}>
                              <div className={`text-lg font-black ${
                                item.optimization_score >= 80
                                  ? 'text-green-400'
                                  : item.optimization_score >= 50
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}>
                                {item.optimization_score}
                              </div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score</div>
                            </div>
                          )}

                          {item.status === 'error' ? (
                            <button
                              onClick={(e) => handleRetry(e, item.id)}
                              disabled={retryingIds.has(item.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title={item.error_message || 'Analysis failed'}
                            >
                              {retryingIds.has(item.id) ? (
                                <><i className="fas fa-spinner fa-spin mr-1.5"></i>Retrying...</>
                              ) : (
                                <><i className="fas fa-rotate-right mr-1.5"></i>Retry</>
                              )}
                            </button>
                          ) : (
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                              item.status === 'completed'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {item.status === 'completed' ? (
                                <><i className="fas fa-check mr-1.5"></i>Done</>
                              ) : (
                                <><i className="fas fa-spinner fa-spin mr-1.5"></i>Processing</>
                              )}
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <i className="fas fa-chevron-right text-slate-700 group-hover:text-slate-400 transition-colors"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setHistoryOffset(Math.max(0, historyOffset - historyLimit))}
                    disabled={historyOffset === 0}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-left mr-2"></i>
                    Previous
                  </button>
                  <span className="text-sm text-slate-500 font-bold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setHistoryOffset(historyOffset + historyLimit)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <i className="fas fa-chevron-right ml-2"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
