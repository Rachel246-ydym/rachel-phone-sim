import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { put } from '../../../services/storage'
import type { Character } from '../../../types'

interface CharInfoPanelProps {
  open: boolean
  character: Character
  onClose: () => void
  onOpenCharProfile: () => void
  onOpenMemory: () => void
  onSwitchCharacter: (id: string) => void
  onNewChar: () => void
}

const CHAR_COLORS = [
  { bg: 'var(--color-primary-light)', border: 'var(--color-primary)' },
  { bg: 'var(--color-sage-light)', border: 'var(--color-sage)' },
  { bg: 'var(--color-amber-light)', border: 'var(--color-amber)' },
  { bg: 'var(--color-lavender-light)', border: 'var(--color-lavender)' },
]

const ChevronRight = () => (
  <svg className="cip__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CharInfoPanel({
  open,
  character,
  onClose,
  onOpenCharProfile,
  onOpenMemory,
  onSwitchCharacter,
  onNewChar,
}: CharInfoPanelProps) {
  const { characters, apiConfigs } = useAppState()
  const dispatch = useAppDispatch()

  const primaryConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0]
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayTokens =
    primaryConfig?.usageStats.statsDate === todayKey
      ? (primaryConfig.usageStats.todayTokens ?? 0)
      : 0
  const todayCost = ((todayTokens / 1000) * 0.004).toFixed(2)

  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dateDisplay = `${day} ${month} · ${weekday}`

  const rawModel = primaryConfig?.model ?? 'N/A'
  const modelLabel = rawModel.replace('deepseek-', 'ds-').slice(0, 12)

  const nickname = character.nickname
  const statusText = (character.online ? '在线' : '离线') + (nickname ? ` · ${nickname}` : '')
  const actionEnabled = character.actionDescEnabled ?? true

  async function toggleActionDesc() {
    const updated: Character = { ...character, actionDescEnabled: !actionEnabled }
    await put('characters', updated)
    dispatch({ type: 'chat/upsertCharacter', character: updated })
  }

  return (
    <>
      {open && <div className="panel-mask" onClick={onClose} />}
      <div className={`char-info-panel${open ? ' char-info-panel--open' : ''}`}>

        {/* Hero */}
        <div className="cip__hero">
          <div className="cip__avatar-wrap">
            <div className="cip__avatar">
              {character.avatar
                ? <img src={character.avatar} alt={character.name} />
                : character.name.slice(0, 1)}
            </div>
            {character.online && <span className="cip__online-dot" />}
          </div>
          <p className="cip__name">{character.name}</p>
          <p className="cip__status">{statusText}</p>
        </div>

        {/* Info card — 3 columns */}
        <div className="cip__card">
          <div className="cip__card-col">
            <span className="cip__card-tag">DATE</span>
            <span className="cip__card-val">{dateDisplay}</span>
          </div>
          <div className="cip__card-sep" />
          <div className="cip__card-col">
            <span className="cip__card-tag">MODEL</span>
            <span className="cip__card-val cip__card-val--mono">{modelLabel}</span>
          </div>
          <div className="cip__card-sep" />
          <div className="cip__card-col">
            <span className="cip__card-tag">COST</span>
            <span className="cip__card-val cip__card-val--cost">¥ {todayCost}</span>
          </div>
        </div>

        {/* Entries */}
        <div className="cip__entries">
          <button className="cip__entry">
            <div className="cip__entry-left">
              <span className="cip__icon cip__icon--sage">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5.5V8l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="cip__entry-label">动态</span>
            </div>
            <ChevronRight />
          </button>

          <button className="cip__entry" onClick={() => { onClose(); onOpenMemory() }}>
            <div className="cip__entry-left">
              <span className="cip__icon cip__icon--amber">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2.5l1.4 2.9 3.2.5-2.3 2.2.5 3.2L8 9.7l-2.8 1.6.5-3.2L3.4 5.9l3.2-.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="cip__entry-label">重要时刻</span>
            </div>
            <ChevronRight />
          </button>

          <button className="cip__entry" onClick={() => { onClose(); onOpenCharProfile() }}>
            <div className="cip__entry-left">
              <span className="cip__icon cip__icon--lavender">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M1.5 13c0-1.9 1.8-3.5 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8.5 9.5c2.2 0 6 1 6 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="cip__entry-label">关于我和 TA</span>
            </div>
            <ChevronRight />
          </button>

          <button className="cip__entry" onClick={() => { onClose(); onOpenMemory() }}>
            <div className="cip__entry-left">
              <span className="cip__icon cip__icon--primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 13V8.5C5 6 6.3 4 8 4s3 2 3 4.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 9H3.5C2.7 9 2 8.3 2 7.5S2.7 6 3.5 6H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 9h1.5c.8 0 1.5-.7 1.5-1.5S13.3 6 12.5 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="cip__entry-label">记忆核心</span>
            </div>
            <ChevronRight />
          </button>

          <div className="cip__entry">
            <div className="cip__entry-left">
              <span className="cip__icon cip__icon--slate">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M11.5 2.5l2 2-8 8H3.5v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="cip__entry-label">动作描写</span>
            </div>
            <button
              className={`cip__toggle${actionEnabled ? ' cip__toggle--on' : ''}`}
              onClick={() => void toggleActionDesc()}
              aria-label={actionEnabled ? '关闭动作描写' : '开启动作描写'}
            >
              <span className="cip__toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Footer — character switcher + new char + group */}
        <div className="cip__footer">
          <div className="cip__chars-row">
            {characters.map((c, idx) => {
              const col = CHAR_COLORS[idx % CHAR_COLORS.length]
              const isActive = c.id === character.id
              return (
                <button
                  key={c.id}
                  className={`cip__char${isActive ? ' cip__char--active' : ''}`}
                  style={{ background: col.bg, borderColor: col.border }}
                  onClick={() => { onSwitchCharacter(c.id); onClose() }}
                  title={c.name}
                >
                  {c.avatar ? <img src={c.avatar} alt={c.name} /> : c.name.slice(0, 1)}
                </button>
              )
            })}
          </div>
          <button className="cip__new-char-btn" onClick={() => { onClose(); onNewChar() }}>
            + 新建角色
          </button>
          <button className="cip__group-create-btn" disabled>
            创建群组（即将推出）
          </button>
        </div>

      </div>
    </>
  )
}
