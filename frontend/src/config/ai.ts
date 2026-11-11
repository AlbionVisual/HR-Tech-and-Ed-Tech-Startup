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

/**
 * Источник истины по моделям — backend:
 * `backend/app/core/ai/providers.py` → `PROVIDER_CATALOG`.
 * Фронтенд получает список через `GET /api/v1/ai/models`.
 *
 * Здесь остаются только настройки UI и данные, которые пока нужны
 * клиентским TTS/probe-модулям.
 */
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
    // Нужно probeGemini и клиентскому Gemini TTS.
    defaultModel: 'gemini-3.5-flash-lite',
    directBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  aiai: {
    // Нужно клиентскому AIAI TTS.
    baseUrl: 'https://api.aiai.by/v1',
  },
  byok: {
    storageKeyPrefix: 'mvp.ai.byokKey',
  },
}
