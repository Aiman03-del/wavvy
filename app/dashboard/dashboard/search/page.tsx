'use client'

import { useState, useEffect, useCallback } from 'react'
import { Frown, Music2, PartyPopper, Search, Smile, Target, TrendingUp, Wind, X } from 'lucide-react'
import SongGrid from '@/components/ui/SongGrid'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import type { Song } from '@/types'

const MOOD_ICONS = {
  All: Music2,
  happy: Smile,
  sad: Frown,
  chill: Wind,
  party: PartyPopper,
  focus: Target,
} as const

const GENRES = ['All', 'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Classical', 'Jazz', 'Folk', 'Indie']
const MOODS = ['All', 'happy', 'sad', 'chill', 'party', 'focus']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [selectedMood, setSelectedMood] = useState('All')
  const [searched, setSearched] = useState(false)
  const { playSong, currentSong, isPlaying } = useMusicStore()

  const search = useCallback(async () => {
    setLoading(true)
    setSearched(true)

    let q = supabase.from('songs').select('*')

    if (query.trim()) {
      q = q.or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
    }
    if (selectedGenre !== 'All') {
      q = q.eq('genre', selectedGenre)
    }
    if (selectedMood !== 'All') {
      q = q.eq('mood', selectedMood)
    }

    const { data } = await q.order('play_count', { ascending: false }).limit(40)
    setSongs(data || [])
    setLoading(false)
  }, [query, selectedGenre, selectedMood])

  // Auto-search on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || selectedGenre !== 'All' || selectedMood !== 'All') {
        search()
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, selectedGenre, selectedMood, search])

  // Load trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('songs')
        .select('*')
        .order('play_count', { ascending: false })
        .limit(20)
      setSongs(data || [])
      setLoading(false)
    }
    loadTrending()
  }, [])

  const handlePlay = async (song: Song) => {
    playSong(song, songs)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('recently_played').insert({ user_id: user.id, song_id: song.id })
    await supabase.from('songs').update({ play_count: (song.play_count || 0) + 1 }).eq('id', song.id)
  }

  return (
    <div className="wavvy-page">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .sk { background: #16161F; border-radius: 0.75rem; animation: pulse 1.5s ease infinite; }
        .filter-chip { transition: all 0.18s ease; cursor: pointer; border: none; font-family: inherit; }
        .filter-chip:hover { opacity: 0.85; }
        .search-input:focus { outline: none; border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
      `}</style>

      <header className="wavvy-page-header">
        <h1 className="wavvy-page-greeting">Search</h1>
        <p className="wavvy-page-subtitle">Find songs, artists, albums</p>
      </header>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <span style={{
          position: 'absolute', left: '1rem', top: '50%',
          transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none',
          color: '#94A3B8',
        }}><Search size={18} /></span>
        <input
          className="search-input"
          type="text"
          placeholder="Search songs, artists..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          style={{
            width: '100%',
            padding: '0.9rem 1rem 0.9rem 2.75rem',
            background: '#16161F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            color: '#F1F5F9',
            fontSize: '1rem',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.2s',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: '1rem', top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent', border: 'none',
              color: '#94A3B8', cursor: 'pointer', fontSize: '1.1rem',
            }}
          ><X size={18} /></button>
        )}
      </div>

      {/* Genre Filter */}
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{
          color: '#475569', fontSize: '0.72rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem',
        }}>Genre</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GENRES.map(genre => (
            <button
              key={genre}
              className="filter-chip"
              onClick={() => setSelectedGenre(genre)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: selectedGenre === genre ? 600 : 400,
                background: selectedGenre === genre
                  ? '#3B82F6'
                  : 'rgba(255,255,255,0.05)',
                color: selectedGenre === genre ? '#fff' : '#94A3B8',
                border: selectedGenre === genre
                  ? '1px solid #3B82F6'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Mood Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          color: '#475569', fontSize: '0.72rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem',
        }}>Mood</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MOODS.map(mood => {
            const MoodIcon = MOOD_ICONS[mood as keyof typeof MOOD_ICONS]
            return (
              <button
                key={mood}
                className="filter-chip"
                onClick={() => setSelectedMood(mood)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: selectedMood === mood ? 600 : 400,
                  background: selectedMood === mood
                    ? 'rgba(139,92,246,0.25)'
                    : 'rgba(255,255,255,0.05)',
                  color: selectedMood === mood ? '#A78BFA' : '#94A3B8',
                  border: selectedMood === mood
                    ? '1px solid rgba(139,92,246,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MoodIcon size={14} />
                  {mood === 'All' ? 'All Moods' : mood.charAt(0).toUpperCase() + mood.slice(1)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Label */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
          {query || selectedGenre !== 'All' || selectedMood !== 'All'
            ? `Results ${songs.length > 0 ? `(${songs.length})` : ''}`
            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><TrendingUp size={16} /> Trending</span>}
        </h2>
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner block label="Searching songs..." />}

      {/* Empty State */}
      {!loading && songs.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: '#16161F', borderRadius: '1.25rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#3B82F6' }}><Music2 size={36} /></p>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
            {searched ? 'No songs found. Try a different search.' : 'Start searching for songs!'}
          </p>
        </div>
      )}

      {/* Song Grid */}
      {!loading && songs.length > 0 && (
        <SongGrid
          songs={songs}
          onPlay={handlePlay}
          showPlayCount
          getIsActive={(song) => currentSong?.id === song.id}
          getIsPlaying={(song) => currentSong?.id === song.id && isPlaying}
        />
      )}
    </div>
  )
}