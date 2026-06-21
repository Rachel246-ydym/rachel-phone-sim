import { ChevronRight } from 'lucide-react'
import type { Character } from '../../types'

interface CharacterCardProps {
  character: Character | null
  onClick: () => void
}

export default function CharacterCard({ character, onClick }: CharacterCardProps) {
  const initial = character?.name.slice(0, 1) ?? '?'

  return (
    <div className="char-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="char-card__row">
        <div className="char-card__avatar-wrap">
          {character?.avatar ? (
            <img src={character.avatar} alt={character.name} className="char-card__avatar-img" />
          ) : (
            <div className="char-card__avatar-initial">{initial}</div>
          )}
          <span className="char-card__online-dot" />
        </div>
        <div className="char-card__info">
          <div className="char-card__name">
            {character ? (character.nickname || character.name) : '暂无角色'}
          </div>
          <div className="char-card__status">
            {character
              ? (character.online ? '在线' : '离线')
              : '点击创建你的第一个角色'}
          </div>
        </div>
        <ChevronRight size={16} strokeWidth={1.5} className="char-card__chevron" />
      </div>
    </div>
  )
}
