'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ChevronDown } from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import PlayerControls from '@/components/ui/player/PlayerControls'

export default function FullScreenPlayer() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { currentSong, isFullScreen, isPlaying, toggleFullScreen } =
    useMusicStore()

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

        <div
          className={`wavvy-fullscreen-art-wrap${isPlaying ? ' is-playing' : ''}`}
        >
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

        <PlayerControls variant="fullscreen" />
      </div>
    </div>
  )
}
