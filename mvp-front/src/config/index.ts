import { appConfig, publicUrl } from './app'
import {
  aiConfig,
  getProviderDefaultModel,
  getProviderModels,
} from './ai'
import { promptsConfig } from './prompts'
import {
  defaultVoiceForTts,
  findTtsModelDef,
  makeTtsId,
  parseTtsId,
  speechConfig,
  voicesForTts,
} from './speech'

export const config = {
  app: appConfig,
  ai: aiConfig,
  prompts: promptsConfig,
  speech: speechConfig,
} as const

export {
  defaultVoiceForTts,
  findTtsModelDef,
  getProviderDefaultModel,
  getProviderModels,
  makeTtsId,
  parseTtsId,
  publicUrl,
  voicesForTts,
}
export type { PageId } from './app'
export type { AiProviderId } from './ai'
export type { VacancyGrade, VacancyContext } from './prompts'
export type { TtsModelDef, TtsModelOption, TtsProviderId } from './speech'
