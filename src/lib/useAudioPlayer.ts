import { useEffect, useState, useCallback, useRef } from 'react'
import { authFetch } from './api'

export interface PlayableSong {
  id: number
  play_url: string | null
  local_audio_path: string | null
}

export function getAudioUrl(song: PlayableSong): string | null {
  return song.local_audio_path || song.play_url || null
}

export interface AudioPlayerOptions {
  /**
   * Optional: route playback through an auth-protected backend endpoint.
   * The player will authFetch the URL, build a blob, and use that as the
   * audio source. Required when source URLs (e.g. play_url from CDNs) are
   * unreliable or when the endpoint needs a JWT in Authorization header.
   */
  authenticatedStreamUrl?: (song: PlayableSong) => string | null
}

export function useAudioPlayer(options: AudioPlayerOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const rafRef = useRef<number>(0)

  const updateProgress = useCallback(() => {
    const a = audioRef.current
    if (a && !a.paused) {
      setProgress(a.currentTime)
      setDuration(a.duration || 0)
      rafRef.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    cancelAnimationFrame(rafRef.current)
    revokeBlob()
    setPlayingId(null)
    setLoadingId(null)
    setProgress(0)
    setDuration(0)
  }, [revokeBlob])

  const toggle = useCallback(async (song: PlayableSong) => {
    if (playingId === song.id) {
      stop()
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => {
        setPlayingId(null)
        setProgress(0)
        cancelAnimationFrame(rafRef.current)
        revokeBlob()
      })
      audioRef.current.addEventListener('error', () => {
        setPlayingId(null)
        setLoadingId(null)
        setProgress(0)
        cancelAnimationFrame(rafRef.current)
        revokeBlob()
      })
    }

    const a = audioRef.current
    a.pause()
    cancelAnimationFrame(rafRef.current)
    abortRef.current?.abort()
    revokeBlob()
    setLoadingId(song.id)
    setPlayingId(null)

    let src: string | null = null

    const streamUrl = options.authenticatedStreamUrl?.(song) ?? null
    if (streamUrl) {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await authFetch(streamUrl, { signal: controller.signal })
        if (!res.ok) {
          setLoadingId(null)
          return
        }
        const blob = await res.blob()
        if (controller.signal.aborted) return
        src = URL.createObjectURL(blob)
        blobUrlRef.current = src
      } catch {
        if (!controller.signal.aborted) setLoadingId(null)
        return
      }
    } else {
      src = getAudioUrl(song)
      if (!src) { setLoadingId(null); return }
    }

    a.src = src
    a.load()

    const onCanPlay = () => {
      setLoadingId(null)
      a.play().then(() => {
        setPlayingId(song.id)
        rafRef.current = requestAnimationFrame(updateProgress)
      }).catch(() => {
        setLoadingId(null)
      })
      a.removeEventListener('canplay', onCanPlay)
    }
    a.addEventListener('canplay', onCanPlay)
  }, [playingId, stop, updateProgress, options, revokeBlob])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      cancelAnimationFrame(rafRef.current)
      revokeBlob()
    }
  }, [revokeBlob])

  return { playingId, loadingId, progress, duration, toggle, stop }
}
