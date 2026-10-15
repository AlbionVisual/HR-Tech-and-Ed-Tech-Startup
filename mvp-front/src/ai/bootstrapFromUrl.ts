import type { AiProviderId } from '../config'
import { setByokKey } from './byok'
import { notifyAiSettingsChanged } from './events'
import { makeModelId, setSelectedModelId } from './selection'

function readParams(): URLSearchParams {
  const fromQuery = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const fromHash = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash)
  const merged = new URLSearchParams(fromQuery)
  for (const [k, v] of fromHash.entries()) {
    if (!merged.has(k)) merged.set(k, v)
  }
  return merged
}

function cleanUrl() {
  const url = new URL(window.location.href)
  const keys = [
    'gemini',
    'g',
    'openrouter',
    'or',
    'aiai',
    'a',
    'model',
    'm',
    'provider',
    'p',
  ]
  for (const key of keys) url.searchParams.delete(key)
  url.hash = ''
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}

export function bootstrapFromUrl() {
  const params = readParams()
  const gemini = params.get('gemini') || params.get('g')
  const openrouter = params.get('openrouter') || params.get('or')
  const aiai = params.get('aiai') || params.get('a')
  const model = params.get('model') || params.get('m')
  const provider = (params.get('provider') || params.get('p')) as
    | AiProviderId
    | null

  let changed = false

  if (gemini?.trim()) {
    setByokKey(gemini, 'gemini')
    changed = true
  }
  if (openrouter?.trim()) {
    setByokKey(openrouter, 'openrouter')
    changed = true
  }
  if (aiai?.trim()) {
    setByokKey(aiai, 'aiai')
    changed = true
  }

  if (model?.trim()) {
    if (model.includes('::')) {
      setSelectedModelId(model.trim())
    } else if (
      provider === 'gemini' ||
      provider === 'openrouter' ||
      provider === 'aiai'
    ) {
      setSelectedModelId(makeModelId(provider, model.trim()))
    } else if (aiai || openrouter || gemini) {
      const p: AiProviderId = aiai
        ? 'aiai'
        : openrouter
          ? 'openrouter'
          : 'gemini'
      setSelectedModelId(makeModelId(p, model.trim()))
    }
    changed = true
  }

  if (changed) {
    cleanUrl()
    notifyAiSettingsChanged()
  }

  return changed
}

export function buildSetupLink(input: {
  origin?: string
  gemini?: string
  openrouter?: string
  aiai?: string
  model?: string
  provider?: AiProviderId
  useHash?: boolean
}) {
  const origin = input.origin || window.location.origin
  // GitHub Pages: BASE_URL = /HR-Tech-and-Ed-Tech-Startup/
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  const params = new URLSearchParams()
  if (input.gemini) params.set('gemini', input.gemini)
  if (input.openrouter) params.set('openrouter', input.openrouter)
  if (input.aiai) params.set('aiai', input.aiai)
  if (input.model) params.set('model', input.model)
  if (input.provider) params.set('provider', input.provider)
  const q = params.toString()
  if (input.useHash) return `${origin}${base}#${q}`
  return `${origin}${base}?${q}`
}
