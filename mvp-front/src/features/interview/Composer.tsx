import { useEffect, useRef, useState } from 'react'
import { btnGhost, btnPrimary } from '../../ui/btn'

type Props = {
  disabled?: boolean
  onSend: (text: string) => void
}

export function Composer({ disabled, onSend }: Props) {
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text, expanded])

  function submit() {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
    setExpanded(false)
  }

  return (
    <div
      className={
        expanded
          ? 'fixed inset-x-0 top-[var(--spacing-topbar)] bottom-[var(--spacing-nav)] z-[15] grid grid-rows-[1fr_auto] gap-2 border-t border-line bg-bg-elevated px-3 py-2.5'
          : 'grid gap-2 border-t border-line bg-bg-elevated px-3 py-2.5'
      }
    >
      <textarea
        ref={ref}
        className={
          expanded
            ? 'h-full max-h-none w-full resize-none overflow-auto rounded-lg border border-line bg-bg px-3 py-2.5 font-sans text-ink'
            : 'max-h-40 w-full resize-none overflow-hidden rounded-lg border border-line bg-bg px-3 py-2.5 font-sans text-ink'
        }
        placeholder="Ваш ответ..."
        value={text}
        disabled={disabled}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => {
          if (text.length > 120) setExpanded(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className={btnGhost}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Свернуть' : 'Развернуть'}
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={disabled || !text.trim()}
          onClick={submit}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}
