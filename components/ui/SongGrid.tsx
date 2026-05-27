'use client'

import SongCard from '@/components/ui/SongCard'
import type { Song } from '@/types'

interface SongGridProps {
  songs: Song[]
  onPlay: (song: Song) => void
  getIsActive?: (song: Song) => boolean
  getIsPlaying?: (song: Song) => boolean
  showPlayCount?: boolean
}

export default function SongGrid({
  songs,
  onPlay,
  getIsActive,
  getIsPlaying,
  showPlayCount = false,
}: SongGridProps) {
  return (
    <div className="wavvy-song-grid">
      {songs.map((song, index) => (
        <SongCard
          key={`${song.id}-${index}`}
          song={song}
          onClick={() => onPlay(song)}
          isActive={getIsActive?.(song)}
          isPlaying={getIsPlaying?.(song)}
          showPlayCount={showPlayCount}
        />
      ))}
    </div>
  )
}
