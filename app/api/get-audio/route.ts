import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { youtubeId } = await req.json()

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RAPIDAPI_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RAPIDAPI_KEY is missing' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://youtube-mp36.p.rapidapi.com/dl?id=${youtubeId}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com',
        },
      }
    )

    const data = await response.json()

    if (data.status === 'ok' && data.link) {
      return NextResponse.json({ audioUrl: data.link })
    }

    const backup = await fetch(
      `https://yt-api.p.rapidapi.com/dl?id=${youtubeId}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
        },
      }
    )

    const backupData = await backup.json()
    const audioFormat = backupData.formats?.find(
      (f: any) => f.hasAudio && !f.hasVideo
    )

    if (audioFormat?.url) {
      return NextResponse.json({ audioUrl: audioFormat.url })
    }

    return NextResponse.json(
      { error: 'Could not fetch audio' },
      { status: 500 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}