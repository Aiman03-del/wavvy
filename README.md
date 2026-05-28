# Wavvy

Wavvy is a modern music streaming web app built with Next.js, Supabase, Zustand, GSAP, and custom CSS styling. It includes user authentication, music browsing, search, mood-based discovery, playlists, requests, liked songs, admin tools, and a persistent player experience.

## What This App Does

- Browse the music catalog from the home dashboard.
- Search songs by title, artist, album, genre, and mood.
- Explore curated song lists through mood pages.
- Support likes, playlists, request flow, and recently played history.
- Control playback through both the fullscreen player and the bottom mini player.
- Let admin users manage songs, requests, and user roles.

## Main Features

### 1. Authentication

- Sign in with email and password.
- Register a new account with username, email, and password.
- Redirect authenticated users to the dashboard from the login and register pages.
- Protect routes such as `/dashboard` and `/admin` with a request proxy guard.

### 2. Music Discovery

- Show recently played songs on the dashboard.
- Browse the full catalog from the all songs section.
- Filter search by query, genre, and mood.
- Show mood pages for `happy`, `sad`, `chill`, `party`, and `focus`.
- Highlight the app's main features on the landing page.

### 3. Playback Experience

- Click any song card once to start playing.
- Use the mini player to see the current track and open fullscreen mode.
- Playback controls include play/pause, previous, next, shuffle, and repeat.
- Progress tracking, seek support, volume storage, and session hydration are included.
- The fullscreen player shows current art, title, artist, album, playlist actions, and like actions.

### 4. Library and Social Actions

- View the current user's liked songs.
- Like and unlike songs from song cards.
- Create new playlists from the playlist page.
- Add the current song to a playlist from the fullscreen player.
- Submit new song requests with a YouTube URL.

### 5. Admin Tools

- Manage songs from the admin panel.
- Approve or reject song requests.
- View users and update roles.
- Create, edit, and delete songs.
- Auto-fill song metadata from YouTube oEmbed when possible.

## Pages

### Public Pages

#### `/`
Landing page with brand intro, animated music notes, hero CTA, and feature cards. It includes Login and Get Started links.

#### `/login`
Public alias page that redirects to `/auth/login`.

#### `/register`
Public alias page that redirects to `/auth/register`.

### Auth Pages

#### `/auth/login`
- Email and password login form
- Password visibility toggle
- Error handling
- Redirect to `/dashboard` after successful sign in

#### `/auth/register`
- Username, email, and password form
- Password minimum length validation
- Supabase sign-up flow
- Email redirect configuration
- Automatic redirect after successful registration

### Dashboard Pages

#### `/dashboard`
Main home dashboard.

This page includes:
- Greeting based on the time of day
- Profile greeting
- Recently Played section
- All Songs section
- Empty state when the catalog is empty
- SongGrid with full click-to-play behavior

#### `/dashboard/search`
Smart search page.

This page includes:
- Search input
- Genre filter
- Mood filter
- Debounced auto-search
- Trending songs on mount
- Empty state when nothing matches

#### `/dashboard/library`
Library placeholder page.

This page currently includes:
- Placeholder state for saved albums, artists, and collections
- Search the catalog CTA

#### `/dashboard/liked`
Liked songs page.

This page includes:
- The current user's liked songs loaded from `liked_songs`
- Empty state when nothing is liked
- SongGrid playback support
- A recently liked catalog view

#### `/dashboard/playlists`
Playlists overview page.

This page includes:
- Existing playlists list
- New playlist creation form
- Song count per playlist
- Preview of a few song titles
- Empty state when no playlist exists

#### `/dashboard/request`
Song request page.

This page includes:
- YouTube URL input
- Optional note field
- Request submission flow
- Current user's request history
- Status badges for pending, approved, and rejected requests

#### `/dashboard/mood/[mood]`
Mood-based song discovery page.

Supported moods:
- happy
- sad
- chill
- party
- focus

This page includes:
- Mood header with icon and color
- Mood-specific song list ordered by play count
- Empty state when no songs match
- Fallback view when the mood is invalid

#### `/dashboard/dashboard/search`
Legacy alias route that re-exports `/dashboard/search`.

### Admin Pages

#### `/admin`
Admin dashboard.

This page includes:
- Songs tab
- Requests tab
- Users tab
- Add song modal and form
- Edit song flow
- Delete confirmation flow
- Song request approval flow
- Role management flow
- Stats cards for songs, users, requests, and pending requests
- Auto-fill from YouTube oEmbed when possible

## Player UI

### Mini Player

The bottom player bar shows:
- Current song thumbnail
- Song title and artist
- Expand/fullscreen button
- Playback controls

### Fullscreen Player

Fullscreen mode shows:
- Large album art
- Current song title, artist, and album
- Progress bar
- Shuffle, previous, play/pause, next, and repeat controls
- Add to playlist icon on the left side of the controls row
- Like icon on the right side of the controls row
- Playlist modal with playlist creation and song add flow

### Song Cards

Song cards across the dashboard, search, liked songs, mood pages, and recent sections support:
- Clicking anywhere on the card to play
- Like button
- Active state styling
- Play badge for the current track
- Play count label where enabled

## Data and State

- Supabase handles authentication and database access.
- Zustand stores player state: current song, queue, history, shuffle, repeat, volume, progress, and fullscreen mode.
- Local storage persists the last session playback state.
- The app uses these key data tables: `recently_played`, `liked_songs`, `playlists`, `playlist_songs`, `song_requests`, `profiles`, and `songs`.

## Route Guarding

- `/dashboard` and `/admin` are protected through `proxy.ts`.
- Anonymous users are redirected to `/auth/login`.
- Non-admin users are redirected away from `/admin`.
- Authenticated users are redirected away from auth pages to `/dashboard`.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Zustand
- GSAP
- Lucide React
- Sonner

## Development

### Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Local Setup

1. Install dependencies.
2. Add your Supabase environment values in `.env.local`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

### Notes

- The project uses a root `app/` directory.
- `next.config.ts` pins the Turbopack root to avoid workspace root ambiguity when multiple lockfiles exist.
- Some pages, such as Library, are intentionally placeholder-style and can be expanded later.
- AI lyrics generation (fullscreen player) uses Groq. Set `GROQ_API_KEY` in `.env.local`. Optionally set `GROQ_LYRICS_MODEL` (default: `llama-3.1-8b-instant`).

## Folder Overview

- `app/` - routes, pages, layouts, and route guards
- `components/` - reusable UI and player components
- `lib/` - Supabase helpers, player helpers, and utilities
- `store/` - Zustand player store and middleware
- `types/` - shared TypeScript types
- `public/` - static assets

## Summary

Wavvy is currently a complete music app shell with real auth, browsing, search, mood discovery, likes, playlists, requests, admin workflows, and a persistent player. The key user journeys are already wired end to end, and this README now reflects the site as it exists today.
