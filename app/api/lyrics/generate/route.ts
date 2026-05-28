import { NextResponse } from 'next/server'

type Body = {
  title?: string
  artist?: string
  youtubeId?: string
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

