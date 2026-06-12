import { useAppDispatch, useAppState } from '../../../store/AppContext'
import type { ChatView } from '../index'
import './ChatList.css'

interface ChatListProps {
  onNavigate: (view: ChatView) => void
}

export default function ChatList({ onNavigate }: ChatListProps) {
  const { characters } = useAppState()
  const dispatch = useAppDispatch()

  function openRoom(characterId: string) {
    dispatch({ type: 'chat/setActiveCharacter', characterId })
    onNavigate('room')
  }

  return (
    <div className="chat-list">
      <header className="chat-list__header">
        <h1 className="chat-list__title">聊天</h1>
        <button
          className="chat-list__add"
          onClick={() => onNavigate('charProfile')}
          aria-label="角色档案"
        >
          ＋
        </button>
      </header>
      {characters.length === 0 ? (
        <div className="chat-list__empty">
          <p>还没有角色</p>
          <p className="chat-list__empty-hint">点击右上角 ＋ 创建角色（如：江浔）</p>
        </div>
      ) : (
        <ul className="chat-list__items">
          {characters.map((c) => (
            <li key={c.id}>
              <button className="chat-list__item" onClick={() => openRoom(c.id)}>
                <span className="chat-list__avatar">
                  {c.avatar ? <img src={c.avatar} alt={c.name} /> : c.name.slice(0, 1)}
                </span>
                <span className="chat-list__info">
                  <span className="chat-list__name">
                    {c.name}
                    {c.online && <span className="chat-list__online" aria-label="在线" />}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
