import { useEffect, useState } from 'react'
import type { Character, Memory } from '../../types'
import { listMemories } from '../../services/memory'

const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function hourToColor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'var(--emotion-warm)'
  if (hour >= 12 && hour < 18) return 'var(--emotion-calm)'
  if (hour >= 18 && hour < 23) return 'var(--emotion-deep)'
  return 'var(--emotion-cool)'
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${MON_SHORT[d.getMonth()]} ${d.getDate()}`
}

interface RecentListProps {
  character: Character | null
  onOpenMemory?: () => void
}

export default function RecentList({ character, onOpenMemory }: RecentListProps) {
  const [items, setItems] = useState<Memory[]>([])

  useEffect(() => {
    if (!character) { setItems([]); return }
    listMemories(character.id).then((mems) => setItems(mems.slice(0, 5)))
  }, [character?.id])

  return (
    <div className="recent-list">
      <div className="recent-list__title">RECENT</div>
      {items.length === 0 ? (
        <div className="recent-list__empty">
          还没有记忆，开始和{character ? ` ${character.name} ` : ''}聊天吧
        </div>
      ) : (
        items.map((item, i) => {
          const hour = new Date(item.createdAt).getHours()
          const color = hourToColor(hour)
          const title = item.title?.trim() || item.content.slice(0, 10)
          return (
            <div
              key={item.id}
              className={`recent-list__item${i < items.length - 1 ? ' recent-list__item--bordered' : ''}`}
              onClick={onOpenMemory}
              role={onOpenMemory ? 'button' : undefined}
              style={onOpenMemory ? { cursor: 'pointer' } : undefined}
            >
              <span className="recent-list__dot" style={{ backgroundColor: color }} />
              <span className="recent-list__text">{title}</span>
              <span className="recent-list__date">{formatDate(item.createdAt)}</span>
            </div>
          )
        })
      )}
    </div>
  )
}
