'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Bell, Heart, ListMusic, Music2, Play, Search, Target } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: Music2,
    title: 'Unlimited Streaming',
    desc: 'Listen to thousands of songs without any limits or ads.',
  },
  {
    icon: Target,
    title: 'Mood-Based Playlists',
    desc: 'Happy, Sad, Chill, Party, Focus — music for every moment.',
  },
  {
    icon: ListMusic,
    title: 'Custom Playlists',
    desc: 'Create and manage your own playlists with ease.',
  },
  {
    icon: Bell,
    title: 'Song Requests',
    desc: "Can't find your song? Request it and get notified when it's added.",
  },
  {
    icon: Heart,
    title: 'Like & Save',
    desc: 'Save your favorite tracks and access them anytime.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    desc: 'Search by song, artist, genre, or mood instantly.',
  },
]

const notes = ['♪', '♫', '♩', '♬', '♭', '♮']
const noteFontSizes = ['1.75rem', '2rem', '1.5rem', '2.25rem', '1.625rem', '2.125rem']

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating music notes
      const noteEls = notesRef.current?.querySelectorAll('.music-note')
      noteEls?.forEach((note, i) => {
        gsap.set(note, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          opacity: 0,
        })
        gsap.to(note, {
          y: `-=${100 + Math.random() * 200}`,
          x: `+=${(Math.random() - 0.5) * 100}`,
          opacity: Math.random() * 0.4 + 0.1,
          duration: 3 + Math.random() * 4,
          delay: i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      // Hero text staggered reveal
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
      )
      gsap.fromTo(
        subtitleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 }
      )
      gsap.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.8 }
      )

      // Feature cards ScrollTrigger
      gsap.fromTo(
        '.feature-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        color: '#F1F5F9',
        fontFamily: "'DM Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0F; }
        .nav-link:hover { color: #60A5FA; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(59,130,246,0.5); }
        .cta-secondary:hover { background: rgba(255,255,255,0.08); }
        .feature-card:hover { border-color: rgba(59,130,246,0.4); transform: translateY(-4px); }
        .cta-primary, .cta-secondary, .feature-card { transition: all 0.3s ease; }
      `}</style>

      {/* Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
          background: 'rgba(10,10,15,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#3B82F6',
            letterSpacing: '-0.5px',
          }}
        >
          Wavvy
        </span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            href="/login"
            className="nav-link"
            style={{
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="cta-primary"
            style={{
              background: '#3B82F6',
              color: '#fff',
              padding: '0.5rem 1.2rem',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Floating Music Notes */}
      <div
        ref={notesRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {notes.map((note, i) => (
          <span
            key={i}
            className="music-note"
            style={{
              position: 'absolute',
              fontSize: noteFontSizes[i % noteFontSizes.length],
              color: '#3B82F6',
              userSelect: 'none',
            }}
          >
            {note}
          </span>
        ))}
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '6rem 1.5rem 4rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'inline-block',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '999px',
            padding: '0.3rem 1rem',
            fontSize: '0.8rem',
            color: '#60A5FA',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Music2 size={14} /> Free Music Streaming — No Ads, Ever
          </span>
        </div>

        <h1
          ref={titleRef}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            marginBottom: '1.5rem',
            opacity: 0,
          }}
        >
          Music that moves
          <br />
          <span style={{ color: '#3B82F6' }}>with you.</span>
        </h1>

        <p
          ref={subtitleRef}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#94A3B8',
            maxWidth: '520px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            opacity: 0,
          }}
        >
          Stream thousands of songs for free. Create playlists, discover music
          by mood, and request your favorite tracks — all in one place.
        </p>

        <div
          ref={ctaRef}
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: 0,
          }}
        >
          <Link
            href="/register"
            className="cta-primary"
            style={{
              background: '#3B82F6',
              color: '#fff',
              padding: '0.85rem 2rem',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Start Listening Free →
          </Link>
          <Link
            href="/login"
            className="cta-secondary"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#F1F5F9',
              padding: '0.85rem 2rem',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Login
          </Link>
        </div>

        {/* Mock Player Preview */}
        <div
          style={{
            marginTop: '4rem',
            background: 'rgba(22,22,31,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: '1.2rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '400px',
            width: '100%',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
              <Music2 size={24} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Your favorite song
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Your favorite artist
            </p>
            <div
              style={{
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '999px',
                marginTop: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: '100%',
                  background: '#3B82F6',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', cursor: 'pointer', color: '#F1F5F9' }}>
            <Play size={20} fill="currentColor" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        style={{
          padding: '6rem 1.5rem',
          maxWidth: '1100px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '0.75rem',
            letterSpacing: '-1px',
          }}
        >
          Everything you need
        </h2>
        <p
          style={{
            color: '#94A3B8',
            textAlign: 'center',
            marginBottom: '3rem',
            fontSize: '1rem',
          }}
        >
          Wavvy is packed with features to make your music experience perfect.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                {(() => {
                  const FeatureIcon = f.icon
                  return <FeatureIcon size={32} strokeWidth={1.8} />
                })()}
              </div>
              <h3
                style={{
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontSize: '1.05rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '6rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '2rem',
            padding: '4rem 2rem',
            maxWidth: '700px',
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              letterSpacing: '-1px',
            }}
          >
            Ready to listen?
          </h2>
          <p
            style={{
              color: '#94A3B8',
              marginBottom: '2rem',
              fontSize: '1rem',
            }}
          >
            Join Wavvy today — it's completely free, forever.
          </p>
          <Link
            href="/register"
            className="cta-primary"
            style={{
              background: '#3B82F6',
              color: '#fff',
              padding: '0.9rem 2.5rem',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: '#475569',
          fontSize: '0.85rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            color: '#3B82F6',
            marginRight: '0.5rem',
          }}
        >
          Wavvy
        </span>
        © 2025 — Free music for everyone.
      </footer>
    </main>
  )
}