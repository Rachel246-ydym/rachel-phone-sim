import { useState } from 'react'
import StatusBar from './components/StatusBar'
import Navigation, { type TabId } from './components/Navigation'
import HomeModule from './pages/Home'
import ChatModule, { type ChatView } from './pages/Chat'
import ProfileModule from './pages/Profile'
import { useAppDispatch } from './store/AppContext'
import { useAutoScheduler } from './hooks/useAutoScheduler'
import './App.css'

type AppTab = 'home' | 'chat' | 'profile'

export default function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [chatInitView, setChatInitView] = useState<ChatView>('room')
  const dispatch = useAppDispatch()
  useAutoScheduler()

  function openChat(view: ChatView, characterId?: string) {
    if (characterId) {
      dispatch({ type: 'chat/setActiveCharacter', characterId })
    }
    setChatInitView(view)
    setTab('chat')
  }

  const navActive: TabId = tab === 'profile' ? 'profile' : 'home'

  function handleNavChange(navTab: TabId) {
    setTab(navTab)
  }

  return (
    <div className="phone">
      <StatusBar />
      <main className="phone__screen">
        {tab === 'home' && <HomeModule onOpenChat={openChat} />}
        {tab === 'chat' && <ChatModule initialView={chatInitView} />}
        {tab === 'profile' && <ProfileModule />}
      </main>
      <Navigation active={navActive} onChange={handleNavChange} />
    </div>
  )
}
