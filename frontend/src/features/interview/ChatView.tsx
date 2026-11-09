import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../ai/types'
import { useVoice } from '../../speech/VoiceContext'
import { Composer } from './Composer'
import { FeedbackActions } from './FeedbackActions'
import { MessageBubble } from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'
import type { InterviewPhase } from './useInterviewSession'

type Props = {
	messages: ChatMessage[]
	phase: InterviewPhase
	status: 'idle' | 'thinking' | 'streaming' | 'error'
	error: string
	thought: string
	onSend: (text: string) => void
	onRefine: () => void
	onNext: () => void
}

export function ChatView({
	messages,
	phase,
	status,
	error,
	thought,
	onSend,
	onRefine,
	onNext,
}: Props) {
	const listRef = useRef<HTMLDivElement>(null)
	const stickRef = useRef(true)
	// const prevStatus = useRef(status)
	// const spokenIdRef = useRef<string | null>(null)
	const { stopAll } = useVoice()
	// const { enabled, speak, preparing, speaking, listening, voiceError } = useVoice()
	const busy = status === 'thinking' || status === 'streaming'
	const canType = phase === 'interviewing' && !busy
	const showThinkingUi = status === 'thinking' || Boolean(thought)
	// const showStopBar =
	// 	enabled &&
	// 	phase === 'awaiting_next' &&
	// 	(preparing || speaking || listening)

	const last = messages[messages.length - 1]
	// Новый ход поверх старого ответа ассистента: thought снизу ленты.
	// Текущий ход (стрим / готовый ответ с thought): thought ПЕРЕД этим ответом.
	const newTurnOverOldAssistant =
		status === 'thinking' &&
		last?.role === 'assistant' &&
		Boolean(last.content.trim())
	const attachThoughtBeforeLast =
		showThinkingUi &&
		last?.role === 'assistant' &&
		!newTurnOverOldAssistant
	const ahead = attachThoughtBeforeLast ? messages.slice(0, -1) : messages
	const answer = attachThoughtBeforeLast ? last : null

	useEffect(() => {
		const el = listRef.current
		if (!el || !stickRef.current) return
		el.scrollTop = el.scrollHeight
	}, [messages, thought, status, error])

	// Озвучка временно отключена
	// useEffect(() => {
	// 	const prev = prevStatus.current
	// 	prevStatus.current = status
	// 	if (!enabled) return
	// 	if (status !== 'idle') return
	// 	if (prev !== 'streaming' && prev !== 'thinking') return
	// 	if (!last || last.role !== 'assistant' || !last.content.trim()) return
	// 	if (spokenIdRef.current === last.id) return
	// 	spokenIdRef.current = last.id
	// 	void speak(last.content, {
	// 		messageId: last.id,
	// 		listenAfter: phase === 'interviewing',
	// 	})
	// }, [status, enabled, last, phase, speak])

	useEffect(() => {
		if (busy) stopAll()
	}, [busy, stopAll])

	return (
		<div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
			<div
				ref={listRef}
				className="flex flex-col gap-2.5 overflow-auto p-4"
				onScroll={() => {
					const el = listRef.current
					if (!el) return
					stickRef.current =
						el.scrollHeight - el.scrollTop - el.clientHeight < 96
				}}
			>
				{ahead.map((m) => (
					<MessageBubble key={m.id} message={m} />
				))}
				{showThinkingUi ? (
					<ThinkingIndicator thought={thought} live={status === 'thinking'} />
				) : null}
				{answer ? <MessageBubble message={answer} /> : null}
				{error ? <p className="m-0 text-[0.9rem] text-danger">{error}</p> : null}
				{/* {voiceError ? (
					<p className="m-0 text-[0.9rem] text-danger">{voiceError}</p>
				) : null} */}
			</div>

			{/* Озвучка временно скрыта
			{showStopBar ? (
				<div className="flex items-center justify-between gap-2 border-t border-line bg-bg-elevated px-3 py-2">
					<span className="text-[0.85rem] text-muted">
						{preparing
							? 'Думаю, как сказать красивее…'
							: speaking
								? 'Играет…'
								: listening
									? 'Слушаю…'
									: ''}
					</span>
					<button
						type="button"
						className="rounded-lg border border-line bg-bg-panel px-3.5 py-2.5 font-sans text-ink"
						onClick={() => stopAll()}
					>
						Замолчи
					</button>
				</div>
			) : null}
			*/}
			{phase === 'awaiting_next' ? (
				<FeedbackActions onRefine={onRefine} onNext={onNext} />
			) : (
				<Composer disabled={!canType} onSend={onSend} textPlaceholder={'Ваш ответ'} />
			)}
		</div>
	)
}
