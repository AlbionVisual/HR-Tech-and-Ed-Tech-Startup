import { useEffect, useState } from "react";
import {
  answerTest,
  finishTest,
  getTestLanguages,
  getTestStats,
  startTest,
  type TestAnswer,
  type TestAttempt,
  type TestLanguage,
  type TestResult,
} from "../api/tests";

type Screen = "start" | "quiz" | "result" | "review";

export function TestsPage() {
  const [languages, setLanguages] = useState<TestLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [completedTestsCount, setCompletedTestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [screen, setScreen] = useState<Screen>("start");
  const [error, setError] = useState("");

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answer, setAnswer] = useState<TestAnswer | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  const currentQuestion = attempt?.questions[currentIndex];
  const lives = attempt?.lives ?? 0;
  const isChecked = answer !== null;
  const isGameOver = lives === 0;
  const isLastQuestion = attempt
    ? currentIndex + 1 === attempt.questions.length
    : false;
  const languageTitle =
    languages.find((language) => language.slug === selectedLanguage)?.title ??
    selectedLanguage;
  const wrongQuestions = result?.wrong_questions ?? [];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [languageData, stats] = await Promise.all([
          getTestLanguages(),
          getTestStats(),
        ]);
        if (cancelled) return;
        setLanguages(languageData);
        setCompletedTestsCount(stats.completed_count);
        if (languageData.length) {
          setSelectedLanguage(languageData[0].slug);
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить тесты",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const nextAttempt = await startTest(selectedLanguage);
      setAttempt(nextAttempt);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswer(null);
      setResult(null);
      setScreen("quiz");
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Не удалось начать тест",
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleCheck() {
    if (selectedOption === null || !attempt || !currentQuestion || checking) {
      return;
    }
    setChecking(true);
    setError("");
    try {
      const nextAnswer = await answerTest(
        attempt.attempt_id,
        currentQuestion.id,
        selectedOption,
      );
      setAnswer(nextAnswer);
      setAttempt((prev) =>
        prev ? { ...prev, lives: nextAnswer.lives } : prev,
      );
    } catch (checkError) {
      setError(
        checkError instanceof Error ? checkError.message : "Не удалось проверить ответ",
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleNext() {
    if (!attempt || checking) return;

    if (isGameOver || isLastQuestion) {
      setChecking(true);
      setError("");
      try {
        const nextResult = await finishTest(attempt.attempt_id);
        setResult(nextResult);
        setScreen("result");
        void getTestStats()
          .then((stats) => setCompletedTestsCount(stats.completed_count))
          .catch(() => undefined);
      } catch (finishError) {
        setError(
          finishError instanceof Error
            ? finishError.message
            : "Не удалось завершить тест",
        );
      } finally {
        setChecking(false);
      }
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswer(null);
  }

  return (
    <div className="mt-10 mx-auto w-full max-w-xl grid gap-4 p-4">
      {error ? <p className="m-0 text-sm text-danger">{error}</p> : null}

      {screen === "start" && (
        <div className="grid gap-5 bg-[#70BFA1] p-6 rounded-3xl text-white shadow-lg">
          <div className="grid gap-1">
            <span className="text-xs opacity-80 uppercase tracking-wider">
              Development · Junior
            </span>
            <h2 className="m-0 text-2xl font-bold">Случайный тест дня</h2>
            <p className="m-0 text-sm opacity-90">
              10 вопросов · около 3 минут
            </p>
          </div>

          <div className="grid gap-1.5">
            <div className="flex justify-between text-xs opacity-90 font-medium">
              <span>Цель на день</span>
              <span>{Math.min(completedTestsCount, 5)}/5</span>
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min((completedTestsCount / 5) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <section className="grid gap-3 pt-2">
            <span className="text-sm font-semibold opacity-90">
              Выбери язык
            </span>
            <div className="grid gap-2.5">
              {languages.map((lang) => {
                const active = selectedLanguage === lang.slug;
                return (
                  <button
                    key={lang.slug}
                    type="button"
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border-0 shadow-sm ${
                      active
                        ? "bg-white text-ink font-semibold"
                        : "bg-emerald-700/60 text-white hover:bg-emerald-700/80"
                    }`}
                    onClick={() => setSelectedLanguage(lang.slug)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.icon}</span>
                      <div className="text-left">
                        <div className="text-base font-bold">{lang.title}</div>
                        <div className="text-xs opacity-70">
                          {lang.tests_count} тестов
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-white/60"
                      }`}>
                      {active && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
              {!languages.length && !loading ? (
                <p className="m-0 text-sm opacity-90">
                  Тесты пока не загружены.
                </p>
              ) : null}
            </div>
          </section>

          <div className="pt-2">
            <button
              type="button"
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
              onClick={() => void handleStart()}
              disabled={loading || starting || !languages.length}>
              {starting ? "Загружаю тест…" : `Начать тест · ${languageTitle}`}
            </button>
          </div>
        </div>
      )}

      {screen === "quiz" && currentQuestion && attempt && (
        <div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                className="text-xl font-bold text-ink/60 hover:text-ink cursor-pointer border-0 bg-transparent p-0"
                onClick={() => setScreen("start")}>
                ✕
              </button>

              <div className="flex-1 h-2.5 bg-[#ede9e2] rounded-full overflow-hidden mx-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / attempt.questions.length) * 100}%`,
                  }}
                />
              </div>

              <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                ♥ {lives}
              </span>
            </div>

            <div className="text-xs text-muted mb-1 font-medium">
              Вопрос {currentIndex + 1} из {attempt.questions.length}
            </div>

            <h3 className="m-0 text-xl font-bold mb-6 text-ink">
              {currentQuestion.question}
            </h3>

            <div className="grid gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = isChecked && answer?.correct_index === idx;

                let itemStyle =
                  "bg-white text-ink border-2 border-transparent shadow-sm hover:border-[#ede9e2]";

                if (isSelected && !isChecked) {
                  itemStyle =
                    "bg-white text-ink border-2 border-emerald-500 font-medium shadow-sm";
                }

                if (isChecked) {
                  if (isCorrect) {
                    itemStyle =
                      "bg-[#bde8d3] text-ink border-2 border-[#81d4ad] font-semibold";
                  } else if (isSelected) {
                    itemStyle =
                      "bg-[#ffd3cc] text-ink border-2 border-[#ff9180] font-semibold";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isChecked}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full p-4 rounded-2xl text-left text-base transition-all cursor-pointer ${itemStyle}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            {!isChecked ? (
              <button
                type="button"
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
                disabled={selectedOption === null || checking}
                onClick={() => void handleCheck()}>
                {checking ? "Проверяю…" : "Проверить"}
              </button>
            ) : (
              <div
                className={`-mx-6 -mb-6 p-6 rounded-b-3xl grid gap-3 transition-all ${
                  answer?.is_correct ? "bg-[#bde8d3]" : "bg-[#ffd3cc]"
                }`}>
                <div>
                  <h4
                    className={`m-0 text-lg font-bold ${
                      answer?.is_correct ? "text-emerald-900" : "text-red-900"
                    }`}>
                    {answer?.is_correct ? "Верно!" : "Почти!"}
                  </h4>
                  <p
                    className={`m-0 text-sm mt-0.5 ${
                      answer?.is_correct ? "text-emerald-800" : "text-red-800"
                    }`}>
                    {answer?.is_correct ? (
                      "Так держать."
                    ) : (
                      <>
                        Правильный ответ:{" "}
                        <strong>{answer?.correct_option}</strong>. Запомним и
                        вернёмся.
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className={`w-full py-4 rounded-2xl font-bold text-center text-white transition-all shadow-md cursor-pointer border-0 ${
                    answer?.is_correct
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                  disabled={checking}
                  onClick={() => void handleNext()}>
                  {checking
                    ? "Завершаю…"
                    : isGameOver
                      ? "Завершить"
                      : isLastQuestion
                        ? "Посмотреть результат"
                        : "Дальше"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === "result" && result && (
        <div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md text-center">
          <div className="pt-6">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              {result.language_title} · Junior
            </span>

            <div className="text-6xl font-bold text-emerald-600 my-4 tracking-tight">
              {result.correct_count}/{result.total}
            </div>

            <h3 className="m-0 text-xl font-bold text-ink mb-2">
              {result.correct_count >= result.total * 0.7
                ? "Уверенный результат. Навыки соответствуют ожиданиям."
                : "Требуется дополнительная подготовка по ряду тем."}
            </h3>

            <p className="m-0 text-sm text-muted">Остаток жизней: ♥ {result.lives}</p>
          </div>

          <div className="grid gap-3 pb-4">
            <button
              type="button"
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center transition-all shadow-md cursor-pointer border-0"
              onClick={() => void handleStart()}>
              Пройти тест ещё раз
            </button>

            {wrongQuestions.length > 0 ? (
              <button
                type="button"
                className="w-full py-4 rounded-2xl bg-transparent hover:bg-black/5 text-ink font-bold text-center transition-all cursor-pointer border-2 border-ink"
                onClick={() => setScreen("review")}>
                Разобрать ошибки ({wrongQuestions.length})
              </button>
            ) : null}

            <div className="pt-2">
              <button
                type="button"
                className="text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent"
                onClick={() => setScreen("start")}>
                На главную
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "review" && result && (
        <div className="relative flex flex-col justify-between min-h-[580px] bg-[#f5f3ef] p-6 rounded-3xl text-ink shadow-md">
          <div className="grid gap-4">
            <div>
              <button
                type="button"
                className="text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent p-0 mb-2"
                onClick={() => setScreen("result")}>
                ← К результату
              </button>
              <h2 className="m-0 text-xl font-bold text-ink">Разбор ошибок</h2>
              <p className="m-0 text-sm text-muted mt-1">
                Анализ допущенных неточностей для закрепления материала.
              </p>
            </div>

            <div className="grid gap-4 pt-2">
              {wrongQuestions.map((question, index) => (
                <div
                  key={`${question.question}-${index}`}
                  className="grid gap-2 bg-white rounded-2xl p-4 shadow-sm border border-[#e5e2dc]">
                  <div className="font-bold text-base text-ink mb-1">
                    {question.question}
                  </div>
                  <div className="bg-[#ffd3cc] text-red-900 font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                    <span>✕</span> Твой ответ:{" "}
                    {question.options[question.selected_index]}
                  </div>
                  <div className="bg-[#bde8d3] text-emerald-900 font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                    <span>✓</span> Верно: {question.correct_option}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              className="w-full py-4 rounded-2xl bg-transparent hover:bg-black/5 text-ink font-bold text-center transition-all cursor-pointer border-2 border-ink"
              onClick={() => void handleStart()}>
              Пройти другой тест
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
