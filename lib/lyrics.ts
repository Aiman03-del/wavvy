import unidecode from 'unidecode'

export type LrcLine = {
  time: number
  text: string
}

const TIME_TAG = /^\s*\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/

export function hasNonLatin(text: string) {
  // Rough check: anything outside basic latin + common punctuation/spaces
  return /[^\u0000-\u024F\s]/.test(text)
}

export function romanizeToEnglishLetters(text: string) {
  // `unidecode` returns ASCII approximations for many scripts (bn/hi/ur/ko/etc.)
  // Keep newlines intact.
  return text
    .split('\n')
    .map((line) => unidecode(line))
    .join('\n')
}

export function parseLrc(raw: string): LrcLine[] {
  const lines = raw.split(/\r?\n/)
  const out: LrcLine[] = []

  for (const line of lines) {
    const match = line.match(TIME_TAG)
    if (!match) continue
    const min = Number(match[1])
    const sec = Number(match[2])
    const frac = match[3] ? Number(match[3]) : 0
    const text = (match[4] ?? '').trim()
    if (!Number.isFinite(min) || !Number.isFinite(sec)) continue

    const fracSeconds = match[3]
      ? match[3].length === 3
        ? frac / 1000
        : frac / 100
      : 0

    out.push({
      time: min * 60 + sec + fracSeconds,
      text,
    })
  }

  return out.sort((a, b) => a.time - b.time)
}

export function pickActiveLrcIndex(lines: LrcLine[], progressSeconds: number) {
  if (lines.length === 0) return -1
  let active = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progressSeconds) active = i
    else break
  }
  return active
}

export function renderTypedTextByProgress(params: {
  text: string
  progressSeconds: number
  durationSeconds: number
}) {
  const { text, progressSeconds, durationSeconds } = params
  if (!text) return ''
  if (!durationSeconds || durationSeconds <= 0) return text

  const pct = Math.max(0, Math.min(1, progressSeconds / durationSeconds))
  const total = text.length
  const visible = Math.max(0, Math.min(total, Math.floor(total * pct)))
  return text.slice(0, visible)
}

