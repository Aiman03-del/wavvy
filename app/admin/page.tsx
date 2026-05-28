'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clock3,
  Crown,
  ExternalLink,
  Frown,
  Music2,
  PartyPopper,
  Pencil,
  Plus,
  Smile,
  Target,
  Trash2,
  UserRound,
  Users,
  Wind,
  XCircle,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Song, Profile } from '@/types'

type Tab = 'songs' | 'requests' | 'users'

const TAB_ICONS = {
  songs: Music2,
  requests: Target,
  users: Users,
} as const

const MOOD_ICONS = {
  happy: Smile,
  sad: Frown,
  chill: Wind,
  party: PartyPopper,
  focus: Target,
} as const
interface SongRequest {
  id: string
  user_id: string
  youtube_url: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles?: { username: string; email: string }
}

const MOODS = ['happy', 'sad', 'chill', 'party', 'focus']
const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Classical', 'Jazz', 'Folk', 'Indie', 'Other']

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('songs')
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // Songs state
  const [songs, setSongs] = useState<Song[]>([])
  const [showAddSong, setShowAddSong] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [songForm, setSongForm] = useState({
    title: '', artist: '', youtube_id: '', album: '',
    genre: '', mood: '', thumbnail_url: '', lyrics: '',
  })
  const [savingSong, setSavingSong] = useState(false)
  const [autoFillingSong, setAutoFillingSong] = useState(false)
  const [lastAutoFilledId, setLastAutoFilledId] = useState('')
  const [autoGeneratingLyrics, setAutoGeneratingLyrics] = useState(false)
  const [lastAutoLyricsId, setLastAutoLyricsId] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<SongRequest | null>(null)

  // Requests state
  const [requests, setRequests] = useState<SongRequest[]>([])
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Users state
  const [users, setUsers] = useState<Profile[]>([])
  const [pendingDeleteSongId, setPendingDeleteSongId] = useState<string | null>(null)
  const [pendingRoleUser, setPendingRoleUser] = useState<Profile | null>(null)

  // Stats
  const [stats, setStats] = useState({ songs: 0, users: 0, requests: 0, pending: 0 })

  // Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setAuthorized(true)
      setLoading(false)
    }
    check()
  }, [router])

  const loadAll = useCallback(async () => {
    const [
      { data: songsData },
      { data: reqData },
      { data: usersData },
    ] = await Promise.all([
      supabase.from('songs').select('*').order('created_at', { ascending: false }),
      supabase.from('song_requests').select('*, profiles(username, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ])

    setSongs(songsData || [])
    setRequests(reqData || [])
    setUsers(usersData || [])
    setStats({
      songs: songsData?.length || 0,
      users: usersData?.length || 0,
      requests: reqData?.length || 0,
      pending: reqData?.filter((request: SongRequest) => request.status === 'pending').length || 0,
    })
  }, [])

  useEffect(() => {
    if (authorized) loadAll()
  }, [authorized, loadAll])

  useEffect(() => {
    const ytId = extractYouTubeId(songForm.youtube_id)

    if (!ytId || editingSong || lastAutoFilledId === ytId) {
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setAutoFillingSong(true)

        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
        )

        if (!response.ok) {
          return
        }

        const data = await response.json() as { title?: string }
        const oembedTitle = data.title?.trim() || ''
        const { title, artist, album } = splitYouTubeTitle(oembedTitle)
        const combinedText = `${oembedTitle} ${title} ${artist}`.toLowerCase()

        setSongForm((current) => ({
          ...current,
          title: current.title || title || oembedTitle,
          artist: current.artist || artist || inferArtistFromTitle(oembedTitle) || current.artist,
          album: current.album || album || current.album,
          genre: current.genre || inferGenreFromText(combinedText) || current.genre,
          mood: current.mood || inferMoodFromText(combinedText) || current.mood,
          thumbnail_url: current.thumbnail_url || `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        }))

        setLastAutoFilledId(ytId)
      } catch {
        // Keep the form usable even if metadata lookup fails.
      } finally {
        setAutoFillingSong(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [editingSong, lastAutoFilledId, songForm.youtube_id])

  useEffect(() => {
    const ytId = extractYouTubeId(songForm.youtube_id)

    if (!ytId) return
    if (lastAutoLyricsId === ytId) return
    if (autoGeneratingLyrics) return
    if (songForm.lyrics.trim()) return
    if (!songForm.title.trim() || !songForm.artist.trim()) return

    const timeout = setTimeout(async () => {
      try {
        setAutoGeneratingLyrics(true)
        const res = await fetch('/api/lyrics/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: songForm.title.trim(),
            artist: songForm.artist.trim(),
            youtubeId: ytId,
          }),
        })

        if (!res.ok) return
        const data = await res.json() as { lyrics?: string }
        const lyrics = (data.lyrics || '').trim()
        if (!lyrics) return

        setSongForm((current) => {
          if (current.lyrics.trim()) return current
          return { ...current, lyrics }
        })
        setLastAutoLyricsId(ytId)
      } catch {
        // Keep the form usable if lyric generation fails.
      } finally {
        setAutoGeneratingLyrics(false)
      }
    }, 650)

    return () => clearTimeout(timeout)
  }, [
    autoGeneratingLyrics,
    lastAutoLyricsId,
    songForm.youtube_id,
    songForm.title,
    songForm.artist,
    songForm.lyrics,
  ])

  // ─── Song CRUD ───────────────────────────────────────

  const openAddSong = () => {
    setEditingSong(null)
    setSelectedRequest(null)
    setSongForm({ title: '', artist: '', youtube_id: '', album: '', genre: '', mood: '', thumbnail_url: '', lyrics: '' })
    setLastAutoFilledId('')
    setLastAutoLyricsId('')
    setShowAddSong(true)
  }

  const openRequestAsSong = (request: SongRequest) => {
    const ytId = extractYouTubeId(request.youtube_url || '')

    if (!ytId) {
      return
    }

    setEditingSong(null)
    setSelectedRequest(request)
    setSongForm({
      title: '',
      artist: '',
      youtube_id: ytId,
      album: '',
      genre: '',
      mood: '',
      thumbnail_url: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      lyrics: '',
    })
    setLastAutoFilledId('')
    setLastAutoLyricsId('')
    setShowAddSong(true)
    setTab('songs')
  }

  const openEditSong = (song: Song) => {
    setEditingSong(song)
    setSongForm({
      title: song.title,
      artist: song.artist,
      youtube_id: song.youtube_id,
      album: song.album || '',
      genre: song.genre || '',
      mood: song.mood || '',
      thumbnail_url: song.thumbnail_url || '',
      lyrics: song.lyrics || '',
    })
    setShowAddSong(true)
  }

  const saveSong = async () => {
    if (!songForm.title.trim() || !songForm.artist.trim() || !songForm.youtube_id.trim()) return
    setSavingSong(true)

    try {
      // Extract video ID from URL if full URL pasted
      let ytId = songForm.youtube_id.trim()
      const urlMatch = ytId.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
      if (urlMatch) ytId = urlMatch[1]

      const payload: Record<string, unknown> = {
        title: songForm.title.trim(),
        artist: songForm.artist.trim(),
        youtube_id: ytId,
        album: songForm.album.trim() || null,
        genre: songForm.genre || null,
        mood: songForm.mood || null,
        lyrics: songForm.lyrics.trim() || null,
        thumbnail_url: songForm.thumbnail_url.trim() ||
          `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      }

      const writeSong = async (data: Record<string, unknown>) => {
        if (editingSong) {
          return await supabase.from('songs').update(data).eq('id', editingSong.id)
        }
        return await supabase.from('songs').insert({ ...data, play_count: 0 })
      }

      let { error } = await writeSong(payload)

      // If the DB schema doesn't have optional columns (album/genre/mood),
      // retry without them so admins can still add songs.
      if (error?.code === 'PGRST204') {
        const reduced = { ...payload }
        const msg = (error.message || '').toLowerCase()
        if (msg.includes("'album'")) delete reduced.album
        if (msg.includes("'genre'")) delete reduced.genre
        if (msg.includes("'mood'")) delete reduced.mood
        if (msg.includes("'lyrics'")) delete reduced.lyrics
        ;({ error } = await writeSong(reduced))
      }

      if (error) {
        toast.error(error.message || 'Failed to save song')
        return
      }

      if (selectedRequest) {
        const { error: reqErr } = await supabase
          .from('song_requests')
          .update({ status: 'approved' })
          .eq('id', selectedRequest.id)
        if (!reqErr) {
          setRequests(prev => prev.map(request => request.id === selectedRequest.id ? { ...request, status: 'approved' } : request))
          setStats(prev => ({
            ...prev,
            pending: selectedRequest.status === 'pending' ? Math.max(prev.pending - 1, 0) : prev.pending,
          }))
        }
      }

      toast.success(editingSong ? 'Song updated' : 'Song added')
      setShowAddSong(false)
      setSelectedRequest(null)
      loadAll()
    } finally {
      setSavingSong(false)
    }
  }

  const deleteSong = async (id: string) => {
    setPendingDeleteSongId(id)
  }

  const confirmDeleteSong = async () => {
    if (!pendingDeleteSongId) return
    const { error } = await supabase.from('songs').delete().eq('id', pendingDeleteSongId)
    if (error) {
      toast.error('Failed to delete song')
      return
    }
    toast.success('Song deleted')
    setPendingDeleteSongId(null)
    loadAll()
  }

  // ─── Requests ─────────────────────────────────────────

  const updateRequest = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('song_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setStats(prev => ({ ...prev, pending: Math.max(prev.pending - 1, 0) }))
  }

  // ─── Users ────────────────────────────────────────────

  const toggleRole = async (user: Profile) => {
    setPendingRoleUser(user)
  }

  const confirmToggleRole = async () => {
    if (!pendingRoleUser) return
    const newRole = pendingRoleUser.role === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', pendingRoleUser.id)
    if (error) {
      toast.error('Failed to update role')
      return
    }
    setUsers(prev =>
      prev.map(u => u.id === pendingRoleUser.id ? { ...u, role: newRole } : u)
    )
    toast.success(`Role updated for ${pendingRoleUser.username}`)
    setPendingRoleUser(null)
  }

  // ─── Loading / Auth ───────────────────────────────────

  if (loading || !authorized) return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid rgba(59,130,246,0.2)',
        borderTop: '3px solid #3B82F6',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const filteredRequests = requestFilter === 'all'
    ? requests
    : requests.filter(r => r.status === requestFilter)

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      fontFamily: "'DM Sans', sans-serif", color: '#F1F5F9',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .tab-btn { transition: all 0.2s; cursor: pointer; border: none; font-family: inherit; }
        .admin-input:focus { outline: none; border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .row-hover { transition: background 0.15s; }
        .row-hover:hover { background: rgba(255,255,255,0.03) !important; }
        .icon-btn { transition: all 0.15s; cursor: pointer; border: none; background: transparent; }
        .icon-btn:hover { opacity: 0.75; transform: scale(1.1); }
        @keyframes pulse { 0%,100%{opacity:.4}50%{opacity:.8} }
        @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .modal-anim { animation: slideIn 0.25s ease; }
      `}</style>

      {/* Top Bar */}
      <div className="wavvy-admin-topbar">
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}
        >←</button>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 800, color: '#A78BFA',
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
        }}><Crown size={18} /> Admin Panel</span>

        <div className="wavvy-admin-tabs">
          {(['songs', 'requests', 'users'] as Tab[]).map(t => (
            <button
              key={t}
              className="tab-btn"
              onClick={() => setTab(t)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: tab === t ? 600 : 400,
                background: tab === t ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: tab === t ? '#A78BFA' : '#94A3B8',
                border: tab === t ? '1px solid rgba(139,92,246,0.35)' : '1px solid transparent',
                position: 'relative',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                {(() => {
                  const TabIcon = TAB_ICONS[t]
                  return <TabIcon size={14} />
                })()}
                {t === 'songs' ? 'Songs' : t === 'requests' ? `Requests${stats.pending > 0 ? ` (${stats.pending})` : ''}` : 'Users'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="wavvy-admin-content">

        {/* Stats Row */}
        <div className="wavvy-admin-stats">
          {[
            { label: 'Total Songs', value: stats.songs, icon: Music2, color: '#3B82F6' },
            { label: 'Total Users', value: stats.users, icon: Users, color: '#10B981' },
            { label: 'Requests', value: stats.requests, icon: Target, color: '#F59E0B' },
            { label: 'Pending', value: stats.pending, icon: Clock3, color: '#EF4444' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '1rem', padding: '1.1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.85rem',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '0.75rem',
                background: `${stat.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>{(() => { const StatIcon = stat.icon; return <StatIcon size={20} /> })()}</div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: stat.color }}>
                  {stat.value}
                </p>
                <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.2rem' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SONGS TAB ─────────────────────────────── */}
        {tab === 'songs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                All Songs ({songs.length})
              </h2>
              <button
                onClick={openAddSong}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: '#3B82F6', border: 'none',
                  borderRadius: '0.75rem', color: '#fff',
                  fontWeight: 600, fontSize: '0.88rem',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >+ Add Song</button>
            </div>

            <div className="wavvy-table-scroll" style={{
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '1.25rem',
            }}>
              <div className="wavvy-table-inner">
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr 160px 90px 90px 80px 90px',
                padding: '0.65rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['', 'Song', 'Artist', 'Genre', 'Mood', 'Plays', 'Actions'].map(h => (
                  <span key={h} style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {songs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                  No songs yet. Add your first song!
                </div>
              ) : songs.map((song, idx) => (
                <div
                  key={song.id}
                  className="row-hover"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr 160px 90px 90px 80px 90px',
                    padding: '0.6rem 1rem',
                    alignItems: 'center',
                    borderBottom: idx < songs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <img
                    src={song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`}
                    alt=""
                    style={{ width: '38px', height: '38px', borderRadius: '0.5rem', objectFit: 'cover' }}
                  />
                  <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </p>
                    {song.album && (
                      <p style={{ color: '#475569', fontSize: '0.74rem' }}>{song.album}</p>
                    )}
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.artist}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{song.genre || '—'}</span>
                  <span style={{ fontSize: '0.8rem' }}>
                    {song.mood ? (() => {
                      const MoodIcon = MOOD_ICONS[song.mood as keyof typeof MOOD_ICONS]
                      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><MoodIcon size={14} /> {song.mood}</span>
                    })() : '—'}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>
                    {(song.play_count || 0).toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="icon-btn"
                      onClick={() => openEditSong(song)}
                      style={{ color: '#60A5FA', fontSize: '0.9rem', padding: '0.3rem' }}
                      title="Edit"
                    ><Pencil size={14} /></button>
                    <button
                      className="icon-btn"
                      onClick={() => deleteSong(song.id)}
                      style={{ color: '#F87171', fontSize: '0.9rem', padding: '0.3rem' }}
                      title="Delete"
                    ><Trash2 size={14} /></button>
                    <a
                      href={`https://youtube.com/watch?v=${song.youtube_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#94A3B8', fontSize: '0.9rem', padding: '0.3rem', textDecoration: 'none' }}
                      title="Open in YouTube"
                    ><ExternalLink size={14} /></a>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ──────────────────────────── */}
        {tab === 'requests' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  className="tab-btn"
                  onClick={() => setRequestFilter(f)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: requestFilter === f ? 600 : 400,
                    background: requestFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: requestFilter === f ? '#F1F5F9' : '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textTransform: 'capitalize',
                  }}
                >
                  {f} {f === 'pending' && stats.pending > 0 ? `(${stats.pending})` : ''}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '3rem',
                background: '#16161F', borderRadius: '1.25rem',
                border: '1px solid rgba(255,255,255,0.06)', color: '#475569',
              }}>
                No {requestFilter === 'all' ? '' : requestFilter} requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {filteredRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => req.status === 'pending' && openRequestAsSong(req)}
                    className={req.status === 'pending' ? 'row-hover' : undefined}
                    style={{
                    background: '#16161F',
                    border: `1px solid ${req.status === 'pending' ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '1rem',
                    padding: '1rem 1.25rem',
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    flexWrap: 'wrap',
                    cursor: req.status === 'pending' ? 'pointer' : 'default',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          YouTube request
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p style={{ color: '#94A3B8', fontSize: '0.82rem', wordBreak: 'break-all' }}>{req.youtube_url}</p>
                      {req.notes && (
                        <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.35rem', fontStyle: 'italic' }}>
                          "{req.notes}"
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        {req.profiles && (
                          <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <UserRound size={12} /> {req.profiles.username}
                            </span>
                          </span>
                        )}
                        {req.youtube_url && (
                          <a
                            href={req.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ color: '#60A5FA', fontSize: '0.75rem', textDecoration: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <ExternalLink size={12} /> YouTube Link
                            </span>
                          </a>
                        )}
                        <span style={{ color: '#475569', fontSize: '0.73rem' }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openRequestAsSong(req)
                          }}
                          style={{
                            padding: '0.45rem 1rem',
                            background: 'rgba(96,165,250,0.15)',
                            border: '1px solid rgba(96,165,250,0.3)',
                            borderRadius: '0.6rem', color: '#60A5FA',
                            fontSize: '0.82rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} />Add Song</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateRequest(req.id, 'approved')
                          }}
                          style={{
                            padding: '0.45rem 1rem',
                            background: 'rgba(52,211,153,0.15)',
                            border: '1px solid rgba(52,211,153,0.3)',
                            borderRadius: '0.6rem', color: '#34D399',
                            fontSize: '0.82rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          }}
                        ><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CheckCircle2 size={14} />Approve</span></button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateRequest(req.id, 'rejected')
                          }}
                          style={{
                            padding: '0.45rem 1rem',
                            background: 'rgba(248,113,113,0.1)',
                            border: '1px solid rgba(248,113,113,0.25)',
                            borderRadius: '0.6rem', color: '#F87171',
                            fontSize: '0.82rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          }}
                        ><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><XCircle size={14} />Reject</span></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────── */}
        {tab === 'users' && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
              All Users ({users.length})
            </h2>

            <div className="wavvy-table-scroll" style={{
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '1.25rem',
            }}>
              <div className="wavvy-table-inner">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 200px 90px 120px 100px',
                padding: '0.65rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['', 'Username', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <span key={h} style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {users.map((user, idx) => (
                <div
                  key={user.id}
                  className="row-hover"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr 200px 90px 120px 100px',
                    padding: '0.65rem 1rem',
                    alignItems: 'center',
                    borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: user.role === 'admin'
                      ? 'linear-gradient(135deg, #A855F7, #6366F1)'
                      : 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  }}>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <span style={{ fontWeight: 500, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                  <span>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.74rem', fontWeight: 600,
                      background: user.role === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.1)',
                      color: user.role === 'admin' ? '#C4B5FD' : '#60A5FA',
                      border: `1px solid ${user.role === 'admin' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.2)'}`,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {user.role === 'admin' ? <Crown size={12} /> : <UserRound size={12} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </span>
                  </span>
                  <span style={{ color: '#475569', fontSize: '0.78rem' }}>
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleRole(user)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem', fontWeight: 600,
                      color: user.role === 'admin' ? '#F87171' : '#A78BFA',
                      border: `1px solid ${user.role === 'admin' ? 'rgba(248,113,113,0.25)' : 'rgba(168,85,247,0.25)'}`,
                      background: user.role === 'admin' ? 'rgba(248,113,113,0.08)' : 'rgba(168,85,247,0.08)',
                    }}
                  >
                    {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </button>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD/EDIT SONG MODAL ───────────────────────── */}
      {showAddSong && (
        <div
          onClick={() => setShowAddSong(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-anim"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1.5rem',
              padding: '1.75rem',
              width: '100%', maxWidth: '520px',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  {editingSong ? <Pencil size={16} /> : <Plus size={16} />}
                  {editingSong ? 'Edit Song' : 'Add New Song'}
                </span>
              </h2>
              {selectedRequest && (
                <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.35rem', wordBreak: 'break-all' }}>
                  Requested link: {selectedRequest.youtube_url}
                </p>
              )}
              <button
                onClick={() => setShowAddSong(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.1rem' }}
              ><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* YouTube ID / URL */}
              <div>
                <label style={labelStyle}>YouTube ID or URL <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="dQw4w9WgXcQ or full YouTube URL"
                  value={songForm.youtube_id}
                  onChange={e => {
                    const val = e.target.value
                    const match = val.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
                    setSongForm(p => ({ ...p, youtube_id: match ? match[1] : val }))
                  }}
                  style={inputStyle}
                />
                {autoFillingSong && !editingSong && (
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.45rem' }}>
                    Auto-filling song details...
                  </p>
                )}
                {songForm.youtube_id.length === 11 && (
                  <img
                    src={`https://img.youtube.com/vi/${songForm.youtube_id}/mqdefault.jpg`}
                    alt="Preview"
                    style={{ width: '100%', borderRadius: '0.65rem', marginTop: '0.5rem', maxHeight: '140px', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label style={labelStyle}>Song Title <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="admin-input" type="text" placeholder="Title" value={songForm.title}
                  onChange={e => setSongForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
              </div>

              {/* Artist */}
              <div>
                <label style={labelStyle}>Artist <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="admin-input" type="text" placeholder="Artist name" value={songForm.artist}
                  onChange={e => setSongForm(p => ({ ...p, artist: e.target.value }))} style={inputStyle} />
              </div>

              {/* Album */}
              <div>
                <label style={labelStyle}>Album <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input className="admin-input" type="text" placeholder="Album name" value={songForm.album}
                  onChange={e => setSongForm(p => ({ ...p, album: e.target.value }))} style={inputStyle} />
              </div>

              {/* Genre + Mood */}
              <div className="wavvy-form-grid-2">
                <div>
                  <label style={labelStyle}>Genre</label>
                  <select className="admin-input" value={songForm.genre}
                    onChange={e => setSongForm(p => ({ ...p, genre: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Auto</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Mood</label>
                  <select className="admin-input" value={songForm.mood}
                    onChange={e => setSongForm(p => ({ ...p, mood: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Auto</option>
                    {MOODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Custom Thumbnail */}
              <div>
                <label style={labelStyle}>Custom Thumbnail URL <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input className="admin-input" type="url" placeholder="Leave empty to use YouTube thumbnail"
                  value={songForm.thumbnail_url}
                  onChange={e => setSongForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                  style={inputStyle} />
              </div>

              {/* Lyrics */}
              <div>
                <label style={labelStyle}>
                  Lyrics <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="admin-input"
                  placeholder="Auto-generates when empty (after Title + Artist are filled)"
                  value={songForm.lyrics}
                  onChange={e => setSongForm(p => ({ ...p, lyrics: e.target.value }))}
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: 1.5 }}
                />
                {autoGeneratingLyrics && (
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '0.45rem' }}>
                    Generating lyrics…
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowAddSong(false)}
                  style={{
                    flex: 1, padding: '0.8rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.85rem', color: '#94A3B8',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem',
                  }}
                >Cancel</button>
                <button
                  onClick={saveSong}
                  disabled={savingSong || !songForm.title || !songForm.artist || !songForm.youtube_id}
                  style={{
                    flex: 2, padding: '0.8rem',
                    background: savingSong || !songForm.title || !songForm.artist || !songForm.youtube_id
                      ? 'rgba(59,130,246,0.3)' : '#3B82F6',
                    border: 'none', borderRadius: '0.85rem',
                    color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                    cursor: savingSong ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {savingSong ? 'Saving...' : editingSong ? 'Save Changes' : 'Add Song'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(pendingDeleteSongId || pendingRoleUser) && (
        <div
          onClick={() => {
            setPendingDeleteSongId(null)
            setPendingRoleUser(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-anim"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#16161F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1rem',
              padding: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              {pendingDeleteSongId ? 'Delete Song?' : 'Change User Role?'}
            </h3>
            <p style={{ margin: '0.5rem 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
              {pendingDeleteSongId
                ? 'This action cannot be undone.'
                : `Make ${pendingRoleUser?.username} ${
                    pendingRoleUser?.role === 'admin' ? 'a regular user' : 'an admin'
                  }?`}
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteSongId(null)
                  setPendingRoleUser(null)
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.7rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={pendingDeleteSongId ? confirmDeleteSong : confirmToggleRole}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.7rem',
                  border: 'none',
                  background: pendingDeleteSongId ? '#EF4444' : '#8B5CF6',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    pending: { color: '#FCD34D', bg: 'rgba(252,211,77,0.1)', border: 'rgba(252,211,77,0.2)', label: 'Pending' },
    approved: { color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', label: 'Approved' },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Rejected' },
  }
  const s = map[status as keyof typeof map] || map.pending
  return (
    <span style={{
      padding: '0.15rem 0.6rem', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>{status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'}</span>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#94A3B8',
  fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.72rem 1rem',
  background: '#0A0A0F',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem', color: '#F1F5F9',
  fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s',
}

function extractYouTubeId(value: string) {
  const trimmed = value.trim()
  const urlMatch = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  if (urlMatch) return urlMatch[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return ''
}

function splitYouTubeTitle(rawTitle: string) {
  const cleanedTitle = normalizeTitle(rawTitle).replace(/\s*\(.*?\)\s*$/g, '').trim()
  const parts = cleanedTitle.split(/\s[-|•:]\s/)

  if (parts.length >= 2) {
    const first = cleanTitlePart(parts[0])
    const second = cleanTitlePart(parts.slice(1).join(' - '))
    const firstLooksArtist = looksLikeArtistName(first)
    const secondLooksArtist = looksLikeArtistName(second)

    const useSwapped = !firstLooksArtist && secondLooksArtist

    return {
      title: (useSwapped ? first : second) || cleanedTitle,
      artist: useSwapped ? second : first,
      album: inferAlbumFromTitle(rawTitle),
    }
  }

  return {
    title: cleanedTitle || rawTitle,
    artist: inferArtistFromTitle(rawTitle),
    album: inferAlbumFromTitle(rawTitle),
  }
}

function inferArtistFromTitle(title: string) {
  const match = title.match(/^(.+?)\s[-|•:]\s(.+)$/)
  if (match) return match[1].trim()
  const topicMatch = title.match(/^(.*?)\s*-\s*Topic$/i)
  if (topicMatch) return topicMatch[1].trim()
  return ''
}

function inferAlbumFromTitle(title: string) {
  const normalized = normalizeTitle(title)

  const bracketMatch = normalized.match(/\[([^\]]{2,})\]/)
  if (bracketMatch?.[1]) return bracketMatch[1].trim()

  // (Album: Name) / (from "Name") / (EP: Name) etc
  const parenMatch = normalized.match(/\(([^)]{2,})\)/)
  if (parenMatch?.[1]) {
    const inside = parenMatch[1].trim()
    const labeled = inside.match(/^(?:album|ep|lp|ost|soundtrack)\s*[:\-]\s*(.+)$/i)
    if (labeled?.[1]) return labeled[1].trim()
    const fromQuoted = inside.match(/^(?:from|off|taken from)\s*["“”'](.+?)["“”']$/i)
    if (fromQuoted?.[1]) return fromQuoted[1].trim()
    if (/\b(album|ep|lp|ost|soundtrack)\b/i.test(inside)) return inside
  }

  // from "Album Name" / from Album Name
  const fromQuoted = normalized.match(/\bfrom\s*["“”'](.+?)["“”']/i)
  if (fromQuoted?.[1]) return fromQuoted[1].trim()
  const fromPlain = normalized.match(/\bfrom\s+([^|•\-–—]{3,})/i)
  if (fromPlain?.[1]) return fromPlain[1].trim()

  // Album: Name | ...
  const pipeAlbum = normalized.match(/\balbum\s*[:\-]\s*([^|]+)\b/i)
  if (pipeAlbum?.[1]) return pipeAlbum[1].trim()

  return ''
}

function inferGenreFromText(text: string) {
  const t = normalizeTextForInference(text)
  if (/(hip\s?hop|rap|trap|drill|grime|boom bap)/.test(t)) return 'Hip-Hop'
  if (/(r&b|rnb|soul|neo\s?soul)/.test(t)) return 'R&B'
  if (/(rock|metal|punk|pop punk|hardcore)/.test(t)) return 'Rock'
  if (/(classical|orchestra|piano(?!\s?tutorial)|sonata|symphony|concerto|mozart|beethoven|chopin)/.test(t)) return 'Classical'
  if (/(jazz|swing|blues|bossa|bebop)/.test(t)) return 'Jazz'
  if (/(electronic|edm|dance|remix|dj|house|techno|trance|dubstep|dnb|drum\s?and\s?bass)/.test(t)) return 'Electronic'
  if (/(indie|alternative|alt\b|acoustic|folk|singer[-\s]?songwriter|lofi|lo-fi)/.test(t)) return 'Indie'
  if (/\bpop\b/.test(t)) return 'Pop'
  return ''
}

function inferMoodFromText(text: string) {
  const t = normalizeTextForInference(text)

  // Strong signals first
  if (/(sad|blue|lonely|cry|tears|broken|heartbreak|depress|melanchol)/.test(t)) return 'sad'
  if (/(party|club|festival|turn up|upbeat|dancehall|banger)/.test(t)) return 'party'
  if (/(chill|calm|relax|lofi|lo-fi|ambient|sleep|nightdrive|vibes)/.test(t)) return 'chill'
  if (/(focus|study|work|concentrat|instrumental|beats to study|coding music)/.test(t)) return 'focus'
  if (/(happy|joy|feel good|good vibes|summer|smile|love song)/.test(t)) return 'happy'

  // Fallbacks: common video labels implying vibe
  if (/\b(instrumental|piano|beats)\b/.test(t)) return 'focus'
  return ''
}

function normalizeTitle(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*[\|•]\s*/g, ' | ')
    .replace(/\s*[-–—]\s*/g, ' - ')
    .trim()
}

function cleanTitlePart(value: string) {
  return normalizeTitle(value)
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(official\s*(video|audio)|music\s*video|lyrics?|lyric\s*video|audio|video|hd|4k|mv|visualizer|performance|live)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeArtistName(value: string) {
  if (!value) return false
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0) return false
  if (words.length > 5) return false
  if (value.length > 42) return false
  if (/[!?]/.test(value)) return false
  return true
}

function normalizeTextForInference(value: string) {
  const lowered = value.toLowerCase()
  // strip noisy/overcommon tokens so keyword matching works better
  return lowered
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(official\s*(video|audio)|music\s*video|lyrics?|lyric\s*video|audio|video|hd|4k|mv|visualizer|performance|live|feat\.?|ft\.?|remaster(?:ed)?|version|edit|explicit|clean)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}