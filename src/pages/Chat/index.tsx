import { useState } from 'react'
import ChatList from './ChatList'
import ChatRoom from './ChatRoom'
import StoryMode from './StoryMode'
import CharProfile from './CharProfile'
import MemoryCore from './MemoryCore'

export type ChatView = 'list' | 'room' | 'story' | 'charProfile' | 'memoryCore'

interface ChatModuleProps {
  initialView?: ChatView
}

// 聊天模块入口：模块内部视图切换
export default function ChatModule({ initialView = 'list' }: ChatModuleProps) {
  const [view, setView] = useState<ChatView>(initialView)

  switch (view) {
    case 'list':
      return <ChatList onNavigate={setView} />
    case 'room':
      return (
        <ChatRoom
          onBack={() => setView('list')}
          onOpenStory={() => setView('story')}
          onOpenMemory={() => setView('memoryCore')}
        />
      )
    case 'story':
      return <StoryMode onBack={() => setView('room')} />
    case 'charProfile':
      return <CharProfile onBack={() => setView('list')} />
    case 'memoryCore':
      return <MemoryCore onBack={() => setView('room')} />
  }
}
