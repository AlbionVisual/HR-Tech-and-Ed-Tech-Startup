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
  | { type: 'progress'; value: number }
  | { type: 'feedback' }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type ChatRequest = {
  task: 'interview' | 'resume'
  mode: string
  vacancy?: { company: string; grade: string; description: string } | null
  messages: { role: 'user' | 'assistant'; content: string }[]
  provider?: string
  model?: string
  signal?: AbortSignal
}
