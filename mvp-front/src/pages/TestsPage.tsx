import { useState } from 'react'
import { TESTS_DATA } from '../features/tests/testsData'
// import { btn, btnPrimary } from '../ui/btn'

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
		<div className="mt-10 mx-auto w-full max-w-xl grid gap-4 p-4">
			{screen === 'start' && (
				<div className="grid gap-5 bg-[#70BFA1] p-6 rounded-3xl text-white shadow-lg">
					<div className="grid gap-1">
						<span className="text-xs opacity-80 uppercase tracking-wider">Development · Junior</span>
						<h2 className="m-0 text-2xl font-bold">Тест дня</h2>
						<p className="m-0 text-sm opacity-90">{questions.length} вопросов · около 3 минут</p>
					</div>

					<div className="grid gap-1.5">
						<div className="flex justify-between text-xs opacity-90">
							<span>Цель на день</span>
							<span>2/10</span>
						</div>
						<div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
							<div className="h-full bg-white rounded-full w-[20%]" />
						</div>
					</div>

					<section className="grid gap-3 pt-2">
						<span className="text-sm font-semibold opacity-90">Выбери язык</span>
						<div className="grid gap-2.5">
							{Object.keys(TESTS_DATA).map((lang) => {
								const active = selectedLanguage === lang
								return (
									<button
										key={lang}
										type="button"
										className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border-0 shadow-sm ${active
											? 'bg-white text-ink font-semibold'
											: 'bg-emerald-700/60 text-white hover:bg-emerald-700/80'
											}`}
										onClick={() => setSelectedLanguage(lang)}
									>
										<div className="flex items-center gap-3">
											<span className="text-xl">
												{lang === 'Python' ? '🐍' : lang === 'Java' ? '☕' : '⚙️'}
											</span>
											<div className="text-left">
												<div className="text-base font-bold">{lang}</div>
												<div className={`text-xs ${active ? 'text-muted' : 'opacity-70'}`}>
													{active ? 'Лучший: 9/10' : 'Новый'}
												</div>
											</div>
										</div>
										<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-ink bg-ink text-white' : 'border-white/60'
											}`}>
											{active && <div className="w-2 h-2 rounded-full bg-white" />}
										</div>
									</button>
								)
							})}
						</div>
					</section>

					<div className="pt-2">
						<button
							type="button"
							className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
							onClick={handleStart}
						>
							Начать тест · {selectedLanguage}
						</button>
					</div>
				</div>
			)}


			{screen === 'quiz' && (
				<div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md overflow-hidden">
					{/* Верхняя шапка с прогрессом и жизнями */}
					<div>
						<div className="flex items-center justify-between gap-3 mb-4">
							<button
								type="button"
								className="text-xl font-bold text-ink/60 hover:text-ink cursor-pointer border-0 bg-transparent p-0"
								onClick={() => setScreen('start')}
							>
								✕
							</button>

							<div className="flex-1 h-2.5 bg-[#ede9e2] rounded-full overflow-hidden mx-2">
								<div
									className="h-full bg-emerald-500 rounded-full transition-all duration-300"
									style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
								/>
							</div>

							<span className="text-sm font-bold text-orange-500 flex items-center gap-1">
								♥ {lives}
							</span>
						</div>

						<div className="text-xs text-muted mb-1 font-medium">
							Вопрос {currentIndex + 1} из {questions.length}
						</div>

						{/* Текст вопроса */}
						<h3 className="m-0 text-xl font-bold mb-6 text-ink">
							{currentQuestion.question}
						</h3>

						{/* Варианты ответов */}
						<div className="grid gap-3">
							{currentQuestion.options.map((opt, idx) => {
								const isSelected = selectedOption === idx
								const isCorrect = idx === currentQuestion.correctAnswer

								let itemStyle = 'bg-white text-ink border-2 border-transparent shadow-sm hover:border-[#ede9e2]'

								if (isSelected && !isChecked) {
									itemStyle = 'bg-white text-ink border-2 border-emerald-500 font-medium shadow-sm'
								}

								if (isChecked) {
									if (isCorrect) {
										itemStyle = 'bg-[#bde8d3] text-ink border-2 border-[#81d4ad] font-semibold'
									} else if (isSelected) {
										itemStyle = 'bg-[#ffd3cc] text-ink border-2 border-[#ff9180] font-semibold'
									}
								}

								return (
									<button
										key={idx}
										type="button"
										disabled={isChecked}
										onClick={() => setSelectedOption(idx)}
										className={`w-full p-4 rounded-2xl text-left text-base transition-all cursor-pointer ${itemStyle}`}
									>
										{opt}
									</button>
								)
							})}
						</div>
					</div>

					<div className="mt-6">
						{!isChecked ? (
							<button
								type="button"
								className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
								disabled={selectedOption === null}
								onClick={handleCheck}
							>
								Проверить
							</button>
						) : (
							<div className={`-mx-6 -mb-6 p-6 rounded-b-3xl grid gap-3 transition-all ${selectedOption === currentQuestion.correctAnswer
								? 'bg-[#bde8d3]'
								: 'bg-[#ffd3cc]'
								}`}>
								<div>
									<h4 className={`m-0 text-lg font-bold ${selectedOption === currentQuestion.correctAnswer ? 'text-emerald-900' : 'text-red-900'
										}`}>
										{selectedOption === currentQuestion.correctAnswer ? 'Верно!' : 'Почти!'}
									</h4>
									<p className={`m-0 text-sm mt-0.5 ${selectedOption === currentQuestion.correctAnswer ? 'text-emerald-800' : 'text-red-800'
										}`}>
										{selectedOption === currentQuestion.correctAnswer ? (
											'Так держать.'
										) : (
											<>
												Правильный ответ: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>. Запомним и вернёмся.
											</>
										)}
									</p>
								</div>

								<button
									type="button"
									className={`w-full py-4 rounded-2xl font-bold text-center text-white transition-all shadow-md cursor-pointer border-0 ${selectedOption === currentQuestion.correctAnswer
										? 'bg-emerald-500 hover:bg-emerald-600'
										: 'bg-orange-500 hover:bg-orange-600'
										}`}
									onClick={handleNext}
								>
									{isGameOver
										? 'Завершить'
										: isLastQuestion
											? 'Посмотреть результат'
											: 'Дальше'}
								</button>
							</div>
						)}
					</div>
				</div>
			)}


			{screen === 'result' && (
				<div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md text-center">
					<div className="pt-6">
						<span className="text-xs uppercase tracking-wider text-muted font-medium">
							Python · Junior
						</span>

						{/* Крупный результат */}
						<div className="text-6xl font-bold text-emerald-600 my-4 tracking-tight">
							{correctCount}/{questions.length}
						</div>

						<h3 className="m-0 text-xl font-bold text-ink mb-2">
							{correctCount >= (questions.length * 0.7)
								? 'Уверенный результат. Навыки соответствуют ожиданиям.'
								: 'Требуется дополнительная подготовка по ряду тем.'}
						</h3>

						<p className="m-0 text-sm text-muted">
							Остаток жизней: ♥ {lives}
						</p>
					</div>

					<div className="grid gap-3 pb-4">
						<button
							type="button"
							className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
							onClick={handleStart}
						>
							Пройти тест ещё раз
						</button>

						{wrongQuestions.length > 0 ? (
							<button
								type="button"
								className="w-full py-4 rounded-2xl bg-transparent hover:bg-black/5 text-ink font-bold text-center transition-all cursor-pointer border-2 border-ink"
								onClick={() => setScreen('review')}
							>
								Разобрать ошибки ({wrongQuestions.length})
							</button>
						) : null}

						<div className="pt-2">
							<button
								type="button"
								className="text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent"
								onClick={() => setScreen('start')}
							>
								На главную
							</button>
						</div>
					</div>
				</div>
			)}

			{screen === 'review' && (
				<div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md">
					<div className="grid gap-4">
						<div>
							<button
								type="button"
								className="text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent p-0 mb-2"
								onClick={() => setScreen('result')}
							>
								← К результату
							</button>
							<h2 className="m-0 text-xl font-bold text-ink">Разбор ошибок</h2>
							<p className="m-0 text-sm text-muted mt-1">
								Анализ допущенных неточностей для закрепления материала.
							</p>
						</div>

						<div className="grid gap-4 pt-2">
							{wrongQuestions.map((q) => (
								<div
									key={q.id}
									className="grid gap-2 bg-white rounded-2xl p-4 shadow-sm border border-[#e5e2dc]"
								>
									<div className="font-bold text-base text-ink mb-1">{q.question}</div>
									<div className="bg-[#ffd3cc] text-red-900 font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-2">
										<span>✕</span> Твой ответ: {q.options[userAnswers[q.id]]}
									</div>
									<div className="bg-[#bde8d3] text-emerald-900 font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-2">
										<span>✓</span> Верно: {q.options[q.correctAnswer]}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Нижняя кнопка */}
					<div className="pt-6">
						<button
							type="button"
							className="w-full py-4 rounded-2xl bg-transparent hover:bg-black/5 text-ink font-bold text-center transition-all cursor-pointer border-2 border-ink"
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
