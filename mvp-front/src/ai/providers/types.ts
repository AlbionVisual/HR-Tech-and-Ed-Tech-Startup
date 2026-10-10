import type { ChatStreamInput, StreamEvent } from '../types'

export interface AiProvider {
  chatStream(input: ChatStreamInput): AsyncIterable<StreamEvent>
}
