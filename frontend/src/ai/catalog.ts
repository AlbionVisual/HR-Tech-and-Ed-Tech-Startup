import { apiBaseUrl, config, type AiProviderId } from '../config'
import { notifyAiSettingsChanged } from './events'

export type ModelOption = {
  id: string
  provider: AiProviderId
  model: string
  label: string
}

export type CatalogDefault = {
  provider: AiProviderId
  model: string
}

const STORAGE_KEY = 'mvp.ai.catalog'

export function makeModelId(provider: AiProviderId, model: string) {
  return `${provider}::${model}`
}

export function parseModelId(id: string): {
  provider: AiProviderId
  model: string
} | null {
  const sep = id.indexOf('::')
  if (sep <= 0) return null
  const provider = id.slice(0, sep) as AiProviderId
  const model = id.slice(sep + 2)
  if (!model) return null
  if (
    provider !== 'gemini' &&
    provider !== 'openrouter' &&
    provider !== 'aiai' &&
    provider !== 'mock'
  ) {
    return null
  }
  return { provider, model }
}

function makeOption(
  provider: AiProviderId,
  model: string,
  label: string,
): ModelOption {
  return { id: makeModelId(provider, model), provider, model, label }
}

function fallbackDefault(): CatalogDefault {
  // Модель станет известна после загрузки каталога с backend.
  // Пустая строка означает «использовать модель по умолчанию на сервере».
  return { provider: config.ai.preferredProvider, model: '' }
}

function readCache(): {
  options: ModelOption[]
  default: CatalogDefault
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      options?: ModelOption[]
      default?: CatalogDefault
    }
    if (!Array.isArray(parsed.options) || !parsed.options.length) return null
    return {
      options: parsed.options,
      default: parsed.default ?? fallbackDefault(),
    }
  } catch {
    return null
  }
}

const cached = readCache()
let options: ModelOption[] = cached?.options ?? []
let defaultSelection: CatalogDefault = cached?.default ?? fallbackDefault()
let loading: Promise<void> | null = null

export function getCatalog(): ModelOption[] {
  return options
}

export function getCatalogDefault(): CatalogDefault {
  return defaultSelection
}

export async function loadCatalog(): Promise<void> {
  if (loading) return loading

  loading = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/ai/models`)
      if (!response.ok) return

      const payload = (await response.json()) as {
        providers?: {
          id: string
          label: string
          models?: { id: string; label: string }[]
        }[]
        default?: { provider?: string; model?: string }
      }

      const next: ModelOption[] = []
      for (const provider of payload.providers ?? []) {
        const id = provider.id as AiProviderId
        for (const model of provider.models ?? []) {
          if (!model.id) continue
          next.push(makeOption(id, model.id, `${provider.label}: ${model.label}`))
        }
      }
      if (!next.length) return

      options = next
      if (payload.default?.provider && payload.default.model) {
        defaultSelection = {
          provider: payload.default.provider as AiProviderId,
          model: payload.default.model,
        }
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ options, default: defaultSelection }),
      )
      notifyAiSettingsChanged()
    } catch {
      // Оставляем ранее закэшированный каталог, если backend недоступен.
    } finally {
      loading = null
    }
  })()

  return loading
}
