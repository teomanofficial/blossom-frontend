import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'

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

// === Analysis Steps for Progress Stepper ===

const ANALYSIS_STEPS = [
  { key: 'upload', label: 'Upload Complete', doneDesc: 'Source verified', runningDesc: 'Uploading content...', pendingDesc: 'Waiting...' },
  { key: 'full_analysis', label: 'Full Video Analysis', doneDesc: 'Frame sampling successful', runningDesc: 'Analyzing frames...', pendingDesc: 'Waiting for data...' },
  { key: 'hook_analysis', label: 'Hook Analysis', doneDesc: 'Hook patterns identified', runningDesc: 'Scanning first 3.0s...', pendingDesc: 'Waiting for data...' },
  { key: 'virality_scores', label: 'Virality Scoring', doneDesc: 'Scores calculated', runningDesc: 'Computing virality metrics...', pendingDesc: 'Waiting for data...' },
  { key: 'improvement', label: 'Generating Improvements', doneDesc: 'Blueprint ready', runningDesc: 'Synthesizing blueprint...', pendingDesc: 'Synthesizing blueprint' },
]

export default function ContentAnalysis() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  // History count state
  const [history, setHistory] = useState<any[]>([])

  // Results tab state
  const [activeTab, setActiveTab] = useState('improvements')
  const [tacticSort, setTacticSort] = useState<'score' | 'time'>('score')
  const [tacticFilter, setTacticFilter] = useState<string>('all')
  const [expandedHooks, setExpandedHooks] = useState<Set<number>>(new Set())
  const [exampleVideos, setExampleVideos] = useState<any>(null)
  const [carouselVideos, setCarouselVideos] = useState<CarouselVideo[] | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Video thumbnail for loading screen
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // === Data Fetching ===

  const fetchHistory = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await resp.json()
      if (resp.ok && data.uploads && Array.isArray(data.uploads)) {
        setHistory(data.uploads)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }, [session?.access_token])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Load analysis from ?id= query param (coming from history page)
  const fetchFullResult = useCallback(async (id: number, fromHistory = false) => {
    if (!session?.access_token) return
    if (fromHistory) setLoadingHistory(true)
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await resp.json()
      if (resp.ok && !data.error) {
        setAnalysisResult(data)
        setActiveTab('improvements')
      }
    } catch (err) {
      console.error('Failed to fetch result:', err)
    } finally {
      if (fromHistory) setLoadingHistory(false)
    }
  }, [session?.access_token])

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
          fetchFullResult(id)
          fetchHistory()
        } else if (data.status === 'error') {
          stopPolling()
          setUploadError(data.error || 'Analysis failed')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)
  }, [session?.access_token, stopPolling, fetchFullResult, fetchHistory])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Load analysis from ?id= query param (from history page)
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam && session?.access_token) {
      const id = parseInt(idParam)
      if (!isNaN(id)) {
        setUploadId(id)
        fetchFullResult(id, true)
        // Clean up the URL
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, session?.access_token, fetchFullResult, setSearchParams])

  // Fetch example viral videos once improvement data is available
  useEffect(() => {
    if (!analysisResult?.improvement?.improvement_json || !uploadId || !session?.access_token) return
    setExampleVideos(null)
    fetch(`${API_URL}/api/content-analysis/${uploadId}/examples`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setExampleVideos(data) })
      .catch(() => {})
  }, [analysisResult, uploadId, session?.access_token])

  // === Submit Handler ===

  const handleSubmit = async () => {
    if (mode === 'url' && !url.trim()) return
    if (mode === 'upload' && !file) return

    setUploading(true)
    setUploadError(null)
    setAnalysisResult(null)
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
    setAnalysisResult(null)
    setUploadError(null)
    setUrl('')
    setFile(null)
    setVideoThumbnail(null)
    setActiveTab('improvements')
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

  // === Progress Step Status ===

  const getStepStatus = (stepIndex: number): 'done' | 'running' | 'pending' | 'error' => {
    if (!analysisStatus?.steps) return stepIndex === 0 ? 'done' : 'pending'

    // Backend returns: { status, steps: { upload: 'done', full_analysis: 'running', ... } }
    const stepKey = ANALYSIS_STEPS[stepIndex]?.key
    if (!stepKey) return 'pending'

    const stepState = analysisStatus.steps[stepKey]
    if (stepState === 'done') return 'done'
    if (stepState === 'running') return 'running'
    if (stepState === 'error') return 'error'
    return 'pending'
  }

  // === Render ===

  const isAnalyzing = uploadId !== null && !analysisResult && !loadingHistory && analysisStatus?.status !== 'error'

  return (
    <>
      {/* Page Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
                Content Analysis
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">
              Analyze <span className="gradient-text">Your Content</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Upload a video or paste a URL to get AI-powered analysis and improvement suggestions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(uploadId || analysisResult) && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
              >
                <i className="fas fa-plus mr-2"></i>
                New Analysis
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/analyze/history')}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <i className="fas fa-history mr-2"></i>
              History
              {history.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] font-black rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">

          {/* === RESULTS VIEW === */}
          {analysisResult ? (
            <div>
              {/* Back button */}
              <button
                onClick={handleReset}
                className="mb-6 text-slate-400 hover:text-white text-sm font-bold transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to upload
              </button>

<>
  {(() => {
    const full = analysisResult?.fullAnalysis?.analysis_json;
    const hook = analysisResult?.hookAnalysis?.analysis_json;
    const virality = analysisResult?.viralityAnalysis?.analysis_json;
    const improv = analysisResult?.improvement?.improvement_json;
    const upload = analysisResult?.upload;
    const scoreBreakdown = improv?.score_breakdown;

    const tabs = [
      ...(improv ? [{ id: 'improvements', label: 'Improvements', icon: 'fa-rocket' }] : []),
      { id: 'hook', label: 'Hook', icon: 'fa-magnet' },
      { id: 'structure', label: 'Structure', icon: 'fa-layer-group' },
      { id: 'tactics', label: 'Tactics', icon: 'fa-chess' },
      { id: 'emotions', label: 'Emotions', icon: 'fa-heart' },
      ...(virality ? [{ id: 'virality', label: 'Virality', icon: 'fa-fire' }] : []),
      { id: 'weaknesses', label: 'Weaknesses', icon: 'fa-exclamation-triangle' },
    ];

    const fmtTime = (sec: number | null | undefined) => {
      if (sec == null) return '--';
      const m = Math.floor(sec / 60);
      const s = String(Math.round(sec) % 60).padStart(2, '0');
      return `${m}:${s}`;
    };

    const categoryColors: Record<string, string> = {
      hook_visual: 'bg-pink-500/20 text-pink-400',
      hook_audio: 'bg-purple-500/20 text-purple-400',
      hook_text: 'bg-blue-500/20 text-blue-400',
      hook_structural: 'bg-indigo-500/20 text-indigo-400',
      pacing: 'bg-teal-500/20 text-teal-400',
      emotional: 'bg-rose-500/20 text-rose-400',
      visual_style: 'bg-amber-500/20 text-amber-400',
      audio_design: 'bg-violet-500/20 text-violet-400',
      text_overlay: 'bg-cyan-500/20 text-cyan-400',
      framing_angle: 'bg-emerald-500/20 text-emerald-400',
      content_structure: 'bg-sky-500/20 text-sky-400',
      shareability: 'bg-orange-500/20 text-orange-400',
      engagement_bait: 'bg-yellow-500/20 text-yellow-400',
      trend_leverage: 'bg-lime-500/20 text-lime-400',
      identity_signal: 'bg-fuchsia-500/20 text-fuchsia-400',
    };

    const getCategoryColor = (cat: string) =>
      categoryColors[cat?.toLowerCase()?.replace(/\s+/g, '_')] || 'bg-white/10 text-slate-300';

    const scoreColor = (score: number) =>
      score >= 70 ? 'text-teal-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';

    const scoreBarColor = (score: number) =>
      score >= 70
        ? 'from-teal-500 to-teal-400'
        : score >= 40
        ? 'from-yellow-500 to-yellow-400'
        : 'from-red-500 to-red-400';

    const effortColor = (effort: string) => {
      const e = effort?.toLowerCase();
      if (e === 'low') return 'bg-teal-400/10 text-teal-400';
      if (e === 'medium') return 'bg-yellow-400/10 text-yellow-400';
      return 'bg-red-400/10 text-red-400';
    };

    // Gather all unique categories from full analysis tactics
    const allCategories: string[] = Array.from(
      new Set((full?.tactics || []).map((t: any) => t.category).filter(Boolean)) as Set<string>
    );

    // Sort tactics based on current sort mode
    const sortedTactics = [...(full?.tactics || [])].sort((a: any, b: any) => {
      if (tacticSort === 'score') return (b.execution_score || 0) - (a.execution_score || 0);
      return (a.when_start || 0) - (b.when_start || 0);
    });

    const filteredTactics =
      tacticFilter === 'all'
        ? sortedTactics
        : sortedTactics.filter((t: any) => t.category === tacticFilter);

    // -- Example Video Components --
    const openExampleCarousel = (videos: any[], index: number) => {
      const mapped: CarouselVideo[] = videos.map((v: any) => ({
        id: v.video_id,
        platform: v.platform,
        username: v.username,
        content_url: v.content_url,
        thumbnail_url: v.thumbnail_url,
        local_thumbnail_path: v.local_thumbnail_path || null,
        local_video_path: v.local_video_path || null,
        views: v.views,
        engagement_rate: v.engagement_rate,
      }));
      setCarouselVideos(mapped);
      setCarouselIndex(index);
    };

    const ExampleVideoCard = ({ video, videos, index }: { video: any; videos: any[]; index: number }) => {
      const thumb = video.thumbnail_url;
      return (
        <div
          onClick={() => openExampleCarousel(videos, index)}
          className="group relative w-[120px] flex-shrink-0 block cursor-pointer"
        >
          <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all">
            {thumb ? (
              <img src={thumb} alt={`@${video.username}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center"><i className="fas fa-film text-slate-700 text-lg"></i></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[8px] text-white`}></i>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-black text-white truncate mb-1">@{video.username}</div>
                <div className="flex gap-1">
                  <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-white">
                    <i className="fas fa-eye mr-0.5 text-[6px] text-slate-400"></i>{formatNumber(video.views)}
                  </div>
                  <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-teal-400">
                    {Number(video.engagement_rate).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-5 h-5 rounded-full bg-pink-500/80 backdrop-blur-md flex items-center justify-center">
                <i className="fas fa-play text-[7px] text-white"></i>
              </div>
            </div>
          </div>
          <p className="mt-1.5 px-0.5 text-[9px] text-slate-500 leading-tight line-clamp-2">{video.match_reason}</p>
        </div>
      );
    };

    const ExampleVideoRow = ({ videos, label }: { videos: any[] | undefined; label?: string }) => {
      if (!videos || videos.length === 0) return null;
      // Flatten if nested arrays
      const flat = Array.isArray(videos[0]) ? videos.flat() : videos;
      if (flat.length === 0) return null;
      return (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
            <i className="fas fa-play-circle mr-1.5 text-pink-400/50"></i>{label || 'See it done right'}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {flat.map((v: any, i: number) => <ExampleVideoCard key={v.video_id} video={v} videos={flat} index={i} />)}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* OVERVIEW — always visible as header                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* Video info card */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              {upload?.thumbnail_path && (
                <div className="w-full md:w-48 flex-shrink-0">
                  <div className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={upload.thumbnail_path.startsWith('http') ? upload.thumbnail_path : `/media/${upload.thumbnail_path.split('/').pop()}`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-4">
                {/* Platform + Username */}
                <div className="flex items-center gap-3">
                  {upload?.platform && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-white/10 capitalize flex items-center gap-1.5">
                      <i className={`fab fa-${upload.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[10px]`}></i>
                      {upload.platform}
                    </span>
                  )}
                  {upload?.username && (
                    <span className="text-sm font-bold text-slate-300">@{upload.username}</span>
                  )}
                  {upload?.source_type && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-white/5 text-slate-500 uppercase">
                      {upload.source_type}
                    </span>
                  )}
                </div>

                {/* Caption */}
                {upload?.caption && (
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{upload.caption}</p>
                )}

                {/* One-line verdict */}
                {full?.one_line_verdict && (
                  <div className="pt-2">
                    <p className="text-xl font-black gradient-text leading-snug">{full.one_line_verdict}</p>
                  </div>
                )}

                {/* Format + Hook class badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {full?.format_class && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-500/15 text-pink-400 capitalize">
                      <i className="fas fa-shapes mr-1.5 text-[9px]"></i>
                      {full.format_class}
                    </span>
                  )}
                  {hook?.hook_class && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">
                      <i className="fas fa-magnet mr-1.5 text-[9px]"></i>
                      {hook.hook_class}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Scores */}
          {(improv?.optimization_score != null || virality?.overall_virality_score != null) && (
            <div className={`grid ${improv?.optimization_score != null && virality?.overall_virality_score != null ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {improv?.optimization_score != null && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Optimization Score
                  </div>
                  <div className={`text-6xl font-black ${scoreColor(improv.optimization_score)}`}>
                    {improv.optimization_score}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">out of 100</div>
                </div>
              )}
              {virality?.overall_virality_score != null && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    <i className="fas fa-fire mr-1 text-orange-400"></i>Virality Score
                  </div>
                  <div className={`text-6xl font-black ${scoreColor(virality.overall_virality_score)}`}>
                    {virality.overall_virality_score}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">out of 100</div>
                </div>
              )}
            </div>
          )}

          {/* Score Breakdown Cards */}
          {scoreBreakdown && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Hook Power', value: scoreBreakdown.hook_power, icon: 'fa-bolt' },
                { label: 'Retention', value: scoreBreakdown.retention_strength, icon: 'fa-magnet' },
                { label: 'Emotional Impact', value: scoreBreakdown.emotional_impact, icon: 'fa-heart' },
                { label: 'Shareability', value: scoreBreakdown.shareability, icon: 'fa-share-alt' },
                { label: 'Tactic Execution', value: scoreBreakdown.tactic_execution, icon: 'fa-crosshairs' },
              ].map((card) => (
                <div key={card.label} className="glass-card rounded-2xl p-5 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center mb-3 ${
                    (card.value || 0) >= 70
                      ? 'border-teal-400/50'
                      : (card.value || 0) >= 40
                      ? 'border-yellow-400/50'
                      : 'border-red-400/50'
                  }`}>
                    <span className={`text-2xl font-black ${scoreColor(card.value || 0)}`}>
                      {card.value ?? '--'}
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>
                    {card.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider between Overview header and Analysis tabs ── */}
        <div className="flex items-center gap-4 pt-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Detailed Analysis</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fas ${tab.icon} text-[10px]`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB: IMPROVEMENTS                                       */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'improvements' && improv && (
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-pink-500/40 via-orange-400/40 to-yellow-400/40">
            <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
                    <i className="fas fa-rocket text-white text-sm"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">How to Improve This Content</h2>
                    <p className="text-xs text-slate-500">Actionable suggestions to boost performance</p>
                  </div>
                </div>
                {improv?.optimization_score != null && (
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</div>
                    <div className={`text-3xl font-black ${scoreColor(improv.optimization_score)}`}>{improv.optimization_score}<span className="text-sm text-slate-600">/100</span></div>
                  </div>
                )}
              </div>

              {/* Improvements content */}
              <div className="p-6 space-y-8">
                {/* ── Priority Actions ── */}
                {improv?.priority_actions && improv.priority_actions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-list-ol text-pink-400 text-xs"></i>Priority Actions
                    </h3>
                    <div className="space-y-3">
                      {improv.priority_actions.map((action: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-white">{action.rank ?? idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white mb-2">{action.action}</p>
                            <div className="flex items-center gap-2">
                              {action.effort && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${effortColor(action.effort)}`}>
                                  <i className="fas fa-bolt mr-1 text-[8px]"></i>{action.effort} effort
                                </span>
                              )}
                              {action.expected_impact && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-400">
                                  <i className="fas fa-chart-line mr-1 text-[8px]"></i>{action.expected_impact}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ExampleVideoRow videos={exampleVideos?.priority_actions} label="Top videos using these strategies" />
                  </div>
                )}

                {/* ── Alternative Hooks ── */}
                {improv?.alternative_hooks && improv.alternative_hooks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-magic text-purple-400 text-xs"></i>Alternative Hooks
                    </h3>
                    <div className="space-y-4">
                      {improv.alternative_hooks.map((alt: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                          <button
                            onClick={() => {
                              setExpandedHooks((prev: Set<number>) => {
                                const next = new Set(prev);
                                if (next.has(idx)) next.delete(idx);
                                else next.add(idx);
                                return next;
                              });
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-400 capitalize">
                                {alt.type}
                              </span>
                              {alt.estimated_scroll_stop_improvement && (
                                <span className="text-[10px] font-bold text-teal-400">
                                  <i className="fas fa-arrow-up mr-0.5 text-[8px]"></i>{alt.estimated_scroll_stop_improvement}
                                </span>
                              )}
                            </div>
                            <i className={`fas fa-chevron-${expandedHooks.has(idx) ? 'up' : 'down'} text-slate-500 text-xs`}></i>
                          </button>
                          {expandedHooks.has(idx) && (
                            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                              <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Script</div>
                                <p className="text-sm text-white bg-white/[0.03] rounded-lg p-3 border border-white/5 leading-relaxed">{alt.script}</p>
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Why It's Better</div>
                                <p className="text-sm text-slate-400">{alt.why_better}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <ExampleVideoRow videos={exampleVideos?.alternative_hooks} label="Videos with scroll-stopping hooks" />
                  </div>
                )}

                {/* ── Retention Improvements ── */}
                {improv?.retention_improvements && improv.retention_improvements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-user-clock text-blue-400 text-xs"></i>Retention Improvements
                    </h3>
                    <div className="space-y-4">
                      {improv.retention_improvements.map((ret: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500/15 text-blue-400">
                              <i className="fas fa-clock mr-1 text-[9px]"></i>{fmtTime(ret.timestamp_sec)}
                            </span>
                            {ret.tactic_to_add && (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/10 text-indigo-400">
                                + {ret.tactic_to_add}
                              </span>
                            )}
                          </div>
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-2 h-2 rounded-full bg-red-400"></div>
                              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Current Issue</span>
                            </div>
                            <p className="text-sm text-red-300/80 pl-3.5">{ret.current_issue}</p>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Suggested Change</span>
                            </div>
                            <p className="text-sm text-teal-300/80 pl-3.5">{ret.suggested_change}</p>
                          </div>
                          {ret.expected_impact && (
                            <div className="text-xs text-slate-500 pl-3.5 italic">
                              <i className="fas fa-chart-line mr-1 text-[9px]"></i>{ret.expected_impact}
                            </div>
                          )}
                          <ExampleVideoRow videos={exampleVideos?.retention_improvements?.[idx]} label="See this tactic in action" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Missing High-Impact Tactics ── */}
                {improv?.missing_high_impact_tactics && improv.missing_high_impact_tactics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-puzzle-piece text-amber-400 text-xs"></i>Missing High-Impact Tactics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {improv.missing_high_impact_tactics.map((tactic: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.03] rounded-xl p-5 border border-white/5 border-l-4 border-l-amber-400/50">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-black text-white">{tactic.tactic_name}</span>
                            {tactic.category && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                                {(tactic.category || '').replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {tactic.where_to_insert && (
                            <div className="mb-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Where: </span>
                              <span className="text-xs text-slate-400">{tactic.where_to_insert}</span>
                            </div>
                          )}
                          {tactic.implementation && (
                            <div className="mb-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How: </span>
                              <span className="text-xs text-slate-300">{tactic.implementation}</span>
                            </div>
                          )}
                          {tactic.why_high_impact && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Why High Impact: </span>
                              <span className="text-xs text-slate-400">{tactic.why_high_impact}</span>
                            </div>
                          )}
                          <ExampleVideoRow videos={exampleVideos?.missing_tactics?.[idx]} label="This video nails it" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Before / After Rewrites ── */}
                {improv?.before_after_rewrites && improv.before_after_rewrites.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-exchange-alt text-emerald-400 text-xs"></i>Before / After Rewrites
                    </h3>
                    <div className="space-y-6">
                      {improv.before_after_rewrites.map((rw: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                          {rw.section && (
                            <div className="text-xs font-black text-white uppercase tracking-widest">
                              <i className="fas fa-tag mr-1.5 text-[9px] text-slate-500"></i>{rw.section}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10">
                              <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Before</span>
                              </div>
                              <p className="text-sm text-red-300/70 leading-relaxed">{rw.before}</p>
                            </div>
                            <div className="bg-teal-500/[0.04] rounded-xl p-4 border border-teal-500/10">
                              <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">After</span>
                              </div>
                              <p className="text-sm text-teal-300/70 leading-relaxed">{rw.after}</p>
                            </div>
                          </div>
                          {rw.improvement_rationale && (
                            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Rationale:</span>
                              <span className="text-xs text-slate-400">{rw.improvement_rationale}</span>
                            </div>
                          )}
                          <ExampleVideoRow videos={exampleVideos?.before_after?.[idx]} label="Example of the improved version" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Engagement Amplifiers ── */}
                {improv?.engagement_amplifiers && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-bullhorn text-yellow-400 text-xs"></i>Engagement Amplifiers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-comment mr-1"></i>Comment Bait
                        </div>
                        {improv.engagement_amplifiers.comment_bait_suggestions?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.engagement_amplifiers.comment_bait_suggestions.map((s: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-chevron-right text-yellow-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-bookmark mr-1"></i>Save Triggers
                        </div>
                        {improv.engagement_amplifiers.save_worthy_moments?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.engagement_amplifiers.save_worthy_moments.map((s: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-chevron-right text-blue-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-share-alt mr-1"></i>Share Triggers
                        </div>
                        {improv.engagement_amplifiers.share_triggers?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.engagement_amplifiers.share_triggers.map((s: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-chevron-right text-orange-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                    </div>
                    {improv.engagement_amplifiers.duet_stitch_potential && (
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-2">
                          <i className="fas fa-layer-group mr-1"></i>Duet / Stitch Potential
                        </div>
                        <p className="text-sm text-slate-300">{improv.engagement_amplifiers.duet_stitch_potential}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Trend Alignment ── */}
                {improv?.trend_alignment && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-fire text-lime-400 text-xs"></i>Trend Alignment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-lime-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-trending-up mr-1"></i>Trends to Leverage
                        </div>
                        {improv.trend_alignment.current_trends_to_leverage?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.trend_alignment.current_trends_to_leverage.map((t: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-fire text-lime-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {t}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-random mr-1"></i>Format Remixes
                        </div>
                        {improv.trend_alignment.format_remix_suggestions?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.trend_alignment.format_remix_suggestions.map((f: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-shapes text-cyan-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {f}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">
                          <i className="fas fa-music mr-1"></i>Audio Suggestions
                        </div>
                        {improv.trend_alignment.audio_suggestions?.length > 0 ? (
                          <ul className="space-y-2">
                            {improv.trend_alignment.audio_suggestions.map((a: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className="fas fa-volume-up text-violet-400/50 text-[7px] mt-1 flex-shrink-0"></i>
                                {a}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">No suggestions</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Virality Optimization ── */}
                {improv?.virality_optimization && (
                  <div>
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-fire text-orange-400 text-xs"></i>Virality Optimization
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'SEO Improvements', items: improv.virality_optimization.seo_improvements, icon: 'fa-search', color: 'teal' },
                        { label: 'Shareability Boosters', items: improv.virality_optimization.shareability_boosters, icon: 'fa-share-alt', color: 'orange' },
                        { label: 'Save Triggers to Add', items: improv.virality_optimization.save_triggers_to_add, icon: 'fa-bookmark', color: 'blue' },
                        { label: 'Authenticity Adjustments', items: improv.virality_optimization.authenticity_adjustments, icon: 'fa-fingerprint', color: 'emerald' },
                        { label: 'Platform-Specific Fixes', items: improv.virality_optimization.platform_specific_fixes, icon: 'fa-mobile-alt', color: 'purple' },
                      ].filter(section => section.items && section.items.length > 0).map((section) => (
                        <div key={section.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                          <div className={`text-[10px] font-black text-${section.color}-400 uppercase tracking-widest mb-3`}>
                            <i className={`fas ${section.icon} mr-1`}></i>{section.label}
                          </div>
                          <ul className="space-y-2">
                            {section.items.map((item: string, idx: number) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <i className={`fas fa-check text-${section.color}-400/50 text-[7px] mt-1 flex-shrink-0`}></i>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB: HOOK ANALYSIS                                      */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'hook' && (
          <div className="space-y-6">
            {/* Scroll-stop power score */}
            {hook?.first_frame && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Scroll-Stop Power
                </div>
                <div className={`text-7xl font-black ${scoreColor(hook.first_frame.scroll_stop_power || 0)}`}>
                  {hook.first_frame.scroll_stop_power ?? '--'}
                </div>
                <div className="text-xs text-slate-500 mt-2">out of 100</div>
              </div>
            )}

            {/* Hook class + verdict */}
            <div className="glass-card rounded-2xl p-6 space-y-3">
              {hook?.hook_class && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">
                    {hook.hook_class}
                  </span>
                </div>
              )}
              {hook?.verdict && (
                <p className="text-base font-bold text-white leading-relaxed">{hook.verdict}</p>
              )}
            </div>

            {/* First Frame Analysis */}
            {hook?.first_frame && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-image mr-2 text-pink-400 text-sm"></i>First Frame
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</div>
                    <p className="text-sm text-slate-300">{hook.first_frame.description}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Why It Stops The Scroll</div>
                    <p className="text-sm text-slate-400">{hook.first_frame.why}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hook Tactics */}
            {hook?.tactics && hook.tactics.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-chess mr-2 text-indigo-400 text-sm"></i>Hook Tactics
                </h3>
                <div className="space-y-4">
                  {hook.tactics.map((tactic: any, idx: number) => (
                    <div key={idx} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{tactic.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                            {tactic.category}
                          </span>
                        </div>
                        <span className={`text-sm font-black ${scoreColor(tactic.execution_score || 0)}`}>
                          {tactic.execution_score}
                        </span>
                      </div>
                      {/* Score bar */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(tactic.execution_score || 0)}`}
                          style={{ width: `${Math.min(100, tactic.execution_score || 0)}%` }}
                        ></div>
                      </div>
                      {tactic.when_sec != null && (
                        <div className="text-[10px] font-bold text-slate-500 mb-1">
                          <i className="fas fa-clock mr-1"></i>{fmtTime(tactic.when_sec)}
                        </div>
                      )}
                      <p className="text-sm text-slate-300 mb-1">{tactic.what}</p>
                      {tactic.viewer_effect && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 mt-1">
                          {tactic.viewer_effect}
                        </span>
                      )}
                      {tactic.execution_note && (
                        <p className="text-xs text-slate-500 mt-1 italic">{tactic.execution_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promise Setup */}
            {hook?.promise_setup && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-bullseye mr-2 text-orange-400 text-sm"></i>Promise Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Planted</div>
                    <div className="flex items-center gap-2">
                      {hook.promise_setup.promise_planted ? (
                        <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes</span>
                      ) : (
                        <span className="text-red-400 font-black text-sm"><i className="fas fa-times-circle mr-1"></i>No</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Single Promise</div>
                    <div className="flex items-center gap-2">
                      {hook.promise_setup.is_single_promise ? (
                        <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes</span>
                      ) : (
                        <span className="text-yellow-400 font-black text-sm"><i className="fas fa-exclamation-circle mr-1"></i>No</span>
                      )}
                    </div>
                  </div>
                  {hook.promise_setup.promise_text && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Text</div>
                      <p className="text-sm text-slate-300">{hook.promise_setup.promise_text}</p>
                    </div>
                  )}
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Curiosity Loop</div>
                    {hook.promise_setup.curiosity_loop_opened ? (
                      <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Opened</span>
                    ) : (
                      <span className="text-slate-500 font-black text-sm"><i className="fas fa-minus-circle mr-1"></i>Not opened</span>
                    )}
                  </div>
                  {hook.promise_setup.loop_description && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Loop Description</div>
                      <p className="text-sm text-slate-400">{hook.promise_setup.loop_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio in First 3s */}
            {hook?.audio_in_first_3s && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-volume-up mr-2 text-violet-400 text-sm"></i>Audio (First 3 Seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Type</div>
                    <p className="text-sm font-bold text-white capitalize">{hook.audio_in_first_3s.type}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-sm text-slate-300">{hook.audio_in_first_3s.description}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Impact</div>
                    <p className="text-sm text-slate-400">{hook.audio_in_first_3s.impact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Patterns */}
            {hook?.anti_patterns_detected && hook.anti_patterns_detected.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-shield-alt mr-2 text-red-400 text-sm"></i>Anti-Patterns Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hook.anti_patterns_detected.map((pattern: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20">
                      <i className="fas fa-exclamation-triangle mr-1.5 text-[9px]"></i>
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB 3: STRUCTURE & FORMAT                               */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            {/* Format Class */}
            {full?.format_class && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  <i className="fas fa-shapes mr-2 text-pink-400 text-sm"></i>Format Class
                </h3>
                <span className="px-4 py-1.5 rounded-full text-sm font-black bg-pink-500/15 text-pink-400 capitalize inline-block">
                  {full.format_class}
                </span>
              </div>
            )}

            {/* Timeline Visualization */}
            {full?.structural_breakdown && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-stream mr-2 text-indigo-400 text-sm"></i>Timeline Breakdown
                </h3>
                {(() => {
                  const sb = full.structural_breakdown;
                  const totalDur = sb.total_seconds || 1;
                  const hookPct = ((sb.hook_seconds || 0) / totalDur) * 100;
                  const setupPct = ((sb.setup_seconds || 0) / totalDur) * 100;
                  const payoffPct = ((sb.payoff_seconds || 0) / totalDur) * 100;

                  return (
                    <div className="space-y-4">
                      {/* Bar */}
                      <div className="w-full h-10 rounded-xl overflow-hidden flex">
                        {hookPct > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center relative group"
                            style={{ width: `${Math.max(hookPct, 5)}%` }}
                          >
                            <span className="text-[9px] font-black text-white/90 uppercase">Hook</span>
                          </div>
                        )}
                        {setupPct > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-center relative group"
                            style={{ width: `${Math.max(setupPct, 5)}%` }}
                          >
                            <span className="text-[9px] font-black text-white/90 uppercase">Setup</span>
                          </div>
                        )}
                        {payoffPct > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 flex items-center justify-center relative group"
                            style={{ width: `${Math.max(payoffPct, 5)}%` }}
                          >
                            <span className="text-[9px] font-black text-white/90 uppercase">Payoff</span>
                          </div>
                        )}
                      </div>

                      {/* Duration Labels */}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-500 to-orange-400"></div>
                          <span className="text-xs font-bold text-slate-400">Hook: {sb.hook_seconds ?? 0}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-indigo-500"></div>
                          <span className="text-xs font-bold text-slate-400">Setup: {sb.setup_seconds ?? 0}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-teal-500 to-emerald-400"></div>
                          <span className="text-xs font-bold text-slate-400">Payoff: {sb.payoff_seconds ?? 0}s</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 ml-auto">Total: {sb.total_seconds ?? 0}s</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Stats Grid */}
            {full?.structural_breakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pacing Style', value: full.structural_breakdown.pacing_style, icon: 'fa-tachometer-alt' },
                  { label: 'Avg Shot Length', value: full.structural_breakdown.avg_shot_length_sec != null ? `${full.structural_breakdown.avg_shot_length_sec}s` : '--', icon: 'fa-camera' },
                  { label: 'Movement Frequency', value: full.structural_breakdown.movement_frequency, icon: 'fa-running' },
                  { label: 'Open Loop', value: full.structural_breakdown.has_open_loop ? 'Yes' : 'No', icon: 'fa-redo' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card rounded-2xl p-5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      <i className={`fas ${stat.icon} mr-1`}></i>{stat.label}
                    </div>
                    <div className="text-sm font-black text-white capitalize">{stat.value || '--'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Loop Description */}
            {full?.structural_breakdown?.loop_description && (
              <div className="glass-card rounded-2xl p-6">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <i className="fas fa-redo mr-1"></i>Loop Description
                </div>
                <p className="text-sm text-slate-300">{full.structural_breakdown.loop_description}</p>
              </div>
            )}

            {/* Promise Analysis */}
            {full?.promise && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-bullseye mr-2 text-orange-400 text-sm"></i>Promise Analysis
                </h3>
                <div className="space-y-4">
                  {full.promise.statement && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise Statement</div>
                      <p className="text-sm text-white font-semibold">{full.promise.statement}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Clarity</div>
                      <div className={`text-2xl font-black ${scoreColor(((full.promise.clarity || 0) / 10) * 100)}`}>
                        {full.promise.clarity ?? '--'}<span className="text-sm text-slate-500">/10</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Single Promise</div>
                      {full.promise.is_single_promise ? (
                        <div className="text-teal-400 font-black"><i className="fas fa-check-circle text-xl"></i></div>
                      ) : (
                        <div className="text-yellow-400 font-black"><i className="fas fa-exclamation-circle text-xl"></i></div>
                      )}
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payoff Delivered</div>
                      {full.promise.payoff_delivered ? (
                        <div className="text-teal-400 font-black"><i className="fas fa-check-circle text-xl"></i></div>
                      ) : (
                        <div className="text-red-400 font-black"><i className="fas fa-times-circle text-xl"></i></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shareability */}
            {full?.shareability && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-share-alt mr-2 text-orange-400 text-sm"></i>Shareability
                </h3>
                <div className="space-y-4">
                  {full.shareability.would_share_because && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Would Share Because</div>
                      <p className="text-sm text-slate-300">{full.shareability.would_share_because}</p>
                    </div>
                  )}
                  {full.shareability.identity_signal && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Identity Signal</div>
                      <p className="text-sm text-slate-300">{full.shareability.identity_signal}</p>
                    </div>
                  )}
                  {full.shareability.share_trigger && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Share Trigger</div>
                      <p className="text-sm text-white font-semibold">{full.shareability.share_trigger}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB 4: TACTICS                                          */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'tactics' && (
          <div className="space-y-6">
            {/* Sort & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sort</span>
                <button
                  onClick={() => setTacticSort('score')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    tacticSort === 'score' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <i className="fas fa-sort-amount-down mr-1 text-[9px]"></i>Score
                </button>
                <button
                  onClick={() => setTacticSort('time')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    tacticSort === 'time' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <i className="fas fa-clock mr-1 text-[9px]"></i>Timestamp
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Filter</span>
                <button
                  onClick={() => setTacticFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    tacticFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  All
                </button>
                {allCategories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setTacticFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors capitalize ${
                      tacticFilter === cat
                        ? `${getCategoryColor(cat)}`
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactic Count */}
            <div className="text-xs font-bold text-slate-500">
              Showing {filteredTactics.length} tactic{filteredTactics.length !== 1 ? 's' : ''}
            </div>

            {/* Tactic Cards */}
            <div className="space-y-4">
              {filteredTactics.map((tactic: any, idx: number) => (
                <div key={idx} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{tactic.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${getCategoryColor(tactic.category)}`}>
                        {(tactic.category || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`text-lg font-black ${scoreColor(tactic.execution_score || 0)} flex-shrink-0 ml-3`}>
                      {tactic.execution_score ?? '--'}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(tactic.execution_score || 0)} transition-all`}
                      style={{ width: `${Math.min(100, tactic.execution_score || 0)}%` }}
                    ></div>
                  </div>

                  {/* Timestamp */}
                  {(tactic.when_start != null || tactic.when_end != null) && (
                    <div className="text-[10px] font-bold text-slate-500 mb-2">
                      <i className="fas fa-clock mr-1"></i>
                      {fmtTime(tactic.when_start)}
                      {tactic.when_end != null && ` - ${fmtTime(tactic.when_end)}`}
                    </div>
                  )}

                  {/* What */}
                  <p className="text-sm text-white mb-2">{tactic.what}</p>

                  {/* Why it works */}
                  {tactic.why_it_works && (
                    <p className="text-xs text-slate-400 mb-2">
                      <i className="fas fa-brain mr-1 text-[9px] text-slate-500"></i>
                      {tactic.why_it_works}
                    </p>
                  )}

                  {/* Viewer effect */}
                  {tactic.viewer_effect && (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 mr-2">
                      <i className="fas fa-eye mr-1 text-[8px]"></i>{tactic.viewer_effect}
                    </span>
                  )}

                  {/* Execution note */}
                  {tactic.execution_note && (
                    <p className="text-[11px] text-slate-500 mt-2 italic">{tactic.execution_note}</p>
                  )}
                </div>
              ))}

              {filteredTactics.length === 0 && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <p className="text-sm text-slate-500">No tactics found for this filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB 5: EMOTIONS                                         */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'emotions' && (
          <div className="space-y-6">
            {/* Primary Emotion */}
            {full?.emotional_architecture?.primary_emotion && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Primary Emotion</div>
                <div className="text-4xl font-black gradient-text capitalize">{full.emotional_architecture.primary_emotion}</div>
              </div>
            )}

            {/* Emotion Shifts */}
            {full?.emotional_architecture?.emotion_shifts && full.emotional_architecture.emotion_shifts.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-exchange-alt mr-2 text-rose-400 text-sm"></i>Emotion Shifts
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {full.emotional_architecture.emotion_shifts.map((shift: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 capitalize">
                        {shift}
                      </span>
                      {idx < full.emotional_architecture.emotion_shifts.length - 1 && (
                        <i className="fas fa-arrow-right text-slate-600 text-[10px]"></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {full?.emotional_architecture?.arousal_curve && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <i className="fas fa-chart-line mr-1"></i>Arousal Curve
                  </div>
                  <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.arousal_curve}</p>
                </div>
              )}
              {full?.emotional_architecture?.specificity_level && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <i className="fas fa-microscope mr-1"></i>Specificity Level
                  </div>
                  <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.specificity_level}</p>
                </div>
              )}
              {full?.emotional_architecture?.opinion_strength && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <i className="fas fa-fist-raised mr-1"></i>Opinion Strength
                  </div>
                  <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.opinion_strength}</p>
                </div>
              )}
              {full?.emotional_architecture?.relatability_moment && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <i className="fas fa-users mr-1"></i>Relatability Moment
                  </div>
                  <p className="text-sm text-slate-300">{full.emotional_architecture.relatability_moment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB: VIRALITY SCORING                                    */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'virality' && virality && (
          <div className="space-y-6">
            {/* Overall Virality Score */}
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <i className="fas fa-fire mr-1 text-orange-400"></i>Overall Virality Score
              </div>
              <div className={`text-7xl font-black ${scoreColor(virality.overall_virality_score || 0)}`}>
                {virality.overall_virality_score ?? '--'}
              </div>
              <div className="text-xs text-slate-500 mt-2">out of 100</div>
            </div>

            {/* Universal Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Shareability', value: virality.shareability?.score, icon: 'fa-share-alt', color: 'orange' },
                { label: 'Save Value', value: virality.save_value?.score, icon: 'fa-bookmark', color: 'blue' },
                { label: 'Rewatch', value: virality.rewatch?.score, icon: 'fa-redo', color: 'purple' },
                { label: 'Authenticity', value: virality.authenticity?.score, icon: 'fa-fingerprint', color: 'teal' },
                { label: 'Emotional ROI', value: virality.emotional_roi?.score, icon: 'fa-heart', color: 'pink' },
              ].map((card) => (
                <div key={card.label} className="glass-card rounded-2xl p-5 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center mb-3 ${
                    (card.value || 0) >= 70 ? 'border-teal-400/50' : (card.value || 0) >= 40 ? 'border-yellow-400/50' : 'border-red-400/50'
                  }`}>
                    <span className={`text-2xl font-black ${scoreColor(card.value || 0)}`}>
                      {card.value ?? '--'}
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>
                    {card.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Shareability Details */}
            {virality.shareability && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-share-alt mr-2 text-orange-400 text-sm"></i>Shareability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {virality.shareability.social_currency_type && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Social Currency</div>
                      <p className="text-sm text-slate-300">{virality.shareability.social_currency_type}</p>
                    </div>
                  )}
                  {virality.shareability.share_motivation && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Share Motivation</div>
                      <p className="text-sm text-slate-300">{virality.shareability.share_motivation}</p>
                    </div>
                  )}
                  {virality.shareability.share_friction && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                      <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Share Friction</div>
                      <p className="text-sm text-red-300/70">{virality.shareability.share_friction}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rewatch Analysis */}
            {virality.rewatch && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-redo mr-2 text-purple-400 text-sm"></i>Rewatch Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Loop Detected</div>
                    {virality.rewatch.loop_detected ? (
                      <span className="text-teal-400 font-black text-sm"><i className="fas fa-check-circle mr-1"></i>Yes — {virality.rewatch.loop_type}</span>
                    ) : (
                      <span className="text-slate-500 font-black text-sm"><i className="fas fa-minus-circle mr-1"></i>No loop</span>
                    )}
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Info Density</div>
                    <span className={`font-black text-sm capitalize ${
                      virality.rewatch.information_density === 'overwhelming' || virality.rewatch.information_density === 'high'
                        ? 'text-teal-400' : virality.rewatch.information_density === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{virality.rewatch.information_density}</span>
                  </div>
                  {virality.rewatch.hidden_details && virality.rewatch.hidden_details.length > 0 && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hidden Details</div>
                      <ul className="space-y-1">
                        {virality.rewatch.hidden_details.map((d: string, i: number) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                            <i className="fas fa-eye text-[8px] text-purple-400 mt-1 flex-shrink-0"></i>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authenticity */}
            {virality.authenticity && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-fingerprint mr-2 text-teal-400 text-sm"></i>Authenticity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Production Level</div>
                    <span className="text-sm font-black text-white capitalize">{virality.authenticity.production_level?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Detection Risk</div>
                    <span className={`font-black text-sm capitalize ${
                      virality.authenticity.ai_detection_risk === 'none' || virality.authenticity.ai_detection_risk === 'low'
                        ? 'text-teal-400' : virality.authenticity.ai_detection_risk === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{virality.authenticity.ai_detection_risk}</span>
                  </div>
                  {virality.authenticity.signals && virality.authenticity.signals.length > 0 && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 md:col-span-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Signals</div>
                      <div className="flex flex-wrap gap-2">
                        {virality.authenticity.signals.map((s: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Value */}
            {virality.save_value && virality.save_value.save_triggers && virality.save_value.save_triggers.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-bookmark mr-2 text-blue-400 text-sm"></i>Save Value
                  {virality.save_value.save_category && virality.save_value.save_category !== 'none' && (
                    <span className="ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 capitalize">
                      {virality.save_value.save_category}
                    </span>
                  )}
                </h3>
                <ul className="space-y-2">
                  {virality.save_value.save_triggers.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <i className="fas fa-bookmark text-[9px] text-blue-400 mt-1.5 flex-shrink-0"></i>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Emotional ROI */}
            {virality.emotional_roi && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-heart mr-2 text-pink-400 text-sm"></i>Emotional ROI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {virality.emotional_roi.promise_quality && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Promise</div>
                      <p className="text-sm text-slate-300">{virality.emotional_roi.promise_quality}</p>
                    </div>
                  )}
                  {virality.emotional_roi.payoff_quality && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payoff Quality</div>
                      <span className={`font-black text-sm capitalize ${
                        virality.emotional_roi.payoff_quality === 'exceeded' || virality.emotional_roi.payoff_quality === 'satisfying'
                          ? 'text-teal-400' : virality.emotional_roi.payoff_quality === 'adequate' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{virality.emotional_roi.payoff_quality}</span>
                    </div>
                  )}
                  {virality.emotional_roi.curiosity_resolution && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Curiosity Resolution</div>
                      <p className="text-sm text-slate-400">{virality.emotional_roi.curiosity_resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Retention Danger Zones */}
            {virality.retention_danger_zones && virality.retention_danger_zones.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fas fa-exclamation-triangle mr-2 text-yellow-400 text-sm"></i>Retention Danger Zones
                </h3>
                <div className="space-y-3">
                  {virality.retention_danger_zones.map((zone: any, idx: number) => (
                    <div key={idx} className={`rounded-xl p-4 border ${
                      zone.risk_level === 'high' ? 'bg-red-500/[0.04] border-red-500/10'
                        : zone.risk_level === 'medium' ? 'bg-yellow-500/[0.04] border-yellow-500/10'
                        : 'bg-white/[0.02] border-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-white">
                            <i className="fas fa-clock mr-1 text-xs text-slate-500"></i>
                            {fmtTime(zone.timestamp_sec)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            zone.risk_level === 'high' ? 'bg-red-500/20 text-red-400'
                              : zone.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/10 text-slate-400'
                          }`}>{zone.risk_level} risk</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{zone.reason}</p>
                      {zone.fix_suggestion && (
                        <div className="flex items-start gap-1.5 text-xs text-teal-400">
                          <i className="fas fa-lightbulb text-[9px] mt-0.5"></i>
                          <span>{zone.fix_suggestion}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform-Specific: TikTok */}
            {upload?.platform === 'tiktok' && virality.tiktok_specific && virality.tiktok_specific.seo_score != null && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fab fa-tiktok mr-2 text-sm"></i>TikTok-Specific Scores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'SEO Score', value: virality.tiktok_specific.seo_score, icon: 'fa-search' },
                    { label: 'Golden 2s Alignment', value: virality.tiktok_specific.golden_2s_alignment, icon: 'fa-bullseye' },
                  ].filter(c => c.value != null).map((card) => (
                    <div key={card.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className={`text-3xl font-black mb-1 ${scoreColor(card.value || 0)}`}>{card.value}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>{card.label}
                      </div>
                    </div>
                  ))}
                  {virality.tiktok_specific.audio_niche_fit && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className="text-lg font-black text-white mb-1 capitalize">{virality.tiktok_specific.audio_niche_fit.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <i className="fas fa-music mr-1 text-[8px]"></i>Audio Niche Fit
                      </div>
                    </div>
                  )}
                </div>

                {/* SEO Details */}
                <div className="space-y-3">
                  {virality.tiktok_specific.searchable_phrases && virality.tiktok_specific.searchable_phrases.length > 0 && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Searchable Phrases</div>
                      <div className="flex flex-wrap gap-2">
                        {virality.tiktok_specific.searchable_phrases.map((p: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400">"{p}"</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {virality.tiktok_specific.caption_seo_keywords && virality.tiktok_specific.caption_seo_keywords.length > 0 && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Caption SEO Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {virality.tiktok_specific.caption_seo_keywords.map((k: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {virality.tiktok_specific.golden_2s_mismatch && (
                    <div className="bg-yellow-500/[0.04] rounded-xl p-4 border border-yellow-500/10">
                      <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-2">Golden 2s Mismatch</div>
                      <p className="text-sm text-yellow-300/70">{virality.tiktok_specific.golden_2s_mismatch}</p>
                    </div>
                  )}
                  {virality.tiktok_specific.audio_niche_reasoning && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audio Niche Analysis</div>
                      <p className="text-sm text-slate-400">{virality.tiktok_specific.audio_niche_reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Platform-Specific: Instagram */}
            {upload?.platform === 'instagram' && virality.instagram_specific && virality.instagram_specific.dm_shareability_score != null && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  <i className="fab fa-instagram mr-2 text-sm"></i>Instagram-Specific Scores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'DM Shareability', value: virality.instagram_specific.dm_shareability_score, icon: 'fa-paper-plane' },
                    { label: 'Platform Native', value: virality.instagram_specific.platform_native_score, icon: 'fa-check-circle' },
                    { label: 'Topic Clarity', value: virality.instagram_specific.topic_category_clarity, icon: 'fa-tag' },
                    { label: 'Visual Fidelity', value: virality.instagram_specific.visual_fidelity_score, icon: 'fa-camera' },
                  ].filter(c => c.value != null).map((card) => (
                    <div key={card.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
                      <div className={`text-3xl font-black mb-1 ${scoreColor(card.value || 0)}`}>{card.value}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <i className={`fas ${card.icon} mr-1 text-[8px]`}></i>{card.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instagram Details */}
                <div className="space-y-3">
                  {virality.instagram_specific.conversation_starter && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Conversation Starter</div>
                      <p className="text-sm text-slate-300">{virality.instagram_specific.conversation_starter}</p>
                      {virality.instagram_specific.dm_reaction_type && virality.instagram_specific.dm_reaction_type !== 'none' && (
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-400 capitalize">
                          {virality.instagram_specific.dm_reaction_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  )}
                  {virality.instagram_specific.topic_category && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Algorithm Topic Category</div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 capitalize">{virality.instagram_specific.topic_category}</span>
                    </div>
                  )}
                  {virality.instagram_specific.platform_native_issues && virality.instagram_specific.platform_native_issues.length > 0 && (
                    <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10">
                      <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Platform Native Issues</div>
                      <ul className="space-y-1">
                        {virality.instagram_specific.platform_native_issues.map((issue: string, i: number) => (
                          <li key={i} className="text-sm text-red-300/70 flex items-start gap-1.5">
                            <i className="fas fa-exclamation-circle text-[9px] text-red-400 mt-1 flex-shrink-0"></i>{issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {virality.instagram_specific.visual_fidelity_notes && (
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Visual Fidelity Notes</div>
                      <p className="text-sm text-slate-400">{virality.instagram_specific.visual_fidelity_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* TAB 7: WEAKNESSES                                       */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'weaknesses' && (
          <div className="space-y-4">
            {full?.weaknesses && full.weaknesses.length > 0 ? (
              full.weaknesses.map((w: any, idx: number) => (
                <div key={idx} className="glass-card rounded-2xl p-6">
                  {/* Weakness heading */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-exclamation text-red-400 text-xs"></i>
                    </div>
                    <h3 className="text-base font-black text-white">{w.what}</h3>
                  </div>

                  {/* Impact */}
                  {w.impact && (
                    <div className="bg-red-500/[0.04] rounded-xl p-4 border border-red-500/10 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Impact</span>
                      </div>
                      <p className="text-sm text-red-300/70 pl-3.5">{w.impact}</p>
                    </div>
                  )}

                  {/* Fix */}
                  {w.fix && (
                    <div className="bg-teal-500/[0.04] rounded-xl p-4 border border-teal-500/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Suggested Fix</span>
                      </div>
                      <p className="text-sm text-teal-300/70 pl-3.5">{w.fix}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-teal-400/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-teal-400 text-xl"></i>
                </div>
                <h3 className="font-black text-lg mb-2">No Major Weaknesses</h3>
                <p className="text-sm text-slate-500">Great job! No significant weaknesses were found in this content.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  })()}
</>
{/* === RESULTS DISPLAY END === */}
            </div>

          ) : loadingHistory ? (
            /* === SKELETON LOADING — matches result page layout === */
            <div>
              <div className="mb-6 h-4 w-32 bg-white/5 rounded animate-pulse"></div>
              <div className="space-y-6">
                {/* Skeleton: Video info card */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 flex-shrink-0">
                      <div className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse"></div>
                        <div className="h-5 w-28 bg-white/5 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                      </div>
                      <div className="pt-2">
                        <div className="h-6 w-2/3 bg-white/5 rounded animate-pulse"></div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <div className="h-7 w-28 bg-white/5 rounded-full animate-pulse"></div>
                        <div className="h-7 w-24 bg-white/5 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skeleton: Score cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
                    <div className="h-3 w-28 mx-auto bg-white/5 rounded animate-pulse"></div>
                    <div className="h-14 w-20 mx-auto bg-white/5 rounded animate-pulse"></div>
                    <div className="h-3 w-16 mx-auto bg-white/5 rounded animate-pulse"></div>
                  </div>
                  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
                    <div className="h-3 w-28 mx-auto bg-white/5 rounded animate-pulse"></div>
                    <div className="h-14 w-20 mx-auto bg-white/5 rounded animate-pulse"></div>
                    <div className="h-3 w-16 mx-auto bg-white/5 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Skeleton: Score breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 text-center space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/5 animate-pulse"></div>
                      <div className="h-3 w-16 mx-auto bg-white/5 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Skeleton: Divider */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <div className="h-3 w-28 bg-white/5 rounded animate-pulse"></div>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                {/* Skeleton: Tab bar */}
                <div className="flex flex-wrap gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-9 rounded-xl bg-white/5 animate-pulse" style={{ width: `${70 + i * 10}px` }}></div>
                  ))}
                </div>

                {/* Skeleton: Tab content (improvements card) */}
                <div className="rounded-2xl border border-white/[0.06] p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-48 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-3 w-64 bg-white/5 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="glass-card rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded bg-white/5 animate-pulse"></div>
                          <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : isAnalyzing ? (
            /* === PROGRESS STEPPER — Content Deconstruction === */
            <div className="relative">
              {/* Ambient glow spheres */}
              <div className="absolute -top-10 -left-10 w-[300px] h-[300px] rounded-full bg-purple-700/10 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

              <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-stretch relative z-10">
                {/* LEFT: Phone Scanner */}
                <div className="flex justify-center">
                  <div className="analysis-phone-frame w-full max-w-[280px] rounded-[32px] relative overflow-hidden flex items-center justify-center">
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
                            <p
                              className={`text-[9px] font-mono uppercase tracking-widest mt-0.5 transition-all ${
                                status === 'done'
                                  ? 'text-emerald-500/50'
                                  : status === 'running'
                                  ? 'text-pink-500 animate-pulse'
                                  : status === 'error'
                                  ? 'text-red-400/60'
                                  : 'text-slate-600'
                              }`}
                            >
                              {status === 'done' ? step.doneDesc
                                : status === 'running' ? step.runningDesc
                                : status === 'error' ? (analysisStatus?.error || 'Error occurred')
                                : step.pendingDesc}
                            </p>
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
                          Retry Analysis
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

              {/* Bottom branding */}
              <div className="flex justify-center mt-6 opacity-20">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-6 bg-white/50" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Blossom AI &bull; 2026 Build</span>
                  <div className="h-[1px] w-6 bg-white/50" />
                </div>
              </div>
            </div>

          ) : (
            /* === UPLOAD FORM === */
            <div className="glass-card rounded-2xl p-8">
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
          )}
        </div>

      </div>

      {carouselVideos && (
        <VideoStoryCarousel
          videos={carouselVideos}
          initialIndex={carouselIndex}
          onClose={() => setCarouselVideos(null)}
        />
      )}
    </>
  )
}
