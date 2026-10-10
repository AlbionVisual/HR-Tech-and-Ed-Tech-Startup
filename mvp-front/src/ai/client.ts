import { resolveSelection } from './selection'
import { aiaiProvider } from './providers/aiai'
import { geminiProvider } from './providers/gemini'
import { openrouterProvider } from './providers/openrouter'
import type { AiProvider } from './providers/types'
import type { ChatStreamInput, StreamEvent } from './types'

function getProvider(provider: string): AiProvider {
  if (provider === 'openrouter') return openrouterProvider
  if (provider === 'aiai') return aiaiProvider
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

  if (!apiKey) {
    yield {
      type: 'error',
      message:
        'Нет API-ключа для выбранной модели. Добавьте ключ Gemini и/или OpenRouter в Профиле.',
    }
    return
  }

  yield* provider.chatStream({ ...input, apiKey, model })
}
