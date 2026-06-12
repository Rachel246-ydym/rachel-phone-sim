import './Placeholder.css'

interface PlaceholderProps {
  title: string
  description?: string
}

// 未完成模块的占位页，后续阶段逐个替换为真实实现
export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="placeholder">
      <h2 className="placeholder__title">{title}</h2>
      <p className="placeholder__desc">{description ?? '开发中，敬请期待'}</p>
    </div>
  )
}
