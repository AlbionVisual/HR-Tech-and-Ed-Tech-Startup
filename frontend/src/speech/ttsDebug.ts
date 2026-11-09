type TtsDebugLevel = 'info' | 'warn' | 'error'

export type TtsDebugEntry = {
  t: number
  iso: string
  level: TtsDebugLevel
  tag: string
  data?: Record<string, unknown>
}

const MAX = 200
const entries: TtsDebugEntry[] = []
let announced = false

function announce() {
  if (announced || typeof window === 'undefined') return
  announced = true
  console.info(
    '[tts-debug] Логи включены. Снять дамп: copy(window.__TTS_DEBUG__.dump()) или window.__TTS_DEBUG__.print()',
  )
}

export function ttsDebug(
  tag: string,
  data?: Record<string, unknown>,
  level: TtsDebugLevel = 'info',
) {
  announce()
  const entry: TtsDebugEntry = {
    t: performance.now(),
    iso: new Date().toISOString(),
    level,
    tag,
    data,
  }
  entries.push(entry)
  if (entries.length > MAX) entries.shift()

  const line = data ? [`[tts-debug] ${tag}`, data] : [`[tts-debug] ${tag}`]
  if (level === 'error') console.error(...line)
  else if (level === 'warn') console.warn(...line)
  else console.log(...line)
}

export function ttsDebugDump() {
  return entries
    .map((e) => {
      const payload = e.data ? ` ${JSON.stringify(e.data)}` : ''
      return `${e.iso} +${e.t.toFixed(0)}ms [${e.level}] ${e.tag}${payload}`
    })
    .join('\n')
}

export function estimateMp3Seconds(byteLength: number, bitrateKbps = 128) {
  if (byteLength <= 0) return 0
  return (byteLength * 8) / (bitrateKbps * 1000)
}

export function estimatePcm16Seconds(byteLength: number, sampleRate = 24000) {
  if (byteLength <= 0) return 0
  return byteLength / (sampleRate * 2)
}

export function sniffHeadHex(buf: ArrayBuffer, n = 16) {
  const u8 = new Uint8Array(buf, 0, Math.min(n, buf.byteLength))
  return [...u8].map((b) => b.toString(16).padStart(2, '0')).join(' ')
}

function bindWindow() {
  if (typeof window === 'undefined') return
  ;(window as unknown as { __TTS_DEBUG__: unknown }).__TTS_DEBUG__ = {
    entries,
    dump: ttsDebugDump,
    print: () => console.log(ttsDebugDump()),
    clear: () => {
      entries.length = 0
    },
  }
}

bindWindow()
