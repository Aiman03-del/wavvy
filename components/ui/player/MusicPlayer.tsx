'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useMusicStore } from '@/store/musicStore'
import AudioPlayer from '@/components/player/AudioPlayer'

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, volume, progress, duration,
    togglePlay, nextSong, prevSong, setVolume, toggleFullScreen,
  } = useMusicStore()

  const barRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (currentSong && !shown) {
      setShown(true)
      gsap.fromTo(barRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [currentSong])

  if (!currentSong) return <AudioPlayer />

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const seekTo = pct * duration
    ;(window as any).wavvySeek?.(seekTo)
  }

  return (
    <>
      <AudioPlayer />
      <div
        ref={barRef}
        className="music-player-shell"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 'var(--sidebar-width, 240px)',
          right: 0,
          height: '88px',
          background: 'rgba(17,17,24,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          zIndex: 50,
          gap: '1rem',
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            .music-player-shell {
              left: 0 !important;
              height: auto !important;
              padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom)) !important;
              gap: 0.85rem !important;
              flex-wrap: wrap;
            }
            .music-player-shell > div {
              flex: 1 1 100% !important;
            }
          }
        `}</style>
        {/* Song Info */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.85rem',
            flex: '0 0 260px', minWidth: 0, cursor: 'pointer',
          }}
          onClick={toggleFullScreen}
        >
          <img
            src={currentSong.thumbnail_url || `https://img.youtube.com/vi/${currentSong.youtube_id}/mqdefault.jpg`}
            alt={currentSong.title}
            style={{
              width: '52px', height: '52px',
              borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontWeight: 600, fontSize: '0.9rem',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              color: '#F1F5F9',
            }}>{currentSong.title}</p>
            <p style={{
              color: '#94A3B8', fontSize: '0.78rem',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={prevSong} style={btnStyle}>⏮</button>
            <button
              onClick={togglePlay}
              style={{
                width: '42px', height: '42px',
                borderRadius: '50%',
                background: '#3B82F6',
                border: 'none', cursor: 'pointer',
                fontSize: '1rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={nextSong} style={btnStyle}>⏭</button>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '480px' }}>
            <span style={{ color: '#475569', fontSize: '0.72rem', flexShrink: 0 }}>
              {formatTime(progress)}
            </span>
            <div
              onClick={handleSeek}
              style={{
                flex: 1, height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '999px', cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: '#3B82F6',
                borderRadius: '999px',
                transition: 'width 0.5s linear',
              }} />
            </div>
            <span style={{ color: '#475569', fontSize: '0.72rem', flexShrink: 0 }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div style={{
          flex: '0 0 200px', display: 'flex',
          alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end',
        }}>
          <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{
              width: '90px', accentColor: '#3B82F6', cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0.25rem',
  transition: 'color 0.2s',
}