import { create } from 'zustand'
import type { Song } from '@/types'
import {
  buildUpcomingQueue,
  dedupeSongs,
  seekTo,
  shuffleArray,
  type RepeatMode,
} from '@/lib/player'

interface MusicStore {
  currentSong: Song | null
  isPlaying: boolean
  queue: Song[]
  sourceList: Song[]
  history: Song[]
  volume: number
  progress: number
  duration: number
  isFullScreen: boolean
  isShuffle: boolean
  repeatMode: RepeatMode
  playSong: (song: Song, list?: Song[]) => void
  togglePlay: () => void
  nextSong: () => void
  prevSong: () => void
  onTrackEnd: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
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
  sourceList: [],
  history: [],
  volume: 80,
  progress: 0,
  duration: 0,
  isFullScreen: false,
  isShuffle: false,
  repeatMode: 'off',

  playSong: (song, list = []) => {
    const state = get()
    const sourceList = dedupeSongs(
      list.length > 0 ? list : state.sourceList.length > 0 ? state.sourceList : [song]
    )
    const queue = buildUpcomingQueue(sourceList, song.id, state.isShuffle)
    const history =
      state.currentSong && state.currentSong.id !== song.id
        ? [...state.history, state.currentSong].slice(-40)
        : state.history

    set({
      currentSong: song,
      isPlaying: true,
      progress: 0,
      sourceList,
      queue,
      history,
    })
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
  },

  nextSong: () => {
    const { queue, currentSong, repeatMode, isShuffle, sourceList, history } = get()
    if (!currentSong) return

    if (repeatMode === 'one') {
      set({ progress: 0, isPlaying: true })
      seekTo(0)
      return
    }

    if (queue.length > 0) {
      const next = queue[0]
      set({
        currentSong: next,
        isPlaying: true,
        progress: 0,
        history: [...history, currentSong].slice(-40),
        queue: queue.slice(1),
      })
      return
    }

    if (repeatMode === 'all' && sourceList.length > 0) {
      const ordered = isShuffle ? shuffleArray(sourceList) : sourceList
      const next = ordered[0]
      const rest = buildUpcomingQueue(sourceList, next.id, isShuffle)
      set({
        currentSong: next,
        isPlaying: true,
        progress: 0,
        history: [...history, currentSong].slice(-40),
        queue: rest,
      })
      return
    }

    set({ isPlaying: false })
  },

  prevSong: () => {
    const { progress, history, currentSong, sourceList, isShuffle } = get()
    if (!currentSong) return

    if (progress > 3) {
      set({ progress: 0 })
      seekTo(0)
      return
    }

    const prev = history[history.length - 1]
    if (!prev) {
      set({ progress: 0 })
      seekTo(0)
      return
    }

    const newHistory = history.slice(0, -1)
    const queue = currentSong
      ? [currentSong, ...get().queue.filter((s) => s.id !== currentSong.id)]
      : get().queue

    const remainingFromSource = buildUpcomingQueue(
      sourceList.length > 0 ? sourceList : [prev],
      prev.id,
      isShuffle
    )
    const mergedQueue = dedupeSongs([...queue, ...remainingFromSource]).filter(
      (s) => s.id !== prev.id
    )

    set({
      currentSong: prev,
      isPlaying: true,
      progress: 0,
      history: newHistory,
      queue: mergedQueue,
    })
  },

  onTrackEnd: () => {
    const { repeatMode, currentSong } = get()
    if (repeatMode === 'one' && currentSong) {
      set({ progress: 0, isPlaying: true })
      seekTo(0)
      return
    }
    get().nextSong()
  },

  toggleShuffle: () => {
    set((state) => {
      const isShuffle = !state.isShuffle
      if (!state.currentSong) return { isShuffle }

      const queue = buildUpcomingQueue(
        state.sourceList.length > 0 ? state.sourceList : [state.currentSong],
        state.currentSong.id,
        isShuffle
      )
      return { isShuffle, queue }
    })
  },

  cycleRepeat: () => {
    set((state) => {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const i = order.indexOf(state.repeatMode)
      return { repeatMode: order[(i + 1) % order.length] }
    })
  },

  addToQueue: (song) => {
    set((state) => ({
      queue: state.queue.some((s) => s.id === song.id)
        ? state.queue
        : [...state.queue, song],
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
  clearQueue: () => set({ queue: [], sourceList: [], history: [] }),
}))
