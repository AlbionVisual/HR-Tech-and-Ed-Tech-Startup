export const AI_SETTINGS_EVENT = 'mvp-ai-settings'

export function notifyAiSettingsChanged() {
  window.dispatchEvent(new Event(AI_SETTINGS_EVENT))
}
