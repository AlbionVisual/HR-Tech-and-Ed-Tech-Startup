import { useRef, useState } from 'react'
import { chatStream } from '../../ai/client'
import { typewriter } from '../../ai/stream/typewriter'
import type { ChatMessage } from '../../ai/types'
import { config, type VacancyContext, type VacancyGrade } from '../../config'

export type InterviewMode = 'vacancy' | 'practice'

export type InterviewPhase =
  | 'idle'
  | 'vacancy_form'
  | 'interviewing'
  | 'awaiting_next'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useInterviewSession() {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [mode, setMode] = useState<InterviewMode | null>(null)
  const [vacancy, setVacancy] = useState<VacancyContext | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming' | 'error'>(
    'idle',
  )
  const [error, setError] = useState('')
  const [thought, setThought] = useState('')
  const [progress, setProgress] = useState(0)
  const systemRef = useRef('')
  const abortRef = useRef(0)

  function chooseVacancyPrep() {
    setMode('vacancy')
    setPhase('vacancy_form')
  }

  function choosePractice() {
    setMode('practice')
    setVacancy(null)
    void startInterview('practice', null)
  }

  function closeVacancyForm() {
    setPhase('idle')
    setMode(null)
  }

  async function startInterview(
    nextMode: InterviewMode,
    nextVacancy: VacancyContext | null,
  ) {
    const system = config.prompts.buildInterviewSystemPrompt({
      mode: nextMode,
      vacancy: nextVacancy,
    })
    systemRef.current = system
    setMode(nextMode)
    setVacancy(nextVacancy)
    setMessages([])
    setError('')
    setThought('')
    setProgress(0)
    setPhase('interviewing')
    await runAssistantTurn([
      { role: 'user', content: config.prompts.firstUserKickoff },
    ])
  }

  async function submitVacancy(form: {
    company: string
    grade: VacancyGrade
    description: string
  }) {
    await startInterview('vacancy', form)
  }

  async function runAssistantTurn(
    history: { role: 'user' | 'assistant'; content: string }[],
  ) {
    const runId = ++abortRef.current
    setStatus('thinking')
    setError('')
    setThought('')

    const assistantId = uid()
    let assembled = ''
    let created = false
    const tw = config.ai.typewriter

    try {
      for await (const event of chatStream({
        system: systemRef.current,
        messages: history,
      })) {
        if (runId !== abortRef.current) return

        if (event.type === 'thinking') {
          setStatus('thinking')
          continue
        }
        if (event.type === 'thought') {
          setStatus('thinking')
          setThought((prev) => prev + event.text)
          continue
        }
        if (event.type === 'error') {
          setStatus('error')
          setError(event.message)
          return
        }
        if (event.type === 'delta') {
          if (!created) {
            created = true
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: 'assistant', content: '' },
            ])
          }
          setStatus('streaming')

          for await (const piece of typewriter(event.text, tw)) {
            if (runId !== abortRef.current) return
            assembled += piece
            const preview = config.prompts.parseAssistantMarkers(assembled)
            if (preview.progress != null) setProgress(preview.progress)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: preview.content } : m,
              ),
            )
          }
          continue
        }
        if (event.type === 'done') {
          if (!assembled.trim()) {
            setStatus('error')
            setError('Модель вернула пустой ответ')
            return
          }
          const parsed = config.prompts.parseAssistantMarkers(assembled)
          if (parsed.progress != null) setProgress(parsed.progress)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId)
            if (!exists) {
              return [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant',
                  content: parsed.content,
                },
              ]
            }
            return prev.map((m) =>
              m.id === assistantId ? { ...m, content: parsed.content } : m,
            )
          })
          setPhase(parsed.isFeedback ? 'awaiting_next' : 'interviewing')
          setStatus('idle')
        }
      }
    } catch (e) {
      if (runId !== abortRef.current) return
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    }
  }

  async function sendUserMessage(text: string) {
    const content = text.trim()
    if (!content || status === 'thinking' || status === 'streaming') return
    if (phase !== 'interviewing') return

    const userMessage: ChatMessage = { id: uid(), role: 'user', content }
    const next = [...messages, userMessage]
    setMessages(next)
    setPhase('interviewing')

    await runAssistantTurn(
      next.map((m) => ({ role: m.role, content: m.content })),
    )
  }

  async function refineAnswer() {
    if (phase !== 'awaiting_next') return
    setPhase('interviewing')
  }

  async function nextQuestion() {
    if (phase !== 'awaiting_next') return
    setPhase('interviewing')
    const prompt =
      'Задай следующий основной вопрос интервью. Не повторяй предыдущий.'
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: prompt },
    ]
    await runAssistantTurn(history)
  }

  function reset() {
    abortRef.current += 1
    setPhase('idle')
    setMode(null)
    setVacancy(null)
    setMessages([])
    setStatus('idle')
    setError('')
    setThought('')
    setProgress(0)
    systemRef.current = ''
  }

  return {
    phase,
    mode,
    vacancy,
    messages,
    status,
    error,
    thought,
    progress,
    chooseVacancyPrep,
    choosePractice,
    closeVacancyForm,
    submitVacancy,
    sendUserMessage,
    refineAnswer,
    nextQuestion,
    reset,
  }
}
