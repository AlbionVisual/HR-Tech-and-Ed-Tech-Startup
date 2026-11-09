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

type Props = {
  variant?: 'bar' | 'panel'
}

export function TtsVoiceSelect({ variant = 'bar' }: Props) {
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

  if (!enabled) {
    return (
      <span className="text-[0.75rem] text-muted">Включите озвучку</span>
    )
  }

  if (!voices.length) {
    return (
      <span className="text-[0.75rem] text-muted">Голос не выбирается</span>
    )
  }

  if (variant === 'bar' && voices.length <= 1) return null

  const selectClass =
    variant === 'panel'
      ? 'w-full rounded-lg border border-line bg-bg-elevated px-2 py-1.5 font-sans text-[0.8rem] text-ink'
      : 'w-full max-w-[160px] rounded-lg border border-line bg-bg-panel px-2 py-1.5 font-sans text-[0.75rem] text-ink'

  return (
    <label
      className={variant === 'panel' ? 'min-w-0 w-full' : 'min-w-0 max-w-[min(160px,32vw)]'}
      title="Голос озвучки"
    >
      <span className="sr-only">TTS голос</span>
      <select
        className={selectClass}
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
