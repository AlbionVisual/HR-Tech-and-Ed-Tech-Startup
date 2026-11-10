import { useVoice } from '../speech/VoiceContext'

export function AccessBanner() {
  const { enabled, voiceError, clearVoiceError } = useVoice()
  const text = enabled ? voiceError : ''
  if (!text) return null

  return (
    <div className="flex items-start justify-between gap-2 border-b border-danger/30 bg-danger/10 px-3 py-2 text-[0.8rem] text-danger">
      <p className="m-0">{text}</p>
      <button
        type="button"
        className="shrink-0 border-0 bg-transparent p-0 text-danger underline"
        onClick={clearVoiceError}
      >
        Скрыть
      </button>
    </div>
  )
}
