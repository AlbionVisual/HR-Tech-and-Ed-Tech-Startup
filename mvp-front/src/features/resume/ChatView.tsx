import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../ai/types'
import { useVoice } from '../../speech/VoiceContext'
import { ChatMessageList } from './ChatMessageList'
import { Composer } from '../interview/Composer'
import { FeedbackActions } from '../interview/FeedbackActions'
import { ResumeStartGrid } from './ResumeStartGrid'
import type { ResumeMode, ResumePhase } from './useResumeSession'

type Props = {
	messages: ChatMessage[]
	phase: ResumePhase
	mode: ResumeMode | null
	status: 'idle' | 'thinking' | 'streaming' | 'error'
	error: string
	thought: string
	onChooseAtsCheck: () => void
	onChooseImproveExperience: () => void
	onChooseKeywords: () => void
	onChooseFormatting: () => void
	onStartCheck: (resumeText: string) => void
	onSend: (text: string) => void
	onRefine: () => void
}

export function ChatView({
	messages,
	phase,
	mode,
	status,
	error,
	thought,
	onChooseAtsCheck,
	onChooseImproveExperience,
	onChooseKeywords,
	onChooseFormatting,
	onStartCheck,
	onSend,
	onRefine,
}: Props) {
	const listRef = useRef<HTMLDivElement>(null)
	const stickRef = useRef(true)
	const isIdle = phase === 'idle'
	const busy = status === 'thinking' || status === 'streaming'

	const { voiceError, stopAll } = useVoice()

	useEffect(() => {
		const el = listRef.current
		if (!el || !stickRef.current || isIdle) return
		el.scrollTop = el.scrollHeight
	}, [messages, thought, status, error, isIdle])

	useEffect(() => {
		if (busy) stopAll()
	}, [busy, stopAll])

	const handleSubmit = (text: string) => {
		if (isIdle) {
			onStartCheck(text)
		} else {
			onSend(text)
		}
	}

	return (
		<div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
			<div
				ref={listRef}
				className="flex flex-col gap-2.5 overflow-auto p-4"
			>
				{isIdle ? (
					<ResumeStartGrid
						mode={mode}
						onChooseAtsCheck={onChooseAtsCheck}
						onChooseImproveExperience={onChooseImproveExperience}
						onChooseKeywords={onChooseKeywords}
						onChooseFormatting={onChooseFormatting}
					/>
				) : (
					<ChatMessageList
						messages={messages}
						status={status}
						thought={thought}
						error={error}
						voiceError={voiceError}
					/>
				)}
			</div>

			{phase === 'awaiting_next' ? (
				<FeedbackActions onRefine={onRefine} onNext={() => { }} />
			) : (
				<Composer
					disabled={busy}
					onSend={handleSubmit}
				/>
			)}
		</div>
	)
}
