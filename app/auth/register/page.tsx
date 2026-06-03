'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import WavvyLogo from '@/components/ui/WavvyLogo'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wavvy-five.vercel.app'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)

  const getInboxLink = (email: string) => {
    try {
      const domain = email.split('@')[1]?.toLowerCase() || ''
      if (domain.includes('gmail.com')) return 'https://mail.google.com/mail/u/0/#inbox'
      if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return 'https://outlook.live.com/mail/'
      if (domain.includes('yahoo.com')) return 'https://mail.yahoo.com/'
      if (domain.includes('icloud.com') || domain.includes('me.com')) return 'https://www.icloud.com/mail'
      if (domain.includes('yandex')) return 'https://mail.yandex.com/'
      if (domain.includes('protonmail')) return 'https://mail.proton.me/'
      // fallback to mailto which opens the user's default mail client
      return `mailto:${email}`
    } catch (e) {
      return `mailto:${email}`
    }
  }

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // redirect users to the live site root after they confirm their email
        emailRedirectTo: `${appUrl}`,
        data: { username },
      },
    })

    if (error) {
      // Map common Supabase messages to friendly Bangla messages
      const msg = (error.message || '').toString()
      const isAlready = /user already registered|already registered|duplicate/i.test(msg)
      if (isAlready) {
        setError('এই ইমেইল দিয়ে একটি একাউন্ট ইতিমধ্যেই তৈরি করা আছে। লগইন করুন অথবা পাসওয়ার্ড ভুলে গেলে পুনরুদ্ধার করুন।')
        setIsDuplicate(true)
      } else {
        setError(msg)
        setIsDuplicate(false)
      }
      setLoading(false)
      return
    }

    // Determine if email confirmation is required
    const emailConfirmed = (data?.user as any)?.email_confirmed_at || (data?.user as any)?.confirmed_at
    if (!emailConfirmed) {
      setRequiresConfirmation(true)
      setRegisteredEmail(email)
    }
    // Update username in profiles
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id)
    }

    setSuccess(true)
    setLoading(false)

    // If email is already confirmed (no confirmation step), redirect after short delay
    if (emailConfirmed) {
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.85rem 1rem;
          color: #F1F5F9;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .auth-input::placeholder { color: #475569; }
        .password-field {
          position: relative;
        }
        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #94A3B8;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .password-toggle:hover {
          color: #E2E8F0;
        }
        .auth-btn {
          width: 100%;
          background: #3B82F6;
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.9rem;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .auth-btn:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(59,130,246,0.4);
        }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)',
      }} />

      <div ref={cardRef} style={{
        background: '#16161F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <WavvyLogo href="/" size={56} showLabel={false} />
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Create your free account
          </p>
        </div>

        {success ? (
          requiresConfirmation ? (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.12)',
              borderRadius: '1rem',
            }}>
              <div style={{ height: 6, width: 64, margin: '0 auto 0.6rem', borderRadius: 999, background: '#60A5FA' }} />
              <p style={{ color: '#60A5FA', fontWeight: 700 }}>Almost there — check your email</p>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                We've sent a confirmation link to <strong style={{ color: '#E6EDF3' }}>{registeredEmail}</strong>.
                Please open the email and click the link to activate your account.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                <a
                  href={getInboxLink(registeredEmail)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#111827',
                    color: '#E6EDF3',
                    padding: '0.5rem 0.9rem',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  Open inbox
                </a>
                <a
                  href="/auth/login"
                  style={{
                    background: 'transparent',
                    color: '#94A3B8',
                    padding: '0.5rem 0.9rem',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  Go to login
                </a>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.82rem', marginTop: '0.6rem' }}>
                After confirming, you'll be redirected to the site home.
              </p>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '1rem',
            }}>
              <div style={{ height: 6, width: 64, margin: '0 auto 0.6rem', borderRadius: 999, background: '#86EFAC' }} />
              <p style={{ color: '#86EFAC', fontWeight: 600 }}>Account created!</p>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Redirecting you to your account...
              </p>
            </div>
          )
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Username
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Password
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#FCA5A5',
                fontSize: '0.85rem',
              }}>
                  <div style={{ marginBottom: isDuplicate ? 8 : 0 }}>{error}</div>
                  {isDuplicate && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href="/auth/login" style={{ color: '#fff', background: '#3B82F6', padding: '6px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                        লগইন করুন
                      </Link>
                      <a href={`mailto:support@wavvy-five.vercel.app?subject=Password%20reset%20help&body=I%20need%20help%20resetting%20my%20password%20for%20${encodeURIComponent(email)}`} style={{ color: '#fff', background: '#6B7280', padding: '6px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                        পাসওয়ার্ড রিকোভারির জন্য লিখুন
                      </a>
                    </div>
                  )}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}