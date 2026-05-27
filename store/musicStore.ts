import { create } from 'zustand'
import { Song } from '@/types'

interface MusicStore {
  currentSong: Song | null
  isPlaying: boolean
  queue: Song[]
  volume: number
  progress: number
  duration: number
  isFullScreen: boolean
  playSong: (song: Song, queue?: Song[]) => void
  togglePlay: () => void
  nextSong: () => void
  prevSong: () => void
  addToQueue: (song: Song) => void
  removeFromQueue: (songId: string) => void
  setVolume: (vol: number) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  toggleFullScreen: () => void
  closeFullScreen: () => void
  clearQueue: () => void
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 80,
  progress: 0,
  duration: 0,
  isFullScreen: false,

  playSong: (song, queue = []) => {
    set({
      currentSong: song,
      isPlaying: true,
      progress: 0,
      queue: queue.filter((s) => s.id !== song.id),
    })
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }))
  },

  nextSong: () => {
    const { queue, currentSong } = get()
    if (queue.length === 0) return
    const nextSong = queue[0]
    const newQueue = queue.slice(1)
    set({
      currentSong: nextSong,
      isPlaying: true,
      progress: 0,
      queue: newQueue,
    })
  },

  prevSong: () => {
    set({ progress: 0 })
  },

  addToQueue: (song) => {
    set((state) => ({
      queue: [...state.queue, song],
    }))
  },

  removeFromQueue: (songId) => {
    set((state) => ({
      queue: state.queue.filter((s) => s.id !== songId),
    }))
  },

  setVolume: (vol) => set({ volume: vol }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  toggleFullScreen: () =>
    set((state) => ({ isFullScreen: !state.isFullScreen })),
  closeFullScreen: () => set({ isFullScreen: false }),
  clearQueue: () => set({ queue: [] }),
}))