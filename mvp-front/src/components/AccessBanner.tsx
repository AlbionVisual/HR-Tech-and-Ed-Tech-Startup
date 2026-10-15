import { useEffect, useState } from 'react'
import { AI_SETTINGS_EVENT, resolveSelection } from '../ai/selection'
import { geminiProbeMessage, probeGeminiAccess } from '../ai/probeGemini'
import { useVoice } from '../speech/VoiceContext'

export function AccessBanner() {
  const { enabled, voiceError, clearVoiceError } = useVoice()
  const [geminiMsg, setGeminiMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const selected = resolveSelection()
      if (selected.provider !== 'gemini') {
        if (!cancelled) setGeminiMsg('')
        return
      }
      const probe = await probeGeminiAccess(true)
      if (cancelled) return
      if (!probe.ok && probe.reason !== 'no_key') {
        setGeminiMsg(geminiProbeMessage(probe))
      } else {
        setGeminiMsg('')
      }
    }

    void check()
    window.addEventListener(AI_SETTINGS_EVENT, check)
    window.addEventListener('online', check)
    return () => {
      cancelled = true
      window.removeEventListener(AI_SETTINGS_EVENT, check)
      window.removeEventListener('online', check)
    }
  }, [])

  const text = geminiMsg || (enabled ? voiceError : '')
  if (!text) return null

  return (
    <div className="flex items-start justify-between gap-2 border-b border-danger/30 bg-danger/10 px-3 py-2 text-[0.8rem] text-danger">
      <p className="m-0">{text}</p>
      <button
        type="button"
        className="shrink-0 border-0 bg-transparent p-0 text-danger underline"
        onClick={() => {
          setGeminiMsg('')
          clearVoiceError()
        }}
      >
        Скрыть
      </button>
    </div>
  )
}
