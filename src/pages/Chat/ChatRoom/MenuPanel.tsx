import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { put } from '../../../services/storage'
import { THEMES, applyTheme } from '../../../services/theme'
import type { Message, ThemeId } from '../../../types'

interface MenuPanelProps {
  open: boolean
  messages: Message[]
  characterName: string
  onClose: () => void
  onOpenMemory: () => void
}

export default function MenuPanel({
  open,
  messages,
  characterName,
  onClose,
  onOpenMemory,
}: MenuPanelProps) {
  const { displaySettings } = useAppState()
  const dispatch = useAppDispatch()
  const currentTheme = displaySettings.themeId ?? 'green'

  async function handleTheme(themeId: ThemeId) {
    applyTheme(themeId)
    const settings = { ...displaySettings, themeId }
    await put('settings', { id: 'displaySettings', value: settings })
    dispatch({ type: 'profile/setDisplaySettings', settings })
  }

  function handleExport() {
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleString('zh-CN')}] ${m.role === 'user' ? '我' : characterName}：${m.content}`,
      )
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${characterName}-聊天记录.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {open && <div className="panel-mask" onClick={onClose} />}
      <div className={`menu-panel${open ? ' menu-panel--open' : ''}`}>
        <div className="menu-panel__header">
          <span className="menu-panel__title">设置</span>
          <button className="menu-panel__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className="menu-panel__section">
          <button
            className="menu-panel__item"
            onClick={() => {
              onClose()
              onOpenMemory()
            }}
          >
            <span className="menu-panel__icon">🧠</span>
            <span>记忆核心</span>
            <span className="menu-panel__arrow">›</span>
          </button>
          <button className="menu-panel__item" onClick={handleExport}>
            <span className="menu-panel__icon">📤</span>
            <span>导出聊天数据</span>
          </button>
        </div>
        <div className="menu-panel__section">
          <p className="menu-panel__section-title">外观主题</p>
          <div className="menu-panel__themes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`menu-panel__swatch${currentTheme === t.id ? ' menu-panel__swatch--active' : ''}`}
                style={{ background: t.swatch }}
                onClick={() => void handleTheme(t.id)}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
