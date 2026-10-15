import { config, defaultVoiceForTts } from '../config'
import { getByokKey } from '../ai/byok'
import {
  estimateMp3Seconds,
  estimatePcm16Seconds,
  sniffHeadHex,
  ttsDebug,
} from './ttsDebug'

function readErrorMessage(body: string, status: number) {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string } | string
      code?: string
      allowed_voices?: string[]
    }
    const msg =
      typeof json.error === 'string'
        ? json.error
        : json.error?.message || ''
    if (msg) {
      if (json.allowed_voices?.length) {
        return `${msg} (выберите голос из списка)`
      }
      return msg
    }
  } catch {
    // keep raw
  }
  const trimmed = body.trim()
  if (trimmed) return trimmed.slice(0, 240)
  if (status === 502 || status === 503 || status === 500) {
    return `AIAI TTS временно недоступен (${status}). Попробуйте ещё раз или другую модель.`
  }
  return `AIAI TTS error ${status}`
}

function sniffAudioMime(buf: ArrayBuffer): string | null {
  const u8 = new Uint8Array(buf)
  if (u8.length < 12) return null

  if (
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x41 &&
    u8[10] === 0x56 &&
    u8[11] === 0x45
  ) {
    return 'audio/wav'
  }

  if (u8[0] === 0x4f && u8[1] === 0x67 && u8[2] === 0x67 && u8[3] === 0x53) {
    return 'audio/ogg'
  }

  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) return 'audio/mpeg'
  if (u8[0] === 0xff && (u8[1] & 0xe0) === 0xe0) return 'audio/mpeg'

  if (
    u8[4] === 0x66 &&
    u8[5] === 0x74 &&
    u8[6] === 0x79 &&
    u8[7] === 0x70
  ) {
    return 'audio/mp4'
  }

  if (
    u8[0] === 0x66 &&
    u8[1] === 0x4c &&
    u8[2] === 0x61 &&
    u8[3] === 0x43
  ) {
    return 'audio/flac'
  }

  const head = String.fromCharCode(...u8.slice(0, Math.min(u8.length, 32)))
  if (head.trimStart().startsWith('{') || head.trimStart().startsWith('<')) {
    return null
  }

  return null
}

function normalizeMime(header: string | null, buf: ArrayBuffer) {
  const sniffed = sniffAudioMime(buf)
  if (sniffed) return sniffed
  const raw = (header || '').split(';')[0].trim().toLowerCase()
  if (raw.startsWith('audio/')) return raw
  return 'audio/mpeg'
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function requestSpeech(
  apiKey: string,
  model: string,
  text: string,
  voice: string,
  format: 'mp3' | 'wav' | 'pcm' | null,
): Promise<Response> {
  const body: Record<string, string> = {
    model,
    input: text,
    voice,
  }
  if (format) body.response_format = format

  return fetch(`${config.ai.aiai.baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg, audio/wav, audio/*, */*',
    },
    body: JSON.stringify(body),
  })
}

export async function fetchAiaiTtsBlob(
  text: string,
  model = config.speech.aiai.defaultModel,
  voice = defaultVoiceForTts('aiai', model),
): Promise<Blob> {
  const apiKey = getByokKey('aiai')
  if (!apiKey) {
    throw new Error('Для AIAI TTS нужен ключ AIAI.BY в Профиле')
  }

  // mp3 по умолчанию у OpenAI-совместимых; wav/pcm ближе к «gemini-like»
  const formats: Array<'mp3' | 'wav' | 'pcm' | null> = ['mp3', null, 'wav', 'pcm']
  let lastStatus = 0
  let lastBody = ''

  ttsDebug('aiai.fetch.begin', {
    model,
    voice,
    textLen: text.length,
    textPreview: text.slice(0, 80),
  })

  for (let attempt = 0; attempt < 4; attempt++) {
    const format = formats[Math.min(attempt, formats.length - 1)]
    ttsDebug('aiai.fetch.attempt', { attempt, response_format: format })
    const res = await requestSpeech(apiKey, model, text, voice, format)

    if (res.ok) {
      const buf = await res.arrayBuffer()
      const headerCt = res.headers.get('content-type')
      const sniffed = sniffAudioMime(buf)
      ttsDebug('aiai.fetch.ok', {
        attempt,
        response_format: format,
        status: res.status,
        headerContentType: headerCt,
        sniffedMime: sniffed,
        bytes: buf.byteLength,
        headHex: sniffHeadHex(buf),
        estMp3Sec128k: Number(estimateMp3Seconds(buf.byteLength).toFixed(3)),
        estPcm16Sec24k: Number(estimatePcm16Seconds(buf.byteLength).toFixed(3)),
      })

      if (buf.byteLength < 64) {
        throw new Error('AIAI TTS: пустой или слишком короткий аудиоответ')
      }

      const mime = normalizeMime(headerCt, buf)
      if (!sniffed) {
        const head = new TextDecoder().decode(buf.slice(0, 80)).trimStart()
        if (head.startsWith('{')) {
          throw new Error(readErrorMessage(head, res.status))
        }
        if (format === 'pcm' || headerCt?.includes('pcm')) {
          ttsDebug('aiai.fetch.rawPcmSuspect', {
            bytes: buf.byteLength,
            headerContentType: headerCt,
          }, 'warn')
        }
      }

      return new Blob([buf], { type: mime })
    }

    lastStatus = res.status
    lastBody = await res.text().catch(() => '')
    ttsDebug(
      'aiai.fetch.fail',
      {
        attempt,
        response_format: format,
        status: lastStatus,
        bodyPreview: lastBody.slice(0, 160),
      },
      'warn',
    )

    if (res.status === 400) continue

    if (res.status === 502 || res.status === 503 || res.status === 500) {
      await sleep(400 * (attempt + 1))
      continue
    }

    throw new Error(readErrorMessage(lastBody, lastStatus))
  }

  throw new Error(readErrorMessage(lastBody, lastStatus))
}
