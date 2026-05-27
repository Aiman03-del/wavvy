'use client'

import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { formatTime } from '@/lib/player'
import { useMusicStore } from '@/store/musicStore'

interface PlayerControlsProps {
  variant?: 'bar' | 'fullscreen'
  showProgress?: boolean
}

export default function PlayerControls({
  variant = 'bar',
  showProgress = true,
}: PlayerControlsProps) {
  const {
    isPlaying,
    progress,
    duration,
    isShuffle,
    repeatMode,
    togglePlay,
    nextSong,
    prevSong,
    toggleShuffle,
    cycleRepeat,
  } = useMusicStore()

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0
  const isFullscreen = variant === 'fullscreen'

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    window.wavvySeek?.(pct * duration)
  }

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  return (
    <div
      className={`wavvy-player-controls-root${isFullscreen ? ' wavvy-player-controls-root--fullscreen' : ''}`}
    >
      {showProgress && (
        <div className="wavvy-player-progress-row">
          <span className="wavvy-player-time">{formatTime(progress)}</span>
          <div
            className="wavvy-player-progress-bar"
            onClick={handleSeek}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={progress}
            aria-label="Seek"
          >
            <div
              className="wavvy-player-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="wavvy-player-time">{formatTime(duration)}</span>
        </div>
      )}

      <div className="wavvy-player-buttons-row">
        <button
          type="button"
          className={`wavvy-player-icon-btn${isShuffle ? ' is-active' : ''}`}
          onClick={toggleShuffle}
          aria-label={isShuffle ? 'Shuffle on' : 'Shuffle off'}
          aria-pressed={isShuffle}
        >
          <Shuffle size={18} />
        </button>

        <button
          type="button"
          className="wavvy-player-icon-btn"
          onClick={prevSong}
          aria-label="Previous"
        >
          <SkipBack size={22} fill="currentColor" />
        </button>

        <button
          type="button"
          className="wavvy-player-play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={isFullscreen ? 24 : 22} fill="currentColor" />
          ) : (
            <Play size={isFullscreen ? 24 : 22} fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          className="wavvy-player-icon-btn"
          onClick={nextSong}
          aria-label="Next"
        >
          <SkipForward size={22} fill="currentColor" />
        </button>

        <button
          type="button"
          className={`wavvy-player-icon-btn${repeatMode !== 'off' ? ' is-active' : ''}`}
          onClick={cycleRepeat}
          aria-label={`Repeat ${repeatMode}`}
        >
          <RepeatIcon size={18} />
          {repeatMode === 'one' && (
            <span className="wavvy-player-repeat-badge">1</span>
          )}
        </button>
      </div>
    </div>
  )
}
