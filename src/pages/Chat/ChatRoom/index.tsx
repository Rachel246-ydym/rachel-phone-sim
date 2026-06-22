import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import MessageList from './MessageList'
import InputBar from './InputBar'
import ChatTopBar from './ChatTopBar'
import SearchOverlay from './SearchOverlay'
import MenuPanel from './MenuPanel'
import CharInfoPanel from './CharInfoPanel'
import { useChatRoom } from './useChatRoom'
import './ChatRoom.css'

interface ChatRoomProps {
  onOpenStory: () => void
  onOpenMemory: () => void
  onOpenCharProfile: () => void
  onGoHome: () => void
}

export default function ChatRoom({ onOpenStory, onOpenMemory, onOpenCharProfile, onGoHome }: ChatRoomProps) {
  const { characters, activeCharacterId } = useAppState()
  const dispatch = useAppDispatch()
  const { character, messages, streamingText, error, latestHeartVoice, send, sending, stopGeneration } =
    useChatRoom()

  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [charInfoOpen, setCharInfoOpen] = useState(false)
  const [notifVisible, setNotifVisible] = useState(false)
  const notifTimer = useRef<number | null>(null)

  const hvMode = character?.heartVoiceEnabled ? (character.heartVoiceMode ?? 'topbar') : null

  useEffect(() => {
    if (!latestHeartVoice || hvMode !== 'notification') return
    setNotifVisible(true)
    if (notifTimer.current !== null) clearTimeout(notifTimer.current)
    notifTimer.current = window.setTimeout(() => setNotifVisible(false), 3000)
    return () => {
      if (notifTimer.current !== null) clearTimeout(notifTimer.current)
    }
  }, [latestHeartVoice, hvMode])

  // Auto-select first character when no active character but characters exist
  useEffect(() => {
    if (!activeCharacterId && characters.length > 0) {
      dispatch({ type: 'chat/setActiveCharacter', characterId: characters[0].id })
    }
  }, [activeCharacterId, characters, dispatch])

  function switchCharacter(id: string) {
    dispatch({ type: 'chat/setActiveCharacter', characterId: id })
  }

  if (!character) {
    return (
      <div className="chat-page">
        <div className="chat-page__empty-state">
          {characters.length === 0 ? (
            <>
              <p>还没有角色</p>
              <button className="chat-page__empty-btn" onClick={onOpenCharProfile}>
                ＋ 创建角色
              </button>
            </>
          ) : (
            <p>正在加载…</p>
          )}
          <button className="chat-page__empty-btn chat-page__empty-btn--ghost" onClick={onGoHome}>
            返回主页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <ChatTopBar
        character={character}
        onGoHome={onGoHome}
        onAvatarClick={() => setCharInfoOpen(true)}
        onStory={onOpenStory}
        onSearch={() => setSearchOpen((v) => !v)}
        onMenu={() => setMenuOpen(true)}
      />
      <SearchOverlay
        open={searchOpen}
        messages={messages}
        characterName={character.name}
        onClose={() => setSearchOpen(false)}
      />
      <div className="chat-page__body">
        <MessageList
          messages={messages}
          character={character}
          streamingText={streamingText}
          error={error}
        />
        {hvMode === 'topbar' && latestHeartVoice && (
          <div className="chat-room__hv-bar">
            <span className="chat-room__hv-icon">🌙</span>
            {latestHeartVoice}
          </div>
        )}
        {sending ? (
          <div className="chat-room__input-bar gen-status-bar">
            <div className="gen-status-bar__dots">
              <span className="gen-status-bar__dot" />
              <span className="gen-status-bar__dot" />
              <span className="gen-status-bar__dot" />
            </div>
            <span className="gen-status-bar__text">正在回复…</span>
            <button className="gen-status-bar__stop" onClick={stopGeneration}>停止</button>
          </div>
        ) : (
          <InputBar disabled={false} onSend={(text) => void send(text)} />
        )}
      </div>
      <CharInfoPanel
        open={charInfoOpen}
        character={character}
        onClose={() => setCharInfoOpen(false)}
        onOpenCharProfile={() => {
          setCharInfoOpen(false)
          onOpenCharProfile()
        }}
        onOpenMemory={() => {
          setCharInfoOpen(false)
          onOpenMemory()
        }}
        onSwitchCharacter={switchCharacter}
        onNewChar={() => {
          setCharInfoOpen(false)
          onOpenCharProfile()
        }}
      />
      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenCharProfile={() => {
          setMenuOpen(false)
          onOpenCharProfile()
        }}
        onOpenMemory={() => {
          setMenuOpen(false)
          onOpenMemory()
        }}
      />
      {hvMode === 'notification' && notifVisible && latestHeartVoice && (
        <div className="hv-notif">
          <p className="hv-notif__label">心声</p>
          <p className="hv-notif__text">{latestHeartVoice}</p>
        </div>
      )}
    </div>
  )
}
