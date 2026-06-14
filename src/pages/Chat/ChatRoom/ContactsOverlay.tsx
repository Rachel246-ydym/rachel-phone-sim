import type { Character } from '../../../types'

interface ContactsOverlayProps {
  open: boolean
  characters: Character[]
  activeCharacterId: string | null
  onClose: () => void
  onSelect: (id: string) => void
  onNewChar: () => void
}

export default function ContactsOverlay({
  open,
  characters,
  activeCharacterId,
  onClose,
  onSelect,
  onNewChar,
}: ContactsOverlayProps) {
  if (!open) return null

  return (
    <div className="contacts-overlay">
      <div className="contacts-overlay__mask" onClick={onClose} />
      <div className="contacts-overlay__sheet">
        <div className="contacts-overlay__header">
          <h2 className="contacts-overlay__title">联络人</h2>
          <button className="contacts-overlay__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        {characters.length === 0 ? (
          <p className="contacts-overlay__empty">还没有角色，点击下方 ＋ 创建</p>
        ) : (
          <ul className="contacts-overlay__list">
            {characters.map((c) => (
              <li key={c.id}>
                <button
                  className={`contacts-overlay__item${c.id === activeCharacterId ? ' contacts-overlay__item--active' : ''}`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="contacts-overlay__avatar">
                    {c.avatar ? <img src={c.avatar} alt={c.name} /> : c.name.slice(0, 1)}
                  </span>
                  <span className="contacts-overlay__info">
                    <span className="contacts-overlay__name">{c.name}</span>
                    {c.online && <span className="contacts-overlay__online" aria-label="在线" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="contacts-overlay__footer">
          <button className="contacts-overlay__add" onClick={onNewChar}>
            ＋ 新建角色
          </button>
          <button className="contacts-overlay__group" disabled>
            创建群组（即将推出）
          </button>
        </div>
      </div>
    </div>
  )
}
