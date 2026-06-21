import { useAppState } from '../../store/AppContext'
import { useNow } from '../../hooks/useNow'
import type { ChatView } from '../Chat'
import CharacterCard from './CharacterCard'
import AboutUsCard from './AboutUsCard'
import EmotionHeatmap from './EmotionHeatmap'
import AppGrid from './AppGrid'
import RecentList from './RecentList'
import './Home.css'

interface HomeProps {
  onOpenChat: (view: ChatView, characterId?: string) => void
}

const GREETINGS = [
  '凌晨好', '凌晨好', '凌晨好', '凌晨好', '凌晨好', '早上好',
  '早上好', '早上好', '上午好', '上午好', '上午好', '上午好',
  '下午好', '下午好', '下午好', '下午好', '下午好', '下午好',
  '晚上好', '晚上好', '晚上好', '晚上好', '晚上好', '晚上好',
]

const MONTH_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Home({ onOpenChat }: HomeProps) {
  const { characters, activeCharacterId } = useAppState()
  const now = useNow()

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? characters[0] ?? null

  const greeting = GREETINGS[now.getHours()]
  const dateStr = `${DOW_EN[now.getDay()]} · ${MONTH_EN[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

  function handleCharacterClick() {
    if (activeCharacter) {
      onOpenChat('room', activeCharacter.id)
    } else {
      onOpenChat('charProfile')
    }
  }

  return (
    <div className="home">
      <div className="home__greeting">
        <div className="home__greeting-text">{greeting}</div>
        <div className="home__greeting-date">{dateStr}</div>
      </div>
      <CharacterCard character={activeCharacter} onClick={handleCharacterClick} />
      <AboutUsCard character={activeCharacter} />
      <EmotionHeatmap now={now} character={activeCharacter} />
      <AppGrid onOpenChat={onOpenChat} />
      <RecentList character={activeCharacter} onOpenMemory={() => onOpenChat('memoryCore')} />
    </div>
  )
}
