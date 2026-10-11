import type { ChatMessage } from '../../ai/types'
import { useVoice } from '../../speech/VoiceContext'

type Props = {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const {
    enabled,
    speak,
    stopAll,
    playingMessageId,
    speaking,
    preparing,
  } = useVoice()
  const active = playingMessageId === message.id
  const isPreparing = active && preparing
  const isPlaying = active && speaking

  return (
    <div
      className={`anim-bubble-in max-w-[min(85%,520px)] rounded-[10px] border border-line px-3 py-2.5 ${
        isUser ? 'self-end bg-bubble-user' : 'self-start bg-bubble-ai'
      }`}
    >
      <p className="m-0 wrap-break-word whitespace-pre-wrap">{message.content}</p>
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
            aria-label="Проиграть сообщение"
          />
          <span>
            {isPreparing
              ? 'Думаю, как сказать красивее…'
              : isPlaying
                ? 'Играет…'
                : 'Проиграть'}
          </span>
        </label>
      ) : null}
    </div>
  )
}
