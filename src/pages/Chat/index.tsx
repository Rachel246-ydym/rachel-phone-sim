import { useState } from 'react'
import ChatList from './ChatList'
import ChatRoom from './ChatRoom'
import StoryMode from './StoryMode'
import CharProfile from './CharProfile'
import MemoryCore from './MemoryCore'
import ChatSettings from './Settings'

export type ChatView = 'list' | 'room' | 'story' | 'charProfile' | 'memoryCore' | 'settings'

// 聊天模块入口：模块内部视图切换
export default function ChatModule() {
  const [view, setView] = useState<ChatView>('list')

  switch (view) {
    case 'list':
      return <ChatList onNavigate={setView} />
    case 'room':
      return (
        <ChatRoom
          onBack={() => setView('list')}
          onOpenStory={() => setView('story')}
          onOpenMemory={() => setView('memoryCore')}
          onOpenSettings={() => setView('settings')}
        />
      )
    case 'story':
      return <StoryMode onBack={() => setView('room')} />
    case 'charProfile':
      return <CharProfile onBack={() => setView('list')} />
    case 'memoryCore':
      return <MemoryCore onBack={() => setView('room')} />
    case 'settings':
      return <ChatSettings onBack={() => setView('room')} />
  }
}
