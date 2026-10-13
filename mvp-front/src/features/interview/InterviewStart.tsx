// import { btn, btnPrimary } from '../../ui/btn'

type Props = {
	onVacancyPrep: () => void
	onPractice: () => void
}

export function InterviewStart({ onVacancyPrep, onPractice }: Props) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<button
				type="button"
				className="h-28 w-full min-w-0 max-w-200 md:max-w-80 flex flex-col items-start p-5 rounded-3xl bg-[#FE502D] text-white transition-all justify-between shadow-md cursor-pointer border-0"
				onClick={onVacancyPrep}
			>
				<span className="text-xl font-bold mb-1">Готовлюсь к вакансии</span>
				<span className="text-sm opacity-90 text-left">Есть конкретная компания, грейд и описание вакансии</span>
			</button>

			<button
				type="button"
				className="h-28 w-full min-w-0 md:max-w-80 flex flex-col items-start p-5 rounded-3xl bg-[#f5f3ef] text-ink hover:bg-[#ede9e2] transition-all justify-center shadow-sm cursor-pointer border-0"
				onClick={onPractice}
			>
				<span className="text-xl font-bold mb-1 text-ink">Просто тренируюсь</span>
				<span className="text-sm text-ink/70 text-left">Выберите необходимый язык</span>
			</button>
		</div>)
}
