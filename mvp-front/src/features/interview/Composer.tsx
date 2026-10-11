import { useEffect, useRef, useState } from 'react'
import { useVoice } from '../../speech/VoiceContext'
import { btn, btnGhost, btnPrimary } from '../../ui/btn'

type Props = {
  disabled?: boolean
  onSend: (text: string) => void
}

function appendChunk(prev: string, chunk: string) {
  const next = chunk.trim()
  if (!next) return prev
  if (!prev.trim()) return next
  return /\s$/.test(prev) ? `${prev}${next}` : `${prev} ${next}`
}

export function Composer({ disabled, onSend }: Props) {
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [micError, setMicError] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const {
    enabled,
    preparing,
    speaking,
    listening,
    voiceError,
    heardInsert,
    sttSupported,
    startMic,
    stopAll,
    stopMic,
    consumeHeardInsert,
  } = useVoice()
  const ttsBusy = preparing || speaking

  useEffect(() => {
    if (!heardInsert) return
    setText((prev) => appendChunk(prev, heardInsert.text))
    consumeHeardInsert(heardInsert.id)
  }, [heardInsert, consumeHeardInsert])

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text, expanded])

  function submit(value = text) {
    const next = value.trim()
    if (!next || disabled) return
    onSend(next)
    setText('')
    setExpanded(false)
    setMicError('')
  }

  async function onMicClick() {
    if (listening) {
      stopMic()
      return
    }
    setMicError('')
    try {
      await startMic()
    } catch (e) {
      setMicError(e instanceof Error ? e.message : 'Ошибка микрофона')
    }
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
        placeholder={
          listening
            ? 'Слушаю…'
            : preparing
              ? 'Думаю, как сказать красивее…'
              : speaking
                ? 'ИИ говорит…'
                : 'Ваш ответ...'
        }
        value={text}
        disabled={disabled || listening}
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
      {micError ? <p className="m-0 text-[0.85rem] text-danger">{micError}</p> : null}
      {voiceError ? <p className="m-0 text-[0.85rem] text-danger">{voiceError}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        {enabled ? (
          <>
            <button
              type="button"
              className={btn}
              onClick={() => stopAll()}
              disabled={!ttsBusy && !listening}
              title="Остановить озвучку и микрофон"
            >
              Замолчи
            </button>
            <button
              type="button"
              className={listening ? btnPrimary : btn}
              onClick={() => void onMicClick()}
              disabled={disabled || !sttSupported || ttsBusy}
              title={
                sttSupported
                  ? listening
                    ? 'Остановить микрофон'
                    : 'Говорить'
                  : 'Speech recognition недоступен'
              }
            >
              {listening ? 'Слушаю…' : 'Микрофон'}
            </button>
          </>
        ) : null}
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
          disabled={disabled || listening || !text.trim()}
          onClick={() => submit()}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}
