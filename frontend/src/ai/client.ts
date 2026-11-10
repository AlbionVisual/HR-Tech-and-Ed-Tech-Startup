import { apiBaseUrl } from '../config'
import { resolveSelection } from './selection'
import { parseSse } from './stream/parseSse'
import type { ChatRequest, StreamEvent } from './types'

async function readError(response: Response) {
  const text = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(text) as {
      detail?: { message?: string } | string
    }
    if (typeof payload.detail === 'string') return payload.detail
    if (payload.detail?.message) return payload.detail.message
  } catch {
    // keep raw text
  }
  const trimmed = text.trim()
  return trimmed.slice(0, 500) || `Ошибка API (${response.status})`
}

export async function* chatStream(
  input: ChatRequest,
): AsyncIterable<StreamEvent> {
  const selected = resolveSelection()
  const body = {
    task: input.task,
    mode: input.mode,
    vacancy: input.vacancy ?? null,
    messages: input.messages,
    provider: input.provider ?? selected.provider,
    model: input.model ?? selected.model,
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/v1/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: input.signal,
    })
  } catch (error) {
    if (input.signal?.aborted) return
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Ошибка сети',
    }
    return
  }

  if (!response.ok || !response.body) {
    yield { type: 'error', message: await readError(response) }
    return
  }

  try {
    for await (const data of parseSse(response.body)) {
      let event: StreamEvent
      try {
        event = JSON.parse(data) as StreamEvent
      } catch {
        continue
      }
      yield event
      if (event.type === 'done' || event.type === 'error') return
    }
  } catch (error) {
    if (input.signal?.aborted) return
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Ошибка чтения потока',
    }
  }
}
