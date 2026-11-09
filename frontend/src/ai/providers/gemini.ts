import { config, getProviderDefaultModel } from '../../config'
import { humanizeAiError } from '../errors'
import type { ChatStreamInput, StreamEvent } from '../types'
import { parseSse } from '../stream/parseSse'
import type { AiProvider } from './types'

function resolveModel(input: ChatStreamInput) {
  return input.model || getProviderDefaultModel('gemini')
}

type GeminiPart = {
  text?: string
  thought?: boolean
}

type GeminiChunk = {
  error?: { message?: string; status?: string; code?: number }
  promptFeedback?: { blockReason?: string }
  candidates?: {
    finishReason?: string
    content?: { parts?: GeminiPart[] }
  }[]
}

function toGeminiContents(input: ChatStreamInput) {
  return input.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

function extractFromChunk(json: GeminiChunk): {
  answer: string
  thought: string
  error?: string
} {
  if (json.error?.message) {
    const code = json.error.code ?? 0
    return {
      answer: '',
      thought: '',
      error: humanizeAiError(code, JSON.stringify(json)),
    }
  }
  if (json.promptFeedback?.blockReason) {
    return {
      answer: '',
      thought: '',
      error: `Запрос заблокирован: ${json.promptFeedback.blockReason}`,
    }
  }

  const candidate = json.candidates?.[0]
  const parts = candidate?.content?.parts ?? []
  const thought = parts
    .filter((p) => p.text && p.thought)
    .map((p) => p.text ?? '')
    .join('')
  const answer = parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text ?? '')
    .join('')

  const finish = candidate?.finishReason
  if (
    !answer &&
    !thought &&
    finish &&
    finish !== 'STOP' &&
    finish !== 'MAX_TOKENS' &&
    finish !== 'FINISH_REASON_UNSPECIFIED'
  ) {
    return { answer: '', thought: '', error: `Ответ прерван: ${finish}` }
  }

  return { answer, thought }
}

function* parsePayload(data: string): Generator<StreamEvent> {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return
  }

  const items = Array.isArray(parsed) ? parsed : [parsed]
  for (const item of items) {
    const { answer, thought, error } = extractFromChunk(item as GeminiChunk)
    if (error) {
      yield { type: 'error', message: error }
      return
    }
    if (thought) yield { type: 'thought', text: thought }
    if (answer) yield { type: 'delta', text: answer }
  }
}

function requestBody(input: ChatStreamInput) {
  return {
    system_instruction: { parts: [{ text: input.system }] },
    contents: toGeminiContents(input),
    generationConfig: config.ai.gemini.includeThoughts
      ? { thinkingConfig: { includeThoughts: true } }
      : undefined,
  }
}

export const geminiProvider: AiProvider = {
  async *chatStream(input) {
    yield { type: 'thinking' }

    if (!input.apiKey) {
      yield { type: 'error', message: 'Нет API-ключа. Добавьте ключ в Профиле.' }
      return
    }

    const model = resolveModel(input)
    const url =
      `${config.ai.gemini.directBaseUrl}/models/` +
      `${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(input.apiKey)}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody(input)),
    })

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '')
      yield { type: 'error', message: humanizeAiError(res.status, text) }
      return
    }

    let gotText = false
    for await (const data of parseSse(res.body)) {
      for (const event of parsePayload(data)) {
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
        message:
          'Пустой ответ модели (200, но без текста). Часто это обрыв SSE или thinking без answer — попробуйте ещё раз.',
      }
      return
    }

    yield { type: 'done' }
  },
}
