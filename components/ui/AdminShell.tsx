'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECTION_ROUTES,
  type AdminSection,
} from '@/lib/admin-nav'

export default function AdminShell({
  activeSection,
  stats,
  children,
}: {
  activeSection: AdminSection
  stats: { songs: number; users: number; requests: number; pending: number; artists: number }
  children: ReactNode
}) {
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const sections = ADMIN_NAV_ITEMS

  const sectionLabel = (section: AdminSection) => {
    if (section === 'songs') return 'Songs'
    if (section === 'requests') {
      return `Requests${stats.pending > 0 ? ` (${stats.pending})` : ''}`
    }
    if (section === 'artists') {
      return `Artists${stats.artists > 0 ? ` (${stats.artists})` : ''}`
    }
    if (section === 'users') return 'Users'
    return 'Stats'
  }

  const navigate = (section: AdminSection) => {
    setMobileNavOpen(false)
    router.push(ADMIN_SECTION_ROUTES[section])
  }

  return (
    <div className="admin-shell-page">
      <style>{`
        .admin-shell-page {
          min-height: 100vh;
          background: #0A0A0F;
          color: #F1F5F9;
          font-family: 'DM Sans', sans-serif;
        }
        .admin-shell-header {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: #0A0A0F;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .admin-shell-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem clamp(1rem, 2.4vw, 2rem) 0;
        }
        .admin-shell-brand {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #E2E8F0;
          letter-spacing: -0.01em;
        }
        .admin-shell-brand span {
          color: #A78BFA;
        }
        .admin-shell-nav-desktop {
          display: flex;
          align-items: stretch;
          gap: 0;
          padding: 0 clamp(1rem, 2.4vw, 2rem);
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-shell-nav-desktop::-webkit-scrollbar {
          display: none;
        }
        .admin-shell-nav-link {
          transition: color 0.2s, border-color 0.2s;
          cursor: pointer;
          border: none;
          background: none;
          font-family: inherit;
          padding: 0.7rem 1.1rem;
          font-size: 0.875rem;
          color: #64748B;
          font-weight: 500;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .admin-shell-nav-link:hover {
          color: #CBD5E1;
        }
        .admin-shell-nav-link-active {
          color: #A78BFA;
          font-weight: 600;
          border-bottom-color: #A78BFA;
        }
        .admin-shell-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          height: 34px;
          padding: 0 0.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.5rem;
          background: rgba(255,255,255,0.04);
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.82rem;
          flex-shrink: 0;
        }
        .admin-shell-mobile-nav {
          display: none;
          flex-direction: column;
          padding: 0.25rem clamp(1rem, 2.4vw, 2rem) 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .admin-shell-mobile-nav.open {
          display: flex;
        }
        .admin-shell-mobile-nav-link {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.75rem 0;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: none;
          font-family: inherit;
          font-size: 0.9rem;
          color: #64748B;
          font-weight: 500;
          cursor: pointer;
        }
        .admin-shell-mobile-nav-link:last-child {
          border-bottom: none;
        }
        .admin-shell-mobile-nav-link-active {
          color: #A78BFA;
          font-weight: 600;
        }
        .admin-shell-content {
          min-width: 0;
          padding: 1.25rem clamp(1rem, 2.4vw, 2rem) 2rem;
        }
        @media (max-width: 768px) {
          .admin-shell-header-row {
            padding-top: 3.25rem;
          }
          .admin-shell-nav-desktop {
            display: none;
          }
          .admin-shell-mobile-toggle {
            display: inline-flex;
          }
        }
      `}</style>

      <header className="admin-shell-header">
        <div className="admin-shell-header-row">
          <div className="admin-shell-brand">
            <span>Admin</span> Panel
          </div>

          <button
            type="button"
            className="admin-shell-mobile-toggle"
            onClick={() => setMobileNavOpen(open => !open)}
            aria-label={mobileNavOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={mobileNavOpen}
          >
            {sectionLabel(activeSection)}
            {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        <nav className="admin-shell-nav-desktop" aria-label="Admin sections">
          {sections.map(section => {
            const active = activeSection === section
            return (
              <button
                key={section}
                type="button"
                className={`admin-shell-nav-link${active ? ' admin-shell-nav-link-active' : ''}`}
                onClick={() => navigate(section)}
              >
                {sectionLabel(section)}
              </button>
            )
          })}
        </nav>

        <nav
          className={`admin-shell-mobile-nav${mobileNavOpen ? ' open' : ''}`}
          aria-label="Admin sections mobile"
        >
          {sections.map(section => {
            const active = activeSection === section
            return (
              <button
                key={section}
                type="button"
                className={`admin-shell-mobile-nav-link${active ? ' admin-shell-mobile-nav-link-active' : ''}`}
                onClick={() => navigate(section)}
              >
                {sectionLabel(section)}
              </button>
            )
          })}
        </nav>
      </header>

      <div className="admin-shell-content">{children}</div>
    </div>
  )
}
