import { useState, useMemo } from 'react'
import type { Message } from '../../../types'

interface SearchOverlayProps {
  open: boolean
  messages: Message[]
  characterName: string
  onClose: () => void
}

export default function SearchOverlay({ open, messages, characterName, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [dateStr, setDateStr] = useState('')

  const results = useMemo(() => {
    if (!query && !dateStr) return []
    return messages.filter((m) => {
      const matchText = !query || m.content.toLowerCase().includes(query.toLowerCase())
      const matchDate =
        !dateStr || new Date(m.timestamp).toISOString().slice(0, 10) === dateStr
      return matchText && matchDate
    })
  }, [messages, query, dateStr])

  function handleClose() {
    setQuery('')
    setDateStr('')
    onClose()
  }

  return (
    <div className={`search-overlay${open ? ' search-overlay--open' : ''}`}>
      <div className="search-overlay__bar">
        <input
          className="search-overlay__input"
          placeholder="搜索聊天记录…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          className="search-overlay__date"
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          title="按日期筛选"
        />
        <button className="search-overlay__close" onClick={handleClose} aria-label="关闭搜索">
          ✕
        </button>
      </div>
      {(query || dateStr) && (
        <div className="search-overlay__results">
          {results.length === 0 ? (
            <p className="search-overlay__empty">无匹配结果</p>
          ) : (
            results.map((m) => (
              <div
                key={m.id}
                className={`search-overlay__item${m.role === 'user' ? ' search-overlay__item--user' : ''}`}
              >
                <span className="search-overlay__role">
                  {m.role === 'user' ? '我' : characterName}
                </span>
                <span className="search-overlay__content">{m.content}</span>
                <span className="search-overlay__time">
                  {new Date(m.timestamp).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
