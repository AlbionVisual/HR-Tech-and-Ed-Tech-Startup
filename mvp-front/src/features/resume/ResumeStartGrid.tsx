import type { ResumeMode } from './useResumeSession'

type Props = {
  mode: ResumeMode | null
  onChooseAtsCheck: () => void
  onChooseImproveExperience: () => void
  onChooseKeywords: () => void
  onChooseFormatting: () => void
}

const MODE_DESCRIPTIONS: Record<ResumeMode, string> = {
  ats_check:
    'Проверим, насколько хорошо ваше резюме считывается алгоритмами ATS.',
  improve_experience:
    'текст1',
  formatting:
    'текст2',
  keywords:
    'текст3',
}

export function ResumeStartGrid({
  mode,
  onChooseAtsCheck,
  onChooseImproveExperience,
  onChooseKeywords,
  onChooseFormatting,
}: Props) {

  const getCardStyle = (cardMode: ResumeMode) => {
    if (mode === cardMode) {
      return 'border-[#FE502D] bg-emerald-100 text-emerald-950 shadow-sm'
    }
    return 'border-[#FE502D] bg-white hover:bg-orange-50/40 text-gray-900'
  }

  const headerText = mode
    ? MODE_DESCRIPTIONS[mode]
    : 'Помогу довести резюме до стандарта ATS.\nВыберите задачу или сразу вставьте текст'

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full py-2">
      <div className="mb-4 text-gray-500 text-sm sm:text-base text-left whitespace-pre-line min-h-[48px]">
        {headerText}
      </div>

      <div className="grid grid-cols-2 gap-3.5 mb-2">
        <button
          type="button"
          onClick={onChooseAtsCheck}
          className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[110px] ${getCardStyle(
            'ats_check',
          )}`}
        >
          <span className="text-base sm:text-lg font-bold mb-1">
            Проверка ATS
          </span>
          <span className="text-xs sm:text-sm text-gray-600 leading-snug">
            Пройдет ли резюме фильтры?
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseImproveExperience}
          className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[110px] ${getCardStyle(
            'improve_experience',
          )}`}
        >
          <span className="text-base sm:text-lg font-bold mb-1">
            Улучшить опыт
          </span>
          <span className="text-xs sm:text-sm text-gray-600 leading-snug">
            Сильнее формулировки
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseFormatting}
          className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[110px] ${getCardStyle(
            'formatting',
          )}`}
        >
          <span className="text-base sm:text-lg font-bold mb-1">
            Форматирование
          </span>
          <span className="text-xs sm:text-sm text-gray-600 leading-snug">
            Структура и читаемость
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseKeywords}
          className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[110px] ${getCardStyle(
            'keywords',
          )}`}
        >
          <span className="text-base sm:text-lg font-bold mb-1">
            Ключевые слова
          </span>
          <span className="text-xs sm:text-sm text-gray-600 leading-snug">
            Поиск важных навыков
          </span>
        </button>
      </div>
    </div>
  )
}
