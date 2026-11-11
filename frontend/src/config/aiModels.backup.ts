import type { AiModelDef } from './ai'

/**
 * BACKUP старых списков моделей.
 *
 * НЕ импортируется приложением.
 * Источник истины: backend/app/core/ai/providers.py → PROVIDER_CATALOG,
 * фронтенд получает каталог через GET /api/v1/ai/models.
 *
 * TODO: удалить этот файл после проверки, что backend-каталог полностью
 * покрывает все модели, которые нужны интерфейсу.
 */
export const legacyAiModels: Record<string, AiModelDef[]> = {
  gemini: [
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  ],
  openrouter: [
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
  ],
  aiai: [
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
    { id: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
  ],
}

/** Значения по умолчанию из старого фронтенд-каталога. */
export const legacyDefaultModels = {
  gemini: 'gemini-3.5-flash-lite',
  openrouter: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  aiai: 'gemini-3.5-flash-lite',
  mock: 'demo',
} as const

/** Настройки провайдеров, которые были в старом `aiConfig`. */
export const legacyAiEndpoints = {
  geminiDirectBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  geminiIncludeThoughts: true,
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  openrouterSiteUrl: 'http://localhost:5273',
  openrouterAppName: 'Interview MVP',
  aiaiBaseUrl: 'https://api.aiai.by/v1',
} as const
