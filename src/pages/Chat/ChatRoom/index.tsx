import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import MessageList from './MessageList'
import InputBar from './InputBar'
import ChatTopBar from './ChatTopBar'
import SearchOverlay from './SearchOverlay'
import MenuPanel from './MenuPanel'
import CharInfoPanel from './CharInfoPanel'
import ContactsOverlay from './ContactsOverlay'
import { useChatRoom } from './useChatRoom'
import './ChatRoom.css'

interface ChatRoomProps {
  onOpenStory: () => void
  onOpenMemory: () => void
  onOpenCharProfile: () => void
}

export default function ChatRoom({ onOpenStory, onOpenMemory, onOpenCharProfile }: ChatRoomProps) {
  const { characters, activeCharacterId } = useAppState()
  const dispatch = useAppDispatch()
  const { character, messages, streamingText, error, latestHeartVoice, send, sending } =
    useChatRoom()

  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [charInfoOpen, setCharInfoOpen] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)
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

  useEffect(() => {
    if (!activeCharacterId && characters.length > 0) {
      setContactsOpen(true)
    }
  }, [activeCharacterId, characters.length])

  function switchCharacter(id: string) {
    dispatch({ type: 'chat/setActiveCharacter', characterId: id })
    setContactsOpen(false)
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
            <>
              <p>请选择联络人</p>
              <button className="chat-page__empty-btn" onClick={() => setContactsOpen(true)}>
                打开联络人
              </button>
            </>
          )}
        </div>
        <ContactsOverlay
          open={contactsOpen}
          characters={characters}
          activeCharacterId={activeCharacterId}
          onClose={() => setContactsOpen(false)}
          onSelect={switchCharacter}
          onNewChar={() => {
            setContactsOpen(false)
            onOpenCharProfile()
          }}
        />
      </div>
    )
  }

  return (
    <div className="chat-page">
      <ChatTopBar
        character={character}
        onContactsOpen={() => setContactsOpen(true)}
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
        {hvMode === 'topbar' && latestHeartVoice && (
          <div className="chat-room__hv-bar">{latestHeartVoice}</div>
        )}
        <MessageList
          messages={messages}
          character={character}
          streamingText={streamingText}
          error={error}
        />
        <InputBar disabled={sending} onSend={(text) => void send(text)} />
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
        messages={messages}
        characterName={character.name}
        onClose={() => setMenuOpen(false)}
        onOpenMemory={() => {
          setMenuOpen(false)
          onOpenMemory()
        }}
      />
      <ContactsOverlay
        open={contactsOpen}
        characters={characters}
        activeCharacterId={activeCharacterId}
        onClose={() => setContactsOpen(false)}
        onSelect={switchCharacter}
        onNewChar={() => {
          setContactsOpen(false)
          onOpenCharProfile()
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
