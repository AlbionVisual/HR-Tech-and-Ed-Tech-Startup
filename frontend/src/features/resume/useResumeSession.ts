import { useEffect, useRef, useState } from 'react'
import { chatStream } from '../../ai/client'
import { typewriter } from '../../ai/stream/typewriter'
import type { ChatMessage } from '../../ai/types'
import { config } from '../../config'

export type ResumeMode =
    | 'ats_check'
    | 'improve_experience'
    | 'keywords'
    | 'formatting'

export type ResumePhase =
    | 'idle'
    | 'check_resume'
    | 'awaiting_next'

function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useResumeSession() {
    const [phase, setPhase] = useState<ResumePhase>('idle')
    const [mode, setMode] = useState<ResumeMode | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming' | 'error'>(
        'idle',
    )
    const [error, setError] = useState('')
    const [thought, setThought] = useState('')
    const [progress, setProgress] = useState(0)
    const abortRef = useRef<AbortController | null>(null)

    // Функции выбора режимов (карточек) на главном экране (не запускают ИИ сразу)
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

    async function startResumeCheck(resumeText: string) {
        const text = resumeText.trim()
        if (!text || status === 'thinking' || status === 'streaming') return

        const currentMode = mode || 'ats_check'
        setMode(currentMode)

        const modeLabel = getModeLabel(currentMode)
        const firstContent = `${modeLabel}\n${text}`

        const firstMessage: ChatMessage = {
            id: uid(),
            role: 'user',
            content: firstContent,
        }

        setMessages([firstMessage])
        setError('')
        setThought('')
        setProgress(0)
        setPhase('check_resume')

        await runAssistantTurn(
            [{ role: 'user', content: firstContent }],
            { mode: currentMode },
        )
    }

    async function runAssistantTurn(
        history: { role: 'user' | 'assistant'; content: string }[],
        context?: { mode: ResumeMode },
    ) {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setStatus('thinking')
        setError('')
        setThought('')

        const assistantId = uid()
        let assembled = ''
        let created = false
        let sawFeedback = false
        const tw = config.ai.typewriter
        const turnMode = context?.mode ?? mode ?? 'ats_check'

        try {
            for await (const event of chatStream({
                task: 'resume',
                mode: turnMode,
                messages: history,
                signal: controller.signal,
            })) {
                if (controller.signal.aborted) return

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

                    for await (const piece of typewriter(event.text, tw)) {
                        if (controller.signal.aborted) return
                        assembled += piece
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId ? { ...m, content: assembled } : m,
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
                    const content = assembled.trim()
                    setMessages((prev) => {
                        const exists = prev.some((m) => m.id === assistantId)
                        if (!exists) {
                            return [
                                ...prev,
                                {
                                    id: assistantId,
                                    role: 'assistant',
                                    content,
                                },
                            ]
                        }
                        return prev.map((m) =>
                            m.id === assistantId ? { ...m, content } : m,
                        )
                    })
                    setPhase(sawFeedback ? 'awaiting_next' : 'check_resume')
                    setStatus('idle')
                }
            }
        } catch (e) {
            if (controller.signal.aborted) return
            setStatus('error')
            setError(e instanceof Error ? e.message : 'Ошибка запроса')
        }
    }

    async function sendUserMessage(text: string) {
        const content = text.trim()
        if (!content || status === 'thinking' || status === 'streaming') return
        if (phase !== 'check_resume' && phase !== 'awaiting_next') return

        const userMessage: ChatMessage = { id: uid(), role: 'user', content }
        const next = [...messages, userMessage]
        setMessages(next)
        setPhase('check_resume')

        await runAssistantTurn(
            next.map((m) => ({ role: m.role, content: m.content })),
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

function getModeLabel(mode: ResumeMode): string {
    switch (mode) {
        case 'ats_check':
            return 'Проверка ATS'
        case 'improve_experience':
            return 'Улучшить опыт'
        case 'keywords':
            return 'Ключевые слова'
        case 'formatting':
            return 'Форматирование'
    }
}
