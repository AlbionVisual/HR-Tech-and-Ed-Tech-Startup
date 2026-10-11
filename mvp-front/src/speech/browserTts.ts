import { config } from '../config'

let current: SpeechSynthesisUtterance | null = null

export function browserTtsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopBrowserTts() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  current = null
}

export function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!browserTtsSupported()) {
      reject(new Error('Браузер не поддерживает speechSynthesis'))
      return
    }
    stopBrowserTts()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = config.speech.lang
    current = utter
    utter.onend = () => {
      if (current === utter) current = null
      resolve()
    }
    utter.onerror = () => {
      if (current === utter) current = null
      resolve()
    }
    window.speechSynthesis.speak(utter)
  })
}
