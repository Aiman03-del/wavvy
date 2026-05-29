'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Frown, Music2, PartyPopper, Smile, Target, Wind } from 'lucide-react'
import SongGrid from '@/components/ui/SongGrid'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import type { Song } from '@/types'

const MOOD_META = {
  happy: { label: 'Happy', icon: Smile, color: '#F59E0B' },
  sad: { label: 'Sad', icon: Frown, color: '#3B82F6' },
  chill: { label: 'Chill', icon: Wind, color: '#10B981' },
  party: { label: 'Party', icon: PartyPopper, color: '#EC4899' },
  focus: { label: 'Focus', icon: Target, color: '#6B7280' },
} as const

type MoodKey = keyof typeof MOOD_META

export default function MoodPage() {
  const params = useParams<{ mood: string }>()
  const moodParam = params?.mood || ''
  const mood = useMemo(() => moodParam.toLowerCase() as MoodKey, [moodParam])
  const meta = MOOD_META[mood]

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const { playSong } = useMusicStore()

  useEffect(() => {
    const loadSongs = async () => {
      if (!meta) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('songs')
        .select('*')
        .eq('mood', mood)
        .order('play_count', { ascending: false })
        .limit(40)

      setSongs(data || [])
      setLoading(false)
    }

    loadSongs()
  }, [meta, mood])

  const handlePlay = async (song: Song) => {
    playSong(song, songs)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('recently_played').insert({ user_id: user.id, song_id: song.id })
    await supabase.from('songs').update({ play_count: (song.play_count || 0) + 1 }).eq('id', song.id)
  }

  if (!meta) {
    return (
      <div style={{ padding: '2rem', maxWidth: '960px' }}>
        <div style={{ background: '#16161F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center' }}>
          <Music2 size={36} color="#3B82F6" />
          <h1 style={{ fontFamily: "'Syne', sans-serif", marginTop: '1rem', marginBottom: '0.5rem' }}>Mood not found</h1>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>Use a valid mood from the sidebar.</p>
          <Link href="/dashboard" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const MoodIcon = meta.icon

  return (
    <div className="wavvy-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{ color: meta.color, display: 'inline-flex' }}>
          <MoodIcon size={26} />
        </span>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
            {meta.label} Songs
          </h1>
          <p style={{ color: '#94A3B8', margin: '0.2rem 0 0' }}>
            Songs matched for the {meta.label.toLowerCase()} mood.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner block label="Loading songs..." />
      ) : songs.length === 0 ? (
        <div style={{ background: '#16161F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.25rem', padding: '3rem', textAlign: 'center' }}>
          <Music2 size={36} color={meta.color} />
          <p style={{ color: '#94A3B8', marginTop: '1rem' }}>No songs found for this mood yet.</p>
        </div>
      ) : (
        <SongGrid songs={songs} onPlay={handlePlay} />
      )}
    </div>
  )
}