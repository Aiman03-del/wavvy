'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ChevronDown, SkipBack, SkipForward } from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FullScreenPlayer() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    currentSong,
    isFullScreen,
    isPlaying,
    volume,
    progress,
    duration,
    toggleFullScreen,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
  } = useMusicStore()

  useEffect(() => {
    if (!isFullScreen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullScreen])

  useEffect(() => {
    if (!isFullScreen || !overlayRef.current || !panelRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      gsap.fromTo(
        panelRef.current,
        { scale: 0.88, opacity: 0, y: 48 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      )
    })

    return () => ctx.revert()
  }, [isFullScreen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) toggleFullScreen()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFullScreen, toggleFullScreen])

  if (!isFullScreen || !currentSong) return null

  const thumb =
    currentSong.thumbnail_url ||
    `https://img.youtube.com/vi/${currentSong.youtube_id}/maxresdefault.jpg`

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const seekTo = pct * duration
    ;(window as Window & { wavvySeek?: (s: number) => void }).wavvySeek?.(seekTo)
  }

  return (
    <div
      ref={overlayRef}
      className="wavvy-fullscreen"
      onClick={toggleFullScreen}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <div
        ref={panelRef}
        className="wavvy-fullscreen-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="wavvy-fullscreen-close"
          onClick={toggleFullScreen}
          aria-label="Minimize player"
        >
          <ChevronDown size={28} />
        </button>

        <div className="wavvy-fullscreen-art-wrap">
          <img
            className="wavvy-fullscreen-art"
            src={thumb}
            alt=""
            onError={(e) => {
              const img = e.currentTarget
              if (!img.src.includes('mqdefault')) {
                img.src = `https://img.youtube.com/vi/${currentSong.youtube_id}/mqdefault.jpg`
              }
            }}
          />
        </div>

        <div className="wavvy-fullscreen-meta">
          <h2 className="wavvy-fullscreen-title">{currentSong.title}</h2>
          <p className="wavvy-fullscreen-artist">{currentSong.artist}</p>
          {currentSong.album && (
            <p className="wavvy-fullscreen-album">{currentSong.album}</p>
          )}
        </div>

        <div className="wavvy-fullscreen-progress">
          <span className="wavvy-fullscreen-time">{formatTime(progress)}</span>
          <div
            className="wavvy-fullscreen-progress-bar"
            onClick={handleSeek}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={progress}
          >
            <div
              className="wavvy-fullscreen-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="wavvy-fullscreen-time">{formatTime(duration)}</span>
        </div>

        <div className="wavvy-fullscreen-controls">
          <button type="button" className="wavvy-fullscreen-btn" onClick={prevSong} aria-label="Previous">
            <SkipBack size={28} />
          </button>
          <button
            type="button"
            className="wavvy-fullscreen-play"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button type="button" className="wavvy-fullscreen-btn" onClick={nextSong} aria-label="Next">
            <SkipForward size={28} />
          </button>
        </div>

        <div className="wavvy-fullscreen-volume">
          <span aria-hidden>{volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
