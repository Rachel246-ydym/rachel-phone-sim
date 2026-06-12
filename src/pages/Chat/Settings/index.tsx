import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function ChatSettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="聊天设置" onBack={onBack}>
      <Placeholder title="聊天设置" description="第四阶段实现：模型参数 + 自动行为" />
    </SubPage>
  )
}
