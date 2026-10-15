import { config, defaultVoiceForTts } from '../config'
import { getByokKey } from '../ai/byok'
import { estimatePcm16Seconds, sniffHeadHex, ttsDebug } from './ttsDebug'

function pcmToWav(pcm: Uint8Array, sampleRate = 24000) {
  const buffer = new ArrayBuffer(44 + pcm.length)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, pcm.length, true)
  new Uint8Array(buffer, 44).set(pcm)
  return buffer
}

export async function fetchGeminiTtsBlob(
  text: string,
  model = config.speech.gemini.defaultModel,
  voice = defaultVoiceForTts('gemini', model),
): Promise<Blob> {
  const apiKey = getByokKey('gemini')
  if (!apiKey) {
    throw new Error('Для Gemini TTS нужен ключ Gemini в Профиле')
  }

  const url =
    `${config.ai.gemini.directBaseUrl}/models/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body.slice(0, 240) || `Gemini TTS error ${res.status}`)
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] }
    }[]
  }
  const inline = json.candidates?.[0]?.content?.parts?.[0]?.inlineData
  if (!inline?.data) throw new Error('Gemini TTS: пустой аудиоответ')

  const raw = Uint8Array.from(atob(inline.data), (c) => c.charCodeAt(0))
  const mime = inline.mimeType || ''
  ttsDebug('gemini.fetch.ok', {
    model,
    voice,
    textLen: text.length,
    inlineMime: mime,
    rawBytes: raw.byteLength,
    headHex: sniffHeadHex(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)),
    estPcm16Sec24k: Number(estimatePcm16Seconds(raw.byteLength).toFixed(3)),
  })

  if (mime.includes('wav') || mime.includes('mpeg') || mime.includes('mp3')) {
    ttsDebug('gemini.fetch.blob', { path: 'as-is', type: mime || 'audio/wav' })
    return new Blob([raw], { type: mime || 'audio/wav' })
  }
  const wav = pcmToWav(raw)
  ttsDebug('gemini.fetch.blob', {
    path: 'pcmToWav',
    type: 'audio/wav',
    wavBytes: wav.byteLength,
  })
  return new Blob([wav], { type: 'audio/wav' })
}
