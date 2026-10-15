import { geminiProbeMessage, probeGeminiAccess } from './probeGemini'
import { resolveSelection } from './selection'
import { aiaiProvider } from './providers/aiai'
import { geminiProvider } from './providers/gemini'
import { mockProvider } from './providers/mock'
import { openrouterProvider } from './providers/openrouter'
import type { AiProvider } from './providers/types'
import type { ChatStreamInput, StreamEvent } from './types'

function getProvider(provider: string): AiProvider {
  if (provider === 'openrouter') return openrouterProvider
  if (provider === 'aiai') return aiaiProvider
  if (provider === 'mock') return mockProvider
  return geminiProvider
}

export async function* chatStream(
  input: Omit<ChatStreamInput, 'apiKey' | 'model'> & {
    apiKey?: string
    model?: string
  },
): AsyncIterable<StreamEvent> {
  const selected = resolveSelection()
  const provider = getProvider(selected.provider)
  const apiKey = input.apiKey ?? selected.apiKey
  const model = input.model ?? selected.model

  if (selected.provider === 'gemini') {
    const probe = await probeGeminiAccess()
    if (!probe.ok && probe.reason === 'blocked') {
      yield { type: 'error', message: geminiProbeMessage(probe) }
      return
    }
  }

  if (selected.provider !== 'mock' && !apiKey) {
    yield {
      type: 'error',
      message:
        'Нет API-ключа для выбранной модели. Добавьте ключ в Профиле (Gemini / OpenRouter / AIAI.BY) или выберите «имитация модели».',
    }
    return
  }

  yield* provider.chatStream({
    ...input,
    apiKey: apiKey || 'mock',
    model,
  })
}
