'use client'

import Link from 'next/link'
import { LibraryBig, Search } from 'lucide-react'

export default function LibraryPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <LibraryBig size={24} color="#60A5FA" />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Your Library
        </h1>
      </div>

      <div style={{
        background: '#16161F',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '1.25rem',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <Search size={36} color="#3B82F6" />
        <p style={{ color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
          Your saved albums, artists, and collections will appear here.
        </p>
        <Link href="/dashboard/search" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          Search the catalog
        </Link>
      </div>
    </div>
  )
}