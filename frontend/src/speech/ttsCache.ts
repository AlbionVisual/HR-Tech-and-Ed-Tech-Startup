const cache = new Map<string, Blob>()

export function ttsCacheKey(input: {
  provider: string
  model: string
  voice: string
  text: string
}) {
  return `${input.provider}|${input.model}|${input.voice}|${input.text}`
}

export function getCachedTts(key: string) {
  return cache.get(key)
}

export function setCachedTts(key: string, blob: Blob) {
  cache.set(key, blob)
}

export function clearCachedTts(key: string) {
  cache.delete(key)
}
