'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Music2 } from 'lucide-react'
import SongGrid from '@/components/ui/SongGrid'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import type { Song } from '@/types'

export default function LikedPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const { playSong, currentSong, isPlaying } = useMusicStore()

  useEffect(() => {
    const loadLiked = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('liked_songs')
        .select('song:songs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const likedSongs =
        (data?.map((row: { song: Song | null }) => row.song).filter(Boolean) as Song[]) || []
      setSongs(likedSongs)
      setLoading(false)
    }

    loadLiked()
  }, [])

  const handlePlay = async (song: Song) => {
    playSong(song, songs)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('recently_played').insert({ user_id: user.id, song_id: song.id })
    await supabase
      .from('songs')
      .update({ play_count: (song.play_count || 0) + 1 })
      .eq('id', song.id)
  }

  return (
    <div className="wavvy-page-narrow">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Heart size={24} color="#EC4899" />
        <h1 className="wavvy-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          Liked Songs
        </h1>
      </div>

      {loading && (
        <div className="wavvy-song-grid">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="wavvy-skeleton wavvy-skeleton-card" />
            ))}
        </div>
      )}

      {!loading && songs.length === 0 && (
        <div
          style={{
            background: '#16161F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '1.25rem',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <Music2 size={36} color="#3B82F6" />
          <p style={{ color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
            Your liked songs will appear here.
          </p>
          <Link
            href="/dashboard/search"
            style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}
          >
            Find songs to like
          </Link>
        </div>
      )}

      {!loading && songs.length > 0 && (
        <SongGrid
          songs={songs}
          onPlay={handlePlay}
          getIsActive={(song) => currentSong?.id === song.id}
          getIsPlaying={(song) => currentSong?.id === song.id && isPlaying}
        />
      )}
    </div>
  )
}