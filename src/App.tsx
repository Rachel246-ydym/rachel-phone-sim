import { useState } from 'react'
import StatusBar from './components/StatusBar'
import Navigation, { type TabId } from './components/Navigation'
import ChatModule from './pages/Chat'
import ProfileModule from './pages/Profile'
import './App.css'

export default function App() {
  const [tab, setTab] = useState<TabId>('chat')

  return (
    <div className="phone">
      <StatusBar />
      <main className="phone__screen">
        {tab === 'chat' ? <ChatModule /> : <ProfileModule />}
      </main>
      <Navigation active={tab} onChange={setTab} />
    </div>
  )
}
