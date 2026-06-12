import type { ReactNode } from 'react'
import './SubPage.css'

interface SubPageProps {
  title: string
  onBack: () => void
  action?: ReactNode
  children: ReactNode
}

// 带返回键标题栏的二级页面容器
export default function SubPage({ title, onBack, action, children }: SubPageProps) {
  return (
    <div className="sub-page">
      <header className="sub-page__header">
        <button className="sub-page__back" onClick={onBack} aria-label="返回">
          ‹
        </button>
        <h1 className="sub-page__title">{title}</h1>
        {action && <div className="sub-page__action">{action}</div>}
      </header>
      <div className="sub-page__body">{children}</div>
    </div>
  )
}
