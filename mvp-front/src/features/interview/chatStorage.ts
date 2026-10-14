import type { ChatMessage } from '../../ai/types'
import type { VacancyContext } from '../../config'
import type { InterviewMode, InterviewPhase } from './useInterviewSession'

// Ключ для списка всех чатов
const CHATS_STORAGE_KEY = 'mvp.interview.chats'
// Префикс для данных конкретного чата
const CHAT_DATA_PREFIX = 'mvp.interview.chat.'

// Ключ для "последнего открытого чата" (выживает после перезагрузки)
const LAST_CHAT_KEY = 'mvp.interview.lastChatId'

// Событие для синхронизации компонентов (как AI_SETTINGS_EVENT)
export const INTERVIEW_CHATS_EVENT = 'mvp-interview-chats'

export interface ChatMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  lastMessage: string
  mode: InterviewMode
  phase: InterviewPhase
  progress: number
}

export interface ChatSnapshot {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  mode: InterviewMode
  phase: InterviewPhase
  vacancy: VacancyContext | null
  messages: ChatMessage[]
  progress: number
}

function safeLocalStorage(): Storage | null {
  try {
    return localStorage
  } catch {
    return null
  }
}

// Уведомление о изменениях (другие компоненты подписываются на это)
export function notifyChatsChanged() {
  window.dispatchEvent(new Event(INTERVIEW_CHATS_EVENT))
}

// Получить список всех чатов (отсортированных по updatedAt, новые сверху)
export function listChats(): ChatMeta[] {
  const ls = safeLocalStorage()
  if (!ls) return []
  try {
    const raw = ls.getItem(CHATS_STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as ChatMeta[]
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

// Получить полные данные одного чата по id
export function getChat(id: string): ChatSnapshot | null {
  const ls = safeLocalStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(`${CHAT_DATA_PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw) as ChatSnapshot
  } catch {
    return null
  }
}

// Сохранить чат (полные данные + обновить метаданные в списке)
export function saveChat(snapshot: ChatSnapshot) {
  const ls = safeLocalStorage()
  if (!ls) return

  try {
    // Сохраняем полные данные
    ls.setItem(`${CHAT_DATA_PREFIX}${snapshot.id}`, JSON.stringify(snapshot))
  } catch {
    // игнорируем ошибки (напр. quota exceeded)
  }

  try {
    // Обновляем список метаданных
    let chats = listChats()
    const existingIndex = chats.findIndex((c) => c.id === snapshot.id)
    const meta: ChatMeta = {
      id: snapshot.id,
      title: snapshot.title,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      lastMessage:
        snapshot.messages.length > 0
          ? snapshot.messages[snapshot.messages.length - 1].content
          : '',
      mode: snapshot.mode,
      phase: snapshot.phase,
      progress: snapshot.progress,
    }
    if (existingIndex >= 0) {
      chats[existingIndex] = meta
    } else {
      chats.unshift(meta) // новые сверху
      // Ограничиваем количество чатов
      const MAX = 50
      if (chats.length > MAX) {
        const toRemove = chats.slice(MAX)
        for (const c of toRemove) {
          ls.removeItem(`${CHAT_DATA_PREFIX}${c.id}`)
        }
        chats = chats.slice(0, MAX)
      }
    }
    ls.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
  } catch {
    // игнорируем
  }

  notifyChatsChanged()
}

// Удалить один чат
export function deleteChat(id: string) {
  const ls = safeLocalStorage()
  if (!ls) return
  try {
    ls.removeItem(`${CHAT_DATA_PREFIX}${id}`)
    const chats = listChats().filter((c) => c.id !== id)
    ls.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
  } catch {
    // игнорируем
  }
  notifyChatsChanged()
}

// Создать новую запись чата (без сохранения пока)
export function createChatRecord(
  mode: InterviewMode,
  vacancy: VacancyContext | null,
): ChatSnapshot {
  const now = Date.now()
  const title = mode === 'practice' ? 'Тренировка' : `Вакансия: ${vacancy?.company ?? ''}`
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 10)}`,
    title,
    createdAt: now,
    updatedAt: now,
    mode,
    phase: 'idle',
    vacancy,
    messages: [],
    progress: 0,
  }
}

// Сохранить ID последнего открытого чата (выживает после refresh)
export function setLastChatId(id: string | null) {
  const ls = safeLocalStorage()
  if (!ls) return
  try {
    if (id) {
      ls.setItem(LAST_CHAT_KEY, id)
    } else {
      ls.removeItem(LAST_CHAT_KEY)
    }
  } catch {
    // игнорируем
  }
}

// Получить ID последнего открытого чата
export function getLastChatId(): string | null {
  const ls = safeLocalStorage()
  if (!ls) return null
  try {
    return ls.getItem(LAST_CHAT_KEY)
  } catch {
    return null
  }
}
