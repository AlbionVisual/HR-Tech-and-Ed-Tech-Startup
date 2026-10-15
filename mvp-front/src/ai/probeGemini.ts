import { config } from '../config'
import { getByokKey } from './byok'

export type GeminiProbeResult =
  | { ok: true }
  | { ok: false; reason: 'no_key' | 'blocked' | 'network' | 'error'; message: string }

const TELEPORT =
  'Похоже, Gemini из этой сети недоступен. Попробуйте «телепортироваться в другую страну» (VPN) и обновить страницу.'

let last: { at: number; result: GeminiProbeResult } | null = null
const TTL_MS = 60_000

export function geminiProbeMessage(result: GeminiProbeResult) {
  if (result.ok) return ''
  return result.message
}

export async function probeGeminiAccess(force = false): Promise<GeminiProbeResult> {
  if (!force && last && Date.now() - last.at < TTL_MS) return last.result

  const apiKey = getByokKey('gemini')
  if (!apiKey) {
    const result: GeminiProbeResult = {
      ok: false,
      reason: 'no_key',
      message: 'Нет ключа Gemini в Профиле',
    }
    last = { at: Date.now(), result }
    return result
  }

  const model = config.ai.gemini.defaultModel
  const url =
    `${config.ai.gemini.directBaseUrl}/models/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1, temperature: 0 },
      }),
    })

    if (res.ok) {
      const result: GeminiProbeResult = { ok: true }
      last = { at: Date.now(), result }
      return result
    }

    const body = await res.text().catch(() => '')
    const lower = body.toLowerCase()
    const blocked =
      lower.includes('user location') ||
      lower.includes('location is not supported') ||
      lower.includes('failed_precondition') ||
      (res.status === 403 && lower.includes('location')) ||
      (lower.includes('region') && lower.includes('not'))

    const result: GeminiProbeResult = {
      ok: false,
      reason: blocked ? 'blocked' : 'error',
      message: blocked
        ? TELEPORT
        : `Gemini недоступен (${res.status}). ${TELEPORT}`,
    }
    last = { at: Date.now(), result }
    return result
  } catch {
    const result: GeminiProbeResult = {
      ok: false,
      reason: 'network',
      message: `Сеть до Gemini не отвечает. ${TELEPORT}`,
    }
    last = { at: Date.now(), result }
    return result
  }
}
