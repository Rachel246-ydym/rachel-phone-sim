import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function StoryMode({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="线下剧情" onBack={onBack}>
      <Placeholder title="线下剧情模式" description="第三阶段实现：长篇叙事 + 剧情分支 + 存档" />
    </SubPage>
  )
}
