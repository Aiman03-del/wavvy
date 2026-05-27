'use client'

import { useEffect, useMemo, useState } from 'react'
import SongCard from '@/components/ui/SongCard'
import { supabase } from '@/lib/supabase'
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
  const [userId, setUserId] = useState<string | null>(null)
  const [likedSongIds, setLikedSongIds] = useState<string[]>([])

  useEffect(() => {
    const loadLibraryMeta = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: liked } = await supabase
        .from('liked_songs')
        .select('song_id')
        .eq('user_id', user.id)

      setLikedSongIds((liked || []).map((row: { song_id: string }) => row.song_id))
    }

    loadLibraryMeta()
  }, [])

  const likedSet = useMemo(() => new Set(likedSongIds), [likedSongIds])

  const toggleLike = async (song: Song) => {
    if (!userId) return
    const isLiked = likedSet.has(song.id)
    if (isLiked) {
      await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', userId)
        .eq('song_id', song.id)
      setLikedSongIds((prev) => prev.filter((id) => id !== song.id))
      return
    }

    const { error } = await supabase
      .from('liked_songs')
      .insert({ user_id: userId, song_id: song.id })
    if (!error) {
      setLikedSongIds((prev) => [...prev, song.id])
    }
  }

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
          isLiked={likedSet.has(song.id)}
          onToggleLike={toggleLike}
        />
      ))}
    </div>
  )
}
