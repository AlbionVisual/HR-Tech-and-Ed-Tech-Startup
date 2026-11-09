import { useEffect, useRef, useState } from 'react'

type Props = {
  thought?: string
  live?: boolean
}

export function ThinkingIndicator({ thought, live = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const hasThought = Boolean(thought?.trim())

  useEffect(() => {
    setExpanded(false)
  }, [live])

  useEffect(() => {
    if (!live || expanded) return
    const el = bodyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [thought, live, expanded])

  if (!hasThought) {
    return (
      <div
        className="flex self-start gap-1.5 rounded-[10px] border border-line bg-bubble-ai px-3 py-2.5"
        aria-live="polite"
      >
        <span className="anim-think h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="anim-think anim-think-delay-1 h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="anim-think anim-think-delay-2 h-1.5 w-1.5 rounded-full bg-muted" />
      </div>
    )
  }

  const mode = expanded ? 'expanded' : live ? 'live' : 'collapsed'

  return (
    <div
      className="anim-bubble-in max-w-[min(90%,560px)] self-start rounded-[10px] border border-dashed border-line bg-bg-panel px-2.5 py-2 text-muted"
      aria-live="polite"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-0 bg-transparent p-0 font-sans text-inherit"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="text-[0.75rem] tracking-[0.04em] uppercase">
          Размышления
        </span>
        <span className="text-[0.8rem] opacity-70">{expanded ? '▾' : '▸'}</span>
      </button>
      {mode === 'collapsed' ? (
        <button
          type="button"
          className="mt-1 block w-full border-0 bg-transparent p-0 text-left font-sans text-inherit"
          onClick={() => setExpanded(true)}
        >
          <p className="m-0 truncate text-[0.9rem] leading-[1.35]">{thought}</p>
        </button>
      ) : (
        <div
          ref={bodyRef}
          className={
            mode === 'live'
              ? 'mt-1.5 max-h-[calc(1.4em*5)] overflow-auto'
              : 'mt-1.5 max-h-[min(40vh,280px)] overflow-auto'
          }
        >
          <p className="m-0 wrap-break-word whitespace-pre-wrap text-[0.9rem] leading-[1.4]">
            {thought}
          </p>
        </div>
      )}
    </div>
  )
}
