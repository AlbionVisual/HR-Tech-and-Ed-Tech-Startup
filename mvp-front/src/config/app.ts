export type PageId = 'tests' | 'resume' | 'interview' | 'profile'

export const appConfig = {
  pages: [
    { id: 'tests' as const, title: 'Тесты' },
    { id: 'resume' as const, title: 'Резюме' },
    { id: 'interview' as const, title: 'Интервью' },
    { id: 'profile' as const, title: 'Профиль' },
  ],
  defaultPage: 'interview' as PageId,
  interview: {
    chats: {
      storageKey: 'mvp.interview.chats',
      maxChats: 50,
    },
  },
}

/** Путь к файлу из public/ с учётом Vite base (GitHub Pages). */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}
