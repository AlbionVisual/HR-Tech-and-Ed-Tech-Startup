function* emitSseChunk(chunk: string): Generator<string> {
  const lines = chunk.split('\n')
  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (!trimmed.startsWith('data:')) continue
    const data = trimmed.slice(5).trimStart()
    if (!data || data === '[DONE]') continue
    yield data
  }
}

export async function* parseSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      yield* emitSseChunk(chunk)
    }
  }

  buffer += decoder.decode()
  const rest = buffer.trim()
  if (!rest) return

  if (rest.includes('data:')) {
    yield* emitSseChunk(rest)
    return
  }

  yield rest
}
