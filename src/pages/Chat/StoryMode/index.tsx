import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppState } from '../../../store/AppContext'
import StoryList from './StoryList'
import StoryReader from './StoryReader'
import './StoryMode.css'

// 线下剧情模式入口：故事列表 ⇄ 故事阅读/互动页
export default function StoryMode({ onBack }: { onBack: () => void }) {
  const { characters, activeCharacterId } = useAppState()
  const [storyId, setStoryId] = useState<string | null>(null)
  const character = characters.find((c) => c.id === activeCharacterId) ?? null

  if (!character) {
    return (
      <SubPage title="线下剧情" onBack={onBack}>
        <p className="story-mode__missing">未选择角色，请先从聊天列表进入角色</p>
      </SubPage>
    )
  }

  if (storyId) {
    return <StoryReader character={character} storyId={storyId} onBack={() => setStoryId(null)} />
  }
  return <StoryList character={character} onBack={onBack} onOpen={setStoryId} />
}
