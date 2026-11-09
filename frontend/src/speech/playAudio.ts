import {
  estimateMp3Seconds,
  estimatePcm16Seconds,
  sniffHeadHex,
  ttsDebug,
} from './ttsDebug'

let audioEl: HTMLAudioElement | null = null
let stopResolver: (() => void) | null = null
let audioCtx: AudioContext | null = null
let activeSource: AudioBufferSourceNode | null = null

function closeCtx() {
  if (activeSource) {
    try {
      activeSource.onended = null
    } catch {
      // already stopped
    }
    activeSource.disconnect()
    activeSource = null
  }
}

export function stopSharedAudio() {
  const hadSource = Boolean(activeSource || audioEl || stopResolver)
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
    if (hadSource) ttsDebug('play.stopSharedAudio', { via: 'element' }, 'warn')
    resolveStop?.()
  } else if (stopResolver) {
    const resolveStop = stopResolver
    stopResolver = null
    if (hadSource) ttsDebug('play.stopSharedAudio', { via: 'webaudio' }, 'warn')
    resolveStop()
  }
}

async function playViaWebAudio(blob: Blob): Promise<void> {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) throw new Error('Web Audio API недоступен')

  const ctx = audioCtx && audioCtx.state !== 'closed' ? audioCtx : new Ctx()
  audioCtx = ctx
  if (ctx.state === 'suspended') {
    ttsDebug('play.webaudio.resume', { state: ctx.state })
    await ctx.resume()
  }

  const raw = await blob.arrayBuffer()
  const t0 = performance.now()
  const decoded = await ctx.decodeAudioData(raw.slice(0))
  const decodeMs = performance.now() - t0
  const estMp3 = estimateMp3Seconds(raw.byteLength)
  const estPcm = estimatePcm16Seconds(raw.byteLength, decoded.sampleRate || 24000)

  ttsDebug('play.webaudio.decoded', {
    blobType: blob.type,
    bytes: raw.byteLength,
    headHex: sniffHeadHex(raw),
    decodeMs: Math.round(decodeMs),
    durationSec: Number(decoded.duration.toFixed(3)),
    frames: decoded.length,
    sampleRate: decoded.sampleRate,
    channels: decoded.numberOfChannels,
    estMp3Sec128k: Number(estMp3.toFixed(3)),
    estPcm16Sec: Number(estPcm.toFixed(3)),
    durationVsEstMp3:
      estMp3 > 0 ? Number((decoded.duration / estMp3).toFixed(3)) : null,
    ctxState: ctx.state,
  })

  if (estMp3 > 8 && decoded.duration < estMp3 * 0.5) {
    ttsDebug(
      'play.webaudio.shortDecodeSuspect',
      {
        durationSec: decoded.duration,
        estMp3Sec128k: estMp3,
        bytes: raw.byteLength,
      },
      'warn',
    )
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const startedAt = performance.now()
    const finish = (fn: () => void, reason: string) => {
      if (settled) return
      settled = true
      stopResolver = null
      if (activeSource) {
        activeSource.onended = null
        activeSource.disconnect()
        activeSource = null
      }
      ttsDebug('play.webaudio.finish', {
        reason,
        playedMs: Math.round(performance.now() - startedAt),
        bufferDurationSec: Number(decoded.duration.toFixed(3)),
      })
      fn()
    }

    const source = ctx.createBufferSource()
    activeSource = source
    source.buffer = decoded
    source.connect(ctx.destination)
    stopResolver = () => finish(() => resolve(), 'stopped')
    source.onended = () => finish(() => resolve(), 'ended')
    try {
      source.start(0)
      ttsDebug('play.webaudio.started', {
        durationSec: Number(decoded.duration.toFixed(3)),
      })
    } catch (e) {
      finish(
        () =>
          reject(
            e instanceof Error ? e : new Error('Не удалось стартовать аудио'),
          ),
        'start-error',
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
    const startedAt = performance.now()
    const finish = (fn: () => void, reason: string) => {
      if (settled) return
      settled = true
      stopResolver = null
      ttsDebug('play.element.finish', {
        reason,
        playedMs: Math.round(performance.now() - startedAt),
        mediaDuration: Number.isFinite(audio.duration) ? audio.duration : null,
        currentTime: audio.currentTime,
      })
      URL.revokeObjectURL(urlObject)
      if (audioEl === audio) audioEl = null
      fn()
    }

    stopResolver = () => finish(() => resolve(), 'stopped')
    audio.onended = () => finish(() => resolve(), 'ended')
    audio.onerror = () =>
      finish(() => reject(new Error('Не удалось воспроизвести аудио')), 'error')
    audio.onloadedmetadata = () => {
      ttsDebug('play.element.metadata', {
        mediaDuration: Number.isFinite(audio.duration) ? audio.duration : null,
        blobType: blob.type,
        bytes: blob.size,
      })
    }

    audio.src = urlObject
    void audio
      .play()
      .then(() => ttsDebug('play.element.started', { blobType: blob.type }))
      .catch((err) => finish(() => reject(err), 'play-reject'))
  })
}

export async function playBlob(blob: Blob): Promise<void> {
  stopSharedAudio()
  ttsDebug('play.blob.begin', {
    bytes: blob.size,
    type: blob.type,
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  })
  try {
    await playViaWebAudio(blob)
    ttsDebug('play.blob.done', { path: 'webaudio' })
  } catch (e) {
    ttsDebug(
      'play.webaudio.failedFallbackElement',
      { error: e instanceof Error ? e.message : String(e) },
      'warn',
    )
    await playViaElement(blob)
    ttsDebug('play.blob.done', { path: 'element' })
  }
}
