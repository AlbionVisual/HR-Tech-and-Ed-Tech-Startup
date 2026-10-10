export type PageId = 'tests' | 'resume' | 'interview' | 'profile'

export const appConfig = {
  pages: [
    { id: 'tests' as const, title: 'Тесты' },
    { id: 'resume' as const, title: 'Резюме' },
    { id: 'interview' as const, title: 'Интервью' },
    { id: 'profile' as const, title: 'Профиль' },
  ],
  defaultPage: 'interview' as PageId,
}
