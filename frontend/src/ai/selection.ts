import {
  config,
  formatModelOptionLabel,
  getProviderDefaultModel,
  getProviderModelDefs,
  type AiProviderId,
} from '../config'
import { getByokKey, resolveApiKey } from './byok'
import { notifyAiSettingsChanged } from './events'

export type ModelOption = {
  id: string
  provider: AiProviderId
  model: string
  label: string
}

export { AI_SETTINGS_EVENT, notifyAiSettingsChanged } from './events'

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

function providerHasKey(provider: AiProviderId) {
  return Boolean(getByokKey(provider))
}

export function listAvailableModels(): ModelOption[] {
  const providers: AiProviderId[] = ['openrouter', 'gemini', 'aiai']
  const options: ModelOption[] = []

  for (const provider of providers) {
    if (!providerHasKey(provider)) continue
    for (const model of getProviderModelDefs(provider)) {
      if (!model.id) continue
      options.push({
        id: makeModelId(provider, model.id),
        provider,
        model: model.id,
        label: formatModelOptionLabel(provider, model.id),
      })
    }
  }

  return options
}

export function getSelectedModelId() {
  try {
    return localStorage.getItem(config.ai.selection.storageKey) ?? ''
  } catch {
    return ''
  }
}

export function setSelectedModelId(id: string) {
  localStorage.setItem(config.ai.selection.storageKey, id)
  notifyAiSettingsChanged()
}

export function resolveSelection(): {
  provider: AiProviderId
  model: string
  apiKey: string
  option: ModelOption | null
} {
  const options = listAvailableModels()
  const preferred = config.ai.preferredProvider
  const saved = parseModelId(getSelectedModelId())
  const match =
    options.find((o) => o.id === getSelectedModelId()) ||
    options.find(
      (o) =>
        saved && o.provider === saved.provider && o.model === saved.model,
    ) ||
    options.find((o) => o.provider === preferred) ||
    options[0] ||
    null

  if (!match) {
    const provider = preferred
    const model = getProviderDefaultModel(provider)
    return {
      provider,
      model,
      apiKey: resolveApiKey(provider),
      option: null,
    }
  }

  if (getSelectedModelId() !== match.id) {
    try {
      localStorage.setItem(config.ai.selection.storageKey, match.id)
    } catch {
      // ignore
    }
  }

  return {
    provider: match.provider,
    model: match.model,
    apiKey: resolveApiKey(match.provider),
    option: match,
  }
}
