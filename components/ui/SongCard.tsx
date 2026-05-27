'use client'

import { Pause, Play } from 'lucide-react'
import type { Song } from '@/types'

interface SongCardProps {
  song: Song
  onClick: () => void
  isActive?: boolean
  isPlaying?: boolean
  showPlayCount?: boolean
}

export default function SongCard({
  song,
  onClick,
  isActive = false,
  isPlaying = false,
  showPlayCount = false,
}: SongCardProps) {
  const thumb =
    song.thumbnail_url ||
    `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`

  return (
    <button
      type="button"
      className={`wavvy-song-card${isActive ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <div className="wavvy-song-card-thumb-wrap">
        <img className="wavvy-song-card-thumb" src={thumb} alt={song.title} />
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
        <p className="wavvy-song-card-title">{song.title}</p>
        <p className="wavvy-song-card-artist">{song.artist}</p>
        {showPlayCount && (song.play_count ?? 0) > 0 && (
          <p className="wavvy-song-card-plays">
            <Play size={12} aria-hidden />
            <span>{(song.play_count ?? 0).toLocaleString()} plays</span>
          </p>
        )}
      </div>
    </button>
  )
}
