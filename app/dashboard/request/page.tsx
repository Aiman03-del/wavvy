'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Music2, Send, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Request {
  id: string
  youtube_url: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function RequestPage() {
  const [form, setForm] = useState({ youtube_url: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('song_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { loadRequests() }, [])

  const handleSubmit = async () => {
    if (!form.youtube_url.trim()) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    await supabase.from('song_requests').insert({
      user_id: user.id,
      youtube_url: form.youtube_url.trim() || null,
      notes: form.note.trim() || null,
      status: 'pending',
    })

    setForm({ youtube_url: '', note: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    loadRequests()
    setSubmitting(false)
  }

  const statusStyle = (status: string) => {
    if (status === 'approved') return { color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', label: '✅ Approved' }
    if (status === 'rejected') return { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: '❌ Rejected' }
    return { color: '#FCD34D', bg: 'rgba(252,211,77,0.1)', border: 'rgba(252,211,77,0.2)', label: '⏳ Pending' }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <style>{`
        .req-input { transition: all 0.2s; }
        .req-input:focus { outline: none; border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        @keyframes pulse { 0%,100%{opacity:.4}50%{opacity:.8} }
        .sk { background: #16161F; border-radius: .75rem; animation: pulse 1.5s ease infinite; }
      `}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}><Target size={24} /> Request a Song</h1>
        <p style={{ color: '#94A3B8', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Paste a YouTube link and we'll review it from there.
        </p>
      </div>

      {/* Form */}
      <div style={{
        background: '#16161F',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '1.5rem',
        padding: '1.75rem',
        marginBottom: '2rem',
      }}>
        {success && (
          <div style={{
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: '0.85rem',
            padding: '0.85rem 1.1rem',
            color: '#34D399',
            fontSize: '0.9rem',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <CheckCircle2 size={16} /> Request submitted successfully! Admin will review it soon.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              YouTube URL <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              className="req-input"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={form.youtube_url}
              onChange={e => setForm(p => ({ ...p, youtube_url: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Note <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="req-input"
              placeholder="Any additional info..."
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !form.youtube_url.trim()}
            style={{
              padding: '0.85rem',
              background: submitting || !form.youtube_url.trim()
                ? 'rgba(59,130,246,0.3)'
                : '#3B82F6',
              border: 'none', borderRadius: '0.85rem',
              color: '#fff', fontWeight: 600, fontSize: '0.95rem',
              cursor: submitting || !form.youtube_url.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {submitting ? <Music2 size={16} /> : <Send size={16} />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </span>
          </button>
        </div>
      </div>

      {/* My Requests */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
          My Requests
        </h2>

        {loading ? (
          Array(3).fill(0).map((_,i) => (
            <div key={i} className="sk" style={{ height: '72px', marginBottom: '0.5rem' }} />
          ))
        ) : myRequests.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2.5rem',
            background: '#16161F', borderRadius: '1.25rem',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#475569', fontSize: '0.9rem',
          }}>
            No requests yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {myRequests.map(req => {
              const s = statusStyle(req.status)
              return (
                <div key={req.id} style={{
                  background: '#16161F',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>YouTube request</p>
                    <p style={{ color: '#94A3B8', fontSize: '0.8rem', wordBreak: 'break-all' }}>{req.youtube_url}</p>
                    {req.notes && <p style={{ color: '#475569', fontSize: '0.76rem', marginTop: '0.25rem' }}>{req.notes}</p>}
                  </div>
                  <div style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    color: s.color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#0A0A0F',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  color: '#F1F5F9',
  fontSize: '0.92rem',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s',
}