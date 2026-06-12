import './Navigation.css'

export type TabId = 'chat' | 'profile'

interface NavigationProps {
  active: TabId
  onChange: (tab: TabId) => void
}

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'chat', label: '聊天', icon: '💬' },
  { id: 'profile', label: '我的', icon: '👤' },
]

export default function Navigation({ active, onChange }: NavigationProps) {
  return (
    <nav className="navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`navigation__tab${active === tab.id ? ' navigation__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="navigation__icon">{tab.icon}</span>
          <span className="navigation__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
