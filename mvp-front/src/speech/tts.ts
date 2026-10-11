import { speakBrowser, stopBrowserTts } from './browserTts'
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

  if (selected.provider === 'browser') {
    onStatus?.('playing')
    await speakBrowser(value)
    onStatus?.('done')
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
  }

  onStatus?.('playing')
  try {
    await playBlob(blob)
  } catch (e) {
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
          'AIAI: не удалось воспроизвести аудио (часто битый/не тот формат или обрыв ответа). Попробуйте другую модель или голос.',
        )
      }
      onStatus?.('done')
      return
    }
    throw e
  }
  onStatus?.('done')
}
