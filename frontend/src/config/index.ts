import { apiBaseUrl, appConfig, publicUrl } from './app'
import { aiConfig, providerLabels } from './ai'
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
  formatTtsOptionLabel,
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
