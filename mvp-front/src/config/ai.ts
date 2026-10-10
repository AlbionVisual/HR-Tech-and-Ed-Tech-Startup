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
      'nvidia/nemotron-3.5-lightning:free',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
    ],
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    siteUrl: 'http://localhost:5173',
    appName: 'Interview MVP',
  },
  aiai: {
    baseUrl: '',
    models: [] as string[],
    defaultModel: '',
  },
  byok: {
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
