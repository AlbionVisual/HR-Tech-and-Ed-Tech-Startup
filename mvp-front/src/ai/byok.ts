import { config, type AiProviderId } from '../config'
import { notifyAiSettingsChanged } from './events'

function storageKey(provider: AiProviderId) {
  return `${config.ai.byok.storageKeyPrefix}.${provider}`
}

export function getByokKey(provider: AiProviderId) {
  try {
    const keyed = localStorage.getItem(storageKey(provider))
    if (keyed) return keyed
    if (provider === 'gemini') {
      return localStorage.getItem('mvp.ai.byokKey') ?? ''
    }
    return ''
  } catch {
    return ''
  }
}

export function setByokKey(key: string, provider: AiProviderId) {
  const value = key.trim()
  if (!value) {
    localStorage.removeItem(storageKey(provider))
  } else {
    localStorage.setItem(storageKey(provider), value)
  }
  notifyAiSettingsChanged()
}

export function clearByokKey(provider: AiProviderId) {
  localStorage.removeItem(storageKey(provider))
  if (provider === 'gemini') {
    localStorage.removeItem('mvp.ai.byokKey')
  }
  notifyAiSettingsChanged()
}

export function resolveApiKey(provider: AiProviderId) {
  return getByokKey(provider)
}
