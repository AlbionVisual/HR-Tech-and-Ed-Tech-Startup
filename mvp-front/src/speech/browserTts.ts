import { config } from '../config'

let current: SpeechSynthesisUtterance | null = null

export function browserTtsSupported() {
  if (typeof window === 'undefined') return false
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return false
  }
  // Safari / часть мобильных: API есть, но движок фактически мёртв
  try {
    if (typeof window.speechSynthesis.getVoices !== 'function') return false
  } catch {
    return false
  }
  return true
}

/** Более честная проверка: есть ли хоть один голос (после voiceschanged). */
export async function browserTtsReady(): Promise<boolean> {
  if (!browserTtsSupported()) return false
  const synth = window.speechSynthesis
  const existing = synth.getVoices()
  if (existing.length > 0) return true

  return new Promise((resolve) => {
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      synth.removeEventListener('voiceschanged', onVoices)
      resolve(ok)
    }
    const onVoices = () => finish(synth.getVoices().length > 0)
    synth.addEventListener('voiceschanged', onVoices)
    // форс-запрос списка
    synth.getVoices()
    window.setTimeout(() => finish(synth.getVoices().length > 0), 700)
  })
}

export function stopBrowserTts() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  current = null
}

export async function speakBrowser(text: string): Promise<void> {
  if (!browserTtsSupported()) {
    throw new Error(
      'Встроенная озвучка недоступна в этом браузере (часто Safari). Выберите Gemini или AIAI TTS.',
    )
  }
  const ready = await browserTtsReady()
  if (!ready) {
    throw new Error(
      'Браузер не отдал голоса для speechSynthesis. В Safari встроенный TTS часто не работает — выберите другую модель озвучки.',
    )
  }

  return new Promise((resolve, reject) => {
    stopBrowserTts()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = config.speech.lang
    current = utter
    utter.onend = () => {
      if (current === utter) current = null
      resolve()
    }
    utter.onerror = (ev) => {
      if (current === utter) current = null
      const code = ev.error || 'error'
      if (code === 'interrupted' || code === 'canceled') {
        resolve()
        return
      }
      reject(
        new Error(
          `Встроенная озвучка не сработала (${code}). В Safari она часто недоступна — выберите Gemini/AIAI TTS.`,
        ),
      )
    }
    window.speechSynthesis.speak(utter)
  })
}
