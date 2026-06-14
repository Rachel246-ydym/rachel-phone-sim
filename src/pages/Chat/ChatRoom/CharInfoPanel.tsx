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

  const today = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

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
        <div className="char-info-panel__hero">
          <button className="char-info-panel__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
          <div className="char-info-panel__avatar">
            {character.avatar ? (
              <img src={character.avatar} alt={character.name} />
            ) : (
              character.name.slice(0, 1)
            )}
          </div>
          <p className="char-info-panel__name">{character.name}</p>
          <p className="char-info-panel__status">
            <span
              className={`char-info-panel__dot${character.online ? ' char-info-panel__dot--online' : ''}`}
            />
            {character.online ? '在线' : '离线'}
          </p>
        </div>

        <div className="char-info-panel__card">
          <div className="char-info-panel__card-row">
            <span className="char-info-panel__card-label">今日</span>
            <span className="char-info-panel__card-value">{today}</span>
          </div>
          <div className="char-info-panel__card-row">
            <span className="char-info-panel__card-label">模型</span>
            <span className="char-info-panel__card-value">
              {primaryConfig?.model ?? '未配置'}
            </span>
          </div>
          <div className="char-info-panel__card-row">
            <span className="char-info-panel__card-label">今日 Tokens</span>
            <span className="char-info-panel__card-value">{todayTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className="char-info-panel__entries">
          <button className="char-info-panel__entry" onClick={() => {}}>
            <span>动态</span>
            <span className="char-info-panel__badge">即将推出</span>
          </button>
          <button
            className="char-info-panel__entry"
            onClick={() => {
              onClose()
              onOpenMemory()
            }}
          >
            <span>重要时刻</span>
            <span className="char-info-panel__arrow">›</span>
          </button>
          <button
            className="char-info-panel__entry"
            onClick={() => {
              onClose()
              onOpenCharProfile()
            }}
          >
            <span>关于我和TA</span>
            <span className="char-info-panel__arrow">›</span>
          </button>
          <div className="char-info-panel__entry">
            <span>动作描写</span>
            <button
              className={`char-info-panel__toggle${actionEnabled ? ' char-info-panel__toggle--on' : ''}`}
              onClick={() => void toggleActionDesc()}
            >
              {actionEnabled ? '开' : '关'}
            </button>
          </div>
        </div>

        <div className="char-info-panel__chars">
          <p className="char-info-panel__chars-title">角色列表</p>
          <div className="char-info-panel__chars-row">
            {characters.map((c) => (
              <button
                key={c.id}
                className={`char-info-panel__char-thumb${c.id === character.id ? ' char-info-panel__char-thumb--active' : ''}`}
                onClick={() => {
                  onSwitchCharacter(c.id)
                  onClose()
                }}
                title={c.name}
              >
                {c.avatar ? <img src={c.avatar} alt={c.name} /> : c.name.slice(0, 1)}
              </button>
            ))}
            <button
              className="char-info-panel__char-thumb char-info-panel__char-thumb--add"
              onClick={() => {
                onClose()
                onNewChar()
              }}
              title="新建角色"
            >
              ＋
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
