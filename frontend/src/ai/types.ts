export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: Exclude<ChatRole, 'system'>
  content: string
}

export type StreamEvent =
  | { type: 'thinking' }
  | { type: 'thought'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type ChatStreamInput = {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  apiKey?: string
  model?: string
}
