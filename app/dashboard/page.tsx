'use client'

import { useEffect, useState } from 'react'
import { Music2 } from 'lucide-react'
import SongGrid from '@/components/ui/SongGrid'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import type { Profile, Song } from '@/types'

export default function DashboardPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [recent, setRecent] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { playSong } = useMusicStore()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const [{ data: prof }, { data: allSongs }, { data: recentPlayed }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('songs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase
          .from('recently_played')
          .select('*, song:songs(*)')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })
          .limit(6),
      ])

      setProfile(prof)
      const rawSongs = allSongs || []
      const uniqueSongsMap = new Map<string, Song>()
      rawSongs.forEach((s: Song) => {
        if (s && s.id) uniqueSongsMap.set(s.id, s)
      })
      setSongs(Array.from(uniqueSongsMap.values()))
      const rawRecent = (recentPlayed?.map((entry: { song: Song }) => entry.song).filter(Boolean) || []) as Song[]
      const uniqueRecentMap = new Map<string, Song>()
      rawRecent.forEach((s) => { if (s && s.id) uniqueRecentMap.set(s.id, s) })
      setRecent(Array.from(uniqueRecentMap.values()))
      setLoading(false)
    }

    load()
  }, [])

  const handlePlay = async (song: Song) => {
    playSong(song, songs)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('recently_played').insert({ user_id: user.id, song_id: song.id })
    await supabase.from('songs').update({ play_count: (song.play_count || 0) + 1 }).eq('id', song.id)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="wavvy-page">
      <header className="wavvy-page-header">
        <h1 className="wavvy-page-greeting">
          {greeting}, {profile?.username?.split(' ')[0] || 'there'}
        </h1>
        <p className="wavvy-page-subtitle">What do you want to listen to today?</p>
      </header>

      {recent.length > 0 && (
        <section className="wavvy-section">
          <h2 className="wavvy-section-heading">Recently Played</h2>
          <SongGrid songs={recent} onPlay={handlePlay} />
        </section>
      )}

      <section className="wavvy-section">
        <h2 className="wavvy-section-heading">All Songs</h2>
        {songs.length === 0 ? (
          <div className="wavvy-empty-state">
            <Music2 size={32} color="#3B82F6" />
            <p>No songs yet. Admin will add songs soon!</p>
          </div>
        ) : (
          <SongGrid songs={songs} onPlay={handlePlay} />
        )}
      </section>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="wavvy-page">
      <div className="wavvy-skeleton wavvy-skeleton-title" />
      <div className="wavvy-song-grid">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="wavvy-skeleton wavvy-skeleton-card" />
        ))}
      </div>
    </div>
  )
}
