'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock3, Music2, Plus, Play, Search, Shuffle, Sparkles, Trash2, X } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import { shuffleArray } from '@/lib/player'
import type { Playlist, PlaylistSong, Song } from '@/types'

type PlaylistWithSongs = Playlist & {
  playlist_songs?: Array<PlaylistSong & { song?: Song | Song[] | null }>
}

export default function PlaylistDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const playlistId = params?.id
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null)
  const [loading, setLoading] = useState(true)
  const [busySongId, setBusySongId] = useState<string | null>(null)
  const [deletingPlaylist, setDeletingPlaylist] = useState(false)
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingSongId, setAddingSongId] = useState<string | null>(null)
  const { playSong } = useMusicStore()

  useEffect(() => {
    const load = async () => {
      if (!playlistId) return

      const { data, error } = await supabase
        .from('playlists')
        .select('*, playlist_songs(*, song:songs(*))')
        .eq('id', playlistId)
        .maybeSingle()

      if (!error && data) {
        setPlaylist(data as PlaylistWithSongs)
      }
      setLoading(false)
    }

    load()
  }, [playlistId])

  const songs = useMemo(() => {
    return (playlist?.playlist_songs || [])
      .map((row) => (Array.isArray(row.song) ? row.song[0] : row.song))
      .filter(Boolean) as Song[]
  }, [playlist])

  const playPlaylist = (song: Song) => {
    playSong(song, songs)
  }

  const playShuffledPlaylist = () => {
    if (songs.length === 0) return
    const shuffled = shuffleArray(songs)
    useMusicStore.setState({ isShuffle: true })
    playSong(shuffled[0], shuffled)
  }

  const openAddSongModal = () => {
    setShowAddSongModal(true)
    setSearchQuery('')
    setSearchResults([])
  }

  const closeAddSongModal = () => {
    setShowAddSongModal(false)
    setSearchQuery('')
    setSearchResults([])
  }

  useEffect(() => {
    if (!showAddSongModal) return

    const searchSongs = async () => {
      setSearchLoading(true)

      let queryBuilder = supabase.from('songs').select('*')
      const query = searchQuery.trim()

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
      }

      const { data } = await queryBuilder.order('play_count', { ascending: false }).limit(20)
      const existingSongIds = new Set(songs.map((song) => song.id))
      setSearchResults((data || []).filter((song) => !existingSongIds.has(song.id)) as Song[])
      setSearchLoading(false)
    }

    const timer = setTimeout(() => {
      void searchSongs()
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, showAddSongModal, songs])

  const addSongToPlaylist = async (song: Song) => {
    if (!playlistId) return
    setAddingSongId(song.id)

    const { data: existing } = await supabase
      .from('playlist_songs')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('song_id', song.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: song.id,
          position: songs.length,
        })

      if (!error) {
        setPlaylist((current) => {
          if (!current) return current
          return {
            ...current,
            playlist_songs: [
              ...(current.playlist_songs || []),
              {
                id: crypto.randomUUID(),
                playlist_id: playlistId,
                song_id: song.id,
                position: songs.length,
                added_at: new Date().toISOString(),
                song,
              },
            ],
          }
        })
      }
    }

    setAddingSongId(null)
  }

  const removeSongFromPlaylist = async (songId: string) => {
    if (!playlistId || !songId) return
    setBusySongId(songId)

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId)

    if (!error) {
      setPlaylist((current) => {
        if (!current) return current
        return {
          ...current,
          playlist_songs: (current.playlist_songs || []).filter((row) => {
            const rowSong = Array.isArray(row.song) ? row.song[0] : row.song
            return rowSong?.id !== songId
          }),
        }
      })
    }

    setBusySongId(null)
  }

  const deletePlaylist = async () => {
    if (!playlistId) return
    const confirmed = window.confirm('Delete this playlist? This cannot be undone.')
    if (!confirmed) return

    setDeletingPlaylist(true)

    await supabase.from('playlist_songs').delete().eq('playlist_id', playlistId)
    const { error } = await supabase.from('playlists').delete().eq('id', playlistId)

    setDeletingPlaylist(false)

    if (!error) {
      router.push('/dashboard/playlists')
    }
  }

  const coverImage = songs[0]?.thumbnail_url || (songs[0]?.youtube_id
    ? `https://img.youtube.com/vi/${songs[0].youtube_id}/mqdefault.jpg`
    : '')

  const totalDurationLabel = songs.length > 0 ? `${songs.length} track${songs.length === 1 ? '' : 's'}` : '0 tracks'
  const accent = playlist?.name?.trim().toLowerCase().includes('liked') ? '#3B82F6' : '#A78BFA'

  if (loading) {
    return <LoadingSpinner block label="Loading playlist..." />
  }

  if (!playlist) {
    return (
      <div className="wavvy-page-narrow">
        <p style={{ color: '#94A3B8' }}>Playlist not found.</p>
        <Link href="/dashboard/playlists" style={{ color: '#A78BFA', textDecoration: 'none' }}>
          Go back to playlists
        </Link>
      </div>
    )
  }

  return (
    <div className="wavvy-page-narrow">
      <button
        type="button"
        onClick={() => router.push('/dashboard/playlists')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: 'none',
          background: 'transparent',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(139,92,246,0.24), rgba(22,22,31,0.95) 55%, #16161F 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 24px 80px rgba(0,0,0,0.26)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '164px',
              height: '164px',
              borderRadius: '1.3rem',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(168,85,247,0.35))',
              border: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt={playlist.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                <Music2 size={42} color="#C4B5FD" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <button
              type="button"
              onClick={deletePlaylist}
              disabled={deletingPlaylist}
              title="Delete playlist"
              aria-label="Delete playlist"
              style={{
                position: 'absolute',
                top: '-0.2rem',
                right: '0',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '1px solid rgba(248,113,113,0.28)',
                background: 'rgba(248,113,113,0.1)',
                color: '#F87171',
                display: 'grid',
                placeItems: 'center',
                cursor: deletingPlaylist ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={18} />
            </button>

            <p style={{ margin: 0, color: '#C4B5FD', fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Playlist
            </p>
            <h1 style={{ margin: '0.3rem 0 0', color: '#F8FAFC', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1, fontWeight: 800 }}>
              {playlist.name}
            </h1>
            <p style={{ margin: '0.85rem 0 0', color: '#94A3B8', maxWidth: '60ch' }}>
              A clean queue of your songs, organized in one place with quick play access.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => songs[0] && playPlaylist(songs[0])}
                disabled={songs.length === 0}
                title="Play"
                aria-label="Play"
                style={{
                  width: '46px',
                  height: '46px',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  borderRadius: '50%',
                  background: songs.length === 0 ? 'rgba(59,130,246,0.28)' : accent,
                  color: '#fff',
                  cursor: songs.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={18} fill="currentColor" />
              </button>

              <button
                type="button"
                onClick={playShuffledPlaylist}
                disabled={songs.length === 0}
                title="Shuffle play"
                aria-label="Shuffle play"
                style={{
                  width: '46px',
                  height: '46px',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid rgba(96,165,250,0.25)',
                  borderRadius: '50%',
                  background: 'rgba(96,165,250,0.1)',
                  color: '#60A5FA',
                  cursor: songs.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Shuffle size={18} />
              </button>

              <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={15} /> {totalDurationLabel}
              </span>
              <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock3 size={15} /> Keep adding from the player modal
              </span>
            </div>
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div
          style={{
            background: '#16161F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '1.25rem',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <Music2 size={36} color="#A78BFA" />
          <p style={{ color: '#94A3B8', marginTop: '1rem' }}>This playlist has no songs yet.</p>
          <button
            type="button"
            onClick={openAddSongModal}
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: '999px',
              background: 'rgba(52,211,153,0.1)',
              color: '#34D399',
              padding: '0.65rem 1rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Plus size={16} /> Add songs
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr 1fr 110px 96px',
              alignItems: 'center',
              padding: '0 1rem 0.55rem',
              color: '#64748B',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <span>Album/Genre</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {songs.map((song, index) => (
            <div
              key={song.id}
              onClick={() => playPlaylist(song)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  playPlaylist(song)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 1rem',
                borderRadius: '1.05rem',
                border: '1px solid rgba(255,255,255,0.06)',
                background: '#16161F',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <span style={{ width: '28px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                {index + 1}
              </span>
              <img
                src={song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`}
                alt=""
                style={{ width: '46px', height: '46px', borderRadius: '0.8rem', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: '#F1F5F9', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {song.title}
                </p>
                <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>
                  {song.artist}
                </p>
              </div>
              <span style={{ color: '#64748B', fontSize: '0.82rem' }}>
                {song.album || song.genre || 'Track'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: '#60A5FA', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Play size={14} /> Play
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void removeSongFromPlaylist(song.id)
                  }}
                  disabled={busySongId === song.id}
                  style={{
                    border: '1px solid rgba(248,113,113,0.22)',
                    borderRadius: '999px',
                    background: 'rgba(248,113,113,0.08)',
                    color: '#F87171',
                    padding: '0.45rem 0.7rem',
                    cursor: busySongId === song.id ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddSongModal && (
        <div
          onClick={closeAddSongModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflow: 'hidden',
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1.4rem',
              boxShadow: '0 30px 100px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ margin: 0, color: '#C4B5FD', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  Add songs to playlist
                </p>
                <h3 style={{ margin: '0.25rem 0 0', color: '#F8FAFC', fontSize: '1.05rem' }}>
                  Search and add tracks
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAddSongModal}
                aria-label="Close add songs modal"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#94A3B8',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.2rem 0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, artist, or album"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem 0.9rem 2.7rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#0F1016',
                    color: '#F1F5F9',
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '0 1.2rem 1.2rem', overflowY: 'auto' }}>
              {searchLoading ? (
                <LoadingSpinner block label="Searching songs..." size={28} />
              ) : searchResults.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: '1.5rem 0' }}>
                  No matching songs found.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {searchResults.map((song) => (
                    <div
                      key={song.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        padding: '0.75rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: '#0F1016',
                      }}
                    >
                      <img
                        src={song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`}
                        alt=""
                        style={{ width: '46px', height: '46px', borderRadius: '0.75rem', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: '#F8FAFC', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {song.title}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>
                          {song.artist}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void addSongToPlaylist(song)}
                        disabled={addingSongId === song.id}
                        style={{
                          border: '1px solid rgba(52,211,153,0.25)',
                          borderRadius: '999px',
                          background: 'rgba(52,211,153,0.1)',
                          color: '#34D399',
                          padding: '0.55rem 0.85rem',
                          fontWeight: 700,
                          cursor: addingSongId === song.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Plus size={14} /> {addingSongId === song.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}