import { config } from '../../config'
import type { AiProvider } from './types'
import type { StreamEvent } from '../types'

const thoughts = [
  'Смотрю на контекст интервью и выбираю следующий шаг…\n',
  'Думаю, насколько глубоко копнуть в прошлый ответ…\n',
  'Сверяю грейд и формулирую понятный вопрос…\n',
  'Проверяю, не повторяю ли я уже заданное…\n',
]

const questions = [
  'Расскажите о самом сложном техническом решении за последний год. Что было на кону и чем закончилось?\n\n[[PROGRESS:PROGRESS_VALUE]]',
  'Как вы обычно разбираете падение продакшена ночью? Опишите шаги от алерта до фикса.\n\n[[PROGRESS:PROGRESS_VALUE]]',
  'Какой компромисс в архитектуре вы сознательно приняли и почему?\n\n[[PROGRESS:PROGRESS_VALUE]]',
]

const feedbacks = [
  'Хорошая структура ответа, но не хватает конкретики по метрикам и срокам. Добавьте цифры и итог для бизнеса.\n\n[[PROGRESS:PROGRESS_VALUE]]\n[[FEEDBACK]]',
  'Звучит уверенно. Усильте часть про риски и что сделали бы иначе — это любят на middle+.\n\n[[PROGRESS:PROGRESS_VALUE]]\n[[FEEDBACK]]',
  'Ок по смыслу. Не хватает связи «действие → результат». Допишите один измеримый эффект.\n\n[[PROGRESS:PROGRESS_VALUE]]\n[[FEEDBACK]]',
]

let progress = 0

export function resetMockProgress() {
  progress = 0
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function nextProgress() {
  progress = Math.min(100, progress + 25)
  return progress
}

function isQuestionTurn(messages: { role: string; content: string }[]) {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'user') return true
  if (last.content === config.prompts.firstUserKickoff) return true
  if (last.content.includes('следующий основной вопрос')) return true
  return false
}

export const mockProvider: AiProvider = {
  async *chatStream(input): AsyncGenerator<StreamEvent> {
    yield { type: 'thinking' }

    const thought = pick(thoughts)
    const chunks = thought.match(/.{1,24}/g) ?? [thought]
    const thinkMs = 2000 + Math.floor(Math.random() * 1000)
    const step = Math.max(80, Math.floor(thinkMs / chunks.length))
    for (const chunk of chunks) {
      await sleep(step)
      yield { type: 'thought', text: chunk }
    }

    const value = nextProgress()
    const raw = isQuestionTurn(input.messages)
      ? pick(questions)
      : pick(feedbacks)
    const answer = raw.replace('PROGRESS_VALUE', String(value))

    for (const piece of answer.match(/.{1,18}/g) ?? [answer]) {
      await sleep(28)
      yield { type: 'delta', text: piece }
    }
    yield { type: 'done' }
  },
}
