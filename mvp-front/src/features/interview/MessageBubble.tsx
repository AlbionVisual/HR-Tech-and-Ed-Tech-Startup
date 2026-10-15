import type { ChatMessage } from '../../ai/types'
// import { useVoice } from '../../speech/VoiceContext'

type Props = {
	message: ChatMessage
}

export function MessageBubble({ message }: Props) {
	const isUser = message.role === 'user'
	// Озвучка временно скрыта
	// const {
	// 	enabled,
	// 	speak,
	// 	stopAll,
	// 	playingMessageId,
	// 	speaking,
	// 	preparing,
	// } = useVoice()
	// const active = playingMessageId === message.id
	// const isPreparing = active && preparing
	// const isPlaying = active && speaking

	return (
		<div
			className={`anim-bubble-in max-w-[min(85%,520px)] rounded-[10px] border border-line px-3 py-2.5 ${
				 isUser ? 'self-end bg-[#70BFA1] text-white rounded-6xl rounded-br-sm' : 'self-start bg-[#f5f3ef] text-ink rounded-6xl rounded-bl-sm'
				}`}
		>
			<p className="m-0 wrap-break-word whitespace-pre-wrap">{message.content}</p>
			{/* Озвучка временно скрыта
			{!isUser && enabled && message.content.trim() ? (
				<label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[0.8rem] text-muted">
					<input
						type="checkbox"
						className="m-0"
						checked={isPreparing || isPlaying}
						onChange={(e) => {
							if (e.target.checked) {
								void speak(message.content, { messageId: message.id })
							} else {
								stopAll()
							}
						}}
						aria-label="Прослушать сообщение"
					/>
					<span>
						{isPreparing
							? 'Думаю, как сказать красивее…'
							: isPlaying
								? 'Играет…'
								: 'Прослушать'}
					</span>
				</label>
			) : null}
			*/}
		</div>
	)
}
