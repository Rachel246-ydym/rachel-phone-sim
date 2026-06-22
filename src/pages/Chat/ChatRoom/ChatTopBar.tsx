import type { Character } from '../../../types'

interface ChatTopBarProps {
  character: Character
  onGoHome: () => void
  onAvatarClick: () => void
  onStory: () => void
  onSearch: () => void
  onMenu: () => void
}

export default function ChatTopBar({
  character,
  onGoHome,
  onAvatarClick,
  onStory,
  onSearch,
  onMenu,
}: ChatTopBarProps) {
  return (
    <header className="chat-topbar">
      <div className="chat-topbar__left">
        <button className="chat-topbar__back" onClick={onGoHome} aria-label="返回主页">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="chat-topbar__char" onClick={onAvatarClick} aria-label="角色信息">
          <span className="chat-topbar__avatar-wrap">
            <span className="chat-topbar__avatar">
              {character.avatar ? (
                <img src={character.avatar} alt={character.name} />
              ) : (
                character.name.slice(0, 1)
              )}
            </span>
            {character.online && <span className="chat-topbar__online" aria-label="在线" />}
          </span>
          <span className="chat-topbar__info">
            <span className="chat-topbar__name">{character.name}</span>
            {character.online && <span className="chat-topbar__status">在线</span>}
          </span>
        </button>
      </div>
      <div className="chat-topbar__right">
        <button className="chat-topbar__btn chat-topbar__btn--text" onClick={onStory}>
          线下
        </button>
        <button className="chat-topbar__btn" onClick={onSearch} aria-label="搜索">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="chat-topbar__btn" onClick={onMenu} aria-label="菜单">
          <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
            <circle cx="2" cy="2" r="1.6" fill="currentColor"/>
            <circle cx="2" cy="8" r="1.6" fill="currentColor"/>
            <circle cx="2" cy="14" r="1.6" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
