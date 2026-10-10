import type { ChatMessage } from '../../ai/types'

type Props = {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div
      className={`anim-bubble-in max-w-[min(85%,520px)] rounded-[10px] border border-line px-3 py-2.5 ${
        isUser
          ? 'self-end bg-bubble-user'
          : 'self-start bg-bubble-ai'
      }`}
    >
      <p className="m-0 wrap-break-word whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}
