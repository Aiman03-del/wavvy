'use client'

import Link from 'next/link'
import { ListMusic, Music2 } from 'lucide-react'

export default function PlaylistsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <ListMusic size={24} color="#A78BFA" />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Playlists
        </h1>
      </div>

      <div style={{
        background: '#16161F',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '1.25rem',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <Music2 size={36} color="#A78BFA" />
        <p style={{ color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
          Playlist management is coming soon.
        </p>
        <Link href="/dashboard/search" style={{ color: '#C4B5FD', textDecoration: 'none', fontWeight: 600 }}>
          Discover songs to add
        </Link>
      </div>
    </div>
  )
}