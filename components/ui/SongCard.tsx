'use client'

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
            {isPlaying ? '⏸' : '▶'}
          </span>
        )}
      </div>
      <div className="wavvy-song-card-body">
        <p className="wavvy-song-card-title">{song.title}</p>
        <p className="wavvy-song-card-artist">{song.artist}</p>
        {showPlayCount && (song.play_count ?? 0) > 0 && (
          <p className="wavvy-song-card-plays">
            ▶ {(song.play_count ?? 0).toLocaleString()} plays
          </p>
        )}
      </div>
    </button>
  )
}
