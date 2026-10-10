import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../ai/types'
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
  const busy = status === 'thinking' || status === 'streaming'
  const canType = phase === 'interviewing' && !busy
  const showThinkingUi = status === 'thinking' || Boolean(thought)

  const last = messages[messages.length - 1]
  const splitThoughtBeforeAnswer =
    showThinkingUi && last?.role === 'assistant'
  const ahead = splitThoughtBeforeAnswer ? messages.slice(0, -1) : messages
  const answer = splitThoughtBeforeAnswer ? last : null

  useEffect(() => {
    const el = listRef.current
    if (!el || !stickRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages, thought, status, error])

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
      </div>

      {phase === 'awaiting_next' ? (
        <FeedbackActions onRefine={onRefine} onNext={onNext} />
      ) : (
        <Composer disabled={!canType} onSend={onSend} />
      )}
    </div>
  )
}
