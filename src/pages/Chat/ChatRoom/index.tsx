import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function ChatRoom({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="聊天室" onBack={onBack}>
      <Placeholder title="聊天室" description="第二阶段实现：消息列表 + 输入框 + AI 回复" />
    </SubPage>
  )
}
