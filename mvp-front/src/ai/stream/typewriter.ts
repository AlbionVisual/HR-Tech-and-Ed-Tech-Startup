export async function* typewriter(
  text: string,
  options?: { chunkSize?: number; delayMs?: number },
): AsyncGenerator<string> {
  const chunkSize = options?.chunkSize ?? 3
  const delayMs = options?.delayMs ?? 16

  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize)
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}
