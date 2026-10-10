export type VacancyGrade = 'intern' | 'junior' | 'middle' | 'senior'

export type VacancyContext = {
  company: string
  grade: VacancyGrade
  description: string
}

const gradeLabel: Record<VacancyGrade, string> = {
  intern: 'стажировка',
  junior: 'junior',
  middle: 'middle',
  senior: 'senior',
}

const sharedRules = [
  'Отвечай на русском, коротко и по делу.',
  'За один ход делай РОВНО одно из двух:',
  'A) Вопрос кандидату (основной или уточняющий). Тогда пиши только вопрос/короткий контекст+вопрос. НЕ ставь метку [[FEEDBACK]].',
  'B) Только отзыв на предыдущий ответ: что хорошо, чего не хватает, что добавить. БЕЗ нового вопроса. В самом конце отдельной строкой ровно: [[FEEDBACK]]',
  'Никогда не совмещай вопрос и [[FEEDBACK]] в одном сообщении.',
  'В первом сообщении интервью всегда вариант A без метки.',
].join('\n')

export function buildInterviewSystemPrompt(input: {
  mode: 'vacancy' | 'practice'
  vacancy?: VacancyContext | null
}) {
  if (input.mode === 'practice') {
    return [
      'Ты — строгий, но доброжелательный интервьюер для подготовки к собеседованию.',
      sharedRules,
    ].join('\n')
  }

  const v = input.vacancy
  return [
    'Ты — интервьюер, имитирующий собеседование на конкретную вакансию.',
    `Компания: ${v?.company || 'не указана'}.`,
    `Грейд: ${v ? gradeLabel[v.grade] : 'не указан'}.`,
    'Описание вакансии:',
    v?.description || 'не указано',
    '',
    'Опирайся на описание вакансии и грейд.',
    sharedRules,
  ].join('\n')
}

export const promptsConfig = {
  firstUserKickoff:
    'Начни интервью: коротко представься как интервьюер и задай первый вопрос. Без отзыва и без метки [[FEEDBACK]].',
  feedbackMarker: '[[FEEDBACK]]',
  buildInterviewSystemPrompt,
}
