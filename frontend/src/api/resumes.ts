import { apiBaseUrl } from '../config'
import { parseSse } from '../ai/stream/parseSse'

export type ResumeMode =
  | 'ats_check'
  | 'improve_experience'
  | 'keywords'
  | 'formatting'

export type ResumeSourceType = 'text' | 'pdf' | 'docx'

export type ResumeSource = {
  sourceType: ResumeSourceType
  sourceFilename?: string | null
}

export type ResumeCheckStatus =
  | 'checking'
  | 'awaiting_next'
  | 'completed'
  | 'error'

export type ResumeStreamEvent =
  | {
      type: 'meta'
      check_id: string
      user_message_id: string
    }
  | { type: 'thinking' }
  | { type: 'thought'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'progress'; value: number }
  | { type: 'feedback' }
  | {
      type: 'done'
      check_id: string
      assistant_message_id: string
      status: ResumeCheckStatus
    }
  | { type: 'error'; message: string }

export type ResumeExtractResponse = {
  filename: string
  source_type: 'pdf' | 'docx'
  text: string
  chars: number
  truncated: boolean
}

async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(text) as {
      detail?: unknown
    }
    const detail = payload.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined
      if (first?.msg) return first.msg
    }
    if (detail && typeof detail === 'object') {
      const value = detail as { message?: string }
      if (value.message) return value.message
    }
  } catch {
    // keep raw text
  }
  const trimmed = text.trim()
  return trimmed.slice(0, 500) || `Ошибка API (${response.status})`
}

async function* streamRequest(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<ResumeStreamEvent> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) return
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
      let event: ResumeStreamEvent
      try {
        event = JSON.parse(data) as ResumeStreamEvent
      } catch {
        continue
      }
      yield event
      if (event.type === 'done' || event.type === 'error') return
    }
  } catch (error) {
    if (signal?.aborted) return
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Ошибка чтения потока',
    }
  }
}

export async function extractResume(
  file: File,
): Promise<ResumeExtractResponse> {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${apiBaseUrl}/api/v1/resumes/extract`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as ResumeExtractResponse
}

export function startResumeCheckStream(input: {
  mode: ResumeMode
  text: string
  source?: ResumeSource
  signal?: AbortSignal
}): AsyncGenerator<ResumeStreamEvent> {
  return streamRequest(
    '/api/v1/resumes/checks:stream',
    {
      mode: input.mode,
      text: input.text,
      source_type: input.source?.sourceType ?? 'text',
      source_filename: input.source?.sourceFilename ?? null,
    },
    input.signal,
  )
}

export function sendResumeMessageStream(input: {
  checkId: string
  content: string
  signal?: AbortSignal
}): AsyncGenerator<ResumeStreamEvent> {
  return streamRequest(
    `/api/v1/resumes/checks/${input.checkId}/messages:stream`,
    { content: input.content },
    input.signal,
  )
}
