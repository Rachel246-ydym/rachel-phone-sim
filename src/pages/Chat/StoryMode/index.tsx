import { useEffect, useState } from 'react'
import { getAll } from '../../../services/storage'
import { useAppState } from '../../../store/AppContext'
import StoryReader from './StoryReader'
import type { Story } from '../../../types'
import './StoryMode.css'

export default function StoryMode({ onBack }: { onBack: () => void }) {
  const { characters, activeCharacterId } = useAppState()
  const character = characters.find((c) => c.id === activeCharacterId) ?? null
  // undefined = loading, null = no story, string = story id
  const [mainStoryId, setMainStoryId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!character) return
    void getAll<Story>('stories').then((all) => {
      const main = all.find(
        (s) => s.characterId === character.id && (s.storyType === 'main' || !s.storyType),
      )
      setMainStoryId(main?.id ?? null)
    })
  }, [character?.id])

  if (!character) {
    return (
      <div className="story-reader">
        <p className="story-mode__missing">未选择角色，请先从聊天列表进入角色</p>
      </div>
    )
  }

  if (mainStoryId === undefined) {
    return (
      <div className="story-reader">
        <p className="story-mode__missing">加载中…</p>
      </div>
    )
  }

  return (
    <StoryReader
      character={character}
      mainStoryId={mainStoryId}
      onMainStoryCreated={setMainStoryId}
      onBack={onBack}
    />
  )
}
