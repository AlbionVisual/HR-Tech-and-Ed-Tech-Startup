import { useEffect, useRef, useState } from 'react'
import {
  sendResumeMessageStream,
  startResumeCheckStream,
  type ResumeMode,
  type ResumeSource,
  type ResumeStreamEvent,
} from '../../api/resumes'
import { typewriter } from '../../ai/stream/typewriter'
import type { ChatMessage } from '../../ai/types'
import { config } from '../../config'

export type { ResumeMode } from '../../api/resumes'

export type ResumePhase =
  | 'idle'
  | 'check_resume'
  | 'awaiting_next'

type Status = 'idle' | 'thinking' | 'streaming' | 'error'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useResumeSession() {
  const [phase, setPhase] = useState<ResumePhase>('idle')
  const [mode, setMode] = useState<ResumeMode | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [thought, setThought] = useState('')
  const [progress, setProgress] = useState(0)
  const [checkId, setCheckId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function chooseAtsCheck() {
    setMode('ats_check')
  }

  function chooseImproveExperience() {
    setMode('improve_experience')
  }

  function chooseKeywords() {
    setMode('keywords')
  }

  function chooseFormatting() {
    setMode('formatting')
  }

  async function consumeStream(
    events: AsyncIterable<ResumeStreamEvent>,
    controller: AbortController,
  ) {
    const assistantId = uid()
    let assembled = ''
    let created = false
    let sawFeedback = false

    for await (const event of events) {
      if (controller.signal.aborted) return

      if (event.type === 'meta') {
        setCheckId(event.check_id)
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
          sawFeedback || event.status === 'awaiting_next'
            ? 'awaiting_next'
            : 'check_resume',
        )
        setStatus('idle')
        return
      }
    }
  }

  async function runStream(
    events: AsyncIterable<ResumeStreamEvent>,
    controller: AbortController,
  ) {
    try {
      await consumeStream(events, controller)
    } catch (error) {
      if (controller.signal.aborted) return
      setStatus('error')
      setError(error instanceof Error ? error.message : 'Ошибка анализа резюме')
    }
  }

  async function startResumeCheck(
    resumeText: string,
    source?: ResumeSource,
  ) {
    const text = resumeText.trim()
    if (!text || status === 'thinking' || status === 'streaming') return

    const currentMode = mode || 'ats_check'
    setMode(currentMode)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setMessages([{ id: uid(), role: 'user', content: text }])
    setCheckId(null)
    setError('')
    setThought('')
    setProgress(0)
    setPhase('check_resume')
    setStatus('thinking')

    await runStream(
      startResumeCheckStream({
        mode: currentMode,
        text,
        source,
        signal: controller.signal,
      }),
      controller,
    )
  }

  async function sendUserMessage(text: string) {
    const content = text.trim()
    if (!content || status === 'thinking' || status === 'streaming') return
    if (phase !== 'check_resume' && phase !== 'awaiting_next') return
    if (!checkId) {
      setStatus('error')
      setError('Проверка резюме ещё не создана')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'user', content },
    ])
    setError('')
    setThought('')
    setPhase('check_resume')
    setStatus('thinking')

    await runStream(
      sendResumeMessageStream({
        checkId,
        content,
        signal: controller.signal,
      }),
      controller,
    )
  }

  async function refineAnswer() {
    if (phase !== 'awaiting_next') return
    setPhase('check_resume')
  }

  function reset() {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('idle')
    setMode(null)
    setMessages([])
    setStatus('idle')
    setError('')
    setThought('')
    setProgress(0)
    setCheckId(null)
  }

  useEffect(() => () => abortRef.current?.abort(), [])

  return {
    phase,
    mode,
    messages,
    status,
    error,
    thought,
    progress,
    checkId,
    chooseAtsCheck,
    chooseImproveExperience,
    chooseKeywords,
    chooseFormatting,
    startResumeCheck,
    sendUserMessage,
    refineAnswer,
    reset,
  }
}
