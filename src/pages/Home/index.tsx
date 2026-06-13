import { type ReactNode } from 'react'
import { MessageCircle, Camera, Globe, User } from 'lucide-react'
import { useAppState } from '../../store/AppContext'
import type { Character } from '../../types'
import type { ChatView } from '../Chat'
import { useNow } from '../../hooks/useNow'
import './Home.css'

interface HomeProps {
  onOpenChat: (view: ChatView, characterId?: string) => void
}

const MONTH_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
const DOW_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function CalendarWidget({ now }: { now: Date }) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="home__cal">
      <div className="home__cal-header">
        <span className="home__cal-month">{MONTH_NAMES[month]}月</span>
        <span className="home__cal-year">{year}</span>
      </div>
      <div className="home__cal-dow">
        {DOW_LABELS.map((d) => (
          <span key={d} className="home__cal-dow-cell">{d}</span>
        ))}
      </div>
      <div className="home__cal-grid">
        {cells.map((d, i) => (
          <span
            key={i}
            className={`home__cal-day${d === today ? ' home__cal-day--today' : ''}`}
          >
            {d ?? ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function CharacterWidget({ character }: { character: Character | null }) {
  return (
    <div className="home__char">
      <div className="home__char-avatar">
        {character ? (
          character.avatar ? (
            <img src={character.avatar} alt={character.name} className="home__char-img" />
          ) : (
            <span className="home__char-initial">{character.name.slice(0, 1)}</span>
          )
        ) : (
          <User size={36} className="home__char-placeholder" />
        )}
      </div>
      <div className="home__char-name">
        {character ? (character.nickname || character.name) : '暂无角色'}
      </div>
    </div>
  )
}

function AppIcon({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  accent?: boolean
}) {
  return (
    <button
      className={`home__app-icon${disabled ? ' home__app-icon--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={`home__app-icon-bg${accent ? ' home__app-icon-bg--accent' : ''}`}>
        {icon}
      </div>
      <span className="home__app-icon-label">{label}</span>
    </button>
  )
}

export default function Home({ onOpenChat }: HomeProps) {
  const { characters, activeCharacterId } = useAppState()
  const now = useNow()

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? characters[0] ?? null

  function handleChatPress() {
    if (activeCharacter) {
      onOpenChat('room', activeCharacter.id)
    } else {
      onOpenChat('charProfile')
    }
  }

  return (
    <div className="home">
      <div className="home__widgets">
        <CalendarWidget now={now} />
        <CharacterWidget character={activeCharacter} />
      </div>
      <div className="home__grid">
        <AppIcon
          icon={<MessageCircle size={26} />}
          label="聊天"
          onClick={handleChatPress}
          accent
        />
        <AppIcon
          icon={<Camera size={26} />}
          label="朋友圈"
          disabled
        />
        <AppIcon
          icon={<Globe size={26} />}
          label="论坛"
          disabled
        />
      </div>
    </div>
  )
}
