import { useEffect, useState, useCallback, useRef } from 'react'

export interface PlayableSong {
  id: number
  play_url: string | null
  local_audio_path: string | null
}

export function getAudioUrl(song: PlayableSong): string | null {
  return song.local_audio_path || song.play_url || null
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    cancelAnimationFrame(rafRef.current)
    setPlayingId(null)
    setLoadingId(null)
    setProgress(0)
    setDuration(0)
  }, [])

  const toggle = useCallback((song: PlayableSong) => {
    const url = getAudioUrl(song)
    if (!url) return

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
      })
      audioRef.current.addEventListener('error', () => {
        setPlayingId(null)
        setLoadingId(null)
        setProgress(0)
        cancelAnimationFrame(rafRef.current)
      })
    }

    const a = audioRef.current
    a.pause()
    cancelAnimationFrame(rafRef.current)
    setLoadingId(song.id)
    setPlayingId(null)
    a.src = url
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
  }, [playingId, stop, updateProgress])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { playingId, loadingId, progress, duration, toggle, stop }
}
