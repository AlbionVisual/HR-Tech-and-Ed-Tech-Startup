import { useEffect, useRef, useState } from 'react'
import { chatStream } from '../../ai/client'
import { typewriter } from '../../ai/stream/typewriter'
import type { ChatMessage } from '../../ai/types'
import { config, type VacancyContext, type VacancyGrade } from '../../config'
import { saveChat, getChat, createChatRecord } from './chatStorage'

export type InterviewMode = 'vacancy' | 'practice'

export type InterviewPhase =
	| 'idle'
	| 'vacancy_form'
	| 'interviewing'
	| 'awaiting_next'

function uid() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useInterviewSession(chatId?: string | null) {
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
	const abortRef = useRef<AbortController | null>(null)

	const [currentChatId, setCurrentChatId] = useState<string | null>(chatId ?? null)
	const [createdAtRef, setCreatedAtRef] = useState<number>(Date.now())
	const [isLoaded, setIsLoaded] = useState(false)
	const prevChatIdRef = useRef<string | null | undefined>(chatId)

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
		setMode(nextMode)
		setVacancy(nextVacancy)

		// Создаём новую запись чата в localStorage
		const chat = createChatRecord(nextMode, nextVacancy)
		setCurrentChatId(chat.id)
		setCreatedAtRef(chat.createdAt)

		setMessages([])
		setError('')
		setThought('')
		setProgress(0)
		setPhase('interviewing')
		await runAssistantTurn([], { mode: nextMode, vacancy: nextVacancy })
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
		context?: { mode: InterviewMode; vacancy: VacancyContext | null },
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
		const turnMode = context ? context.mode : mode ?? 'practice'
		const turnVacancy = context ? context.vacancy : vacancy

		try {
			for await (const event of chatStream({
				task: 'interview',
				mode: turnMode,
				vacancy: turnVacancy,
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
					setPhase(sawFeedback ? 'awaiting_next' : 'interviewing')
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
	}

	function startNewChat() {
		setCurrentChatId(null)
		reset()
	}

	// Загрузка чата при смене chatId
	useEffect(() => {
		const prevChatId = prevChatIdRef.current

		if (!chatId) {
			// Переход на "новый чат" — если раньше был активный чат, сбрасываем
			if (prevChatId != null) {
				reset()
			}
			setCurrentChatId(null)
			setIsLoaded(true)
			prevChatIdRef.current = chatId
			return
		}

		// Загрузка конкретного чата
		const snapshot = getChat(chatId)
		if (snapshot) {
			setMode(snapshot.mode)
			setPhase(snapshot.phase === 'idle' ? 'idle' : snapshot.phase)
			setVacancy(snapshot.vacancy)
			setMessages(snapshot.messages)
			setProgress(snapshot.progress)
			setCurrentChatId(snapshot.id)
			setCreatedAtRef(snapshot.createdAt)
		} else {
			if (prevChatId != null) {
				reset()
			}
			setCurrentChatId(null)
		}
		setIsLoaded(true)
		prevChatIdRef.current = chatId
	}, [chatId])

	// Авто-сохранение при изменении состояния
	useEffect(() => {
		if (!currentChatId || !isLoaded) return
		if (phase === 'idle' && messages.length === 0) return

		const snapshot = {
			id: currentChatId,
			title: mode === 'practice' ? 'Тренировка' : `Вакансия: ${vacancy?.company ?? ''}`,
			createdAt: createdAtRef,
			updatedAt: Date.now(),
			mode: mode ?? 'practice',
			phase,
			vacancy,
			messages,
			progress,
		}
		saveChat(snapshot)
	}, [
		currentChatId,
		phase,
		mode,
		vacancy,
		messages,
		progress,
		isLoaded,
		createdAtRef,
	])

	useEffect(() => () => abortRef.current?.abort(), [])

	return {
		phase,
		mode,
		vacancy,
		messages,
		status,
		error,
		thought,
		progress,
		chatId: currentChatId,
		isLoaded,
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
