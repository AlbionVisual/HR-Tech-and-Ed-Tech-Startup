import type { ChatMessage } from '../../ai/types'
import { MessageBubble } from '../interview/MessageBubble'
import { ThinkingIndicator } from '../interview/ThinkingIndicator'

type Props = {
  messages: ChatMessage[]
  status: 'idle' | 'thinking' | 'streaming' | 'error'
  thought: string
  error: string
  voiceError: string
}

export function ChatMessageList({
  messages,
  status,
  thought,
  error,
  voiceError,
}: Props) {
  const showThinkingUi = status === 'thinking' || Boolean(thought)
  const last = messages[messages.length - 1]
  const splitThoughtBeforeAnswer =
    showThinkingUi && last?.role === 'assistant'
  const ahead = splitThoughtBeforeAnswer ? messages.slice(0, -1) : messages
  const answer = splitThoughtBeforeAnswer ? last : null

  return (
    <>
      {ahead.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {showThinkingUi ? (
        <ThinkingIndicator thought={thought} live={status === 'thinking'} />
      ) : null}
      {answer ? <MessageBubble message={answer} /> : null}
      {error ? <p className="m-0 text-[0.9rem] text-danger">{error}</p> : null}
      {voiceError ? (
        <p className="m-0 text-[0.9rem] text-danger">{voiceError}</p>
      ) : null}
    </>
  )
}
