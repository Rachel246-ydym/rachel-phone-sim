import { useState } from 'react'
import { useAppDispatch, useAppState } from '../../store/AppContext'
import { useTheme } from '../../hooks/useTheme'
import { getAll } from '../../services/storage'
import type { Archive, Memory, Message } from '../../types'
import { THEMES } from '../../services/theme'
import ApiSettings from './ApiSettings'
import DisplaySettings from './DisplaySettings'
import CharProfile from '../Chat/CharProfile'
import MemoryCore from '../Chat/MemoryCore'
import './Profile.css'

type ProfileView = 'menu' | 'apiSettings' | 'displaySettings' | 'charProfile' | 'memoryCore'

const RELATIONSHIP_LABELS: Record<string, string> = {
  lover: '恋人',
  friend: '好友',
  family: '家人',
}

export default function ProfileModule() {
  const [view, setView] = useState<ProfileView>('menu')
  const { characters, activeCharacterId, apiConfigs, displaySettings } = useAppState()
  const dispatch = useAppDispatch()
  const { themeMode, toggleTheme } = useTheme()

  const activeChar = characters.find((c) => c.id === activeCharacterId) ?? characters[0] ?? null
  const primaryConfig = apiConfigs.find((c) => c.isPrimary)
  const currentTheme = THEMES.find((t) => t.id === (displaySettings.themeId ?? 'green'))

  const personaSub = activeChar?.persona
    ? activeChar.persona.slice(0, 18) + (activeChar.persona.length > 18 ? '…' : '')
    : '未设置'
  const relationSub = activeChar?.relationship ? RELATIONSHIP_LABELS[activeChar.relationship] ?? '好友' : '好友'
  const styleSub = activeChar?.speakingStyle
    ? activeChar.speakingStyle.slice(0, 15) + (activeChar.speakingStyle.length > 15 ? '…' : '')
    : '未设置'
  const tempSub = `Temperature ${activeChar?.modelParams.temperature ?? 0.8}`
  const memorySub = `注入 ${activeChar?.modelParams.memoryCount ?? 20} 条`
  const autoBehaviorSub = (() => {
    const ab = activeChar?.autoBehavior
    if (!ab) return '未配置'
    const parts: string[] = []
    if (ab.autoSend?.enabled) parts.push('定时消息')
    if (ab.autoDiary?.enabled) parts.push('日记')
    if (ab.autoMoments?.enabled) parts.push('朋友圈')
    return parts.length > 0 ? parts.join(' · ') : '未启用'
  })()
  const apiSub = primaryConfig ? `${primaryConfig.model}` : '未配置'

  function openMemoryCore() {
    if (activeChar) {
      dispatch({ type: 'chat/setActiveCharacter', characterId: activeChar.id })
    }
    setView('memoryCore')
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
  if (view === 'displaySettings') return <DisplaySettings onBack={() => setView('menu')} />
  if (view === 'charProfile') return <CharProfile onBack={() => setView('menu')} />
  if (view === 'memoryCore') return <MemoryCore onBack={() => setView('menu')} />

  return (
    <div className="pm">
      <div className="pm__scroll">
        <h1 className="pm__page-title">我的</h1>

        {/* Character hero */}
        <div className="pm__hero">
          <div className="pm__avatar">
            {activeChar?.avatar
              ? <img src={activeChar.avatar} alt={activeChar.name} className="pm__avatar-img" />
              : <span className="pm__avatar-text">{(activeChar?.name ?? '角').slice(0, 1)}</span>
            }
          </div>
          <h2 className="pm__char-name">{activeChar?.name ?? '未命名角色'}</h2>
          <p className="pm__char-status">你的 AI 伙伴 · {activeChar?.online !== false ? '在线' : '离线'}</p>
          <div className="pm__stats">
            <div className="pm__stat">
              <span className="pm__stat-num">105</span>
              <span className="pm__stat-label">Days</span>
            </div>
            <div className="pm__stat">
              <span className="pm__stat-num">2.4k</span>
              <span className="pm__stat-label">Messages</span>
            </div>
            <div className="pm__stat">
              <span className="pm__stat-num">48</span>
              <span className="pm__stat-label">Memories</span>
            </div>
          </div>
        </div>

        {/* CHARACTER */}
        <div className="pm__section">
          <p className="pm__section-title">CHARACTER</p>
          <div className="pm__card">
            <button className="pm__row" onClick={() => setView('charProfile')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-primary-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 3.5C5.6 3.5 4 5.1 4 7v5c0 3.3 3.6 6 8 6s8-2.7 8-6V7c0-1.9-1.6-3.5-3.5-3.5" />
                  <path d="M9.5 9.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5z" />
                  <path d="M15.5 9.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5z" />
                  <path d="M9.5 14s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">人设</span>
                <span className="pm__row-sub">{personaSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
            <div className="pm__divider" />
            <button className="pm__row" onClick={() => setView('charProfile')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-lavender-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-lavender)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">关系状态</span>
                <span className="pm__row-sub">{relationSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
            <div className="pm__divider" />
            <button className="pm__row" onClick={() => setView('charProfile')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-amber-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">说话风格</span>
                <span className="pm__row-sub">{styleSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
          </div>
        </div>

        {/* INTELLIGENCE */}
        <div className="pm__section">
          <p className="pm__section-title">INTELLIGENCE</p>
          <div className="pm__card">
            <button className="pm__row" onClick={() => setView('charProfile')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-sage-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">创造力</span>
                <span className="pm__row-sub">{tempSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
            <div className="pm__divider" />
            <button className="pm__row" onClick={openMemoryCore}>
              <div className="pm__icon-box" style={{ background: 'var(--color-primary-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
                  <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">记忆系统</span>
                <span className="pm__row-sub">{memorySub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
            <div className="pm__divider" />
            <button className="pm__row" onClick={() => setView('charProfile')}>
              <div className="pm__icon-box" style={{ background: 'var(--color-lavender-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-lavender)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="pm__row-text">
                <span className="pm__row-title">自动行为</span>
                <span className="pm__row-sub">{autoBehaviorSub}</span>
              </div>
              <span className="pm__arrow">›</span>
            </button>
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

        {/* DISPLAY */}
        <div className="pm__section">
          <p className="pm__section-title">DISPLAY</p>
          <div className="pm__card">
            {/* Dark mode — toggle replaces arrow */}
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
            <button className="pm__row" onClick={() => setView('displaySettings')}>
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
              <span className="pm__arrow">›</span>
            </button>
          </div>
        </div>

        <p className="pm__footer">Lumi Phone · v2.0</p>
      </div>
    </div>
  )
}
