export function humanizeAiError(status: number, body: string) {
  const lower = body.toLowerCase()
  const quota =
    status === 429 ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')

  if (quota) {
    return 'Лимит запросов исчерпан или слишком частые вызовы. Подождите и попробуйте снова.'
  }

  if (status === 401 || status === 403) {
    return 'Ключ отклонён или нет доступа к модели. Проверьте API-ключ в Профиле.'
  }

  if (status === 402) {
    return 'Недостаточно кредитов на OpenRouter (402). Пополните баланс или выберите :free модель.'
  }

  if (status === 404) {
    return 'Модель не найдена. Проверьте название модели в config.'
  }

  try {
    const json = JSON.parse(body) as { error?: { message?: string } }
    if (json.error?.message) return json.error.message
  } catch {
    // keep raw
  }

  const trimmed = body.trim()
  if (trimmed) return trimmed.slice(0, 500)
  return `Ошибка API (${status || '?'})`
}
