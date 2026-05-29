import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Body = {
  name?: string
  bio?: string
  genre?: string
  image_url?: string
}

type SongRow = {
  title?: string | null
  artist?: string | null
  album?: string | null
  genre?: string | null
  mood?: string | null
  thumbnail_url?: string | null
  youtube_id?: string | null
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function cleanArtistName(name: string) {
  return normalizeText(name).replace(/\s*\(.*?\)\s*$/g, '')
}

function looksLikePlaceholderImage(url: string) {
  const value = url.trim().toLowerCase()
  return (
    value.includes('ui-avatars.com') ||
    value.includes('img.youtube.com') ||
    value.includes('placehold.co') ||
    value.includes('placeholder') ||
    value.includes('upload.wikimedia.org/wikipedia/commons/thumb/')
  )
}

async function lookupWikipediaImageUrl(name: string) {
  const searchUrl = new URL('https://www.wikidata.org/w/api.php')
  searchUrl.searchParams.set('action', 'wbsearchentities')
  searchUrl.searchParams.set('search', name)
  searchUrl.searchParams.set('language', 'en')
  searchUrl.searchParams.set('type', 'item')
  searchUrl.searchParams.set('limit', '5')
  searchUrl.searchParams.set('format', 'json')
  searchUrl.searchParams.set('origin', '*')

  const searchResponse = await fetch(searchUrl.toString(), { method: 'GET' })
  if (!searchResponse.ok) return ''

  const searchData = await searchResponse.json() as { search?: Array<{ id?: string; label?: string; description?: string }> }
  const entityId = searchData.search?.find((entity) => entity.id?.trim())?.id?.trim()
  if (!entityId) return ''

  const entityUrl = new URL(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(entityId)}.json`)
  entityUrl.searchParams.set('origin', '*')

  const entityResponse = await fetch(entityUrl.toString(), { method: 'GET' })
  if (!entityResponse.ok) return ''

  const entityData = await entityResponse.json() as {
    entities?: Record<string, {
      claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: string } } }>>
    }>
  }

  const entity = entityData.entities?.[entityId]
  const filename = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value?.trim()
  if (!filename) return ''

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=512`
}

async function resolveArtistImageUrl(name: string, songs: SongRow[], currentImageUrl?: string) {
  const existing = currentImageUrl?.trim()
  if (existing && !looksLikePlaceholderImage(existing)) return existing

  const wikiImage = await lookupWikipediaImageUrl(name)
  if (wikiImage) return wikiImage

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff`
}

function inferGenreFallback(songs: SongRow[], currentGenre?: string) {
  const fallback = currentGenre?.trim()
  if (fallback) return fallback

  const genreCounts = new Map<string, number>()
  songs.forEach((song) => {
    const genre = song.genre?.trim()
    if (!genre) return
    genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
  })

  let bestGenre = ''
  let bestCount = 0
  genreCounts.forEach((count, genre) => {
    if (count > bestCount) {
      bestCount = count
      bestGenre = genre
    }
  })

  return bestGenre || 'Other'
}

function inferBioFallback(name: string, songs: SongRow[]) {
  const trackCount = songs.length
  const albums = Array.from(
    new Set(
      songs
        .map((song) => song.album?.trim())
        .filter((album): album is string => Boolean(album))
    )
  )

  const moods = Array.from(
    new Set(
      songs
        .map((song) => song.mood?.trim())
        .filter((mood): mood is string => Boolean(mood))
    )
  )

  const albumLine = albums.length > 0 ? `Featured across ${albums.slice(0, 3).join(', ')}.` : ''
  const moodLine = moods.length > 0 ? `Sound palette leans into ${moods.slice(0, 3).join(', ')}.` : ''

  return normalizeText(
    `${name} is a curated artist profile built from ${trackCount} track${trackCount === 1 ? '' : 's'} in the library. ${albumLine} ${moodLine}`
  )
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as { bio?: string; genre?: string; image_url?: string }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const name = cleanArtistName(body.name || '')

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const groqApiKey = process.env.GROQ_API_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Supabase env vars are missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const [{ data: songsData, error: songsError }, { data: existingArtistData }] = await Promise.all([
      supabase
        .from('songs')
        .select('title,artist,album,genre,mood,thumbnail_url,youtube_id')
        .ilike('artist', `%${name}%`),
      supabase
        .from('artist_profiles')
        .select('bio,genre,image_url')
        .ilike('name', `%${name}%`)
        .maybeSingle(),
    ])

    if (songsError) {
      return NextResponse.json({ error: songsError.message || 'Failed to load songs' }, { status: 500 })
    }

    const songs = songsData || []

    const image_url = await resolveArtistImageUrl(name, songs, body.image_url || existingArtistData?.image_url || undefined)
    const genre = body.genre?.trim() || existingArtistData?.genre?.trim() || inferGenreFallback(songs)
    const bio = body.bio?.trim() || existingArtistData?.bio?.trim() || inferBioFallback(name, songs)

    if (groqApiKey) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            max_tokens: 280,
            messages: [
              {
                role: 'system',
                content:
                  'You generate concise artist profile metadata for a music app. Return only valid JSON with keys bio, genre, image_url. Keep bio under 35 words. Use image_url as a plausible public image URL when possible, otherwise empty string.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  artistName: name,
                  existingProfile: {
                    bio: existingArtistData?.bio || '',
                    genre: existingArtistData?.genre || '',
                    image_url: existingArtistData?.image_url || '',
                  },
                  librarySongs: songs.slice(0, 12).map((song) => ({
                    title: song.title,
                    album: song.album,
                    genre: song.genre,
                    mood: song.mood,
                    thumbnail_url: song.thumbnail_url,
                  })),
                }),
              },
            ],
            response_format: { type: 'json_object' },
          }),
        })

        if (groqResponse.ok) {
          const groqData = await groqResponse.json() as { choices?: Array<{ message?: { content?: string } }> }
          const parsed = safeJsonParse(groqData.choices?.[0]?.message?.content || '')
          if (parsed) {
            return NextResponse.json({
              name,
              bio: normalizeText(parsed.bio || bio),
              genre: normalizeText(parsed.genre || genre),
              image_url,
              trackCount: songs.length,
              source: 'groq',
            })
          }
        }
      } catch {
        // Fall through to deterministic fallback.
      }
    }

    return NextResponse.json({
      name,
      bio,
      genre,
      image_url,
      trackCount: songs.length,
      source: 'fallback',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}