export type AiProviderId = 'gemini' | 'openrouter' | 'aiai' | 'mock'

export type AiModelDef = {
  id: string
  label: string
}

export const providerLabels: Record<AiProviderId, string> = {
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  aiai: 'AIAI',
  mock: 'Локально',
}

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
    models: [
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
    ] satisfies AiModelDef[],
    defaultModel: 'gemini-3.5-flash-lite',
    directBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    includeThoughts: true,
  },
  openrouter: {
    models: [
      {
        id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        label: 'Nemotron 3 Ultra 550B',
      },
      {
        id: 'dots-studio/dots-3-note-preview:free',
        label: 'Dots 3 Note Preview',
      },
      {
        id: 'nvidia/nemotron-3-super-120b-a12b:free',
        label: 'Nemotron 3 Super 120B',
      },
      { id: 'cohere/north-mini-code:free', label: 'North Mini Code' },
    ] satisfies AiModelDef[],
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    siteUrl: 'http://localhost:5273',
    appName: 'Interview MVP',
  },
  aiai: {
    baseUrl: 'https://api.aiai.by/v1',
    models: [
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
      { id: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
    ] satisfies AiModelDef[],
    defaultModel: 'gemini-3.5-flash-lite',
  },
  mock: {
    models: [] satisfies AiModelDef[],
    defaultModel: 'demo',
  },
  byok: {
    storageKeyPrefix: 'mvp.ai.byokKey',
  },
}

function modelsOf(provider: AiProviderId): AiModelDef[] {
  if (provider === 'openrouter') return aiConfig.openrouter.models
  if (provider === 'aiai') return aiConfig.aiai.models
  if (provider === 'mock') return aiConfig.mock.models
  return aiConfig.gemini.models
}

export function getProviderModels(provider: AiProviderId): string[] {
  return modelsOf(provider).map((m) => m.id)
}

export function getProviderModelDefs(provider: AiProviderId): AiModelDef[] {
  return [...modelsOf(provider)]
}

export function getModelLabel(provider: AiProviderId, modelId: string) {
  const found = modelsOf(provider).find((m) => m.id === modelId)
  return found?.label ?? modelId.split('/').pop() ?? modelId
}

export function formatModelOptionLabel(provider: AiProviderId, modelId: string) {
  if (provider === 'mock') return getModelLabel(provider, modelId)
  return `${providerLabels[provider]}: ${getModelLabel(provider, modelId)}`
}

export function getProviderDefaultModel(provider: AiProviderId): string {
  if (provider === 'openrouter') return aiConfig.openrouter.defaultModel
  if (provider === 'aiai') return aiConfig.aiai.defaultModel
  if (provider === 'mock') return aiConfig.mock.defaultModel
  return aiConfig.gemini.defaultModel
}
