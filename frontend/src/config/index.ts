import { apiBaseUrl, appConfig, publicUrl } from './app'
import {
  aiConfig,
  formatModelOptionLabel,
  getModelLabel,
  getProviderDefaultModel,
  getProviderModelDefs,
  getProviderModels,
  providerLabels,
} from './ai'
import {
  defaultVoiceForTts,
  findTtsModelDef,
  formatTtsOptionLabel,
  makeTtsId,
  parseTtsId,
  speechConfig,
  ttsProviderLabels,
  voicesForTts,
} from './speech'

export const config = {
  app: appConfig,
  ai: aiConfig,
  speech: speechConfig,
} as const

export {
  apiBaseUrl,
  defaultVoiceForTts,
  findTtsModelDef,
  formatModelOptionLabel,
  formatTtsOptionLabel,
  getModelLabel,
  getProviderDefaultModel,
  getProviderModelDefs,
  getProviderModels,
  makeTtsId,
  parseTtsId,
  providerLabels,
  publicUrl,
  ttsProviderLabels,
  voicesForTts,
}
export type { PageId } from './app'
export type { AiModelDef, AiProviderId } from './ai'
export type { VacancyGrade, VacancyContext } from './vacancy'
export type { TtsModelDef, TtsModelOption, TtsProviderId } from './speech'
