'use client'

import Image from 'next/image'
import Link from 'next/link'

interface WavvyLogoProps {
  href?: string
  size?: number
  className?: string
  showLabel?: boolean
  zoom?: number
}

export default function WavvyLogo({
  href = '/',
  size = 40,
  className,
  showLabel = false,
  zoom = 1,
}: WavvyLogoProps): React.ReactElement {
  const content = (
    <>
      <span style={{
        position: 'relative',
        width: size,
        height: size,
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Image
          src="/images/logo.png"
          alt="Wavvy logo"
          fill
          priority
          style={{
            objectFit: 'contain',
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
        />
      </span>
      {showLabel && (
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: size >= 44 ? '1.65rem' : '1.35rem',
            fontWeight: 800,
            color: '#3B82F6',
            letterSpacing: '-0.04em',
          }}
        >
          Wavvy
        </span>
      )}
    </>
  )

  const wrapperStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: showLabel ? '0.75rem' : 0,
    textDecoration: 'none',
  } as const

  if (!href) {
    return <div className={className} style={wrapperStyle}>{content}</div>
  }

  return (
    <Link href={href} className={className} style={wrapperStyle} aria-label="Wavvy home">
      {content}
    </Link>
  )
}