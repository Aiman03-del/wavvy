'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ChevronDown, Heart, ListPlus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMusicStore } from '@/store/musicStore'
import PlayerControls from '@/components/ui/player/PlayerControls'
import {
  hasNonLatin,
  parseLrc,
  pickActivePlainLyricIndex,
  pickActiveLrcIndex,
  romanizeToEnglishLetters,
  splitPlainLyricsToLines,
} from '@/lib/lyrics'

export default function FullScreenPlayer() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lyricsScrollRef = useRef<HTMLDivElement>(null)
  const swipeStartXRef = useRef<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([])
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [likedSongIds, setLikedSongIds] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'player' | 'lyrics'>('player')
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

  const romanizedLyrics = useMemo(() => {
    if (!rawLyrics) return ''
    return hasNonLatin(rawLyrics) ? romanizeToEnglishLetters(rawLyrics) : rawLyrics
  }, [rawLyrics])

  const plainLyricsLines = useMemo(
    () => splitPlainLyricsToLines(romanizedLyrics),
    [romanizedLyrics]
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

  const renderedLyricLines = lrcLines.length > 0 ? lrcLines.map((line) => {
    const text = hasNonLatin(line.text) ? romanizeToEnglishLetters(line.text) : line.text
    return text || '...'
  }) : plainLyricsLines

  const activeLyricIndex = lrcLines.length > 0 ? activeLrcIndex : activePlainIndex

  useEffect(() => {
    if (activeView !== 'lyrics') return
    if (!lyricsScrollRef.current) return
    if (activeLyricIndex < 0) return

    const el = lyricsScrollRef.current.querySelector(
      `[data-lyric-idx="${activeLyricIndex}"]`
    ) as HTMLElement | null

    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeLyricIndex, activeView])

  useEffect(() => {
    if (!isFullScreen) return
    setActiveView('player')
  }, [currentSong?.id, isFullScreen])

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
  // Track is 200% wide with two 50% pages, so second page starts at -50%.
  const translatePercent = activeView === 'lyrics' ? -50 : 0

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
          className="wavvy-fullscreen-swiper"
          onPointerDown={(e) => {
            if (showPlaylistModal) return
            swipeStartXRef.current = e.clientX
          }}
          onPointerUp={(e) => {
            if (showPlaylistModal) return
            if (swipeStartXRef.current === null) return
            const deltaX = e.clientX - swipeStartXRef.current
            swipeStartXRef.current = null
            if (Math.abs(deltaX) < 45) return
            if (deltaX < 0) setActiveView('lyrics')
            if (deltaX > 0) setActiveView('player')
          }}
        >
          <div
            className="wavvy-fullscreen-swiper-track"
            style={{ transform: `translateX(${translatePercent}%)` }}
          >
            <div className="wavvy-fullscreen-page wavvy-fullscreen-page--player">
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
            </div>

            <div className="wavvy-fullscreen-page wavvy-fullscreen-page--lyrics">
              <div className="wavvy-lyrics-screen" ref={lyricsScrollRef}>
                {!rawLyrics ? (
                  <p className="wavvy-lyrics-empty">No lyrics found for this song yet.</p>
                ) : (
                  <div className="wavvy-lyrics-lines" role="log" aria-label="Lyrics">
                    {renderedLyricLines.map((line, idx) => {
                      const active = idx === activeLyricIndex
                      return (
                        <p
                          key={`${idx}-${line.slice(0, 16)}`}
                          className={`wavvy-lyrics-line${active ? ' is-active' : ''}`}
                          data-lyric-idx={idx}
                        >
                          {line}
                        </p>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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

        <div className="wavvy-fullscreen-pagination" aria-hidden>
          <button
            type="button"
            className={`wavvy-fullscreen-dot${activeView === 'player' ? ' is-active' : ''}`}
            onClick={() => setActiveView('player')}
          />
          <button
            type="button"
            className={`wavvy-fullscreen-dot${activeView === 'lyrics' ? ' is-active' : ''}`}
            onClick={() => setActiveView('lyrics')}
          />
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
