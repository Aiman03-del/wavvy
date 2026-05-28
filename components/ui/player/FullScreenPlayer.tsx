'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ChevronDown, Heart, ListPlus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import PlayerControls from '@/components/ui/player/PlayerControls'
import {
  parseLrc,
  pickActivePlainLyricIndex,
  pickActiveLrcIndex,
  splitPlainLyricsToLines,
} from '@/lib/lyrics'

export default function FullScreenPlayer() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lyricsScrollRef = useRef<HTMLDivElement>(null)
  const lyricsLineRefs = useRef<Array<HTMLParagraphElement | null>>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [likedSongIds, setLikedSongIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics'>('player')
  const [resolvedLyrics, setResolvedLyrics] = useState('')

  const { currentSong, isFullScreen, isPlaying, toggleFullScreen, progress, duration } =
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

  useEffect(() => {
    if (!isFullScreen || !currentSong || !userId) return

    const loadLikedState = async () => {
      const { data } = await supabase
        .from('liked_songs')
        .select('song_id')
        .eq('user_id', userId)
        .eq('song_id', currentSong.id)
        .maybeSingle()

      setLikedSongIds(data ? [currentSong.id] : [])
    }

    loadLikedState()
  }, [currentSong?.id, isFullScreen, userId])

  const rawLyrics = (resolvedLyrics || currentSong?.lyrics || '').trim()
  const lrcLines = useMemo(() => parseLrc(rawLyrics), [rawLyrics])
  const activeLrcIndex = useMemo(
    () => (lrcLines.length > 0 ? pickActiveLrcIndex(lrcLines, progress) : -1),
    [lrcLines, progress]
  )

  const plainLyricsLines = useMemo(
    () => splitPlainLyricsToLines(rawLyrics),
    [rawLyrics]
  )

  const activePlainIndex = useMemo(
    () =>
      pickActivePlainLyricIndex({
        lineCount: plainLyricsLines.length,
        progressSeconds: progress,
        durationSeconds: duration,
      }),
    [duration, plainLyricsLines.length, progress]
  )

  const renderedLyricLines = lrcLines.length > 0
    ? lrcLines.map((line) => line.text || '...')
    : plainLyricsLines

  const activeLyricIndex = lrcLines.length > 0 ? activeLrcIndex : activePlainIndex

  useEffect(() => {
    setActiveTab('player')
  }, [currentSong?.id])

  useEffect(() => {
    if (activeTab !== 'lyrics' || activeLyricIndex < 0) return

    const container = lyricsScrollRef.current
    const activeLine = lyricsLineRefs.current[activeLyricIndex]
    if (!container || !activeLine) return

    const containerRect = container.getBoundingClientRect()
    const lineRect = activeLine.getBoundingClientRect()
    const offset =
      lineRect.top - containerRect.top - container.clientHeight / 2 + lineRect.height / 2

    container.scrollTo({
      top: container.scrollTop + offset,
      behavior: 'smooth',
    })
  }, [activeLyricIndex, activeTab, renderedLyricLines.length])

  useEffect(() => {
    if (!isFullScreen || !currentSong?.id) return

    // Start with whatever came from current list payload.
    setResolvedLyrics(currentSong.lyrics || '')

    // If the in-memory song has no lyrics, fetch fresh value from DB.
    if ((currentSong.lyrics || '').trim()) return

    const loadLyrics = async () => {
      const { data } = await supabase
        .from('songs')
        .select('lyrics')
        .eq('id', currentSong.id)
        .maybeSingle()

      if (data?.lyrics) {
        setResolvedLyrics(data.lyrics)
      }
    }

    loadLyrics()
  }, [currentSong?.id, currentSong?.lyrics, isFullScreen])

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

  const toggleCurrentLike = async () => {
    if (!userId || !currentSong) return

    const isLiked = likedSongIds.includes(currentSong.id)
    if (isLiked) {
      await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', userId)
        .eq('song_id', currentSong.id)
      setLikedSongIds((prev) => prev.filter((id) => id !== currentSong.id))
      return
    }

    const { error } = await supabase
      .from('liked_songs')
      .insert({ user_id: userId, song_id: currentSong.id })

    if (!error) {
      setLikedSongIds((prev) => [...prev, currentSong.id])
    }
  }

  const isCurrentLiked = likedSongIds.includes(currentSong.id)

  return (
    <div
      ref={overlayRef}
      className="wavvy-fullscreen"
      onClick={(e) => {
        // Only close when clicking the backdrop itself, not child elements.
        if (e.target === overlayRef.current) toggleFullScreen()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <div
        ref={panelRef}
        className="wavvy-fullscreen-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wavvy-fullscreen-tabs" role="tablist" aria-label="Fullscreen player tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'player'}
            className={`wavvy-fullscreen-tab${activeTab === 'player' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('player')}
          >
            Player
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'lyrics'}
            className={`wavvy-fullscreen-tab${activeTab === 'lyrics' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('lyrics')}
          >
            Lyrics
          </button>
        </div>

        {activeTab === 'player' ? (
          <div className="wavvy-fullscreen-player-view">
            <div className="wavvy-fullscreen-grid">
              <div className="wavvy-fullscreen-left">
                <div className={`wavvy-fullscreen-art-wrap${isPlaying ? ' is-playing' : ''}`}>
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
              </div>

              <div className="wavvy-fullscreen-right">
                <div className="wavvy-fullscreen-meta">
                  <h2 className="wavvy-fullscreen-title">{currentSong.title}</h2>
                  <p className="wavvy-fullscreen-artist">{currentSong.artist}</p>
                  {currentSong.album && (
                    <p className="wavvy-fullscreen-album">{currentSong.album}</p>
                  )}
                </div>

                <div className="wavvy-fullscreen-controls-area">
                  <PlayerControls
                    variant="fullscreen"
                    leftAction={
                      <button
                        type="button"
                        className="wavvy-player-icon-btn"
                        onClick={() => setShowPlaylistModal(true)}
                        aria-label="Add to playlist"
                      >
                        <ListPlus size={18} />
                      </button>
                    }
                    rightAction={
                      <button
                        type="button"
                        className={`wavvy-player-icon-btn${isCurrentLiked ? ' is-active' : ''}`}
                        onClick={toggleCurrentLike}
                        aria-label={isCurrentLiked ? 'Unlike song' : 'Like song'}
                        aria-pressed={isCurrentLiked}
                      >
                        <Heart size={18} fill={isCurrentLiked ? 'currentColor' : 'none'} />
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="wavvy-fullscreen-lyrics-view">
            <div className="wavvy-lyrics-screen" ref={lyricsScrollRef}>
              {renderedLyricLines.length > 0 ? (
                <div className="wavvy-lyrics-lines">
                  {renderedLyricLines.map((line, index) => (
                    <p
                      key={`${line}-${index}`}
                      ref={(element) => {
                        lyricsLineRefs.current[index] = element
                      }}
                      className={`wavvy-lyrics-line${index === activeLyricIndex ? ' is-active' : ''}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="wavvy-lyrics-empty">
                  No lyrics available for this track.
                </p>
              )}
            </div>
          </div>
        )}

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
