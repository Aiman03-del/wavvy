'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Crown, Heart, House, LibraryBig, ListMusic, LogOut, Menu, Search, Target, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import WavvyLogo from '@/components/ui/WavvyLogo'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', icon: House, label: 'Home' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/library', icon: LibraryBig, label: 'Your Library' },
  { href: '/dashboard/liked', icon: Heart, label: 'Liked Songs' },
  { href: '/dashboard/playlists', icon: ListMusic, label: 'Playlists' },
  { href: '/dashboard/request', icon: Target, label: 'Request a Song' },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <button
        type="button"
        className="wavvy-mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="wavvy-sidebar-overlay"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`wavvy-sidebar${mobileOpen ? ' open' : ''}`}>
      <style>{`
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background: rgba(255,255,255,0.05) !important; color: #F1F5F9 !important; }
        .nav-item.active { background: rgba(59,130,246,0.12) !important; color: #60A5FA !important; border-right: 2px solid #3B82F6; }
        .logout-btn:hover { background: rgba(239,68,68,0.1) !important; color: #FCA5A5 !important; }
        .admin-link:hover { background: rgba(168,85,247,0.1) !important; color: #C4B5FD !important; }
      `}</style>

      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WavvyLogo href="/dashboard" size={108} zoom={1.45} showLabel={false} />
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Close menu"
          style={{
            position: 'absolute',
            right: '1.25rem',
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          className="wavvy-sidebar-close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`nav-item${isActive ? ' active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  color: isActive ? '#60A5FA' : '#94A3B8',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(255,255,255,0.06)',
          margin: '1rem 0',
        }} />

        {/* Mood Playlists */}
        <p style={{
          color: '#475569',
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.5rem',
          padding: '0 0.85rem',
        }}>Moods</p>

        {[
          { mood: 'happy', icon: Users, label: 'Happy' },
          { mood: 'sad', icon: LibraryBig, label: 'Sad' },
          { mood: 'chill', icon: House, label: 'Chill' },
          { mood: 'party', icon: ListMusic, label: 'Party' },
          { mood: 'focus', icon: Target, label: 'Focus' },
        ].map((m) => {
          const isActive = pathname === `/dashboard/mood/${m.mood}`
          return (
            <Link
              key={m.mood}
              href={`/dashboard/mood/${m.mood}`}
              onClick={closeMobile}
              className={`nav-item${isActive ? ' active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: isActive ? '#60A5FA' : '#94A3B8',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              }}
            >
              <m.icon size={14} />
              {m.label}
            </Link>
          )
        })}

        {/* Admin link */}
        {profile?.role === 'admin' && (
          <>
            <div style={{
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              margin: '1rem 0',
            }} />
            <Link
              href="/admin/stats"
              onClick={closeMobile}
              className={`nav-item admin-link${pathname.startsWith('/admin') ? ' active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: pathname.startsWith('/admin') ? '#C4B5FD' : '#A78BFA',
                fontSize: '0.9rem',
                fontWeight: pathname.startsWith('/admin') ? 600 : 500,
                background: pathname.startsWith('/admin') ? 'rgba(168,85,247,0.12)' : 'transparent',
              }}
            >
              <Crown size={16} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.65rem 0.85rem',
          borderRadius: '0.75rem',
          marginBottom: '4px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#F1F5F9',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile?.username || 'User'}
            </p>
            <p style={{
              fontSize: '0.7rem',
              color: '#475569',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '0.75rem',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    </>
  )
}