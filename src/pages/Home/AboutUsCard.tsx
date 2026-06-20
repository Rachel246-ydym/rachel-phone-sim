interface StatRow {
  label: string
  level: string
  value: number
  max: number
  from: string
  to: string
}

const STATS: StatRow[] = [
  { label: 'Days', level: 'LV7', value: 105, max: 150, from: 'var(--color-primary)', to: 'var(--color-primary-light)' },
  { label: 'Memories', level: 'LV5', value: 48, max: 100, from: 'var(--color-amber)', to: 'var(--color-amber-light)' },
  { label: 'Feels', level: 'LV2', value: 12, max: 100, from: 'var(--color-slate)', to: 'var(--color-slate-light)' },
  { label: 'Pinned', level: 'LV3', value: 18, max: 100, from: 'var(--color-sage)', to: 'var(--color-sage-light)' },
]

export default function AboutUsCard() {
  return (
    <div className="about-card">
      <div className="about-card__header">
        <div className="about-card__title">About Us</div>
        <div className="about-card__since">since March 7, 2026</div>
      </div>
      <div className="about-card__stats">
        {STATS.map((stat) => (
          <div key={stat.label} className="about-card__stat-row">
            <span className="about-card__stat-label">{stat.label}</span>
            <span className="about-card__stat-level">{stat.level}</span>
            <div className="about-card__bar-track">
              <div
                className="about-card__bar-fill"
                style={{
                  width: `${Math.min((stat.value / stat.max) * 100, 100)}%`,
                  background: `linear-gradient(to right, ${stat.from}, ${stat.to})`,
                }}
              />
            </div>
            <span className="about-card__stat-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
