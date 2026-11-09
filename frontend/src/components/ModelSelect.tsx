import { useEffect, useState } from 'react'
import {
	AI_SETTINGS_EVENT,
	listAvailableModels,
	resolveSelection,
	setSelectedModelId,
	type ModelOption,
} from '../ai/selection'

type Props = {
	variant?: 'bar' | 'panel'
}

export function ModelSelect({ variant = 'bar' }: Props) {
	const [options, setOptions] = useState<ModelOption[]>(() =>
		listAvailableModels(),
	)
	const [value, setValue] = useState(() => resolveSelection().option?.id ?? '')

	useEffect(() => {
		function sync() {
			const next = listAvailableModels()
			setOptions(next)
			setValue(resolveSelection().option?.id ?? '')
		}
		sync()
		window.addEventListener(AI_SETTINGS_EVENT, sync)
		return () => window.removeEventListener(AI_SETTINGS_EVENT, sync)
	}, [])

	if (!options.length) {
		return (
			<span className="whitespace-nowrap text-[0.8rem] text-muted" title="Нет ключей">
				Нет ключа
			</span>
		)
	}

	const selectClass =
		variant === 'panel'
			? 'w-full rounded-lg border border-line bg-bg-elevated px-2 py-1.5 font-sans text-[0.8rem] text-ink'
			: 'w-full max-w-[220px] rounded-xl border border-[#b6b3ad] bg-[#f5f3ef] px-3 py-2 font-sans text-xs sm:text-sm text-ink outline-none hover:bg-[#ede9e2] transition-colors cursor-pointer shadow-sm'

	return (
		<label className={variant === 'panel' ? 'min-w-0 w-full' : 'min-w-0 max-w-[min(220px,42vw)]'}>
			<span className="sr-only">Модель</span>
			<select
				className={selectClass}
				value={value}
				onChange={(e) => {
					setSelectedModelId(e.target.value)
					setValue(e.target.value)
				}}
			>
				{options.map((o) => (
					<option key={o.id} value={o.id} className="bg-white text-ink">
						{o.label}
					</option>
				))}
			</select>
		</label>
	)
}
