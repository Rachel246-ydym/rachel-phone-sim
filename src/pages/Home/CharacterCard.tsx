import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Character, HeartVoice } from '../../types'
import { getAll } from '../../services/storage'

interface CharacterCardProps {
  character: Character | null
  onClick: () => void
}

export default function CharacterCard({ character, onClick }: CharacterCardProps) {
  const [latestVoice, setLatestVoice] = useState<string | null>(null)

  useEffect(() => {
    if (!character) return
    getAll<HeartVoice>('heartVoices').then((voices) => {
      const sorted = voices
        .filter((v) => v.characterId === character.id)
        .sort((a, b) => b.createdAt - a.createdAt)
      setLatestVoice(sorted[0]?.content ?? null)
    })
  }, [character?.id])

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
              ? `${character.online ? '在线' : '离线'}${character.persona ? ` · ${character.persona.slice(0, 8)}` : ''}`
              : '添加角色开始聊天'}
          </div>
        </div>
        <ChevronRight size={16} strokeWidth={1.5} className="char-card__chevron" />
      </div>
      {latestVoice && (
        <div className="char-card__voice">
          <span className="char-card__voice-accent" />
          <span className="char-card__voice-text">「{latestVoice}」</span>
        </div>
      )}
    </div>
  )
}
