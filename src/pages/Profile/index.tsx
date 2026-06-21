import { useEffect, useState } from 'react'
import { useAppDispatch, useAppState } from '../../store/AppContext'
import { useTheme } from '../../hooks/useTheme'
import { getAll, put } from '../../services/storage'
import type { Archive, Memory, Message, ThemeId } from '../../types'
import { THEMES, applyTheme } from '../../services/theme'
import ApiSettings from './ApiSettings'
import './Profile.css'

type ProfileView = 'menu' | 'apiSettings'

interface GlobalStats {
  totalChars: number
  totalMsgs: number
  totalMems: number
}

export default function ProfileModule() {
  const [view, setView] = useState<ProfileView>('menu')
  const [stats, setStats] = useState<GlobalStats>({ totalChars: 0, totalMsgs: 0, totalMems: 0 })
  const { characters, apiConfigs, displaySettings, userProfile } = useAppState()
  const dispatch = useAppDispatch()
  const { themeMode, toggleTheme } = useTheme()

  const primaryConfig = apiConfigs.find((c) => c.isPrimary)
  const currentTheme = THEMES.find((t) => t.id === (displaySettings.themeId ?? 'green'))
  const apiSub = primaryConfig ? `${primaryConfig.model}` : '未配置'

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAll<Message>('messages'),
      getAll<Memory>('memories'),
    ]).then(([msgs, mems]) => {
      if (cancelled) return
      setStats({ totalChars: characters.length, totalMsgs: msgs.length, totalMems: mems.length })
    })
    return () => { cancelled = true }
  }, [characters.length])

  async function handleTheme(themeId: ThemeId) {
    applyTheme(themeId)
    const settings = { ...displaySettings, themeId }
    await put('settings', { id: 'displaySettings', value: settings })
    dispatch({ type: 'profile/setDisplaySettings', settings })
  }

  async function handleExport() {
    const [messages, memories, archives] = await Promise.all([
      getAll<Message>('messages'),
      getAll<Memory>('memories'),
      getAll<Archive>('archives'),
    ])
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), messages, memories, archives }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumi-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (view === 'apiSettings') return <ApiSettings onBack={() => setView('menu')} />

  const userName = userProfile?.name ?? userProfile?.nickname ?? '用户'
  const userInitial = userName.slice(0, 1)

  return (
    <div className="pm">
      <div className="pm__scroll">
        <h1 className="pm__page-title">我的</h1>

        {/* User hero */}
        <div className="pm__hero">
          <div className="pm__avatar">
            <span className="pm__avatar-text">{userInitial}</span>
          </div>
          <h2 className="pm__char-name">{userName}</h2>
          <p className="pm__char-status">Lumi Phone · v2.0</p>
          <div className="pm__stats">
            <div className="pm__stat">
              <span className="pm__stat-num">{stats.totalChars}</span>
              <span className="pm__stat-label">角色</span>
            </div>
            <div className="pm__stat">
              <span className="pm__stat-num">{stats.totalMsgs}</span>
              <span className="pm__stat-label">消息</span>
            </div>
            <div className="pm__stat">
              <span className="pm__stat-num">{stats.totalMems}</span>
              <span className="pm__stat-label">记忆</span>
            </div>
          </div>
        </div>

        {/* DISPLAY */}
        <div className="pm__section">
          <p className="pm__section-title">DISPLAY</p>
          <div className="pm__card">
            <div className="pm__row pm__row--static">
              <div className="pm__icon-box" style={{ background: 'var(--color-slate-light)' }}>
                {themeMode === 'dark'
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-slate)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-slate)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                }
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">深色模式</span>
                <span className="pm__row-sub">{themeMode === 'dark' ? '已开启' : '已关闭'}</span>
              </div>
              <label className="pm__toggle">
                <input
                  type="checkbox"
                  className="pm__toggle-input"
                  checked={themeMode === 'dark'}
                  onChange={() => void toggleTheme()}
                />
                <span className="pm__toggle-track" />
                <span className="pm__toggle-thumb" />
              </label>
            </div>
            <div className="pm__divider" />
            <div className="pm__row pm__row--static">
              <div className="pm__icon-box" style={{ background: 'var(--color-slate-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-slate)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" />
                  <circle cx="17.5" cy="10.5" r=".5" />
                  <circle cx="8.5" cy="7.5" r=".5" />
                  <circle cx="6.5" cy="12.5" r=".5" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">主题色</span>
                <span className="pm__row-sub">{currentTheme?.label ?? '淡绿'}</span>
              </div>
            </div>
            <div className="pm__theme-swatches">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`pm__swatch${(displaySettings.themeId ?? 'green') === t.id ? ' pm__swatch--active' : ''}`}
                  style={{ background: t.swatch }}
                  onClick={() => void handleTheme(t.id)}
                  title={t.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* DATA */}
        <div className="pm__section">
          <p className="pm__section-title">DATA</p>
          <div className="pm__card">
            <button className="pm__row" onClick={() => void handleExport()}>
              <div className="pm__icon-box" style={{ background: 'var(--color-amber-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">导出数据</span>
                <span className="pm__row-sub">聊天记录 · 记忆 · 存档</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
            <div className="pm__divider" />
            <button className="pm__row" onClick={() => setView('apiSettings')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-sage-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">API 设置</span>
                <span className="pm__row-sub">{apiSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
          </div>
        </div>

        {/* ABOUT */}
        <div className="pm__section">
          <p className="pm__section-title">ABOUT</p>
          <div className="pm__card">
            <div className="pm__row pm__row--static">
              <div className="pm__icon-box" style={{ background: 'var(--color-sage-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">版本信息</span>
                <span className="pm__row-sub">Lumi Phone v2.0</span>
              </div>
            </div>
          </div>
        </div>

        <p className="pm__footer">Lumi Phone · v2.0</p>
      </div>
    </div>
  )
}
