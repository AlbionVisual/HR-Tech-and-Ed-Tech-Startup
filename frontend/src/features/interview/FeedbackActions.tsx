import { btn, btnPrimary } from '../../ui/btn'

type Props = {
  onRefine: () => void
  onNext: () => void
}

export function FeedbackActions({ onRefine, onNext }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-line bg-bg-elevated p-3">
      <button type="button" className={btn} onClick={onRefine}>
        Уточнить ответ
      </button>
      <button type="button" className={btnPrimary} onClick={onNext}>
        Следующий вопрос
      </button>
    </div>
  )
}
