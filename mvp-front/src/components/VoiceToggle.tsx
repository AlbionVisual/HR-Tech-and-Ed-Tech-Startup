import { useVoice } from '../speech/VoiceContext'

export function VoiceToggle() {
  const { enabled, setEnabled, ttsSupported, sttSupported } = useVoice()
  const unsupported = !ttsSupported && !sttSupported

  return (
    <label
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.75rem] ${
        enabled
          ? 'border-accent bg-bg-panel text-ink'
          : 'border-line bg-bg-elevated text-muted'
      } ${unsupported ? 'opacity-50' : ''}`}
      title={
        unsupported
          ? 'Нет ни встроенного TTS, ни ключей Gemini/AIAI для озвучки'
          : 'Озвучка ответов ИИ и микрофон'
      }
    >
      <input
        type="checkbox"
        className="m-0"
        checked={enabled}
        disabled={unsupported}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      <span className="whitespace-nowrap">Озвучка</span>
    </label>
  )
}
