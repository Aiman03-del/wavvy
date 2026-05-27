import type { LucideIcon } from 'lucide-react'
import { Frown, PartyPopper, Smile, Target, Wind } from 'lucide-react'

export interface Profile {
  id: string
  username: string
  email: string
  role: 'user' | 'admin'
  avatar_url?: string
  created_at?: string
}

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  genre?: string
  mood?: 'happy' | 'sad' | 'chill' | 'party' | 'focus'
  youtube_id: string
  audio_url?: string
  thumbnail_url?: string
  lyrics?: string
  play_count: number
  added_by?: string
  created_at: string
}

export interface LikedSong {
  id: string
  user_id: string
  song_id: string
  created_at: string
  song?: Song
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  cover_url?: string
  is_public: boolean
  created_at: string
  songs?: Song[]
}

export interface PlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  position: number
  added_at: string
  song?: Song
}

export interface SongRequest {
  id: string
  user_id: string
  youtube_url: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface RecentlyPlayed {
  id: string
  user_id: string
  song_id: string
  played_at: string
  song?: Song
}

export type Mood = 'happy' | 'sad' | 'chill' | 'party' | 'focus'

export const MOOD_CONFIG: Record<
  Mood,
  { icon: LucideIcon; label: string; color: string }
> = {
  happy: { icon: Smile, label: 'Happy', color: 'from-yellow-500 to-orange-500' },
  sad: { icon: Frown, label: 'Sad', color: 'from-blue-500 to-indigo-500' },
  chill: { icon: Wind, label: 'Chill', color: 'from-green-500 to-teal-500' },
  party: { icon: PartyPopper, label: 'Party', color: 'from-pink-500 to-purple-500' },
  focus: { icon: Target, label: 'Focus', color: 'from-gray-500 to-slate-500' },
}