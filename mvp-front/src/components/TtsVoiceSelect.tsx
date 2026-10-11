import { useEffect, useState } from 'react'
import { AI_SETTINGS_EVENT } from '../ai/selection'
import { voicesForTts } from '../config'
import { useVoice } from '../speech/VoiceContext'
import {
  resolveTtsSelection,
  setSelectedTtsVoice,
  TTS_SETTINGS_EVENT,
} from '../speech/ttsSelection'

function shortVoice(voice: string) {
  const bare = voice.includes(':') ? voice.split(':')[0] : voice
  return bare.length > 22 ? `${bare.slice(0, 20)}…` : bare
}

export function TtsVoiceSelect() {
  const { enabled } = useVoice()
  const [voices, setVoices] = useState<string[]>([])
  const [value, setValue] = useState('')

  useEffect(() => {
    function sync() {
      const selected = resolveTtsSelection()
      const next = voicesForTts(selected.provider, selected.model)
      setVoices(next)
      setValue(selected.voice)
    }
    sync()
    window.addEventListener(TTS_SETTINGS_EVENT, sync)
    window.addEventListener(AI_SETTINGS_EVENT, sync)
    return () => {
      window.removeEventListener(TTS_SETTINGS_EVENT, sync)
      window.removeEventListener(AI_SETTINGS_EVENT, sync)
    }
  }, [])

  if (!enabled || voices.length <= 1) return null

  return (
    <label className="min-w-0 max-w-[min(160px,32vw)]" title="Голос озвучки">
      <span className="sr-only">TTS голос</span>
      <select
        className="w-full max-w-[160px] rounded-lg border border-line bg-bg-panel px-2 py-1.5 font-sans text-[0.75rem] text-ink"
        value={value}
        onChange={(e) => {
          setSelectedTtsVoice(e.target.value)
          setValue(e.target.value)
        }}
      >
        {voices.map((v) => (
          <option key={v} value={v}>
            {shortVoice(v)}
          </option>
        ))}
      </select>
    </label>
  )
}
