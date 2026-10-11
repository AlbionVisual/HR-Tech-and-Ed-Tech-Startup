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
import { config } from '../config'
import {
  browserSttSupported,
  listenBrowserOnce,
  stopBrowserStt,
} from './browserStt'
import { speakText, stopTts, type SpeakStatus } from './tts'

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
    return localStorage.getItem(config.speech.voiceModeKey) === '1'
  } catch {
    return false
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

  useEffect(() => {
    function sync() {
      setEnabledState(readEnabled())
    }
    window.addEventListener(VOICE_EVENT, sync)
    return () => window.removeEventListener(VOICE_EVENT, sync)
  }, [])

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
        await speakText(text, { onStatus })
        if (runId !== runIdRef.current) return
        setPreparing(false)
        setSpeaking(false)
        setPlayingMessageId(null)

        if (!options?.listenAfter || !enabled) return
        if (!browserSttSupported()) return

        setListening(true)
        try {
          const heard = await listenBrowserOnce()
          if (runId !== runIdRef.current) return
          pushHeard(heard)
        } catch (e) {
          if (runId !== runIdRef.current) return
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
      ttsSupported: true,
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
