export type AiProviderId = 'gemini' | 'openrouter' | 'aiai'

export const aiConfig = {
  preferredProvider: 'openrouter' as AiProviderId,
  typewriter: {
    chunkSize: 2,
    delayMs: 14,
  },
  selection: {
    storageKey: 'mvp.ai.selectedModel',
  },
  gemini: {
    models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
    defaultModel: 'gemini-3.5-flash-lite',
    directBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    includeThoughts: true,
  },
  openrouter: {
    models: [
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'poolside/laguna-s-2.1:free',
      'nvidia/nemotron-3.5-lightning:free',
      'dots-studio/dots-3-note-preview:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'apodex/apodex-1.1-mini:free',
      'thinkingmachines/inkling:free',
      'cohere/north-mini-code:free',
    ],
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    siteUrl: 'http://localhost:5173',
    appName: 'Interview MVP',
  },
  aiai: {
    baseUrl: 'https://api.aiai.by/v1',
    models: ['gemini-3.5-flash-lite', 'deepseek-v4.1-flash'],
    defaultModel: 'gemini-3.5-flash-lite',
  },
  byok: {п
    storageKeyPrefix: 'mvp.ai.byokKey',
  },
}

export function getProviderModels(provider: AiProviderId): string[] {
  if (provider === 'openrouter') return [...aiConfig.openrouter.models]
  if (provider === 'aiai') return [...aiConfig.aiai.models]
  return [...aiConfig.gemini.models]
}

export function getProviderDefaultModel(provider: AiProviderId): string {
  if (provider === 'openrouter') return aiConfig.openrouter.defaultModel
  if (provider === 'aiai') return aiConfig.aiai.defaultModel
  return aiConfig.gemini.defaultModel
}
