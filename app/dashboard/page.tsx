'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Frown, Music2, PartyPopper, Smile, Target, Wind } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import type { Profile, Song } from '@/types'

const MOOD_ICONS = {
  happy: Smile,
  sad: Frown,
  chill: Wind,
  party: PartyPopper,
  focus: Target,
} as const

const MOOD_COLORS: Record<string, string> = {
  happy: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  sad: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  chill: 'linear-gradient(135deg, #10B981, #06B6D4)',
  party: 'linear-gradient(135deg, #EC4899, #A855F7)',
  focus: 'linear-gradient(135deg, #6B7280, #374151)',
}

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
      // Deduplicate songs by id to avoid React key collisions
      const rawSongs = allSongs || []
      const uniqueSongsMap = new Map<string, Song>()
      rawSongs.forEach((s: Song) => {
        if (s && s.id) uniqueSongsMap.set(s.id, s)
      })
      setSongs(Array.from(uniqueSongsMap.values()))
      const rawRecent = (recentPlayed?.map((entry: any) => entry.song).filter(Boolean) || []) as Song[]
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
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-1px' }}>
          {greeting}, {profile?.username?.split(' ')[0] || 'there'}
        </h1>
        <p style={{ color: '#94A3B8', marginTop: '0.25rem' }}>What do you want to listen to today?</p>
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>Browse by Mood</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(MOOD_COLORS).map(([mood, gradient]) => {
            const MoodIcon = MOOD_ICONS[mood as keyof typeof MOOD_ICONS]

            return (
              <Link
                key={mood}
                href={`/dashboard/mood/${mood}`}
                style={{
                  background: gradient,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  textDecoration: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-3px)'
                  event.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'none'
                  event.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>
                  <MoodIcon size={22} />
                </span>
                <span style={{ textTransform: 'capitalize' }}>{mood}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>Recently Played</h2>
          <SongGrid songs={recent} onPlay={handlePlay} />
        </section>
      )}

      <section>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>All Songs</h2>
        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', background: '#16161F', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#3B82F6' }}><Music2 size={32} /></p>
            <p>No songs yet. Admin will add songs soon!</p>
          </div>
        ) : (
          <SongGrid songs={songs} onPlay={handlePlay} />
        )}
      </section>
    </div>
  )
}

function SongGrid({ songs, onPlay }: { songs: Song[]; onPlay: (song: Song) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
      {songs.map((song, index) => (
        <div
          key={`${song.id}-${index}`}
          onClick={() => onPlay(song)}
          style={{
            background: '#16161F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '1.25rem',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = '#1E1E2A'
            event.currentTarget.style.transform = 'translateY(-3px)'
            event.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = '#16161F'
            event.currentTarget.style.transform = 'none'
            event.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          <img
            src={song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`}
            alt={song.title}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '0.75rem' }}
          />
          <p style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
          <p style={{ color: '#94A3B8', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</p>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '2rem' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .sk { background: #16161F; border-radius: 0.75rem; animation: pulse 1.5s ease infinite; }
      `}</style>
      <div className="sk" style={{ height: '2.5rem', width: '300px', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {Array(5).fill(0).map((_, index) => (
          <div key={index} className="sk" style={{ height: '90px', borderRadius: '1rem' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {Array(8).fill(0).map((_, index) => (
          <div key={index} className="sk" style={{ height: '230px' }} />
        ))}
      </div>
    </div>
  )
}