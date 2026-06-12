import type { Character, Message } from '../../types'

export type ChatAction =
  | { type: 'chat/setCharacters'; characters: Character[] }
  | { type: 'chat/upsertCharacter'; character: Character }
  | { type: 'chat/removeCharacter'; characterId: string }
  | { type: 'chat/setActiveCharacter'; characterId: string | null }
  | { type: 'chat/setMessages'; messages: Message[] }
  | { type: 'chat/appendMessage'; message: Message }
