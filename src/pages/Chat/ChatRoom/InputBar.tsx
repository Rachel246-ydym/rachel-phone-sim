import { useState, type KeyboardEvent } from 'react'

interface InputBarProps {
  disabled: boolean
  onSend: (text: string) => void
}

export default function InputBar({ disabled, onSend }: InputBarProps) {
  const [text, setText] = useState('')

  function submit() {
    if (disabled || !text.trim()) return
    onSend(text)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-room__input-bar">
      <textarea
        className="chat-room__input"
        value={text}
        rows={1}
        placeholder="发消息…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="chat-room__send"
        onClick={submit}
        disabled={disabled || !text.trim()}
      >
        发送
      </button>
    </div>
  )
}
