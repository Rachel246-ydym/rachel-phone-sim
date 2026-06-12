import Placeholder from '../../../components/Placeholder'
import SubPage from '../../../components/SubPage'

export default function CharProfile({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="角色档案" onBack={onBack}>
      <Placeholder title="角色档案" description="第二阶段实现：头像 / 名称 / 人设与背景" />
    </SubPage>
  )
}
