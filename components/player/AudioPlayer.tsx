'use client'

import { useEffect, useRef } from 'react'
import { useMusicStore } from '@/store/musicStore'

export default function AudioPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null)
	const pendingSrcRef = useRef<string | null>(null)
	const {
		currentSong,
		isPlaying,
		volume,
		setProgress,
		setDuration,
		nextSong,
	} = useMusicStore()

	// Fetch audio URL and play
	useEffect(() => {
		if (!currentSong) return

		const fetchAndPlay = async () => {
			try {
				const directAudioUrl = currentSong.audio_url

				if (directAudioUrl) {
					pendingSrcRef.current = directAudioUrl
					if (audioRef.current) {
						audioRef.current.src = directAudioUrl
						audioRef.current.load()
						if (isPlaying) audioRef.current.play().catch(() => {})
					}
					return
				}

				const res = await fetch('/api/get-audio', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ youtubeId: currentSong.youtube_id }),
				})

				const data = await res.json()

				if (data.audioUrl) {
					pendingSrcRef.current = data.audioUrl
					if (audioRef.current) {
						audioRef.current.src = data.audioUrl
						audioRef.current.load()
						if (isPlaying) audioRef.current.play().catch(() => {})
					}
				}
			} catch (error) {
				console.error('Audio fetch error:', error)
			}
		}

		fetchAndPlay()
	}, [currentSong?.youtube_id, currentSong?.audio_url])

	// Play/Pause
	useEffect(() => {
		if (!audioRef.current) return
		if (isPlaying) {
			audioRef.current.play().catch(() => {})
		} else {
			audioRef.current.pause()
		}
	}, [isPlaying])

	// Volume
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume / 100
		}
	}, [volume])

	// Seek function
	useEffect(() => {
		;(window as any).wavvySeek = (seconds: number) => {
			if (audioRef.current) {
				audioRef.current.currentTime = seconds
			}
		}
	}, [])

	return (
		<audio
			ref={audioRef}
			onTimeUpdate={() => {
				if (audioRef.current) {
					setProgress(audioRef.current.currentTime)
				}
			}}
			onLoadedMetadata={() => {
				if (audioRef.current) {
					setDuration(audioRef.current.duration)
				}
			}}
			onEnded={nextSong}
			style={{ display: 'none' }}
			preload="auto"
		/>
	)
}