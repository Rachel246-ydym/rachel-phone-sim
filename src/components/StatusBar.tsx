import { useNow } from '../hooks/useNow'
import './StatusBar.css'

export default function StatusBar() {
  const now = useNow()
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="status-bar">
      <span className="status-bar__time">{time}</span>
      <span className="status-bar__right">
        <span className="status-bar__signal">●●●●</span>
        <span className="status-bar__battery" aria-label="电量">
          <span className="status-bar__battery-level" />
        </span>
      </span>
    </header>
  )
}
