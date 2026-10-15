import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getByokKey } from '../ai/byok'
import { AI_SETTINGS_EVENT } from '../ai/selection'
import { geminiProbeMessage, probeGeminiAccess } from '../ai/probeGemini'
import { config } from '../config'
import {
  browserSttSupported,
  listenBrowserOnce,
  stopBrowserStt,
} from './browserStt'
import { browserTtsReady, browserTtsSupported } from './browserTts'
import { resolveTtsSelection, TTS_SETTINGS_EVENT } from './ttsSelection'
import { speakText, stopTts, type SpeakStatus } from './tts'
import { ttsDebug } from './ttsDebug'

type SpeakOptions = {
  messageId?: string
  listenAfter?: boolean
}

type HeardInsert = {
  id: number
  text: string
}

type VoiceContextValue = {
  enabled: boolean
  setEnabled: (value: boolean) => void
  preparing: boolean
  speaking: boolean
  listening: boolean
  playingMessageId: string | null
  voiceError: string
  heardInsert: HeardInsert | null
  sttSupported: boolean
  ttsSupported: boolean
  speak: (text: string, options?: SpeakOptions) => Promise<void>
  stopAll: () => void
  startMic: () => Promise<void>
  stopMic: () => void
  clearVoiceError: () => void
  consumeHeardInsert: (id: number) => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)
const VOICE_EVENT = 'mvp-speech-settings'

function readEnabled() {
  try {
    const v = localStorage.getItem(config.speech.voiceModeKey)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => readEnabled())
  const [preparing, setPreparing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState('')
  const [heardInsert, setHeardInsert] = useState<HeardInsert | null>(null)
  const runIdRef = useRef(0)
  const heardIdRef = useRef(0)

  const clearVoiceError = useCallback(() => setVoiceError(''), [])

  const pushHeard = useCallback((text: string) => {
    const value = text.trim()
    if (!value) return
    heardIdRef.current += 1
    setHeardInsert({ id: heardIdRef.current, text: value })
  }, [])

  const consumeHeardInsert = useCallback((id: number) => {
    setHeardInsert((prev) => (prev?.id === id ? null : prev))
  }, [])

  const runAccessChecks = useCallback(async () => {
    if (!enabled) return

    const tts = resolveTtsSelection()
    if (tts.provider === 'browser') {
      const ok = await browserTtsReady()
      if (!ok) {
        setVoiceError(
          'Встроенная озвучка недоступна в этом браузере (часто Safari). Выберите Gemini или AIAI TTS.',
        )
        return
      }
    }

    if (tts.provider === 'gemini' && getByokKey('gemini')) {
      const probe = await probeGeminiAccess(true)
      if (!probe.ok && probe.reason !== 'no_key') {
        setVoiceError(geminiProbeMessage(probe))
      }
    }
  }, [enabled])

  useEffect(() => {
    function sync() {
      setEnabledState(readEnabled())
    }
    window.addEventListener(VOICE_EVENT, sync)
    return () => window.removeEventListener(VOICE_EVENT, sync)
  }, [])

  useEffect(() => {
    void runAccessChecks()

    function onOnline() {
      void runAccessChecks()
    }
    function onSettings() {
      void runAccessChecks()
    }

    window.addEventListener('online', onOnline)
    window.addEventListener(TTS_SETTINGS_EVENT, onSettings)
    window.addEventListener(AI_SETTINGS_EVENT, onSettings)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener(TTS_SETTINGS_EVENT, onSettings)
      window.removeEventListener(AI_SETTINGS_EVENT, onSettings)
    }
  }, [enabled, runAccessChecks])

  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem(config.speech.voiceModeKey, value ? '1' : '0')
    setEnabledState(value)
    window.dispatchEvent(new Event(VOICE_EVENT))
    if (!value) {
      runIdRef.current += 1
      stopTts()
      stopBrowserStt()
      setPreparing(false)
      setSpeaking(false)
      setListening(false)
      setPlayingMessageId(null)
      setVoiceError('')
    }
  }, [])

  const stopAll = useCallback(() => {
    runIdRef.current += 1
    stopTts()
    stopBrowserStt()
    setPreparing(false)
    setSpeaking(false)
    setListening(false)
    setPlayingMessageId(null)
  }, [])

  const stopMic = useCallback(() => {
    stopBrowserStt()
    setListening(false)
  }, [])

  const startMic = useCallback(async () => {
    if (!browserSttSupported()) {
      throw new Error('Speech recognition недоступен в этом браузере')
    }
    const runId = ++runIdRef.current
    stopTts()
    setPreparing(false)
    setSpeaking(false)
    setPlayingMessageId(null)
    setVoiceError('')
    setListening(true)
    try {
      const text = await listenBrowserOnce()
      if (runId !== runIdRef.current) return
      pushHeard(text)
    } finally {
      if (runId === runIdRef.current) setListening(false)
    }
  }, [pushHeard])

  const speak = useCallback(
    async (text: string, options?: SpeakOptions) => {
      const runId = ++runIdRef.current
      stopBrowserStt()
      setListening(false)
      setVoiceError('')
      setPreparing(true)
      setSpeaking(false)
      setPlayingMessageId(options?.messageId ?? null)

      const onStatus = (status: SpeakStatus) => {
        if (runId !== runIdRef.current) return
        if (status === 'loading') {
          setPreparing(true)
          setSpeaking(false)
        }
        if (status === 'playing') {
          setPreparing(false)
          setSpeaking(true)
        }
        if (status === 'done') {
          setPreparing(false)
          setSpeaking(false)
        }
      }

      try {
        ttsDebug('voice.speak', {
          messageId: options?.messageId ?? null,
          listenAfter: Boolean(options?.listenAfter),
          textLen: text.length,
        })
        await speakText(text, { onStatus })
        if (runId !== runIdRef.current) return
        setPreparing(false)
        setSpeaking(false)
        setPlayingMessageId(null)

        if (!options?.listenAfter || !enabled) return
        if (!browserSttSupported()) return

        ttsDebug('voice.listenAfter.begin', { messageId: options?.messageId ?? null })
        setListening(true)
        try {
          const heard = await listenBrowserOnce()
          if (runId !== runIdRef.current) return
          ttsDebug('voice.listenAfter.heard', { chars: heard.length })
          pushHeard(heard)
        } catch (e) {
          if (runId !== runIdRef.current) return
          ttsDebug(
            'voice.listenAfter.error',
            { error: e instanceof Error ? e.message : String(e) },
            'error',
          )
          setVoiceError(e instanceof Error ? e.message : 'Ошибка микрофона')
        } finally {
          if (runId === runIdRef.current) setListening(false)
        }
      } catch (e) {
        if (runId !== runIdRef.current) return
        setPreparing(false)
        setSpeaking(false)
        setPlayingMessageId(null)
        setListening(false)
        ttsDebug(
          'voice.speak.error',
          { error: e instanceof Error ? e.message : String(e) },
          'error',
        )
        setVoiceError(e instanceof Error ? e.message : 'Ошибка озвучки')
      }
    },
    [enabled, pushHeard],
  )

  const value = useMemo<VoiceContextValue>(
    () => ({
      enabled,
      setEnabled,
      preparing,
      speaking,
      listening,
      playingMessageId,
      voiceError,
      heardInsert,
      sttSupported: browserSttSupported(),
      ttsSupported:
        browserTtsSupported() ||
        Boolean(getByokKey('gemini')) ||
        Boolean(getByokKey('aiai')),
      speak,
      stopAll,
      startMic,
      stopMic,
      clearVoiceError,
      consumeHeardInsert,
    }),
    [
      enabled,
      setEnabled,
      preparing,
      speaking,
      listening,
      playingMessageId,
      voiceError,
      heardInsert,
      speak,
      stopAll,
      startMic,
      stopMic,
      clearVoiceError,
      consumeHeardInsert,
    ],
  )

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice outside VoiceProvider')
  return ctx
}
