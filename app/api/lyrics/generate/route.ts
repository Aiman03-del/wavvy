import { NextResponse } from 'next/server'

type Body = {
  title?: string
  artist?: string
  youtubeId?: string
}

type LrclibRecord = {
  trackName?: string
  artistName?: string
  albumName?: string
  plainLyrics?: string
  syncedLyrics?: string
  lyrics?: string
}

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function pickLyricsPayload(data: unknown) {
  if (!data || typeof data !== 'object') return ''
  const obj = data as Record<string, unknown>
  const synced = typeof obj.syncedLyrics === 'string' ? obj.syncedLyrics : ''
  const plain = typeof obj.plainLyrics === 'string' ? obj.plainLyrics : ''
  const direct = typeof obj.lyrics === 'string' ? obj.lyrics : ''
  return normalizeWhitespace(synced || plain || direct)
}

function cleanSearchText(text: string) {
  return text
    .replace(/(official\s*(video|audio)|music\s*video|lyrics?|lyric\s*video|audio|video|hd|4k|mv|visualizer|performance|live|feat\.?|ft\.?|remaster(?:ed)?|version|edit|explicit|clean)\b/gi, ' ')
    .replace(/[\[\](){}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)))
}

function splitArtistNames(value: string) {
  return uniqueStrings(
    value
      .split(',')
      .map(part => part.trim())
  )
}

function buildTitleVariants(title: string) {
  return uniqueStrings([title, cleanSearchText(title)])
}

function buildArtistVariants(artist: string) {
  return uniqueStrings([
    artist,
    ...splitArtistNames(artist),
  ].map(cleanSearchText))
}

function scoreSearchResult(record: LrclibRecord, title: string, artist: string) {
  const candidateTitle = cleanSearchText(record.trackName || '').toLowerCase()
  const candidateArtist = cleanSearchText(record.artistName || '').toLowerCase()
  const searchTitle = cleanSearchText(title).toLowerCase()
  const searchArtist = cleanSearchText(artist).toLowerCase()

  let score = 0
  if (candidateTitle === searchTitle) score += 8
  if (candidateArtist === searchArtist) score += 6
  if (candidateTitle.includes(searchTitle) || searchTitle.includes(candidateTitle)) score += 4
  if (candidateArtist.includes(searchArtist) || searchArtist.includes(candidateArtist)) score += 3
  if (record.syncedLyrics || record.plainLyrics || record.lyrics) score += 2
  return score
}

async function fetchLyricsFromSearch(title: string, artist: string) {
  const searchParams = new URLSearchParams()
  searchParams.set('q', `${title} ${artist}`.trim())

  const searchResp = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, { method: 'GET' })
  if (!searchResp.ok) return ''

  const searchData = await searchResp.json()
  if (!Array.isArray(searchData)) return ''

  const records = searchData as LrclibRecord[]
  const bestRecord = records
    .filter(record => Boolean(record.plainLyrics || record.syncedLyrics || record.lyrics))
    .sort((left, right) => scoreSearchResult(right, title, artist) - scoreSearchResult(left, title, artist))[0]

  return bestRecord ? pickLyricsPayload(bestRecord) : ''
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const title = (body.title || '').trim()
    const artist = (body.artist || '').trim()

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'title and artist are required' },
        { status: 400 }
      )
    }

    // 1) Try LRCLIB first (often returns synced + plain lyrics)
    const lrcLibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
      title
    )}&artist_name=${encodeURIComponent(artist)}`
    const lrcResp = await fetch(lrcLibUrl, { method: 'GET' })
    if (lrcResp.ok) {
      const lrcData = await lrcResp.json()
      const lyrics = pickLyricsPayload(lrcData)
      if (lyrics) {
        return NextResponse.json({ lyrics, source: 'lrclib' })
      }
    }

    // 1b) Broader LRCLIB search fallback for older songs whose stored title/artist
    // are noisy or slightly different from the lyrics database.
    for (const titleVariant of buildTitleVariants(title)) {
      for (const artistVariant of buildArtistVariants(artist)) {
        const lyrics = await fetchLyricsFromSearch(titleVariant, artistVariant)
        if (lyrics) {
          return NextResponse.json({ lyrics, source: 'lrclib-search' })
        }
      }
    }

    // 2) Fallback: lyrics.ovh plain lyrics
    const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(
      artist
    )}/${encodeURIComponent(title)}`
    const ovhResp = await fetch(ovhUrl, { method: 'GET' })
    if (ovhResp.ok) {
      const ovhData = await ovhResp.json()
      const lyrics = pickLyricsPayload(ovhData)
      if (lyrics) {
        return NextResponse.json({ lyrics, source: 'lyrics.ovh' })
      }
    }

    return NextResponse.json(
      { error: 'Lyrics not found for this title and artist' },
      { status: 404 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

