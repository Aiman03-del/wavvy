import { NextResponse } from 'next/server'

type Body = {
  title?: string
  artist?: string
  youtubeId?: string
}

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null }
  }>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const title = (body.title || '').trim()
    const artist = (body.artist || '').trim()
    const youtubeId = (body.youtubeId || '').trim()

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'title and artist are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is missing' },
        { status: 500 }
      )
    }

    const system = [
      'You generate song lyrics.',
      'Return ONLY valid JSON, no markdown, no extra text.',
      'Do not include timestamps.',
      'Keep it PG-13 and avoid hateful, sexual, or illegal content.',
      'If the song already exists, do not copy it; generate original lyrics inspired by the theme.',
    ].join(' ')

    const user = [
      `Song: ${title} — ${artist}`,
      youtubeId ? `YouTube: https://youtube.com/watch?v=${youtubeId}` : '',
      'Generate 2-3 verses and a chorus (repeat chorus twice).',
      'If the song language seems non-English, you may include that language, but output should still be readable.',
      'JSON shape:',
      '{ "lyrics": "..." }',
    ]
      .filter(Boolean)
      .join('\n')

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_LYRICS_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 900,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json(
        { error: 'AI request failed', details: text },
        { status: 500 }
      )
    }

    const data = (await resp.json()) as GroqChatCompletionResponse
    const content = (data.choices?.[0]?.message?.content || '').trim()

    let payload: { lyrics?: string } = {}
    try {
      payload = JSON.parse(content || '{}') as { lyrics?: string }
    } catch {
      payload = {}
    }

    const lyrics = (payload.lyrics || '').trim()
    if (!lyrics) {
      return NextResponse.json(
        { error: 'No lyrics generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lyrics })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

