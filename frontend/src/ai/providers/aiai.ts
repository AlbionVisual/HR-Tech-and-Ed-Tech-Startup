import { config, getProviderDefaultModel } from '../../config'
import { humanizeAiError } from '../errors'
import type { ChatStreamInput, StreamEvent } from '../types'
import { parseSse } from '../stream/parseSse'
import type { AiProvider } from './types'

type AiaiChunk = {
  error?: { message?: string; code?: number | string }
  choices?: { delta?: { content?: string | null; reasoning?: string | null } }[]
}

function* parseChunk(data: string): Generator<StreamEvent> {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return
  }

  const json = parsed as AiaiChunk
  if (json.error?.message) {
    const code =
      typeof json.error.code === 'number'
        ? json.error.code
        : Number(json.error.code) || 0
    yield {
      type: 'error',
      message: humanizeAiError(code, json.error.message),
    }
    return
  }

  const delta = json.choices?.[0]?.delta
  if (delta?.reasoning) {
    yield { type: 'thought', text: delta.reasoning }
  }
  if (delta?.content) {
    yield { type: 'delta', text: delta.content }
  }
}

export const aiaiProvider: AiProvider = {
  async *chatStream(input: ChatStreamInput): AsyncGenerator<StreamEvent> {
    yield { type: 'thinking' }

    if (!input.apiKey) {
      yield {
        type: 'error',
        message: 'Нет API-ключа AIAI.BY. Добавьте ключ в Профиле.',
      }
      return
    }

    const model = input.model || getProviderDefaultModel('aiai')
    const res = await fetch(`${config.ai.aiai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: 'system', content: input.system },
          ...input.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    })

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '')
      yield { type: 'error', message: humanizeAiError(res.status, text) }
      return
    }

    let gotText = false
    for await (const data of parseSse(res.body)) {
      for (const event of parseChunk(data)) {
        if (event.type === 'error') {
          yield event
          return
        }
        if (event.type === 'thought') yield event
        if (event.type === 'delta') {
          gotText = true
          yield event
        }
      }
    }

    if (!gotText) {
      yield {
        type: 'error',
        message: 'Пустой ответ AIAI.BY. Проверьте модель и ключ.',
      }
      return
    }

    yield { type: 'done' }
  },
}
