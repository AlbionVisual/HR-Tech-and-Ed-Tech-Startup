import { btn, btnPrimary } from '../../ui/btn'

type Props = {
  onVacancyPrep: () => void
  onPractice: () => void
}

export function InterviewStart({ onVacancyPrep, onPractice }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <button
        type="button"
        className={`${btnPrimary} w-full min-w-0 max-w-80`}
        onClick={onVacancyPrep}
      >
        Готовлюсь к вакансии
      </button>
      <button
        type="button"
        className={`${btn} w-full min-w-0 max-w-80`}
        onClick={onPractice}
      >
        Просто тренируюсь
      </button>
    </div>
  )
}
