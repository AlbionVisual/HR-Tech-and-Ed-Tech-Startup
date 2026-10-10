import { appConfig } from './app'
import {
  aiConfig,
  getProviderDefaultModel,
  getProviderModels,
} from './ai'
import { promptsConfig } from './prompts'

export const config = {
  app: appConfig,
  ai: aiConfig,
  prompts: promptsConfig,
} as const

export { getProviderDefaultModel, getProviderModels }
export type { PageId } from './app'
export type { AiProviderId } from './ai'
export type { VacancyGrade, VacancyContext } from './prompts'
