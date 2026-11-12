import { apiBaseUrl, type VacancyContext } from '../config'
import { parseSse } from '../ai/stream/parseSse'

export type InterviewMode = 'practice' | 'vacancy'
export type InterviewSessionPhase = 'interviewing' | 'awaiting_next'
export type InterviewMessageStatus = 'complete' | 'partial' | 'error'

export type InterviewMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  thought: string
  is_feedback: boolean
  status: InterviewMessageStatus
  seq: number
  created_at: string
}

export type InterviewSessionSummary = {
  id: string
  mode: InterviewMode
  title: string
  phase: InterviewSessionPhase
  progress: number
  provider: string | null
  model: string | null
  last_message: string | null
  messages_count: number
  created_at: string
  updated_at: string
}

export type InterviewSessionDetail = InterviewSessionSummary & {
  vacancy: VacancyContext | null
  messages: InterviewMessage[]
}

export type InterviewStreamEvent =
  | {
      type: 'meta'
      interview_id: string
      user_message_id: string | null
    }
  | { type: 'thinking' }
  | { type: 'thought'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'progress'; value: number }
  | { type: 'feedback' }
  | {
      type: 'done'
      interview_id: string
      assistant_message_id: string
      phase: InterviewSessionPhase
      progress: number
    }
  | { type: 'error'; message: string }

async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(text) as { detail?: unknown }
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
  body: Record<string, unknown> | undefined,
  signal?: AbortSignal,
): AsyncGenerator<InterviewStreamEvent> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
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
      let event: InterviewStreamEvent
      try {
        event = JSON.parse(data) as InterviewStreamEvent
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

export function startInterviewStream(input: {
  mode: InterviewMode
  vacancy: VacancyContext | null
  provider?: string
  model?: string
  signal?: AbortSignal
}): AsyncGenerator<InterviewStreamEvent> {
  return streamRequest(
    '/api/v1/interviews:stream',
    {
      mode: input.mode,
      vacancy: input.vacancy,
      provider: input.provider ?? null,
      model: input.model ?? null,
    },
    input.signal,
  )
}

export function sendInterviewMessageStream(input: {
  sessionId: string
  content: string
  signal?: AbortSignal
}): AsyncGenerator<InterviewStreamEvent> {
  return streamRequest(
    `/api/v1/interviews/${input.sessionId}/messages:stream`,
    { content: input.content },
    input.signal,
  )
}

export function nextInterviewQuestionStream(input: {
  sessionId: string
  signal?: AbortSignal
}): AsyncGenerator<InterviewStreamEvent> {
  return streamRequest(
    `/api/v1/interviews/${input.sessionId}/next-question:stream`,
    undefined,
    input.signal,
  )
}

export async function listInterviews(): Promise<InterviewSessionSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/interviews`)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as InterviewSessionSummary[]
}

export async function getInterview(
  sessionId: string,
): Promise<InterviewSessionDetail> {
  const response = await fetch(`${apiBaseUrl}/api/v1/interviews/${sessionId}`)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as InterviewSessionDetail
}

export async function deleteInterview(sessionId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/interviews/${sessionId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error(await readError(response))
}

export async function clearInterviews(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/interviews`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error(await readError(response))
}
