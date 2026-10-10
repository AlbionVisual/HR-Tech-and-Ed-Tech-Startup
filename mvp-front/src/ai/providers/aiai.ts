import type { AiProvider } from './types'

export const aiaiProvider: AiProvider = {
  async *chatStream() {
    yield { type: 'thinking' }
    yield {
      type: 'error',
      message: 'Провайдер aiai ещё не подключён.',
    }
  },
}
