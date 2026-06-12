import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function DisplaySettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="显示设置" onBack={onBack}>
      <Placeholder title="显示设置" description="第五阶段实现：iOS 全荧幕 / 主屏幕换页模式" />
    </SubPage>
  )
}
