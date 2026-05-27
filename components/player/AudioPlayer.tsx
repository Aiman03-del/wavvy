'use client'

import { useEffect, useRef } from 'react'
import { useMusicStore } from '@/store/musicStore'

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastSavedSecondRef = useRef(-1)
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    setProgress,
    setDuration,
    onTrackEnd,
  } = useMusicStore()

  const persistSession = (seconds: number) => {
    if (!currentSong || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        'wavvy:last-session',
        JSON.stringify({
          song: currentSong,
          progress: Math.max(0, seconds),
        })
      )
    } catch {
      // ignore storage failures
    }
  }

  useEffect(() => {
    if (!currentSong) return
    lastSavedSecondRef.current = -1

    const fetchAndPlay = async () => {
      try {
        const directAudioUrl = currentSong.audio_url

        if (directAudioUrl) {
          if (audioRef.current) {
            audioRef.current.src = directAudioUrl
            audioRef.current.load()
            if (isPlaying) audioRef.current.play().catch(() => {})
          }
          return
        }

        const res = await fetch('/api/get-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeId: currentSong.youtube_id }),
        })

        const data = await res.json()

        if (data.audioUrl && audioRef.current) {
          audioRef.current.src = data.audioUrl
          audioRef.current.load()
          if (isPlaying) audioRef.current.play().catch(() => {})
        }
      } catch (error) {
        console.error('Audio fetch error:', error)
      }
    }

    fetchAndPlay()
  }, [currentSong?.youtube_id, currentSong?.audio_url])

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    window.wavvySeek = (seconds: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = seconds
      }
    }
    return () => {
      delete window.wavvySeek
    }
  }, [])

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={() => {
        if (audioRef.current) {
          const seconds = audioRef.current.currentTime
          setProgress(seconds)
          const rounded = Math.floor(seconds)
          if (rounded !== lastSavedSecondRef.current) {
            lastSavedSecondRef.current = rounded
            persistSession(seconds)
          }
        }
      }}
      onLoadedMetadata={() => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
          if (progress > 0 && progress < audioRef.current.duration) {
            audioRef.current.currentTime = progress
          }
        }
      }}
      onEnded={() => {
        const { repeatMode, setProgress } = useMusicStore.getState()
        if (repeatMode === 'one' && audioRef.current) {
          audioRef.current.currentTime = 0
          setProgress(0)
          audioRef.current.play().catch(() => {})
          return
        }
        onTrackEnd()
      }}
      style={{ display: 'none' }}
      preload="auto"
    />
  )
}
