import { useState } from 'react'
import type { VacancyGrade } from '../../config'
import { btnPrimary, fieldInput, fieldLabel } from '../../ui/btn'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    company: string
    grade: VacancyGrade
    description: string
  }) => void
}

const grades: { value: VacancyGrade; label: string }[] = [
  { value: 'intern', label: 'Стажировка' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
]

export function VacancySheet({ open, onClose, onSubmit }: Props) {
  const [company, setCompany] = useState('')
  const [grade, setGrade] = useState<VacancyGrade>('junior')
  const [description, setDescription] = useState('')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="anim-sheet-up grid w-full max-h-[50vh] gap-3 overflow-auto rounded-t-2xl border-t border-line bg-bg-elevated p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-label="О вакансии"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 text-[1.05rem]">О вакансии</h2>

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Компания</span>
          <input
            className={fieldInput}
            placeholder="Введите название компании"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Грейд</span>
          <select
            className={fieldInput}
            value={grade}
            onChange={(e) => setGrade(e.target.value as VacancyGrade)}
          >
            {grades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabel}>Описание вакансии</span>
          <textarea
            className={`${fieldInput} min-h-[110px] resize-y`}
            placeholder="Вставьте сюда описание вакансии"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </label>

        <button
          type="button"
          className={btnPrimary}
          onClick={() => onSubmit({ company, grade, description })}
        >
          Начать интервью
        </button>
      </div>
    </div>
  )
}
