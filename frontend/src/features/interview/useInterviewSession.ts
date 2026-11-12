import { useEffect, useRef, useState } from 'react'
import {
  getInterview,
  nextInterviewQuestionStream,
  sendInterviewMessageStream,
  startInterviewStream,
  type InterviewMessage,
  type InterviewMode,
  type InterviewSessionDetail,
  type InterviewStreamEvent,
} from '../../api/interviews'
import { resolveSelection } from '../../ai/selection'
import { typewriter } from '../../ai/stream/typewriter'
import type { ChatMessage } from '../../ai/types'
import { config, type VacancyContext, type VacancyGrade } from '../../config'

export type { InterviewMode } from '../../api/interviews'

export type InterviewPhase =
  | 'idle'
  | 'vacancy_form'
  | 'interviewing'
  | 'awaiting_next'

type Status = 'idle' | 'thinking' | 'streaming' | 'error'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function toChatMessage(message: InterviewMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
  }
}

function applySession(
  session: InterviewSessionDetail,
  setters: {
    setMode: (mode: InterviewMode) => void
    setVacancy: (vacancy: VacancyContext | null) => void
    setMessages: (messages: ChatMessage[]) => void
    setProgress: (progress: number) => void
    setPhase: (phase: InterviewPhase) => void
    setCurrentSessionId: (id: string) => void
  },
) {
  setters.setMode(session.mode)
  setters.setVacancy(session.vacancy)
  setters.setMessages(session.messages.map(toChatMessage))
  setters.setProgress(session.progress)
  setters.setPhase(session.phase)
  setters.setCurrentSessionId(session.id)
}

export function useInterviewSession(chatId?: string | null) {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [mode, setMode] = useState<InterviewMode | null>(null)
  const [vacancy, setVacancy] = useState<VacancyContext | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [thought, setThought] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    chatId ?? null,
  )
  const [isLoading, setIsLoading] = useState(Boolean(chatId))
  const abortRef = useRef<AbortController | null>(null)
  const loadRef = useRef(0)

  useEffect(() => {
    if (!chatId) return

    const requestId = ++loadRef.current
    void (async () => {
      try {
        const session = await getInterview(chatId)
        if (requestId !== loadRef.current) return
        applySession(session, {
          setMode,
          setVacancy,
          setMessages,
          setProgress,
          setPhase,
          setCurrentSessionId,
        })
        setIsLoading(false)
      } catch (loadError) {
        if (requestId !== loadRef.current) return
        setStatus('error')
        setError(
          loadError instanceof Error ? loadError.message : 'Не удалось загрузить чат',
        )
        setIsLoading(false)
      }
    })()

    return () => {
      loadRef.current += 1
      abortRef.current?.abort()
    }
  }, [chatId])

  useEffect(() => () => abortRef.current?.abort(), [])

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

  async function consumeStream(
    events: AsyncIterable<InterviewStreamEvent>,
    controller: AbortController,
    localUserId?: string,
  ) {
    const assistantId = uid()
    let assembled = ''
    let created = false
    let sawFeedback = false

    for await (const event of events) {
      if (controller.signal.aborted) return

      if (event.type === 'meta') {
        setCurrentSessionId(event.interview_id)
        if (localUserId && event.user_message_id) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === localUserId
                ? { ...message, id: event.user_message_id as string }
                : message,
            ),
          )
        }
        continue
      }
      if (event.type === 'thinking') {
        setStatus('thinking')
        continue
      }
      if (event.type === 'thought') {
        setStatus('thinking')
        setThought((prev) => prev + event.text)
        continue
      }
      if (event.type === 'progress') {
        setProgress(event.value)
        continue
      }
      if (event.type === 'feedback') {
        sawFeedback = true
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

        for await (const piece of typewriter(event.text, config.ai.typewriter)) {
          if (controller.signal.aborted) return
          assembled += piece
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: assembled }
                : message,
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

        const finalId = event.assistant_message_id || assistantId
        const content = assembled.trim()
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, id: finalId, content }
              : message,
          ),
        )
        setPhase(
          sawFeedback || event.phase === 'awaiting_next'
            ? 'awaiting_next'
            : 'interviewing',
        )
        setProgress(event.progress)
        setStatus('idle')
        return
      }
    }
  }

  async function runStream(
    events: AsyncIterable<InterviewStreamEvent>,
    controller: AbortController,
    localUserId?: string,
  ) {
    try {
      await consumeStream(events, controller, localUserId)
    } catch (streamError) {
      if (controller.signal.aborted) return
      setStatus('error')
      setError(
        streamError instanceof Error ? streamError.message : 'Ошибка интервью',
      )
    }
  }

  async function startInterview(
    nextMode: InterviewMode,
    nextVacancy: VacancyContext | null,
  ) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setMode(nextMode)
    setVacancy(nextVacancy)
    setMessages([])
    setCurrentSessionId(null)
    setError('')
    setThought('')
    setProgress(0)
    setPhase('interviewing')
    setStatus('thinking')

    const selected = resolveSelection()
    await runStream(
      startInterviewStream({
        mode: nextMode,
        vacancy: nextVacancy,
        provider: selected.provider,
        model: selected.model || undefined,
        signal: controller.signal,
      }),
      controller,
    )
  }

  async function submitVacancy(form: {
    company: string
    grade: VacancyGrade
    description: string
  }) {
    await startInterview('vacancy', form)
  }

  async function sendUserMessage(text: string) {
    const content = text.trim()
    if (!content || status === 'thinking' || status === 'streaming') return
    if (phase !== 'interviewing') return
    if (!currentSessionId) {
      setStatus('error')
      setError('Интервью ещё не создано')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const localUserId = uid()
    setMessages((prev) => [
      ...prev,
      { id: localUserId, role: 'user', content },
    ])
    setError('')
    setThought('')
    setPhase('interviewing')
    setStatus('thinking')

    await runStream(
      sendInterviewMessageStream({
        sessionId: currentSessionId,
        content,
        signal: controller.signal,
      }),
      controller,
      localUserId,
    )
  }

  async function nextQuestion() {
    if (phase !== 'awaiting_next' || !currentSessionId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setError('')
    setThought('')
    setPhase('interviewing')
    setStatus('thinking')

    await runStream(
      nextInterviewQuestionStream({
        sessionId: currentSessionId,
        signal: controller.signal,
      }),
      controller,
    )
  }

  function refineAnswer() {
    if (phase !== 'awaiting_next') return
    setPhase('interviewing')
  }

  function reset() {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('idle')
    setMode(null)
    setVacancy(null)
    setMessages([])
    setStatus('idle')
    setError('')
    setThought('')
    setProgress(0)
    setCurrentSessionId(null)
    setIsLoading(false)
  }

  function startNewChat() {
    setCurrentSessionId(null)
    reset()
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
    chatId: currentSessionId,
    isLoading,
    chooseVacancyPrep,
    choosePractice,
    closeVacancyForm,
    submitVacancy,
    sendUserMessage,
    refineAnswer,
    nextQuestion,
    reset,
    startNewChat,
  }
}
