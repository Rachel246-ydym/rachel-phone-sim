import { useCallback, useRef, useState, type KeyboardEvent } from 'react'

const INPUT_MAX_HEIGHT = 260

interface InputBarProps {
  disabled: boolean
  onSend: (text: string) => void
}

export default function InputBar({ disabled, onSend }: InputBarProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const newH = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)
    el.style.height = `${newH}px`
    el.style.overflowY = el.scrollHeight > INPUT_MAX_HEIGHT ? 'auto' : 'hidden'
  }, [])

  function submit() {
    if (disabled || !text.trim()) return
    onSend(text)
    setText('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.overflowY = 'hidden'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-room__input-bar">
      <button type="button" className="chat-room__gallery-btn" aria-label="图片">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="18" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2.5 15.5L7 11L10.5 14.5L13.5 11.5L19.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <textarea
        ref={inputRef}
        className="chat-room__input"
        value={text}
        rows={1}
        placeholder="写点什么..."
        onChange={(e) => { setText(e.target.value); autoResize() }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="chat-room__send"
        onClick={submit}
        disabled={disabled || !text.trim()}
        aria-label="发送"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
