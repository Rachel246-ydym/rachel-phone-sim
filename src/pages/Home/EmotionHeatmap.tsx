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

const DEMO_EMOTIONS: Record<number, Emotion> = {
  1: 'warm', 2: 'calm', 3: 'warm', 4: 'deep', 5: 'warm', 6: 'cool',
  7: 'calm', 8: 'warm', 9: 'deep', 10: 'warm', 11: 'cool', 12: 'warm', 13: 'calm',
  14: 'cool', 15: 'warm', 16: 'deep', 17: 'warm', 18: 'calm', 19: 'warm', 20: 'deep',
}

export default function EmotionHeatmap({ now }: { now: Date }) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="emotion-map">
      <div className="emotion-map__header">
        <span className="emotion-map__month">{MONTH_EN[month]} {year}</span>
        <span className="emotion-map__count">42 memories</span>
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
          const emotion = DEMO_EMOTIONS[d]
          return (
            <div
              key={i}
              className="emotion-map__cell"
              style={emotion ? { backgroundColor: EMOTION_COLORS[emotion] } : { backgroundColor: 'var(--bg-input)' }}
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
