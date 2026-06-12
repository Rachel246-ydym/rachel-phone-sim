import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function ApiSettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="API 设置" onBack={onBack}>
      <Placeholder title="API 设置" description="第五阶段实现：API 地址 / Key / 模型 / 用量账本" />
    </SubPage>
  )
}
