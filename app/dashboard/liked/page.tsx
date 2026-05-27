'use client'

import Link from 'next/link'
import { Heart, Music2 } from 'lucide-react'

export default function LikedPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Heart size={24} color="#EC4899" />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Liked Songs
        </h1>
      </div>

      <div style={{
        background: '#16161F',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '1.25rem',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <Music2 size={36} color="#3B82F6" />
        <p style={{ color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
          Your liked songs will appear here.
        </p>
        <Link href="/dashboard/search" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          Find songs to like
        </Link>
      </div>
    </div>
  )
}