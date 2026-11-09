export type TtsProviderId = 'browser' | 'gemini' | 'aiai'

export type TtsModelOption = {
  provider: TtsProviderId
  model: string
  label: string
}

export type TtsModelDef = {
  model: string
  label: string
  voices: string[]
  defaultVoice: string
}

export const ttsProviderLabels: Record<TtsProviderId, string> = {
  browser: 'Браузер',
  gemini: 'Gemini',
  aiai: 'AIAI',
}

const geminiVoices = [
  'Kore',
  'Aoede',
  'Charon',
  'Fenrir',
  'Leda',
  'Orus',
  'Puck',
  'Zephyr',
]

export const speechConfig = {
  voiceModeKey: 'mvp.speech.voiceMode',
  selectionKey: 'mvp.speech.ttsModel',
  voiceMapKey: 'mvp.speech.ttsVoiceMap',
  lang: 'ru-RU',
  browser: {
    models: [
      {
        model: 'native',
        label: 'Системный',
        voices: [] as string[],
        defaultVoice: 'native',
      },
    ],
    defaultModel: 'native',
  },
  gemini: {
    models: [
      {
        model: 'gemini-2.5-flash-preview-tts',
        label: '2.5 Flash Preview TTS',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
      {
        model: 'gemini-3.8-flash-lite-tts',
        label: '3.8 Flash Lite TTS',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
      {
        model: 'gemini-3.8-flash-tts',
        label: '3.8 Flash TTS',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
    ] satisfies TtsModelDef[],
    defaultModel: 'gemini-2.5-flash-preview-tts',
  },
  aiai: {
    models: [
      {
        model: 's1',
        label: 'S1 (Fish Audio)',
        voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
        defaultVoice: 'alloy',
      },
      {
        model: 'mai-voice-2',
        label: 'MAI Voice 2',
        voices: [
          'en-us-harper:mai-voice-2',
          'de-de-klaus:mai-voice-2',
          'es-mx-valeria:mai-voice-2',
          'fr-fr-soleil:mai-voice-2',
        ],
        defaultVoice: 'en-us-harper:mai-voice-2',
      },
      {
        model: 'grok-voice-tts-1.0',
        label: 'Grok Voice TTS',
        voices: ['ara', 'eve', 'leo', 'rex', 'sal'],
        defaultVoice: 'eve',
      },
      {
        model: 'qwen-audio-3.0-tts-flash',
        label: 'Qwen Audio 3.0 Flash',
        voices: ['longanhuan_v3.6', 'loongjohn'],
        defaultVoice: 'loongjohn',
      },
      {
        model: 'gemini-3.1-flash-tts',
        label: 'Gemini 3.1 Flash TTS',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
    ] satisfies TtsModelDef[],
    defaultModel: 's1',
  },
}

export function findTtsModelDef(
  provider: TtsProviderId,
  model: string,
): TtsModelDef | null {
  if (provider === 'browser') {
    return (
      speechConfig.browser.models.find((m) => m.model === model) ??
      speechConfig.browser.models[0] ??
      null
    )
  }
  if (provider === 'gemini') {
    return speechConfig.gemini.models.find((m) => m.model === model) ?? null
  }
  if (provider === 'aiai') {
    return speechConfig.aiai.models.find((m) => m.model === model) ?? null
  }
  return null
}

export function formatTtsOptionLabel(provider: TtsProviderId, model: string) {
  const def = findTtsModelDef(provider, model)
  const name = def?.label ?? model.split('/').pop() ?? model
  if (provider === 'browser') return `Браузер (${name})`
  return `${ttsProviderLabels[provider]}: ${name}`
}

export function voicesForTts(provider: TtsProviderId, model: string) {
  return findTtsModelDef(provider, model)?.voices ?? []
}

export function defaultVoiceForTts(provider: TtsProviderId, model: string) {
  return (
    findTtsModelDef(provider, model)?.defaultVoice ||
    (provider === 'browser' ? 'native' : '')
  )
}

export function makeTtsId(provider: TtsProviderId, model: string) {
  return `${provider}::${model}`
}

export function parseTtsId(id: string): {
  provider: TtsProviderId
  model: string
} | null {
  const sep = id.indexOf('::')
  if (sep <= 0) return null
  const provider = id.slice(0, sep) as TtsProviderId
  const model = id.slice(sep + 2)
  if (!model) return null
  if (provider !== 'browser' && provider !== 'gemini' && provider !== 'aiai') {
    return null
  }
  return { provider, model }
}
