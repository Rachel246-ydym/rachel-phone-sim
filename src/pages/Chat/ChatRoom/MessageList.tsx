import { useEffect, useRef, type ReactNode } from 'react'
import type { Character, Message } from '../../../types'

interface MessageListProps {
  messages: Message[]
  character: Character
  streamingText: string | null
  error: string | null
}

function renderContent(content: string, actionEnabled: boolean): ReactNode[] {
  return content.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      actionEnabled ? (
        <em key={i} className="chat-room__action">
          {part.slice(1, -1)}
        </em>
      ) : (
        <span key={i}>{part.slice(1, -1)}</span>
      )
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function Avatar({ character }: { character: Character }) {
  return (
    <span className="chat-room__avatar">
      {character.avatar ? (
        <img src={character.avatar} alt={character.name} />
      ) : (
        character.name.slice(0, 1)
      )}
    </span>
  )
}

export default function MessageList({
  messages,
  character,
  streamingText,
  error,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const actionEnabled = character.actionDescEnabled ?? true

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, streamingText])

  return (
    <div className="chat-room__messages" ref={listRef}>
      {messages.length === 0 && streamingText === null && (
        <p className="chat-room__empty">和 {character.name} 说点什么吧</p>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          className={`chat-room__row ${m.role === 'user' ? 'chat-room__row--user' : 'chat-room__row--char'}`}
        >
          {m.role === 'assistant' && <Avatar character={character} />}
          <div
            className={`chat-room__bubble ${m.role === 'user' ? 'chat-room__bubble--user' : 'chat-room__bubble--char'}`}
          >
            {renderContent(m.content, actionEnabled)}
          </div>
        </div>
      ))}
      {streamingText !== null && (
        <div className="chat-room__row chat-room__row--char">
          <Avatar character={character} />
          <div className="chat-room__bubble chat-room__bubble--char">
            {streamingText === '' ? (
              <span className="chat-room__typing">正在输入…</span>
            ) : (
              renderContent(streamingText, actionEnabled)
            )}
          </div>
        </div>
      )}
      {error && <p className="chat-room__error">{error}</p>}
    </div>
  )
}
