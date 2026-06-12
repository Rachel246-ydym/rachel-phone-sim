import SubPage from '../../../components/SubPage'
import MessageList from './MessageList'
import InputBar from './InputBar'
import { useChatRoom } from './useChatRoom'
import './ChatRoom.css'

export default function ChatRoom({ onBack }: { onBack: () => void }) {
  const { character, messages, streamingText, error, send, sending } = useChatRoom()

  if (!character) {
    return (
      <SubPage title="聊天室" onBack={onBack}>
        <p className="chat-room__missing">未选择角色，请返回列表选择</p>
      </SubPage>
    )
  }

  return (
    <SubPage title={character.name} onBack={onBack}>
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
