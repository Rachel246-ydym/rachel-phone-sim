import { useState, useEffect, useRef } from 'react'
import StatusBar from './components/StatusBar'
import Navigation, { type TabId } from './components/Navigation'
import HomeModule from './pages/Home'
import ChatModule, { type ChatView } from './pages/Chat'
import ProfileModule from './pages/Profile'
import ThemeToggle from './pages/Home/ThemeToggle'
import { useAppDispatch, useAppState } from './store/AppContext'
import { useAutoScheduler } from './hooks/useAutoScheduler'
import './App.css'

type AppTab = 'home' | 'chat' | 'profile'

const STORAGE_KEY = 'lumi-phone-page-state'

interface SavedPageState {
  currentPage: string
  chatView?: ChatView
  activeCharacterId?: string
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [chatInitView, setChatInitView] = useState<ChatView>('room')
  const [chatView, setChatView] = useState<ChatView>('room')
  const dispatch = useAppDispatch()
  const { characters, activeCharacterId, hydrated } = useAppState()
  const restoredRef = useRef(false)
  useAutoScheduler()

  // Restore page state once after hydration
  useEffect(() => {
    if (restoredRef.current || !hydrated) return
    restoredRef.current = true
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as SavedPageState
      if (saved.activeCharacterId) {
        const exists = characters.some((c) => c.id === saved.activeCharacterId)
        if (!exists) return
        dispatch({ type: 'chat/setActiveCharacter', characterId: saved.activeCharacterId })
      }
      if (saved.currentPage === 'chat' || saved.currentPage === 'story') {
        const view: ChatView = saved.currentPage === 'story' ? 'story' : (saved.chatView ?? 'room')
        setChatInitView(view)
        setChatView(view)
        setTab('chat')
      } else if (saved.currentPage === 'profile') {
        setTab('profile')
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [hydrated, characters, dispatch])

  // Persist page state on every navigation change
  useEffect(() => {
    const currentPage = tab === 'chat' ? (chatView === 'story' ? 'story' : 'chat') : tab
    const state: SavedPageState = {
      currentPage,
      activeCharacterId: activeCharacterId ?? undefined,
    }
    if (tab === 'chat') state.chatView = chatView
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [tab, chatView, activeCharacterId])

  function openChat(view: ChatView, characterId?: string) {
    if (characterId) {
      dispatch({ type: 'chat/setActiveCharacter', characterId })
    }
    setChatInitView(view)
    setChatView(view)
    setTab('chat')
  }

  function goHome() {
    setTab('home')
  }

  // Hide status bar, theme toggle, and nav while in any chat view
  const hideChrome = tab === 'chat'

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
            onGoHome={goHome}
          />
        )}
        {tab === 'profile' && <ProfileModule />}
      </main>
      {!hideChrome && <ThemeToggle />}
      {!hideChrome && <Navigation active={navActive} onChange={handleNavChange} />}
    </div>
  )
}
