import { config, type AiProviderId } from '../config'
import {
  getCatalog,
  getCatalogDefault,
  parseModelId,
  type ModelOption,
} from './catalog'
import { notifyAiSettingsChanged } from './events'

export type { ModelOption } from './catalog'
export { makeModelId, parseModelId } from './catalog'
export { AI_SETTINGS_EVENT, notifyAiSettingsChanged } from './events'

export function listAvailableModels(): ModelOption[] {
  return getCatalog()
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
  option: ModelOption | null
} {
  const options = listAvailableModels()
  const preferred = config.ai.preferredProvider
  const saved = parseModelId(getSelectedModelId())
  const match =
    options.find((option) => option.id === getSelectedModelId()) ||
    options.find(
      (option) =>
        saved &&
        option.provider === saved.provider &&
        option.model === saved.model,
    ) ||
    options.find((option) => option.provider === preferred) ||
    options[0] ||
    null

  if (!match) {
    const fallback = getCatalogDefault()
    return {
      provider: fallback.provider,
      model: fallback.model,
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
    option: match,
  }
}
