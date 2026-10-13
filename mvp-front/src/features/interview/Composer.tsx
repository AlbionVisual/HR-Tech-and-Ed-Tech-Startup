import { useEffect, useRef, useState } from 'react'
import { useVoice } from '../../speech/VoiceContext'
import { btn, btnPrimary } from '../../ui/btn'

type Props = {
	disabled?: boolean
	onSend: (text: string) => void
	textPlaceholder: string
}

function appendChunk(prev: string, chunk: string) {
	const next = chunk.trim()
	if (!next) return prev
	if (!prev.trim()) return next
	return /\s$/.test(prev) ? `${prev}${next}` : `${prev} ${next}`
}

export function Composer({ disabled, onSend, textPlaceholder }: Props) {
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

	console.log(textPlaceholder)
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
					? 'relative flex flex-col justify-between border-t border-line bg-bg-elevated p-5 m-2 rounded-2xl shadow-xl h-[40vh] max-h-full'
					: 'relative flex flex-col justify-between border-t border-line bg-bg-elevated p-5 m-2 rounded-2xl shadow-xl'
			}    >

			<button
				type="button"
				className="mb-5 absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer shadow-sm z-10"
				onClick={() => setExpanded((v) => !v)}
				title={expanded ? 'Свернуть' : 'Развернуть'}
			>
				<img
					src={'/icons/resize-button.png'}
					alt="Изменить размер"
					className="w-5 h-5 object-contain"
				/>
			</button>

			<textarea
				ref={ref}
				className={
					expanded
						? 'flex-1 w-full overflow-auto bg-transparent pr-12 pt-2 pb-12 font-sans text-ink outline-none'
						: 'flex-1 w-full overflow-hidden bg-transparent pr-12 pt-2 pb-10 font-sans text-ink outline-none'
				}
				placeholder={
					listening
						? 'Слушаю…'
						: preparing
							? 'Думаю, как сказать красивее…'
							: speaking
								? 'ИИ говорит…'
								: textPlaceholder
				}
				value={text}
				disabled={disabled || listening}
				rows={2}
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

			<div className="absolute bottom-5 right-5 flex items-center gap-2">
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
					className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${text.trim() && !disabled && !listening
						? 'text-white shadow-md'
						: 'text-ink/60'
						}`}
					disabled={disabled || listening || !text.trim()}
					onClick={() => submit()}
					title="Отправить"
				>
					<img
						src={
							text.trim() && !disabled && !listening
								? '/icons/send-button-active.png'
								: '/icons/send-button-inactive.png'
						}
						alt="Отправить"
						className="w-9 h-9 object-contain"
					/>
				</button>

			</div>
		</div>
	)
}
