import type { Song } from '@/types'

export type RepeatMode = 'off' | 'all' | 'one'

export function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function dedupeSongs(songs: Song[]): Song[] {
  const map = new Map<string, Song>()
  songs.forEach((s) => {
    if (s?.id) map.set(s.id, s)
  })
  return Array.from(map.values())
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Songs after current, in source order or shuffled */
export function buildUpcomingQueue(
  sourceList: Song[],
  currentId: string,
  shuffled: boolean
): Song[] {
  const remaining = sourceList.filter((s) => s.id !== currentId)
  return shuffled ? shuffleArray(remaining) : remaining
}

export function seekTo(seconds: number) {
  if (typeof window !== 'undefined') {
    window.wavvySeek?.(seconds)
  }
}

declare global {
  interface Window {
    wavvySeek?: (seconds: number) => void
  }
}
