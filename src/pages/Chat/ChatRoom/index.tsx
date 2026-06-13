import SubPage from '../../../components/SubPage'
import MessageList from './MessageList'
import InputBar from './InputBar'
import { useChatRoom } from './useChatRoom'
import './ChatRoom.css'

interface ChatRoomProps {
  onBack: () => void
  onOpenStory: () => void
  onOpenMemory: () => void
}

export default function ChatRoom({ onBack, onOpenStory, onOpenMemory }: ChatRoomProps) {
  const { character, messages, streamingText, error, send, sending } = useChatRoom()

  if (!character) {
    return (
      <SubPage title="聊天室" onBack={onBack}>
        <p className="chat-room__missing">未选择角色，请返回列表选择</p>
      </SubPage>
    )
  }

  return (
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
        </div>
      }
    >
      <div className="chat-room">
        <MessageList
          messages={messages}
          character={character}
          streamingText={streamingText}
          error={error}
        />
        <InputBar disabled={sending} onSend={(text) => void send(text)} />
      </div>
    </SubPage>
  )
}
