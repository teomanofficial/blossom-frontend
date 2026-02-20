import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { authFetch } from '../lib/api'

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
}

interface VideoStoryCarouselProps {
  videos: CarouselVideo[]
  initialIndex?: number
  onClose: () => void
  renderMeta?: (video: CarouselVideo, index: number) => ReactNode
  isAdmin?: boolean
}

function getThumbnailSrc(video: CarouselVideo): string | null {
  if (video.local_thumbnail_path) {
    if (video.local_thumbnail_path.startsWith('http')) return video.local_thumbnail_path
    return `/media/${video.local_thumbnail_path.split('/').pop()}`
  }
  return video.thumbnail_url
}

function getVideoUrl(video: CarouselVideo): string | null {
  if (video.local_video_path) {
    if (video.local_video_path.startsWith('http')) return video.local_video_path
    return `/media/${video.local_video_path.split('/').pop()}`
  }
  return null
}

export default function VideoStoryCarousel({ videos: initialVideos, initialIndex = 0, onClose, renderMeta, isAdmin }: VideoStoryCarouselProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
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
    if (!videoUrl) return
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
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex">
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
            onClick={handleVideoClick}
          >
            {/* Video player */}
            {videoUrl && !videoError ? (
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
          <div className="space-y-4">
            {/* Creator & metrics header */}
            <div>
              <h3 className="text-lg font-black text-white">@{video.username}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {video.platform && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    video.platform === 'tiktok' ? 'bg-pink-500/20 text-pink-300' : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} mr-1`}></i>
                    {video.platform}
                  </span>
                )}
                {video.status && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    video.status === 'analyzed' ? 'bg-teal-500/20 text-teal-300' :
                    video.status === 'video_failed' ? 'bg-amber-500/20 text-amber-300' :
                    video.status === 'error' ? 'bg-red-500/20 text-red-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {video.status === 'analyzed' ? 'Analyzed' : video.status === 'video_failed' ? 'No Video' : video.status === 'error' ? 'Error' : 'Pending'}
                  </span>
                )}
                {video.final_viral_probability != null && (
                  <span className={`text-xs font-black ${
                    video.final_viral_probability >= 0.7 ? 'text-teal-400' :
                    video.final_viral_probability >= 0.4 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {Math.round(video.final_viral_probability * 100)}% viral
                  </span>
                )}
              </div>
            </div>

            {/* Error details (admin only) */}
            {isAdmin && (video.status === 'error' || video.status === 'video_failed') && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {video.status === 'video_failed' ? 'Video Download Failed' : 'Analysis Failed'}
                  </p>
                </div>
                {video.error_message ? (
                  <p className="text-xs text-red-300/80 font-mono break-all whitespace-pre-wrap">{video.error_message}</p>
                ) : (
                  <p className="text-xs text-red-300/50 italic">No error message recorded</p>
                )}
                {video.updated_at && (
                  <p className="text-[10px] text-red-400/50 mt-1.5">Failed {timeAgo(video.updated_at)} &middot; {new Date(video.updated_at).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-white">{formatCount(video.views)}</p>
                <p className="text-[10px] font-bold text-slate-500">Views</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-white">{formatCount(video.likes)}</p>
                <p className="text-[10px] font-bold text-slate-500">Likes</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-white">{formatCount(video.comments)}</p>
                <p className="text-[10px] font-bold text-slate-500">Comments</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-white">{formatCount(video.shares)}</p>
                <p className="text-[10px] font-bold text-slate-500">Shares</p>
              </div>
            </div>

            {/* Time Context */}
            {(video.published_at || video.updated_at) && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Context</p>
                <div className="grid grid-cols-2 gap-3">
                  {video.published_at && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">Uploaded</p>
                      <p className="text-sm font-bold text-white">{timeAgo(video.published_at)}</p>
                      <p className="text-[10px] text-slate-600">{new Date(video.published_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {video.status === 'analyzed' && video.updated_at && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">Analyzed</p>
                      <p className="text-sm font-bold text-white">{timeAgo(video.updated_at)}</p>
                      <p className="text-[10px] text-slate-600">{new Date(video.updated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {video.published_at && (
                  <p className="text-[10px] text-amber-400/70 mt-2 font-medium">
                    {(() => {
                      const days = Math.floor((Date.now() - new Date(video.published_at).getTime()) / (1000 * 60 * 60 * 24))
                      if (days < 1) return 'Published today — metrics may still be accumulating'
                      if (days < 3) return 'Published recently — viral potential still developing'
                      if (days < 7) return 'Less than a week old — still gaining traction'
                      if (days < 30) return `${days} days old — metrics are stabilizing`
                      return `${Math.floor(days / 30)} months old — metrics are settled`
                    })()}
                  </p>
                )}
              </div>
            )}

            {/* Caption */}
            {video.caption && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Caption</p>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{video.caption}</p>
              </div>
            )}

            {/* Format / Hook classes */}
            {(video.format_class_name || video.hook_class_name) && (
              <div className="flex flex-wrap gap-2">
                {video.format_class_name && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                    Format: {video.format_class_name}
                  </span>
                )}
                {video.hook_class_name && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    Hook: {video.hook_class_name}
                  </span>
                )}
              </div>
            )}

            {/* Engagement rate */}
            {video.engagement_rate != null && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Engagement Rate</p>
                <p className="text-lg font-black text-white">{Number(video.engagement_rate).toFixed(2)}%</p>
              </div>
            )}

            {/* Custom metadata */}
            {renderMeta && renderMeta(video, currentIndex)}

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-3">
              {videoUrl && !videoError && (
                <button
                  onClick={handleSaveVideo}
                  className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors font-bold"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Save Video
                </button>
              )}
              {video.content_url && (
                <a
                  href={video.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 transition-colors font-bold"
                >
                  Open on {video.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 2.5H3C2.72386 2.5 2.5 2.72386 2.5 3V11C2.5 11.2761 2.72386 11.5 3 11.5H11C11.2761 11.5 11.5 11.2761 11.5 11V8.5M8.5 2.5H11.5V5.5M6.5 7.5L11.5 2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
