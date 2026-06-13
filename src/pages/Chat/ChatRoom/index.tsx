import { useEffect, useRef, useState } from 'react'
import SubPage from '../../../components/SubPage'
import MessageList from './MessageList'
import InputBar from './InputBar'
import { useChatRoom } from './useChatRoom'
import './ChatRoom.css'

interface ChatRoomProps {
  onBack: () => void
  onOpenStory: () => void
  onOpenMemory: () => void
  onOpenSettings: () => void
}

export default function ChatRoom({ onBack, onOpenStory, onOpenMemory, onOpenSettings }: ChatRoomProps) {
  const { character, messages, streamingText, error, latestHeartVoice, send, sending } =
    useChatRoom()
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

  if (!character) {
    return (
      <SubPage title="聊天室" onBack={onBack}>
        <p className="chat-room__missing">未选择角色，请返回列表选择</p>
      </SubPage>
    )
  }

  return (
    <>
      <SubPage
        title={character.name}
        onBack={onBack}
        action={
          <div className="chat-room__header-btns">
            <button className="chat-room__story-btn" onClick={onOpenMemory}>
              记忆
            </button>
            <button className="chat-room__story-btn" onClick={onOpenStory}>
              剧情
            </button>
            <button className="chat-room__story-btn" onClick={onOpenSettings} aria-label="设置">
              ⚙
            </button>
          </div>
        }
      >
        <div className="chat-room">
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
      </SubPage>
      {hvMode === 'notification' && notifVisible && latestHeartVoice && (
        <div className="hv-notif">
          <p className="hv-notif__label">心声</p>
          <p className="hv-notif__text">{latestHeartVoice}</p>
        </div>
      )}
    </>
  )
}
