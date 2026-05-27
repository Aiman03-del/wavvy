'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/ui/Sidebar'
import MusicPlayer from '@/components/ui/player/MusicPlayer'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Profile } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    getProfile()
  }, [router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(59,130,246,0.2)',
          borderTop: '3px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0A0A0F',
      fontFamily: "'DM Sans', sans-serif",
      color: '#F1F5F9',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.4); }
        .dashboard-shell { --sidebar-width: 240px; }
        .dashboard-main {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding-bottom: 100px;
          min-height: 100vh;
          overflow: auto;
        }
        .dashboard-mobile-header {
          display: none;
        }
        .dashboard-mobile-sheet {
          width: min(86vw, 320px) !important;
          padding: 0 !important;
          background: #111118 !important;
          border-right: 1px solid rgba(255,255,255,0.06) !important;
        }
        @media (max-width: 767px) {
          .dashboard-shell { --sidebar-width: 0px; }
          .dashboard-desktop-sidebar { display: none !important; }
          .dashboard-main {
            margin-left: 0;
            padding-top: 72px;
            padding-bottom: 96px;
          }
          .dashboard-mobile-header {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 60;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: max(0.85rem, env(safe-area-inset-top)) 1rem 0.85rem;
            background: rgba(10,10,15,0.92);
            backdrop-filter: blur(18px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
        }
      `}</style>

      <div className="dashboard-shell" style={{ display: 'contents' }}>
        <div className="dashboard-desktop-sidebar">
          <Sidebar profile={profile} />
        </div>

        <header className="dashboard-mobile-header">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open navigation menu"
                style={{ color: '#F1F5F9', background: 'rgba(255,255,255,0.04)' }}
              >
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="dashboard-mobile-sheet">
              <Sidebar profile={profile} mobile />
            </SheetContent>
          </Sheet>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.35rem', fontWeight: 800, color: '#3B82F6', lineHeight: 1 }}>
              Wavvy
            </span>
            <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Your music space</span>
          </div>
        </header>

        <main className="dashboard-main">
        {children}
        </main>

        <MusicPlayer />
        <Toaster theme="dark" />
      </div>
    </div>
  )
}