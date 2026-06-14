import type { Character } from '../../../types'

interface ChatTopBarProps {
  character: Character
  onContactsOpen: () => void
  onAvatarClick: () => void
  onStory: () => void
  onSearch: () => void
  onMenu: () => void
}

export default function ChatTopBar({
  character,
  onContactsOpen,
  onAvatarClick,
  onStory,
  onSearch,
  onMenu,
}: ChatTopBarProps) {
  return (
    <header className="chat-topbar">
      <div className="chat-topbar__left">
        <button className="chat-topbar__back" onClick={onContactsOpen} aria-label="联络人">
          ‹
        </button>
        <button className="chat-topbar__char" onClick={onAvatarClick} aria-label="角色信息">
          <span className="chat-topbar__avatar">
            {character.avatar ? (
              <img src={character.avatar} alt={character.name} />
            ) : (
              character.name.slice(0, 1)
            )}
          </span>
          <span className="chat-topbar__name">{character.name}</span>
          {character.online && <span className="chat-topbar__online" aria-label="在线" />}
        </button>
      </div>
      <div className="chat-topbar__right">
        <button className="chat-topbar__btn chat-topbar__btn--text" onClick={onStory}>
          线下
        </button>
        <button className="chat-topbar__btn" onClick={onSearch} aria-label="搜索">
          🔍
        </button>
        <button className="chat-topbar__btn" onClick={onMenu} aria-label="菜单">
          ☰
        </button>
      </div>
    </header>
  )
}
