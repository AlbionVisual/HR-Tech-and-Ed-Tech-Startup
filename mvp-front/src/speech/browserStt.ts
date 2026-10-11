import { config } from '../config'

let active: SpeechRecognition | null = null

export function browserSttSupported() {
  if (typeof window === 'undefined') return false
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function stopBrowserStt() {
  if (!active) return
  try {
    active.onresult = null
    active.onerror = null
    active.onend = null
    active.abort()
  } catch {
    // ignore
  }
  active = null
}

function humanizeSttError(code: string) {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return (
      'Нет доступа к микрофону. Разрешите браузеру использовать микрофон ' +
      'в настройках телефона (или сайта) и попробуйте снова.'
    )
  }
  if (code === 'network') {
    return 'Распознавание речи недоступно. Проверьте интернет и разрешение микрофона.'
  }
  if (code === 'audio-capture') {
    return (
      'Микрофон недоступен. Разрешите браузеру использовать микрофон ' +
      'в настройках телефона или сайта.'
    )
  }
  return `Распознавание: ${code || 'ошибка'}`
}

async function ensureMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of stream.getTracks()) track.stop()
  } catch {
    throw new Error(
      'Нет доступа к микрофону. Разрешите браузеру использовать микрофон ' +
        'в настройках телефона (или сайта) и попробуйте снова.',
    )
  }
}

export async function listenBrowserOnce(): Promise<string> {
  await ensureMicPermission()

  return new Promise((resolve, reject) => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      reject(new Error('Браузер не поддерживает SpeechRecognition'))
      return
    }

    if (!window.isSecureContext && location.hostname !== 'localhost') {
      reject(new Error('Распознавание требует HTTPS'))
      return
    }

    stopBrowserStt()
    const rec = new Ctor()
    active = rec
    rec.lang = config.speech.lang
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    let finished = false
    let finalText = ''
    const finish = (fn: () => void) => {
      if (finished) return
      finished = true
      if (active === rec) active = null
      fn()
    }

    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? ''
        if (event.results[i].isFinal) finalText += chunk
        else interim += chunk
      }
      if (finalText.trim() && !interim) {
        finish(() => resolve(finalText.trim()))
      }
    }
    rec.onerror = (event) => {
      if (event.error === 'aborted') {
        finish(() => resolve(finalText.trim()))
        return
      }
      if (event.error === 'no-speech') {
        finish(() => resolve(finalText.trim()))
        return
      }
      finish(() => reject(new Error(humanizeSttError(event.error))))
    }
    rec.onend = () => {
      finish(() => resolve(finalText.trim()))
    }

    try {
      rec.start()
    } catch (e) {
      finish(() =>
        reject(e instanceof Error ? e : new Error('Не удалось стартовать микрофон')),
      )
    }
  })
}
