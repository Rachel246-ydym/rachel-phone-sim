import { useState } from 'react'
import StatusBar from './components/StatusBar'
import Navigation, { type TabId } from './components/Navigation'
import HomeModule from './pages/Home'
import ChatModule, { type ChatView } from './pages/Chat'
import ProfileModule from './pages/Profile'
import ThemeToggle from './pages/Home/ThemeToggle'
import { useAppDispatch } from './store/AppContext'
import { useAutoScheduler } from './hooks/useAutoScheduler'
import './App.css'

type AppTab = 'home' | 'chat' | 'profile'

export default function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [chatInitView, setChatInitView] = useState<ChatView>('room')
  const [chatView, setChatView] = useState<ChatView>('room')
  const dispatch = useAppDispatch()
  useAutoScheduler()

  function openChat(view: ChatView, characterId?: string) {
    if (characterId) {
      dispatch({ type: 'chat/setActiveCharacter', characterId })
    }
    setChatInitView(view)
    setChatView(view)
    setTab('chat')
  }

  const hideChrome = tab === 'chat' && chatView === 'story'

  const navActive: TabId =
    tab === 'profile' ? 'profile'
    : tab === 'chat' && chatInitView === 'story' ? 'story'
    : tab === 'chat' ? 'chat'
    : 'home'

  function handleNavChange(navTab: TabId) {
    if (navTab === 'story') {
      openChat('story')
    } else if (navTab === 'chat') {
      openChat('room')
    } else if (navTab === 'home') {
      setTab('home')
    } else {
      setTab('profile')
    }
  }

  return (
    <div className="phone">
      {!hideChrome && <StatusBar />}
      <main className="phone__screen">
        {tab === 'home' && <HomeModule onOpenChat={openChat} />}
        {tab === 'chat' && (
          <ChatModule
            initialView={chatInitView}
            onViewChange={(v) => setChatView(v)}
          />
        )}
        {tab === 'profile' && <ProfileModule />}
      </main>
      {!hideChrome && <ThemeToggle />}
      {!hideChrome && <Navigation active={navActive} onChange={handleNavChange} />}
    </div>
  )
}
