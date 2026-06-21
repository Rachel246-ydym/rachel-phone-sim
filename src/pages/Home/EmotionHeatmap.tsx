import { useEffect, useState } from 'react'
import type { Character, Message } from '../../types'
import { getAll } from '../../services/storage'

const MONTH_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type Emotion = 'warm' | 'calm' | 'deep' | 'cool'

const EMOTION_COLORS: Record<Emotion, string> = {
  warm: '#D4917A',
  calm: '#C8BFAA',
  deep: '#C17C74',
  cool: '#8BA4B8',
}

const EMOTION_LABELS: Record<Emotion, string> = {
  warm: '温暖',
  calm: '平静',
  deep: '深刻',
  cool: '低落',
}

function countToEmotion(count: number): Emotion | null {
  if (count === 0) return null
  if (count <= 5) return 'calm'
  if (count <= 15) return 'warm'
  if (count <= 30) return 'deep'
  return 'cool'
}

interface EmotionHeatmapProps {
  now: Date
  character: Character | null
}

export default function EmotionHeatmap({ now, character }: EmotionHeatmapProps) {
  const [dayCounts, setDayCounts] = useState<Record<number, number>>({})
  const [totalCount, setTotalCount] = useState(0)

  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  useEffect(() => {
    if (!character) {
      setDayCounts({})
      setTotalCount(0)
      return
    }
    const cid = character.id
    getAll<Message>('messages').then((all) => {
      const counts: Record<number, number> = {}
      let total = 0
      for (const m of all) {
        if (m.characterId !== cid) continue
        const d = new Date(m.timestamp)
        if (d.getFullYear() !== year || d.getMonth() !== month) continue
        const day = d.getDate()
        counts[day] = (counts[day] ?? 0) + 1
        total++
      }
      setDayCounts(counts)
      setTotalCount(total)
    })
  }, [character?.id, year, month])

  // Monday-first grid
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="emotion-map">
      <div className="emotion-map__header">
        <span className="emotion-map__month">{MONTH_EN[month]} {year}</span>
        <span className="emotion-map__count">{totalCount} messages</span>
      </div>
      <div className="emotion-map__dow">
        {DOW_LABELS.map((d, i) => (
          <span key={i} className="emotion-map__dow-label">{d}</span>
        ))}
      </div>
      <div className="emotion-map__grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="emotion-map__cell emotion-map__cell--empty" />
          if (d > today) return <div key={i} className="emotion-map__cell emotion-map__cell--future" />
          const emotion = countToEmotion(dayCounts[d] ?? 0)
          return (
            <div
              key={i}
              className="emotion-map__cell"
              style={emotion
                ? { backgroundColor: EMOTION_COLORS[emotion] }
                : { backgroundColor: 'var(--bg-input)', border: '1px dashed var(--border)' }}
            />
          )
        })}
      </div>
      <div className="emotion-map__legend">
        {(Object.keys(EMOTION_COLORS) as Emotion[]).map((e) => (
          <div key={e} className="emotion-map__legend-item">
            <span className="emotion-map__legend-dot" style={{ backgroundColor: EMOTION_COLORS[e] }} />
            <span className="emotion-map__legend-text">{EMOTION_LABELS[e]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
