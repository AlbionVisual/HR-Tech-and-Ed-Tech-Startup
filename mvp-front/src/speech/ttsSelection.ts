import { getByokKey } from '../ai/byok'
import {
  config,
  defaultVoiceForTts,
  makeTtsId,
  parseTtsId,
  voicesForTts,
  type TtsModelOption,
  type TtsProviderId,
} from '../config'

export const TTS_SETTINGS_EVENT = 'mvp-speech-tts'

export function notifyTtsSettingsChanged() {
  window.dispatchEvent(new Event(TTS_SETTINGS_EVENT))
}

function shortLabel(model: string) {
  const bare = model.split('/').pop() ?? model
  return bare.length > 28 ? `${bare.slice(0, 26)}…` : bare
}

export function listAvailableTtsModels(): TtsModelOption[] {
  const options: TtsModelOption[] = config.speech.browser.models.map((m) => ({
    provider: 'browser' as const,
    model: m.model,
    label: 'Браузер (системный)',
  }))

  if (getByokKey('gemini')) {
    for (const m of config.speech.gemini.models) {
      options.push({
        provider: 'gemini',
        model: m.model,
        label: `gemini: ${shortLabel(m.model)}`,
      })
    }
  }

  if (getByokKey('aiai')) {
    for (const m of config.speech.aiai.models) {
      options.push({
        provider: 'aiai',
        model: m.model,
        label: `aiai: ${shortLabel(m.model)}`,
      })
    }
  }

  return options
}

export function getSelectedTtsId() {
  try {
    return localStorage.getItem(config.speech.selectionKey) ?? ''
  } catch {
    return ''
  }
}

export function setSelectedTtsId(id: string) {
  localStorage.setItem(config.speech.selectionKey, id)
  notifyTtsSettingsChanged()
}

function readVoiceMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(config.speech.voiceMapKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeVoiceMap(map: Record<string, string>) {
  localStorage.setItem(config.speech.voiceMapKey, JSON.stringify(map))
}

export function setSelectedTtsVoice(voice: string) {
  const selected = resolveTtsSelection()
  const id = makeTtsId(selected.provider, selected.model)
  const map = readVoiceMap()
  map[id] = voice
  writeVoiceMap(map)
  notifyTtsSettingsChanged()
}

export function resolveTtsVoice(
  provider: TtsProviderId,
  model: string,
): string {
  const allowed = voicesForTts(provider, model)
  const fallback = defaultVoiceForTts(provider, model)
  if (!allowed.length) return fallback

  const id = makeTtsId(provider, model)
  const saved = readVoiceMap()[id]
  if (saved && allowed.includes(saved)) return saved
  return allowed.includes(fallback) ? fallback : allowed[0]
}

export function resolveTtsSelection(): {
  provider: TtsProviderId
  model: string
  voice: string
  option: TtsModelOption | null
} {
  const options = listAvailableTtsModels()
  const saved = parseTtsId(getSelectedTtsId())
  const match =
    options.find((o) => makeTtsId(o.provider, o.model) === getSelectedTtsId()) ||
    options.find(
      (o) => saved && o.provider === saved.provider && o.model === saved.model,
    ) ||
    (saved ? options.find((o) => o.provider === saved.provider) : null) ||
    options.find((o) => o.provider === 'browser') ||
    options[0] ||
    null

  if (!match) {
    return {
      provider: 'browser',
      model: config.speech.browser.defaultModel,
      voice: defaultVoiceForTts('browser', config.speech.browser.defaultModel),
      option: null,
    }
  }

  const id = makeTtsId(match.provider, match.model)
  if (getSelectedTtsId() !== id) {
    try {
      localStorage.setItem(config.speech.selectionKey, id)
    } catch {
      // ignore
    }
  }

  return {
    provider: match.provider,
    model: match.model,
    voice: resolveTtsVoice(match.provider, match.model),
    option: match,
  }
}
