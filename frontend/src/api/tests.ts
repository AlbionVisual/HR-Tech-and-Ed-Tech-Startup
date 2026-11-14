import { apiBaseUrl } from '../config'

export type TestLanguage = {
  slug: string
  title: string
  icon: string
  tests_count: number
}

export type TestStats = {
  completed_count: number
}

export type TestQuestion = {
  id: string
  question: string
  options: string[]
}

export type TestAttempt = {
  attempt_id: string
  language: string
  language_title: string
  total: number
  lives: number
  questions: TestQuestion[]
}

export type TestAnswer = {
  question_id: string
  selected_index: number
  correct_index: number
  correct_option: string
  is_correct: boolean
  lives: number
  answered_count: number
  correct_count: number
  finished: boolean
}

export type TestWrongQuestion = {
  question: string
  options: string[]
  selected_index: number
  correct_index: number
  correct_option: string
}

export type TestResult = {
  attempt_id: string
  language: string
  language_title: string
  correct_count: number
  total: number
  lives: number
  wrong_questions: TestWrongQuestion[]
}

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
  return text.trim().slice(0, 500) || `Ошибка API (${response.status})`
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as T
}

export function getTestLanguages(): Promise<TestLanguage[]> {
  return request('/api/v1/tests/languages')
}

export function getTestStats(): Promise<TestStats> {
  return request('/api/v1/tests/stats')
}

export function startTest(language: string): Promise<TestAttempt> {
  return request('/api/v1/tests/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
}

export function answerTest(
  attemptId: string,
  questionId: string,
  selectedIndex: number,
): Promise<TestAnswer> {
  return request(`/api/v1/tests/attempts/${attemptId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      selected_index: selectedIndex,
    }),
  })
}

export function finishTest(attemptId: string): Promise<TestResult> {
  return request(`/api/v1/tests/attempts/${attemptId}/finish`, {
    method: 'POST',
  })
}
