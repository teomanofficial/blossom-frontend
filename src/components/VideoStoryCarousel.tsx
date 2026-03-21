import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import { useAuth } from '../context/AuthContext'

function formatCount(n: number | null | undefined): string {
  if (n == null) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function timeAgo(date: string | null | undefined): string | null {
  if (!date) return null
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export interface CarouselVideo {
  id: number
  platform: string
  username: string
  content_type?: string
  content_url?: string | null
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  local_video_path?: string | null
  caption?: string | null
  views: number
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  engagement_rate?: number | null
  published_at?: string | null
  updated_at?: string | null
  status?: string
  error_message?: string | null
  format_class_name?: string | null
  hook_class_name?: string | null
  final_viral_probability?: number | null
  duration_sec?: number | null
  top_tactic_names?: string[] | null
  raw_data?: any
  local_carousel_media?: any
}

interface VideoStoryCarouselProps {
  videos: CarouselVideo[]
  initialIndex?: number
  onClose: () => void
  renderMeta?: (video: CarouselVideo, index: number) => ReactNode
  isAdmin?: boolean
}

function getThumbnailSrc(video: CarouselVideo): string | null {
  return getStorageUrl(video.local_thumbnail_path)
}

function getVideoUrl(video: CarouselVideo): string | null {
  return getStorageUrl(video.local_video_path)
}

interface CarouselMediaItem {
  mediaType: 'image' | 'video'
  imageUrl: string | null
  videoUrl: string | null
}

function extractCarouselItems(rawData: any, localCarouselMedia: any): CarouselMediaItem[] {
  // Build a map of locally-downloaded carousel media (keyed by index)
  const localMap = new Map<number, { localImagePath?: string | null; localVideoPath?: string | null }>()
  if (Array.isArray(localCarouselMedia)) {
    for (const lm of localCarouselMedia) {
      localMap.set(lm.index, lm)
    }
  }

  if (!rawData) return []
  const rd = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
  const items = rd.carousel_media || []
  if (!Array.isArray(items)) return []
  return items.map((item: any, i: number) => {
    const local = localMap.get(i)
    const localImage = getStorageUrl(local?.localImagePath || null)
    const localVideo = getStorageUrl(local?.localVideoPath || null)
    const cdnImage = item.image_versions2?.candidates?.[0]?.url || item.thumbnail_url || null
    const cdnVideo = item.media_type === 2 ? (item.video_url || item.video_versions?.[0]?.url || null) : null

    return {
      mediaType: item.media_type === 2 ? 'video' as const : 'image' as const,
      imageUrl: localImage || cdnImage,
      videoUrl: localVideo || cdnVideo,
    }
  })
}

function CarouselItemsViewer({ items, fallbackThumb }: { items: CarouselMediaItem[], fallbackThumb: string | null }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const current = items[slideIndex]

  if (items.length === 0) {
    return fallbackThumb ? (
      <img src={fallbackThumb} alt="" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <i className="fas fa-images text-slate-700 text-3xl"></i>
      </div>
    )
  }

  return (
    <>
      {current?.mediaType === 'video' && current.videoUrl ? (
        <video src={current.videoUrl} className="w-full h-full object-cover" controls playsInline />
      ) : current?.imageUrl ? (
        <img src={current.imageUrl} alt="" className="w-full h-full object-contain bg-black" />
      ) : fallbackThumb ? (
        <img src={fallbackThumb} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <i className="fas fa-images text-slate-700 text-3xl"></i>
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
        {slideIndex + 1} / {items.length}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setSlideIndex(i) }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === slideIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev/Next slide arrows */}
      {slideIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setSlideIndex(i => i - 1) }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {slideIndex < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setSlideIndex(i => i + 1) }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </>
  )
}

export default function VideoStoryCarousel({ videos: initialVideos, initialIndex = 0, onClose, renderMeta, isAdmin: isAdminProp }: VideoStoryCarouselProps) {
  const { userType } = useAuth()
  const isAdmin = isAdminProp || userType === 'admin'
  const [videos, setVideos] = useState(initialVideos)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [jsonCopied, setJsonCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const video = videos[currentIndex]
  const videoUrl = video ? getVideoUrl(video) : null

  async function handleDownloadAndPlay() {
    if (!video?.id || downloading) return
    setDownloading(true)
    try {
      const res = await authFetch(`/api/analysis/videos/${video.id}/download`, { method: 'POST' })
      const result = await res.json()
      if (result.local_video_path) {
        setVideos(prev => prev.map((v, i) =>
          i === currentIndex ? { ...v, local_video_path: result.local_video_path } : v
        ))
      } else if (result.error) {
        setVideoError(true)
      }
    } catch {
      setVideoError(true)
    } finally {
      setDownloading(false)
    }
  }

  // Auto-play after download completes
  useEffect(() => {
    if (videoUrl && videoRef.current && !videoError) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [videoUrl, videoError])

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, videos.length - 1))
  }, [videos.length])

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0))
  }, [])

  // Reset video state when switching
  useEffect(() => {
    setIsPlaying(false)
    setVideoError(false)
    setDownloading(false)
    setJsonCopied(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev)
      }
      if (e.key === ' ') {
        e.preventDefault()
        if (videoUrl && !videoError) {
          togglePlay()
        } else if (!videoUrl && !videoError && !downloading) {
          handleDownloadAndPlay()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, goNext, goPrev, videoUrl, videoError, downloading])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function togglePlay() {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (videoUrl && !videoError) {
      togglePlay()
    } else if (!videoUrl && !videoError && !downloading) {
      handleDownloadAndPlay()
    }
  }

  function handleSaveVideo(e: React.MouseEvent) {
    e.stopPropagation()
    if (!videoUrl || !video) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${video.username}_${video.platform}_${video.id}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!video) return null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < videos.length - 1
  const thumb = getThumbnailSrc(video)

  return (
    <div className="fixed inset-0 z-[100] bg-black/[0.97] backdrop-blur-sm flex">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
      >
        &times;
      </button>

      {/* Progress bar (Instagram-style) */}
      <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 px-3 pt-3">
        {videos.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-white w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Nav arrows */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {hasNext && (
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      {/* Prev/Next thumbnails on sides (desktop only) */}
      {hasPrev && (() => {
        const prevThumb = getThumbnailSrc(videos[currentIndex - 1]!)
        return (
          <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-20 items-center justify-center z-20">
            <div
              className="w-14 h-20 rounded-lg overflow-hidden opacity-40 border border-white/10 cursor-pointer hover:opacity-60 transition-opacity"
              onClick={goPrev}
            >
              {prevThumb ? (
                <img src={prevThumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
          </div>
        )
      })()}
      {hasNext && (() => {
        const nextThumb = getThumbnailSrc(videos[currentIndex + 1]!)
        return (
          <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-20 items-center justify-center z-20">
            <div
              className="w-14 h-20 rounded-lg overflow-hidden opacity-40 border border-white/10 cursor-pointer hover:opacity-60 transition-opacity"
              onClick={goNext}
            >
              {nextThumb ? (
                <img src={nextThumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
            </div>
          </div>
        )
      })()}

      {/* Main content area */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full items-center justify-center lg:px-24 px-4 pt-10 pb-4 gap-4 lg:gap-8">
        {/* Video / Thumbnail */}
        <div className="flex-shrink-0 flex items-center justify-center lg:w-[360px] lg:h-[640px] w-full max-w-[360px] h-[50vh] lg:max-h-none">
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl cursor-pointer"
            onClick={video.content_type !== 'carousel' ? handleVideoClick : undefined}
          >
            {/* Carousel viewer */}
            {video.content_type === 'carousel' ? (
              <CarouselItemsViewer items={extractCarouselItems(video.raw_data, video.local_carousel_media)} fallbackThumb={thumb} />
            ) : videoUrl && !videoError ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  poster={thumb || undefined}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted={isMuted}
                  preload="auto"
                  onError={() => setVideoError(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {thumb ? (
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <i className="fas fa-film text-slate-700 text-3xl"></i>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {downloading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" opacity="0.3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-white/70 text-xs font-bold">Downloading...</span>
                    </div>
                  ) : videoError ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-white/70 text-xs font-bold">Download failed</span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mute/Unmute button */}
            {videoUrl && !videoError && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(prev => !prev) }}
                className="absolute bottom-20 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                )}
              </button>
            )}

            {/* Creator overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">@{video.username}</span>
                {video.platform && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    video.platform === 'tiktok' ? 'bg-pink-500/30 text-pink-300' : 'bg-orange-500/30 text-orange-300'
                  }`}>
                    {video.platform}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-white/70">{formatCount(video.views)} views</span>
                {video.likes != null && <span className="text-xs text-white/70">{formatCount(video.likes)} likes</span>}
                {video.comments != null && <span className="text-xs text-white/70">{formatCount(video.comments)} comments</span>}
              </div>
            </div>

            {/* Video counter + save button */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              {videoUrl && !videoError && (
                <button
                  onClick={handleSaveVideo}
                  title="Save video to device"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              )}
              <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none font-bold">
                {currentIndex + 1} / {videos.length}
              </div>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div className="flex-1 min-w-0 lg:max-w-lg w-full lg:h-[640px] overflow-y-auto carousel-scrollbar">
          <div className="space-y-3">
            {/* Creator header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-white tracking-tight">@{video.username}</h3>
                  {video.platform && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${
                      video.platform === 'tiktok' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/20' : 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-300 border border-orange-500/20'
                    }`}>
                      <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} mr-1`}></i>
                      {video.platform}
                    </span>
                  )}
                  {isAdmin && video.status === 'analyzed' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-teal-500/15 text-teal-400 border border-teal-500/20">
                      Analyzed
                    </span>
                  )}
                </div>
                {video.published_at && (
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {timeAgo(video.published_at)} &middot; {new Date(video.published_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {video.final_viral_probability != null && (
                <div className={`text-right`}>
                  <p className={`text-2xl font-black tabular-nums ${
                    video.final_viral_probability >= 0.7 ? 'text-teal-400' :
                    video.final_viral_probability >= 0.4 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {Math.round(video.final_viral_probability * 100)}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Viral Score</p>
                </div>
              )}
            </div>

            {/* Error details (admin only) */}
            {isAdmin && (video.status === 'error' || video.status === 'video_failed') && (
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-400">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {video.status === 'video_failed' ? 'Video Download Failed' : 'Analysis Failed'}
                  </p>
                </div>
                {video.error_message ? (
                  <p className="text-xs text-red-300/70 font-mono break-all whitespace-pre-wrap leading-relaxed">{video.error_message}</p>
                ) : (
                  <p className="text-xs text-red-300/40 italic">No error message recorded</p>
                )}
                {video.updated_at && (
                  <p className="text-[10px] text-red-400/40 mt-1.5">Failed {timeAgo(video.updated_at)} &middot; {new Date(video.updated_at).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Metrics strip */}
            <div className="flex items-center gap-1">
              {[
                { value: video.views, label: 'Views', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                { value: video.likes, label: 'Likes', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                { value: video.comments, label: 'Comments', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                { value: video.shares, label: 'Shares', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
              ].map((metric) => (
                <div key={metric.label} className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-2.5 text-center transition-colors group">
                  <svg className="w-3.5 h-3.5 mx-auto mb-1 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={metric.icon} />
                  </svg>
                  <p className="text-sm font-black text-white tabular-nums">{formatCount(metric.value)}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Engagement rate bar */}
            {video.engagement_rate != null && (
              <div className="bg-white/[0.03] rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    Number(video.engagement_rate) >= 3 ? 'bg-teal-400' :
                    Number(video.engagement_rate) >= 1 ? 'bg-amber-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engagement Rate</span>
                </div>
                <span className={`text-sm font-black tabular-nums ${
                  Number(video.engagement_rate) >= 3 ? 'text-teal-400' :
                  Number(video.engagement_rate) >= 1 ? 'text-white' :
                  'text-red-400'
                }`}>{Number(video.engagement_rate).toFixed(2)}%</span>
              </div>
            )}

            {/* Analysis: Format & Hook */}
            {video.status === 'analyzed' && (video.format_class_name || video.hook_class_name) && (
              <div className="grid grid-cols-2 gap-2">
                {video.format_class_name && (
                  <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/15 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>
                      </svg>
                      <span className="text-[9px] font-black text-pink-400/70 uppercase tracking-widest">Format</span>
                    </div>
                    <p className="text-[13px] font-bold text-pink-200 leading-tight">{video.format_class_name}</p>
                  </div>
                )}
                {video.hook_class_name && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/15 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                      </svg>
                      <span className="text-[9px] font-black text-purple-400/70 uppercase tracking-widest">Hook</span>
                    </div>
                    <p className="text-[13px] font-bold text-purple-200 leading-tight">{video.hook_class_name}</p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis: Tactics */}
            {video.status === 'analyzed' && video.top_tactic_names && video.top_tactic_names.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Tactics</span>
                  <span className="text-[9px] font-bold text-slate-600 ml-auto">{video.top_tactic_names.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {video.top_tactic_names.map((tactic, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300/90 border border-amber-500/15 hover:bg-amber-500/15 transition-colors"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time context */}
            {(video.published_at || (isAdmin && video.status === 'analyzed' && video.updated_at)) && (
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Time Context</p>
                <div className="flex items-center gap-4">
                  {video.published_at && (
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full bg-blue-500/30" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500">Uploaded</p>
                        <p className="text-sm font-bold text-white">{timeAgo(video.published_at)}</p>
                      </div>
                    </div>
                  )}
                  {isAdmin && video.status === 'analyzed' && video.updated_at && (
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full bg-teal-500/30" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500">Analyzed</p>
                        <p className="text-sm font-bold text-white">{timeAgo(video.updated_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
                {video.published_at && (
                  <p className="text-[10px] text-amber-400/60 mt-2 font-medium">
                    {(() => {
                      const days = Math.floor((Date.now() - new Date(video.published_at).getTime()) / (1000 * 60 * 60 * 24))
                      if (days < 1) return 'Published today — metrics still accumulating'
                      if (days < 3) return 'Recently published — viral potential developing'
                      if (days < 7) return 'Less than a week — still gaining traction'
                      if (days < 30) return `${days} days old — metrics stabilizing`
                      return `${Math.floor(days / 30)} months old — metrics settled`
                    })()}
                  </p>
                )}
              </div>
            )}

            {/* Caption */}
            {video.caption && (
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Caption</p>
                <p className="text-[13px] text-white/80 whitespace-pre-wrap leading-relaxed">{video.caption}</p>
              </div>
            )}

            {/* Custom metadata */}
            {renderMeta && renderMeta(video, currentIndex)}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {videoUrl && !videoError && (
                <button
                  onClick={handleSaveVideo}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/15 transition-colors font-bold"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Save Video
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(JSON.stringify(video, null, 2))
                    setJsonCopied(true)
                    setTimeout(() => setJsonCopied(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/15 transition-colors font-bold"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  {jsonCopied ? 'Copied!' : 'Copy JSON'}
                </button>
              )}
              {video.content_url && (
                <a
                  href={video.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-colors font-bold"
                >
                  Open on {video.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5.5 2.5H3C2.72386 2.5 2.5 2.72386 2.5 3V11C2.5 11.2761 2.72386 11.5 3 11.5H11C11.2761 11.5 11.5 11.2761 11.5 11V8.5M8.5 2.5H11.5V5.5M6.5 7.5L11.5 2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
