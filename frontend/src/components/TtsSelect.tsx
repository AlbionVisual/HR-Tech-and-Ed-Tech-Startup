import { useEffect, useState } from 'react'
import { AI_SETTINGS_EVENT } from '../ai/selection'
import { makeTtsId } from '../config'
import { useVoice } from '../speech/VoiceContext'
import {
  listAvailableTtsModels,
  resolveTtsSelection,
  setSelectedTtsId,
  TTS_SETTINGS_EVENT,
} from '../speech/ttsSelection'
import type { TtsModelOption } from '../config'

type Props = {
  variant?: 'bar' | 'panel'
}

export function TtsSelect({ variant = 'bar' }: Props) {
  const { enabled } = useVoice()
  const [options, setOptions] = useState<TtsModelOption[]>(() =>
    listAvailableTtsModels(),
  )
  const [value, setValue] = useState(() => {
    const selected = resolveTtsSelection()
    return selected.option
      ? makeTtsId(selected.option.provider, selected.option.model)
      : ''
  })

  useEffect(() => {
    function sync() {
      const next = listAvailableTtsModels()
      setOptions(next)
      const selected = resolveTtsSelection()
      setValue(
        selected.option
          ? makeTtsId(selected.option.provider, selected.option.model)
          : '',
      )
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

  if (!options.length) {
    return <span className="text-[0.75rem] text-muted">Нет TTS-моделей</span>
  }

  const selectClass =
    variant === 'panel'
      ? 'w-full rounded-lg border border-line bg-bg-elevated px-2 py-1.5 font-sans text-[0.8rem] text-ink'
      : 'w-full max-w-[180px] rounded-lg border border-line bg-bg-panel px-2 py-1.5 font-sans text-[0.75rem] text-ink'

  return (
    <label
      className={variant === 'panel' ? 'min-w-0 w-full' : 'min-w-0 max-w-[min(180px,36vw)]'}
      title="Модель озвучки"
    >
      <span className="sr-only">TTS модель</span>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => {
          setSelectedTtsId(e.target.value)
          setValue(e.target.value)
        }}
      >
        {options.map((o) => {
          const id = makeTtsId(o.provider, o.model)
          return (
            <option key={id} value={id}>
              {o.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}
