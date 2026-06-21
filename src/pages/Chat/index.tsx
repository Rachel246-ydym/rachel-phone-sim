import { useState } from 'react'
import ChatRoom from './ChatRoom'
import StoryMode from './StoryMode'
import CharProfile from './CharProfile'
import MemoryCore from './MemoryCore'

export type ChatView = 'room' | 'story' | 'charProfile' | 'memoryCore'

interface ChatModuleProps {
  initialView?: ChatView
  onViewChange?: (view: ChatView) => void
}

export default function ChatModule({ initialView = 'room', onViewChange }: ChatModuleProps) {
  const [view, setView] = useState<ChatView>(initialView)

  function changeView(next: ChatView) {
    setView(next)
    onViewChange?.(next)
  }

  switch (view) {
    case 'room':
      return (
        <ChatRoom
          onOpenStory={() => changeView('story')}
          onOpenMemory={() => changeView('memoryCore')}
          onOpenCharProfile={() => changeView('charProfile')}
        />
      )
    case 'story':
      return <StoryMode onBack={() => changeView('room')} />
    case 'charProfile':
      return <CharProfile onBack={() => changeView('room')} />
    case 'memoryCore':
      return <MemoryCore onBack={() => changeView('room')} />
  }
}
