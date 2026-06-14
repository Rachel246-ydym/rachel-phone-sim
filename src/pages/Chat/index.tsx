import { useState } from 'react'
import ChatRoom from './ChatRoom'
import StoryMode from './StoryMode'
import CharProfile from './CharProfile'
import MemoryCore from './MemoryCore'

export type ChatView = 'room' | 'story' | 'charProfile' | 'memoryCore'

interface ChatModuleProps {
  initialView?: ChatView
}

export default function ChatModule({ initialView = 'room' }: ChatModuleProps) {
  const [view, setView] = useState<ChatView>(initialView)

  switch (view) {
    case 'room':
      return (
        <ChatRoom
          onOpenStory={() => setView('story')}
          onOpenMemory={() => setView('memoryCore')}
          onOpenCharProfile={() => setView('charProfile')}
        />
      )
    case 'story':
      return <StoryMode onBack={() => setView('room')} />
    case 'charProfile':
      return <CharProfile onBack={() => setView('room')} />
    case 'memoryCore':
      return <MemoryCore onBack={() => setView('room')} />
  }
}
