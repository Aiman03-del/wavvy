'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Maximize2 } from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import AudioPlayer from '@/components/player/AudioPlayer'
import FullScreenPlayer from '@/components/ui/player/FullScreenPlayer'
import PlayerControls from '@/components/ui/player/PlayerControls'

export default function MusicPlayer() {
  const { currentSong, toggleFullScreen } = useMusicStore()
  const barRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (currentSong && !shown) {
      setShown(true)
      gsap.fromTo(
        barRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [currentSong, shown])

  const openFullScreen = () => {
    const { isFullScreen } = useMusicStore.getState()
    if (!isFullScreen) toggleFullScreen()
  }

  return (
    <>
      <AudioPlayer />
      <FullScreenPlayer />

      {currentSong && (
        <div ref={barRef} className="wavvy-player">
          <div
            className="wavvy-player-top"
            onClick={openFullScreen}
            onKeyDown={(e) => e.key === 'Enter' && openFullScreen()}
            role="button"
            tabIndex={0}
            aria-label="Expand player"
          >
            <img
              className="wavvy-player-thumb"
              src={
                currentSong.thumbnail_url ||
                `https://img.youtube.com/vi/${currentSong.youtube_id}/mqdefault.jpg`
              }
              alt=""
            />
            <div className="wavvy-player-meta">
              <p className="wavvy-player-title">{currentSong.title}</p>
              <p className="wavvy-player-artist">{currentSong.artist}</p>
            </div>
            <button
              type="button"
              className="wavvy-player-expand"
              onClick={(e) => {
                e.stopPropagation()
                openFullScreen()
              }}
              aria-label="Full screen player"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <PlayerControls variant="bar" />
        </div>
      )}
    </>
  )
}
