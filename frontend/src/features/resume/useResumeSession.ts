import { useRef, useState } from 'react'
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
    const systemRef = useRef('')
    const abortRef = useRef(0)

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

        const system = config.prompts.buildResumeSystemPrompt({
            mode: currentMode,
        })
        systemRef.current = system

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

        await runAssistantTurn([{ role: 'user', content: firstContent }])
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
                    setPhase(parsed.isFeedback ? 'awaiting_next' : 'check_resume')
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
        abortRef.current += 1
        setPhase('idle')
        setMode(null)
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
