export type VacancyGrade = 'intern' | 'junior' | 'middle' | 'senior'

export type VacancyContext = {
  company: string
  grade: VacancyGrade
  description: string
}

export type AssistantMarkers = {
  content: string
  isFeedback: boolean
  progress: number | null
}

const gradeLabel: Record<VacancyGrade, string> = {
  intern: 'стажировка',
  junior: 'junior',
  middle: 'middle',
  senior: 'senior',
}

export const feedbackMarker = '[[FEEDBACK]]'
export const progressMarker = '[[PROGRESS:N]]'

function progressMarkerRe() {
  return /\[\[PROGRESS:\s*(\d{1,3})\s*\]\]/g
}

const sharedRules = [
  'Отвечай на русском, коротко и по делу.',
  'За один ход делай РОВНО одно из двух:',
  'A) Вопрос кандидату (основной или уточняющий). Тогда пиши только вопрос/короткий контекст+вопрос. НЕ ставь метку [[FEEDBACK]].',
  'B) Только отзыв на предыдущий ответ: что хорошо, чего не хватает, что добавить. БЕЗ нового вопроса. В самом конце отдельной строкой ровно: [[FEEDBACK]]',
  'Никогда не совмещай вопрос и [[FEEDBACK]] в одном сообщении.',
  'В первом сообщении интервью всегда вариант A без метки.',
  'Прогресс интервью (0–100): когда уместно, в конце сообщения отдельной строкой поставь метку вида [[PROGRESS:10]] (число — проценты). Можно вместе с вопросом или с [[FEEDBACK]]. Не пиши проценты в обычном тексте — только меткой.',
].join('\n')

export function parseAssistantMarkers(text: string): AssistantMarkers {
  let content = text
  let progress: number | null = null
  const progressRe = progressMarkerRe()

  const progressMatches = [...text.matchAll(progressRe)]
  if (progressMatches.length) {
    const raw = Number(progressMatches[progressMatches.length - 1][1])
    if (Number.isFinite(raw)) {
      progress = Math.max(0, Math.min(100, Math.round(raw)))
    }
    content = content.replace(progressMarkerRe(), '')
  }

  content = content.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')

  const trimmed = content.trim()
  let isFeedback = false

  if (trimmed.endsWith(feedbackMarker)) {
    content = trimmed.slice(0, -feedbackMarker.length).trim()
    isFeedback = true
  } else {
    const idx = trimmed.lastIndexOf(feedbackMarker)
    if (idx >= 0 && idx + feedbackMarker.length === trimmed.length) {
      content = trimmed.slice(0, idx).trim()
      isFeedback = true
    } else {
      content = trimmed
    }
  }

  if (isFeedback && /[?？]\s*$/.test(content)) {
    isFeedback = false
  }

  return { content, isFeedback, progress }
}

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
    'Начни интервью: коротко представься как интервьюер и задай первый вопрос. Без отзыва и без метки [[FEEDBACK]]. В конце добавь [[PROGRESS:5]].',
  feedbackMarker,
  progressMarker,
  parseAssistantMarkers,
  buildInterviewSystemPrompt,
}
