'use client'

import { useEffect, useRef, useState } from 'react'
import { useMusicStore } from '@/store/musicStore'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubeFrame() {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)
  const [apiReady, setApiReady] = useState(false)

  const { currentSong, isPlaying, volume, setProgress, setDuration } =
    useMusicStore()

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setApiReady(true)
      return
    }

    window.onYouTubeIframeAPIReady = () => setApiReady(true)

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Create player when API ready + song changes
  useEffect(() => {
    if (!apiReady || !currentSong || !containerRef.current) return

    // Destroy old player
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {}
      playerRef.current = null
    }

    // Create new player
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: currentSong.youtube_id,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event: any) => {
          readyRef.current = true
          event.target.setVolume(volume)
          if (isPlaying) event.target.playVideo()
          const duration = event.target.getDuration()
          if (duration) setDuration(duration)
        },
        onError: (e: any) => {
          console.error('YouTube Player Error:', e.data)
        },
      },
    })

    // Seek function
    window.wavvySeek = (seconds: number) => {
      playerRef.current?.seekTo?.(seconds, true)
    }
  }, [apiReady, currentSong?.youtube_id])

  // Play/Pause
  useEffect(() => {
    if (!playerRef.current || !readyRef.current) return
    try {
      if (isPlaying) {
        playerRef.current.playVideo()
      } else {
        playerRef.current.pauseVideo()
      }
    } catch (e) {}
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (!playerRef.current) return
    try {
      playerRef.current.setVolume(volume)
    } catch (e) {}
  }, [volume])

  // Progress tracker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current) return
      try {
        const current = playerRef.current.getCurrentTime?.()
        const total = playerRef.current.getDuration?.()
        if (typeof current === 'number') setProgress(current)
        if (typeof total === 'number' && total > 0) setDuration(total)
      } catch (e) {}
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} />
    </div>
  )
}