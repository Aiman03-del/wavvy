'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ListMusic, Music2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Song } from '@/types'

interface PlaylistRow {
  id: string
  name: string
  created_at: string
  playlist_songs?: Array<{ song?: Song | Song[] | null }>
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadPlaylists = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('playlists')
      .select('id,name,created_at,playlist_songs(song:songs(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPlaylists((data || []) as PlaylistRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  const createPlaylist = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setCreating(false)
      return
    }

    const { error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name, is_public: false })

    setCreating(false)
    if (!error) {
      setNewName('')
      await loadPlaylists()
    }
  }

  return (
    <div className="wavvy-page-narrow">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <ListMusic size={24} color="#A78BFA" />
        <h1 className="wavvy-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          Playlists
        </h1>
      </div>

      <div
        style={{
          background: '#16161F',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '1rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.6rem',
        }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          style={{
            flex: 1,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            color: '#F1F5F9',
            padding: '0.7rem 0.8rem',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          type="button"
          onClick={createPlaylist}
          disabled={creating || !newName.trim()}
          style={{
            border: 'none',
            borderRadius: '0.75rem',
            background: creating || !newName.trim() ? 'rgba(59,130,246,0.3)' : '#3B82F6',
            color: '#fff',
            padding: '0 0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={14} />
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      {loading && (
        <div className="wavvy-song-grid">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="wavvy-skeleton wavvy-skeleton-card" />
            ))}
        </div>
      )}

      {!loading && playlists.length === 0 && (
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
          <p style={{ color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
            No playlist yet. Create one above, then add songs from cards.
          </p>
          <Link
            href="/dashboard/search"
            style={{ color: '#C4B5FD', textDecoration: 'none', fontWeight: 600 }}
          >
            Discover songs to add
          </Link>
        </div>
      )}

      {!loading && playlists.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {playlists.map((playlist) => {
            const songs = (playlist.playlist_songs || [])
              .map((row) => (Array.isArray(row.song) ? row.song[0] : row.song))
              .filter(Boolean) as Song[]
            return (
              <div
                key={playlist.id}
                style={{
                  background: '#16161F',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '1rem',
                  padding: '0.9rem 1rem',
                }}
              >
                <p style={{ margin: 0, color: '#F1F5F9', fontWeight: 600 }}>{playlist.name}</p>
                <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>
                  {songs.length} song{songs.length === 1 ? '' : 's'}
                </p>
                {songs.length > 0 && (
                  <p
                    style={{
                      margin: '0.45rem 0 0',
                      color: '#64748B',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {songs.slice(0, 3).map((song) => song.title).join(' • ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}