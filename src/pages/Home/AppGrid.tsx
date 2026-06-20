import { MessageCircle, BookOpen, Clock, Heart, Settings, MoreHorizontal } from 'lucide-react'
import type { ChatView } from '../Chat'

interface AppGridProps {
  onOpenChat: (view: ChatView) => void
}

interface IconDef {
  id: string
  label: string
  Icon: typeof MessageCircle
  bg: string
  border: string
  color: string
  badge?: number
  onClick?: () => void
  disabled?: boolean
}

export default function AppGrid({ onOpenChat }: AppGridProps) {
  const icons: IconDef[] = [
    {
      id: 'chat',
      label: '聊天',
      Icon: MessageCircle,
      bg: 'var(--color-primary-bg)',
      border: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      badge: 3,
      onClick: () => onOpenChat('room'),
    },
    {
      id: 'story',
      label: '故事',
      Icon: BookOpen,
      bg: 'var(--color-lavender-light)',
      border: '#D4CCE0',
      color: 'var(--color-lavender)',
      onClick: () => onOpenChat('story'),
    },
    {
      id: 'moments',
      label: '动态',
      Icon: Clock,
      bg: 'var(--color-sage-light)',
      border: '#C8D8CC',
      color: 'var(--color-sage)',
      disabled: true,
    },
    {
      id: 'feels',
      label: '时刻',
      Icon: Heart,
      bg: 'var(--color-amber-light)',
      border: '#E0D8C0',
      color: 'var(--color-amber)',
      disabled: true,
    },
    {
      id: 'settings',
      label: '设置',
      Icon: Settings,
      bg: 'var(--color-slate-light)',
      border: '#CCD4DC',
      color: 'var(--color-slate)',
      disabled: true,
    },
    {
      id: 'more',
      label: '更多',
      Icon: MoreHorizontal,
      bg: 'var(--bg-input)',
      border: 'var(--border-light)',
      color: 'var(--text-light)',
      disabled: true,
    },
  ]

  return (
    <div className="app-grid">
      {icons.map(({ id, label, Icon, bg, border, color, badge, onClick, disabled }) => (
        <button
          key={id}
          className={`app-grid__item${disabled ? ' app-grid__item--disabled' : ''}`}
          onClick={onClick}
          disabled={disabled}
        >
          <div
            className="app-grid__icon"
            style={{ backgroundColor: bg, border: `1.5px solid ${border}`, color }}
          >
            <Icon size={22} strokeWidth={1.5} />
            {badge != null && (
              <span className="app-grid__badge">{badge}</span>
            )}
          </div>
          <span className="app-grid__label">{label}</span>
        </button>
      ))}
    </div>
  )
}
