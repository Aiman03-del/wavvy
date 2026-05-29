'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Clock3, Music2, Target, UserRound, Users } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import type { Profile, RecentlyPlayed, Song } from '@/types'

type UserRow = Profile & { role?: 'user' | 'admin' }

export default function AdminStatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [songs, setSongs] = useState<Song[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [recentPlays, setRecentPlays] = useState<RecentlyPlayed[]>([])
  const [stats, setStats] = useState({ songs: 0, users: 0, requests: 0, pending: 0, artists: 0 })

  const summaryCards = [
    { label: 'Songs', value: stats.songs, icon: Music2, color: '#3B82F6' },
    { label: 'Users', value: stats.users, icon: Users, color: '#10B981' },
    { label: 'Artists', value: stats.artists, icon: UserRound, color: '#8B5CF6' },
    { label: 'Requests', value: stats.requests, icon: Target, color: '#F59E0B' },
    { label: 'Pending', value: stats.pending, icon: Clock3, color: '#EF4444' },
  ] as const

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setAuthorized(true)
      setLoading(false)
    }

    void check()
  }, [router])

  useEffect(() => {
    if (!authorized) return

    const load = async () => {
      const [
        { data: songsData },
        { data: usersData },
        { data: recentPlaysData },
        { data: artistData },
        { data: requestData },
      ] = await Promise.all([
        supabase.from('songs').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('recently_played').select('id,user_id,song_id,played_at').order('played_at', { ascending: false }).limit(200),
        supabase.from('artist_profiles').select('id'),
        supabase.from('song_requests').select('id,status'),
      ])

      const requestRows = requestData || []
      setSongs((songsData || []) as Song[])
      setUsers((usersData || []) as UserRow[])
      setRecentPlays((recentPlaysData || []) as RecentlyPlayed[])
      setStats({
        songs: songsData?.length || 0,
        users: usersData?.length || 0,
        requests: requestRows.length,
        pending: requestRows.filter((request: { status?: string }) => request.status === 'pending').length,
        artists: artistData?.length || 0,
      })
    }

    void load()
  }, [authorized])

  const dayLabels = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date.toISOString().slice(0, 10)
  }), [])

  const listensByDay = useMemo(() => dayLabels.map((day) => ({
    label: new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
    value: recentPlays.filter(play => play.played_at.startsWith(day)).length,
  })), [dayLabels, recentPlays])

  const topSongsByPlays = useMemo(() => [...songs]
    .sort((left, right) => (right.play_count || 0) - (left.play_count || 0))
    .slice(0, 5), [songs])

  const topUsersByPlays = useMemo(() => Object.entries(
    recentPlays.reduce<Record<string, number>>((acc, play) => {
      acc[play.user_id] = (acc[play.user_id] || 0) + 1
      return acc
    }, {})
  )
    .map(([userId, count]) => ({
      user: users.find(user => user.id === userId)?.username || users.find(user => user.id === userId)?.email || 'Unknown user',
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5), [recentPlays, users])

  if (loading || !authorized) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <>
        <div className="admin-stats-shell">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#A78BFA', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                  <BarChart3 size={18} /> Stats
                </p>
                <p style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '0.15rem' }}>Listener activity and usage breakdown</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {summaryCards.map(stat => {
                const StatIcon = stat.icon
                return (
                  <div key={stat.label} style={{
                    padding: '0.6rem 0.9rem',
                    background: '#16161F',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                  }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '0.75rem', background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                      <StatIcon size={17} />
                    </div>
                    <div>
                      <p style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1, color: stat.color }}>{stat.value}</p>
                      <p style={{ color: '#64748B', fontSize: '0.72rem', marginTop: '0.15rem' }}>{stat.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            <AnalyticsCard title="Listening Activity" subtitle="Last 7 days" accent="#8B5CF6" footer={`${recentPlays.length} plays`}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', minHeight: '160px' }}>
                {listensByDay.map((day) => {
                  const max = Math.max(...listensByDay.map(item => item.value), 1)
                  const height = Math.max(12, Math.round((day.value / max) * 120))
                  return (
                    <div key={day.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: '124px' }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '28px',
                          height: `${height}px`,
                          borderRadius: '999px 999px 0.45rem 0.45rem',
                          background: 'linear-gradient(180deg, #A78BFA, #8B5CF6)',
                          boxShadow: '0 0 18px rgba(139,92,246,0.2)',
                        }} />
                      </div>
                      <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{day.label}</span>
                      <span style={{ color: '#F1F5F9', fontSize: '0.75rem', fontWeight: 600 }}>{day.value}</span>
                    </div>
                  )
                })}
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Top Songs" accent="#60A5FA">
              <ChartList
                items={topSongsByPlays.map(song => ({ label: song.title, value: (song.play_count || 0).toLocaleString() }))}
                accentA="#60A5FA"
                accentB="#8B5CF6"
                emptyLabel="No play data yet."
              />
            </AnalyticsCard>

            <AnalyticsCard title="Top Users" accent="#34D399">
              <ChartList
                items={topUsersByPlays.map(entry => ({ label: entry.user, value: String(entry.count) }))}
                accentA="#34D399"
                accentB="#10B981"
                emptyLabel="No user play activity yet."
              />
            </AnalyticsCard>
          </div>
        </div>
    </>
  )
}

function AnalyticsCard({
  title,
  subtitle,
  accent,
  footer,
  children,
}: {
  title: string
  subtitle?: string
  accent: string
  footer?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#16161F',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '1.25rem',
      padding: '1rem 1rem 1.1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div>
          <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.98rem' }}>{title}</p>
          {subtitle && <p style={{ color: '#64748B', fontSize: '0.76rem' }}>{subtitle}</p>}
        </div>
        {footer && <span style={{ color: accent, fontSize: '0.74rem', fontWeight: 600 }}>{footer}</span>}
      </div>
      {children}
    </div>
  )
}

function ChartList({
  items,
  accentA,
  accentB,
  emptyLabel,
}: {
  items: Array<{ label: string; value: string }>
  accentA: string
  accentB: string
  emptyLabel: string
}) {
  const max = Math.max(...items.map(item => Number(item.value.replace(/,/g, '')) || 0), 1)

  if (items.length === 0) {
    return <p style={{ color: '#64748B', fontSize: '0.82rem' }}>{emptyLabel}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {items.map(item => {
        const numericValue = Number(item.value.replace(/,/g, '')) || 0
        const width = Math.max(16, Math.round((numericValue / max) * 100))
        return (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              <span style={{ color: '#F1F5F9', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              <span style={{ color: accentB, fontSize: '0.75rem', fontWeight: 600 }}>{item.value}</span>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${width}%`, height: '100%', borderRadius: 'inherit', background: `linear-gradient(90deg, ${accentA}, ${accentB})` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
