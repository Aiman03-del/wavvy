'use client'

import { Heart, Pause, Play } from 'lucide-react'
import type { Song } from '@/types'

interface SongCardProps {
  song: Song
  onClick: () => void
  isActive?: boolean
  isPlaying?: boolean
  showPlayCount?: boolean
  isLiked?: boolean
  onToggleLike?: (song: Song) => void
}

export default function SongCard({
  song,
  onClick,
  isActive = false,
  isPlaying = false,
  showPlayCount = false,
  isLiked = false,
  onToggleLike,
}: SongCardProps) {
  const thumb =
    song.thumbnail_url ||
    `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`wavvy-song-card${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Play ${song.title}`}
    >
      <div className="wavvy-song-card-thumb-wrap">
        <button type="button" className="wavvy-song-card-play-hit" onClick={onClick}>
          <img className="wavvy-song-card-thumb" src={thumb} alt={song.title} />
        </button>
        {isActive && (
          <span className="wavvy-song-card-play-badge" aria-hidden>
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </span>
        )}
      </div>
      <div className="wavvy-song-card-body">
        <button type="button" className="wavvy-song-card-title-btn" onClick={onClick}>
          <p className="wavvy-song-card-title">{song.title}</p>
        </button>
        <p className="wavvy-song-card-artist">{song.artist}</p>
        {showPlayCount && (song.play_count ?? 0) > 0 && (
          <p className="wavvy-song-card-plays">
            <Play size={12} aria-hidden />
            <span>{(song.play_count ?? 0).toLocaleString()} plays</span>
          </p>
        )}
        <div className="wavvy-song-card-actions">
          <button
            type="button"
            className={`wavvy-song-action-btn${isLiked ? ' is-active' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleLike?.(song)
            }}
            aria-label={isLiked ? 'Unlike song' : 'Like song'}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}
