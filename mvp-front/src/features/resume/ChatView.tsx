import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../ai/types'
import { useVoice } from '../../speech/VoiceContext'
import { ChatMessageList } from './ChatMessageList'
import { Composer } from '../interview/Composer'
// import { FeedbackActions } from '../interview/FeedbackActions'
import { ResumeStartGrid } from './ResumeStartGrid'
import type { ResumeMode, ResumePhase } from './useResumeSession'
import { RESUME_PRESETS } from './presets'

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
}: Props) {

	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
	const [presetText, setPresetText] = useState<string>('')

	const handleSelectPreset = (id: string, text: string) => {
		setSelectedPresetId(id)
		setPresetText(text)
	}

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

			{phase === 'awaiting_next' ? 1 : (


				<div className="flex flex-col gap-2.5 p-4 pt-0">
					{/* Блок готовых резюме — показывается только на стартовом экране (isIdle) */}
					{isIdle && (
						<div className="flex flex-col gap-2">
							<span className="text-sm font-normal text-gray-500 text-left">
								Используйте готовые резюме
							</span>

							{/* Горизонтальный скролл чипсов */}
							<div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
								{RESUME_PRESETS.map((preset) => {
									const isSelected = selectedPresetId === preset.id

									return (
										<button
											key={preset.id}
											type="button"
											onClick={() => handleSelectPreset(preset.id, preset.text)}
											className={`px-3 py-2  border border-[#b6b3ad]  rounded-2xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${isSelected
												? 'bg-[#98D2B9] text-gray-900' 
												: 'bg-[#f5f3ef] text-gray-800 hover:bg-[#ede9e2]'
												}`}
										>
											{preset.label}
										</button>
									)
								})}
							</div>
						</div>
					)}
					<Composer
						disabled={busy}
						value={presetText}
						onSend={handleSubmit}
						textPlaceholder={'Отправьте резюме'}
					/>
				</div>
			)}
		</div>
	)
}
