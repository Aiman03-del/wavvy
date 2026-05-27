'use client'

import Image from 'next/image'

interface WavvyLoaderProps {
  fullScreen?: boolean
  size?: number
  className?: string
}

export default function WavvyLoader({
  fullScreen = false,
  size = 88,
  className,
}: WavvyLoaderProps) {
  return (
    <div
      className={className}
      style={{
        minHeight: fullScreen ? '100vh' : 'auto',
        background: fullScreen ? '#0A0A0F' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: fullScreen ? '1rem' : 0,
      }}
    >
      <style>{`
        @keyframes wavvy-loader-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes wavvy-loader-glow {
          0%, 100% { opacity: 0.45; transform: scale(0.95); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          width: size * 1.6,
          height: size * 1.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: size * 1.45,
            height: size * 1.45,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.38) 0%, rgba(59,130,246,0.12) 42%, transparent 72%)',
            filter: 'blur(8px)',
            animation: 'wavvy-loader-glow 1.6s ease-in-out infinite',
          }}
        />
        <Image
          src="/images/logo.png"
          alt="Wavvy loading"
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            animation: 'wavvy-loader-float 1.6s ease-in-out infinite',
          }}
          priority={fullScreen}
        />
      </div>
    </div>
  )
}