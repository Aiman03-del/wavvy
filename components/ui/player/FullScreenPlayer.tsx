'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ChevronDown, ListPlus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import PlayerControls from '@/components/ui/player/PlayerControls'

export default function FullScreenPlayer() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  const { currentSong, isFullScreen, isPlaying, toggleFullScreen } =
    useMusicStore()

  const filteredPlaylists = useMemo(
    () =>
      playlists.filter(
        (playlist) => playlist.name.trim().toLowerCase() !== 'liked playlist'
      ),
    [playlists]
  )

  useEffect(() => {
    if (!isFullScreen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullScreen])

  useEffect(() => {
    if (!isFullScreen || !overlayRef.current || !panelRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      gsap.fromTo(
        panelRef.current,
        { scale: 0.88, opacity: 0, y: 48 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      )
    })

    return () => ctx.revert()
  }, [isFullScreen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) toggleFullScreen()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFullScreen, toggleFullScreen])

  useEffect(() => {
    if (!isFullScreen) return

    const loadPlaylists = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      const { data } = await supabase
        .from('playlists')
        .select('id,name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPlaylists((data || []) as Array<{ id: string; name: string }>)
    }

    loadPlaylists()
  }, [isFullScreen])

  if (!isFullScreen || !currentSong) return null

  const thumb =
    currentSong.thumbnail_url ||
    `https://img.youtube.com/vi/${currentSong.youtube_id}/maxresdefault.jpg`

  const addSongToPlaylist = async (playlistId: string) => {
    if (!playlistId) return
    const { data: existing } = await supabase
      .from('playlist_songs')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('song_id', currentSong.id)
      .maybeSingle()
    if (existing) return

    const { data: tail } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    await supabase.from('playlist_songs').insert({
      playlist_id: playlistId,
      song_id: currentSong.id,
      position: (tail?.position ?? -1) + 1,
    })
  }

  const createPlaylist = async () => {
    if (!userId) return
    const name = newPlaylistName.trim()
    if (!name) return

    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name, is_public: false })
      .select('id,name')
      .single()

    if (error || !data) return
    setPlaylists((prev) => [data as { id: string; name: string }, ...prev])
    setNewPlaylistName('')
    await addSongToPlaylist(data.id)
  }

  return (
    <div
      ref={overlayRef}
      className="wavvy-fullscreen"
      onClick={toggleFullScreen}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <div
        ref={panelRef}
        className="wavvy-fullscreen-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="wavvy-fullscreen-close"
          onClick={toggleFullScreen}
          aria-label="Minimize player"
        >
          <ChevronDown size={28} />
        </button>

        <div
          className={`wavvy-fullscreen-art-wrap${isPlaying ? ' is-playing' : ''}`}
        >
          <img
            className="wavvy-fullscreen-art"
            src={thumb}
            alt=""
            onError={(e) => {
              const img = e.currentTarget
              if (!img.src.includes('mqdefault')) {
                img.src = `https://img.youtube.com/vi/${currentSong.youtube_id}/mqdefault.jpg`
              }
            }}
          />
        </div>

        <div className="wavvy-fullscreen-meta">
          <h2 className="wavvy-fullscreen-title">{currentSong.title}</h2>
          <p className="wavvy-fullscreen-artist">{currentSong.artist}</p>
          {currentSong.album && (
            <p className="wavvy-fullscreen-album">{currentSong.album}</p>
          )}
        </div>

        <PlayerControls variant="fullscreen" />
        <div className="wavvy-fullscreen-playlist-wrap">
          <button
            type="button"
            className="wavvy-fullscreen-playlist-btn"
            onClick={() => setShowPlaylistModal(true)}
            aria-label="Add to playlist"
          >
            <ListPlus size={18} />
            <span>Add to playlist</span>
          </button>
        </div>

        {showPlaylistModal && (
          <div
            className="wavvy-fullscreen-playlist-modal-backdrop"
            onClick={(e) => {
              e.stopPropagation()
              setShowPlaylistModal(false)
            }}
          >
            <div
              className="wavvy-fullscreen-playlist-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wavvy-fullscreen-playlist-modal-head">
                <h3>Add to playlist</h3>
                <button
                  type="button"
                  className="wavvy-fullscreen-playlist-modal-close"
                  onClick={() => setShowPlaylistModal(false)}
                  aria-label="Close playlist modal"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <div className="wavvy-fullscreen-playlist-create">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New playlist name"
                  className="wavvy-fullscreen-playlist-input"
                />
                <button
                  type="button"
                  className="wavvy-fullscreen-playlist-create-btn"
                  onClick={createPlaylist}
                  aria-label="Create playlist"
                >
                  <Plus size={14} />
                </button>
              </div>

              {filteredPlaylists.length > 0 ? (
                <div className="wavvy-fullscreen-playlist-list">
                  {filteredPlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      className="wavvy-fullscreen-playlist-item"
                      onClick={() => addSongToPlaylist(playlist.id)}
                    >
                      {playlist.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="wavvy-fullscreen-playlist-empty">
                  No playlist found. Create one first.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
