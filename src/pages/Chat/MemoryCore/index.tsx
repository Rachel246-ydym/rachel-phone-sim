import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function MemoryCore({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="记忆核心" onBack={onBack}>
      <Placeholder title="记忆核心" description="第四阶段实现：自动总结 + 标签筛选 + 日历视图" />
    </SubPage>
  )
}
