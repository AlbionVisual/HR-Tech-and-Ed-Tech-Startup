export type TtsProviderId = 'browser' | 'gemini' | 'aiai'

export type TtsModelOption = {
  provider: TtsProviderId
  model: string
  label: string
}

export type TtsModelDef = {
  model: string
  voices: string[]
  defaultVoice: string
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
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
      {
        model: 'gemini-3.8-flash-lite-tts',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      },
      {
        model: 'gemini-3.8-flash-tts',
        voices: geminiVoices,
        defaultVoice: 'Kore',
      }
    ] satisfies TtsModelDef[],
    defaultModel: 'gemini-2.5-flash-preview-tts',
  },
  aiai: {
    models: [
      {
        model: 'mai-voice-2',
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
        voices: ['ara', 'eve', 'leo', 'rex', 'sal'],
        defaultVoice: 'eve',
      },
      {
        model: 'qwen-audio-3.0-tts-flash',
        voices: ['longanhuan_v3.6', 'loongjohn'],
        defaultVoice: 'loongjohn',
      },
      {
        model: 'gemini-3.1-flash-tts',
        voices: geminiVoices,
        defaultVoice: 'Kore'
      }
    ] satisfies TtsModelDef[],
    defaultModel: 'speech-2.8-turbo',
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
