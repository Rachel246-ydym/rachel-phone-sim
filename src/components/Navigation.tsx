import { Home, User } from 'lucide-react'
import './Navigation.css'

export type TabId = 'home' | 'profile'

interface NavigationProps {
  active: TabId
  onChange: (tab: TabId) => void
}

const TABS: Array<{ id: TabId; label: string; Icon: typeof Home }> = [
  { id: 'home', label: '主屏', Icon: Home },
  { id: 'profile', label: '我的', Icon: User },
]

export default function Navigation({ active, onChange }: NavigationProps) {
  return (
    <nav className="navigation">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`navigation__tab${active === id ? ' navigation__tab--active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={22} strokeWidth={active === id ? 2.2 : 1.8} />
          <span className="navigation__label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
