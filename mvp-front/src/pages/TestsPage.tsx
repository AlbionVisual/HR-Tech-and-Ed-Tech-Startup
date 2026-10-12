import { useState } from 'react'
import { TESTS_DATA } from '../features/tests/testsData'
import { btn, btnPrimary } from '../ui/btn'

type Screen = 'start' | 'quiz' | 'result' | 'review'

const INITIAL_LIVES = 5

export function TestsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Python')
  const [screen, setScreen] = useState<Screen>('start')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isChecked, setIsChecked] = useState(false)
  const [lives, setLives] = useState(INITIAL_LIVES)

  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})

  const questions = TESTS_DATA[selectedLanguage] || TESTS_DATA['Python']
  const currentQuestion = questions[currentIndex]

  const handleStart = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsChecked(false)
    setLives(INITIAL_LIVES)
    setUserAnswers({})
    setScreen('quiz')
  }

  const handleCheck = () => {
    if (selectedOption === null) return
    setIsChecked(true)

    const isCorrect = selectedOption === currentQuestion.correctAnswer

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedOption,
    }))

    if (!isCorrect) {
      setLives((prev) => Math.max(0, prev - 1))
    }
  }

  const handleNext = () => {
    if (lives === 0 || currentIndex + 1 >= questions.length) {
      setScreen('result')
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedOption(null)
    setIsChecked(false)
  }

  const answeredQuestionIds = Object.keys(userAnswers).map(Number)
  const correctCount = answeredQuestionIds.reduce((acc, qId) => {
    const q = questions.find((item) => item.id === qId)
    return q && userAnswers[qId] === q.correctAnswer ? acc + 1 : acc
  }, 0)


  const wrongQuestions = questions.filter(
    (q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correctAnswer,
  )

  const isGameOver = lives === 0
  const isLastQuestion = currentIndex + 1 === questions.length

  return (
    <div className="mx-auto w-full max-w-xl grid gap-4 p-4">
      {screen === 'start' && (
        <div className="grid gap-4">
          <div>
            <h2 className="m-0 text-[1.05rem]">Тестирование знаний</h2>
          </div>

          <section className="grid gap-2 border-t border-line pt-3">
            <span className="text-[0.92rem] font-medium">Язык:</span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TESTS_DATA).map((lang) => {
                const active = selectedLanguage === lang
                return (
                  <button
                    key={lang}
                    type="button"
                    className={active ? btnPrimary : btn}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
            <p className="m-0 text-[0.85rem] text-muted">
              В тесте {questions.length} вопросов
            </p>
          </section>

          <div className="pt-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={handleStart}
            >
              Начать тест ({selectedLanguage})
            </button>
          </div>
        </div>
      )}



      {screen === 'quiz' && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-3">
              <span className="text-[0.92rem] text-muted">
                Вопрос {currentIndex + 1} из {questions.length}
              </span>
              <button
                type="button"
                className="text-[0.82rem] text-muted underline"
                onClick={() => setScreen('start')}
              >
                ✕ Выйти
              </button>
            </div>

            <span
              className={`text-[0.92rem] font-bold ${
                lives <= 1 ? 'text-red-500' : 'text-red-600'
              }`}
            >
              ♥ {lives}
            </span>
          </div>

          <h3 className="m-0 text-base font-semibold">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx
              const isCorrect = idx === currentQuestion.correctAnswer

              let itemBorder = 'border-line hover:bg-black/5'
              if (isSelected) itemBorder = 'border-ink bg-black/5 font-medium'

              if (isChecked) {
                if (isCorrect) {
                  itemBorder = 'border-ok text-ok bg-ok/10 font-medium'
                } else if (isSelected) {
                  itemBorder = 'border-red-500 text-red-500 bg-red-50'
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isChecked}
                  onClick={() => setSelectedOption(idx)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-[0.92rem] transition ${itemBorder}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border border-line ${
                      isSelected ? 'bg-ink' : ''
                    }`}
                  />
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>

          <div className="border-t border-line pt-3">
            {!isChecked ? (
              <button
                type="button"
                className={btnPrimary}
                disabled={selectedOption === null}
                onClick={handleCheck}
              >
                Проверить
              </button>
            ) : (
              <div className="grid gap-3">
                <p className="m-0 text-[0.92rem]">
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <span className="text-ok font-medium">Верно! Так держать.</span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      Почти! Правильный ответ:{' '}
                      {currentQuestion.options[currentQuestion.correctAnswer]}
                    </span>
                  )}
                </p>
                <div>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={handleNext}
                  >
                    {isGameOver
                      ? 'Завершить'
                      : isLastQuestion
                        ? 'Посмотреть результат'
                        : 'Дальше'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {screen === 'result' && (
        <div className="grid gap-4">
          <div>
            <h2 className="m-0 text-[1.05rem]">
              Результат: {correctCount}/{questions.length}
            </h2>
            <p className="m-0 text-[0.92rem] text-muted">
              {lives === 0
                ? 'Закончились жизни! Попробуйте ещё раз.'
                : 'Отличная работа!'}
            </p>
            <p className="m-0 text-[0.85rem] text-muted mt-1">
              Жизней осталось: ♥ {lives}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <button
              type="button"
              className={btnPrimary}
              onClick={handleStart}
            >
              Пройти тест ещё раз
            </button>

            {wrongQuestions.length > 0 ? (
              <button
                type="button"
                className={btn}
                onClick={() => setScreen('review')}
              >
                Разобрать ошибки ({wrongQuestions.length})
              </button>
            ) : null}

            <button
              type="button"
              className={btn}
              onClick={() => setScreen('start')}
            >
              На главную
            </button>
          </div>
        </div>
      )}



      {screen === 'review' && (
        <div className="grid gap-4">
          <div>
            <h2 className="m-0 text-[1.05rem]">Разбор ошибок</h2>
            <p className="m-0 text-[0.92rem] text-muted">
              Ошибаться нормально — так запоминается лучше.
            </p>
          </div>

          <div className="grid gap-3 border-t border-line pt-3">
            {wrongQuestions.map((q) => (
              <div
                key={q.id}
                className="grid gap-1.5 rounded-lg border border-line p-3 text-[0.92rem]"
              >
                <div className="font-medium">{q.question}</div>
                <div className="text-red-500">
                  ✕ Твой ответ: {q.options[userAnswers[q.id]]}
                </div>
                <div className="text-ok">
                  ✓ Верно: {q.options[q.correctAnswer]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-line pt-3">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setScreen('result')}
            >
              К результату
            </button>
            <button
              type="button"
              className={btn}
              onClick={handleStart}
            >
              Пройти тест ещё раз
            </button>
          </div>
        </div>
      )}
    </div>
  )
}