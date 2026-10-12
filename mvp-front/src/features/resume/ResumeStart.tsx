import type { ResumeMode } from './useResumeSession'

type Props = {
	mode: ResumeMode | null
	onFormatting: () => void
	onKeywords: () => void
	onAtsCheck?: () => void
	onImproveExperience?: () => void
}

const ModeDescription: Record<ResumeMode, string> = {
	ats_check:
		'Проверим, насколько хорошо ваше резюме считывается алгоритмами ATS и проходит автоматические фильтры.',
	improve_experience:
		'текст2',
	formatting:
		'текст3',
	keywords:
		'текст4',
}

export function ResumeStart({ mode, onFormatting, onKeywords, onAtsCheck, onImproveExperience }: Props) {

	const getCardStyle = (cardMode: ResumeMode) => {
		const isSelected = mode === cardMode

		if (isSelected) {
			return 'border-emerald-500 bg-emerald-50/80 text-emerald-950'
		}

		return 'border-orange-500 bg-white hover:bg-orange-50/40 text-gray-900'
	}

	const headerText = mode
		? ModeDescription[mode]
		: 'Помогу довести резюме до стандарта ATS.\nВыберите задачу или сразу вставьте текст'

	return (
		<div className="flex flex-1 flex-col p-6 max-w-2xl mx-auto w-full">
			<div className="mb-4 text-gray-500 text-sm sm:text-base text-left whitespace-pre-line min-h-[48px]">
				{headerText}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<button
					type="button"
					onClick={onAtsCheck}
					className={`flex flex-col text-left p-5 rounded-2xl border transition-colors cursor-pointer min-h-[120px] ${getCardStyle(
						'ats_check',
					)}`}
				>
					<span className="text-lg font-bold mb-1">Проверка ATS</span>
					<span className="text-xs sm:text-sm text-gray-600 leading-snug">
						Пройдет ли резюме фильтры?
					</span>
				</button>

				<button
					type="button"
					onClick={onImproveExperience}
					className={`flex flex-col text-left p-5 rounded-2xl border transition-colors cursor-pointer min-h-[120px] ${getCardStyle(
						'improve_experience',
					)}`}
				>
					<span className="text-lg font-bold mb-1">Улучшить опыт</span>
					<span className="text-xs sm:text-sm text-gray-600 leading-snug">
						Сильнее формулировки
					</span>
				</button>

				<button
					type="button"
					onClick={onFormatting}
					className={`flex flex-col text-left p-5 rounded-2xl border transition-colors cursor-pointer min-h-[120px] ${getCardStyle(
						'formatting',
					)}`}
				>
					<span className="text-lg font-bold mb-1">Улучшить опыт</span>
					<span className="text-xs sm:text-sm text-gray-600 leading-snug">
						Сильнее формулировки
					</span>
				</button>

				<button
					type="button"
					onClick={onKeywords}
					className={`flex flex-col text-left p-5 rounded-2xl border transition-colors cursor-pointer min-h-[120px] ${getCardStyle(
						'keywords',
					)}`}
				>
					<span className="text-lg font-bold mb-1">Улучшить опыт</span>
					<span className="text-xs sm:text-sm text-gray-600 leading-snug">
						Сильнее формулировки
					</span>
				</button>
			</div>
		</div>
	)
}
