'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminShell from '@/components/ui/AdminShell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Sidebar from '@/components/ui/Sidebar'
import MusicPlayer from '@/components/ui/player/MusicPlayer'
import { Toaster } from '@/components/ui/sonner'
import { getAdminSectionFromPathname } from '@/lib/admin-nav'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

type AdminStats = {
  songs: number
  users: number
  requests: number
  pending: number
  artists: number
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<AdminStats>({
    songs: 0,
    users: 0,
    requests: 0,
    pending: 0,
    artists: 0,
  })

  const activeSection = getAdminSectionFromPathname(pathname)

  useEffect(() => {
    if (pathname === '/admin') {
      router.replace('/admin/stats')
    }
  }, [pathname, router])

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setProfile(prof)
      setAuthorized(true)
      setLoading(false)
    }

    void check()
  }, [router])

  const loadNavStats = useCallback(async () => {
    const [
      { data: songsData },
      { data: reqData },
      { data: usersData },
      { data: artistData },
    ] = await Promise.all([
      supabase.from('songs').select('id'),
      supabase.from('song_requests').select('id, status'),
      supabase.from('profiles').select('id'),
      supabase.from('artist_profiles').select('id'),
    ])

    setStats({
      songs: songsData?.length || 0,
      users: usersData?.length || 0,
      requests: reqData?.length || 0,
      pending:
        reqData?.filter((request) => request.status === 'pending').length || 0,
      artists: artistData?.length || 0,
    })
  }, [])

  useEffect(() => {
    if (!authorized) return
    void loadNavStats()
  }, [authorized, loadNavStats, pathname])

  if (loading || !authorized) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="wavvy-dashboard">
      <Sidebar profile={profile} />

      <main className="wavvy-main">
        <AdminShell activeSection={activeSection} stats={stats}>
          {children}
        </AdminShell>
      </main>

      <MusicPlayer />
      <Toaster theme="dark" />
    </div>
  )
}
