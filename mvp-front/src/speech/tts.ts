import { browserTtsReady, browserTtsSupported, speakBrowser, stopBrowserTts } from './browserTts'
import { fetchAiaiTtsBlob } from './aiaiTts'
import { fetchGeminiTtsBlob } from './geminiTts'
import { playBlob, stopSharedAudio } from './playAudio'
import {
  clearCachedTts,
  getCachedTts,
  setCachedTts,
  ttsCacheKey,
} from './ttsCache'
import { resolveTtsSelection } from './ttsSelection'
import { ttsDebug } from './ttsDebug'

export type SpeakStatus = 'loading' | 'playing' | 'done'

export type SpeakTextOptions = {
  cacheKey?: string
  onStatus?: (status: SpeakStatus) => void
}

export function stopTts() {
  stopBrowserTts()
  stopSharedAudio()
}

export async function speakText(
  text: string,
  options?: SpeakTextOptions,
): Promise<void> {
  const value = text.trim()
  if (!value) return

  const selected = resolveTtsSelection()
  const onStatus = options?.onStatus

  ttsDebug('speak.begin', {
    provider: selected.provider,
    model: selected.model,
    voice: selected.voice,
    textLen: value.length,
    textPreview: value.slice(0, 100),
  })

  if (selected.provider === 'browser') {
    if (!browserTtsSupported() || !(await browserTtsReady())) {
      ttsDebug('speak.browser.unavailable', {}, 'error')
      throw new Error(
        'Встроенная озвучка недоступна в этом браузере (часто Safari). Выберите Gemini или AIAI TTS.',
      )
    }
    onStatus?.('playing')
    await speakBrowser(value)
    onStatus?.('done')
    ttsDebug('speak.done', { provider: 'browser' })
    return
  }

  const key =
    options?.cacheKey ||
    ttsCacheKey({
      provider: selected.provider,
      model: selected.model,
      voice: selected.voice,
      text: value,
    })

  let blob = getCachedTts(key)
  const cacheHit = Boolean(blob)
  ttsDebug('speak.cache', { hit: cacheHit, keyPreview: key.slice(0, 120) })
  if (!blob) {
    onStatus?.('loading')
    if (selected.provider === 'gemini') {
      blob = await fetchGeminiTtsBlob(value, selected.model, selected.voice)
    } else if (selected.provider === 'aiai') {
      blob = await fetchAiaiTtsBlob(value, selected.model, selected.voice)
    } else {
      throw new Error(`Неизвестный TTS провайдер: ${selected.provider}`)
    }
    setCachedTts(key, blob)
    ttsDebug('speak.fetched', {
      provider: selected.provider,
      bytes: blob.size,
      type: blob.type,
    })
  }

  onStatus?.('playing')
  try {
    await playBlob(blob)
  } catch (e) {
    ttsDebug(
      'speak.playFailed',
      {
        provider: selected.provider,
        error: e instanceof Error ? e.message : String(e),
      },
      'error',
    )
    clearCachedTts(key)
    if (selected.provider === 'aiai') {
      onStatus?.('loading')
      blob = await fetchAiaiTtsBlob(value, selected.model, selected.voice)
      setCachedTts(key, blob)
      onStatus?.('playing')
      try {
        await playBlob(blob)
      } catch {
        clearCachedTts(key)
        throw new Error(
          'AIAI: не удалось воспроизвести полное аудио. Попробуйте модель s1 или другую.',
        )
      }
      onStatus?.('done')
      ttsDebug('speak.done', { provider: 'aiai', retried: true })
      return
    }
    throw e
  }
  onStatus?.('done')
  ttsDebug('speak.done', { provider: selected.provider, cacheHit })
}
