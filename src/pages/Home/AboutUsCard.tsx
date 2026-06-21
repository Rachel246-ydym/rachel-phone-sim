import { useEffect, useState } from 'react'
import type { Character, HeartVoice, Memory } from '../../types'
import { getAll } from '../../services/storage'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const LV_BREAKS = [0, 11, 31, 61, 101, 151, 221, 301, 401, 521]

function getLv(value: number): { lv: number; pct: number } {
  for (let i = 1; i < LV_BREAKS.length; i++) {
    if (value < LV_BREAKS[i]) {
      const lo = LV_BREAKS[i - 1]
      const hi = LV_BREAKS[i]
      return { lv: i, pct: ((value - lo) / (hi - lo)) * 100 }
    }
  }
  return { lv: 10, pct: 100 }
}

interface Stats {
  days: number
  memories: number
  feels: number
  pinned: number
  sinceStr: string
}

interface AboutUsCardProps {
  character: Character | null
}

const STAT_META = [
  { key: 'days' as const, label: 'Days', from: 'var(--color-primary)', to: 'var(--color-primary-light)' },
  { key: 'memories' as const, label: 'Memories', from: 'var(--color-amber)', to: 'var(--color-amber-light)' },
  { key: 'feels' as const, label: 'Feels', from: 'var(--color-slate)', to: 'var(--color-slate-light)' },
  { key: 'pinned' as const, label: 'Pinned', from: 'var(--color-sage)', to: 'var(--color-sage-light)' },
]

export default function AboutUsCard({ character }: AboutUsCardProps) {
  const [stats, setStats] = useState<Stats>({ days: 0, memories: 0, feels: 0, pinned: 0, sinceStr: '' })

  useEffect(() => {
    if (!character) {
      setStats({ days: 0, memories: 0, feels: 0, pinned: 0, sinceStr: '' })
      return
    }
    const cid = character.id
    const createdAt = character.createdAt ?? Date.now()
    const daysDiff = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000))
    const d = new Date(createdAt)
    const sinceStr = `since ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

    Promise.all([
      getAll<Memory>('memories'),
      getAll<HeartVoice>('heartVoices'),
    ]).then(([mems, voices]) => {
      const myMems = mems.filter((m) => m.characterId === cid)
      setStats({
        days: daysDiff,
        memories: myMems.length,
        feels: voices.filter((v) => v.characterId === cid).length,
        pinned: myMems.filter((m) => m.pinned).length,
        sinceStr,
      })
    })
  }, [character?.id, character?.createdAt])

  return (
    <div className="about-card">
      <div className="about-card__header">
        <div className="about-card__title">About Us</div>
        {stats.sinceStr && (
          <div className="about-card__since">{stats.sinceStr}</div>
        )}
      </div>
      <div className="about-card__stats">
        {STAT_META.map((meta) => {
          const value = stats[meta.key]
          const { lv, pct } = getLv(value)
          return (
            <div key={meta.label} className="about-card__stat-row">
              <span className="about-card__stat-label">{meta.label}</span>
              <span className="about-card__stat-level">LV{lv}</span>
              <div className="about-card__bar-track">
                <div
                  className="about-card__bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${meta.from}, ${meta.to})`,
                  }}
                />
              </div>
              <span className="about-card__stat-value">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
