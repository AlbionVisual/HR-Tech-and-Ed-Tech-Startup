let audioEl: HTMLAudioElement | null = null
let stopResolver: (() => void) | null = null
let audioCtx: AudioContext | null = null
let activeSource: AudioBufferSourceNode | null = null

function closeCtx() {
  if (activeSource) {
    try {
      activeSource.onended = null
      activeSource.stop()
    } catch {
      // already stopped
    }
    activeSource.disconnect()
    activeSource = null
  }
}

export function stopSharedAudio() {
  closeCtx()
  if (audioEl) {
    const resolveStop = stopResolver
    stopResolver = null
    audioEl.onerror = null
    audioEl.onended = null
    audioEl.pause()
    audioEl.removeAttribute('src')
    audioEl.load()
    audioEl = null
    resolveStop?.()
  } else if (stopResolver) {
    const resolveStop = stopResolver
    stopResolver = null
    resolveStop()
  }
}

async function playViaWebAudio(blob: Blob): Promise<void> {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) throw new Error('Web Audio API недоступен')

  const ctx = audioCtx && audioCtx.state !== 'closed' ? audioCtx : new Ctx()
  audioCtx = ctx
  if (ctx.state === 'suspended') await ctx.resume()

  const raw = await blob.arrayBuffer()
  const decoded = await ctx.decodeAudioData(raw.slice(0))

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      stopResolver = null
      if (activeSource) {
        activeSource.onended = null
        activeSource.disconnect()
        activeSource = null
      }
      fn()
    }

    const source = ctx.createBufferSource()
    activeSource = source
    source.buffer = decoded
    source.connect(ctx.destination)
    stopResolver = () => finish(() => resolve())
    source.onended = () => finish(() => resolve())
    try {
      source.start(0)
    } catch (e) {
      finish(() =>
        reject(e instanceof Error ? e : new Error('Не удалось стартовать аудио')),
      )
    }
  })
}

function playViaElement(blob: Blob): Promise<void> {
  stopSharedAudio()
  const urlObject = URL.createObjectURL(blob)
  const audio = new Audio()
  audio.preload = 'auto'
  audioEl = audio

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      stopResolver = null
      URL.revokeObjectURL(urlObject)
      if (audioEl === audio) audioEl = null
      fn()
    }

    stopResolver = () => finish(() => resolve())
    audio.onended = () => finish(() => resolve())
    audio.onerror = () =>
      finish(() => reject(new Error('Не удалось воспроизвести аудио')))

    audio.src = urlObject
    void audio.play().catch((err) => finish(() => reject(err)))
  })
}

export async function playBlob(blob: Blob): Promise<void> {
  stopSharedAudio()
  try {
    await playViaWebAudio(blob)
  } catch {
    await playViaElement(blob)
  }
}
