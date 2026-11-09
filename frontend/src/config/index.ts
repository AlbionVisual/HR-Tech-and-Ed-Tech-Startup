import { appConfig, publicUrl } from './app'
import {
  aiConfig,
  formatModelOptionLabel,
  getModelLabel,
  getProviderDefaultModel,
  getProviderModelDefs,
  getProviderModels,
  providerLabels,
} from './ai'
import { promptsConfig } from './prompts'
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
  prompts: promptsConfig,
  speech: speechConfig,
} as const

export {
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
export type { VacancyGrade, VacancyContext } from './prompts'
export type { TtsModelDef, TtsModelOption, TtsProviderId } from './speech'
