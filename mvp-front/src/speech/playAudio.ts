let audioEl: HTMLAudioElement | null = null
let stopResolver: (() => void) | null = null

export function stopSharedAudio() {
  if (!audioEl) return
  const resolveStop = stopResolver
  stopResolver = null
  audioEl.onerror = null
  audioEl.onended = null
  audioEl.pause()
  audioEl.removeAttribute('src')
  audioEl.load()
  audioEl = null
  resolveStop?.()
}

export function playBlob(blob: Blob): Promise<void> {
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
