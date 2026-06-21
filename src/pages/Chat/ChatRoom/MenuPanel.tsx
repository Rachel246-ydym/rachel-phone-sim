interface MenuPanelProps {
  open: boolean
  onClose: () => void
  onOpenCharProfile: () => void
  onOpenMemory: () => void
}

export default function MenuPanel({ open, onClose, onOpenCharProfile, onOpenMemory }: MenuPanelProps) {
  function go(action: () => void) {
    onClose()
    action()
  }

  return (
    <>
      {open && <div className="panel-mask" onClick={onClose} />}
      <div className={`menu-panel${open ? ' menu-panel--open' : ''}`}>
        <div className="menu-panel__header">
          <span className="menu-panel__title">角色设置</span>
          <button className="menu-panel__close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* CHARACTER */}
        <div className="menu-panel__section">
          <p className="menu-panel__section-label">CHARACTER</p>
          <button className="menu-panel__row" onClick={() => go(onOpenCharProfile)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-primary-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 3.5C5.6 3.5 4 5.1 4 7v5c0 3.3 3.6 6 8 6s8-2.7 8-6V7c0-1.9-1.6-3.5-3.5-3.5" />
                <circle cx="9" cy="9.5" r="0.5" fill="var(--color-primary)" />
                <circle cx="15" cy="9.5" r="0.5" fill="var(--color-primary)" />
                <path d="M9.5 14s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
              </svg>
            </div>
            <span className="menu-panel__row-title">人物设定</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
          <div className="menu-panel__row-divider" />
          <button className="menu-panel__row" onClick={() => go(onOpenCharProfile)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-lavender-light)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-lavender)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="menu-panel__row-title">关系状态</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
          <div className="menu-panel__row-divider" />
          <button className="menu-panel__row" onClick={() => go(onOpenCharProfile)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-amber-light)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <span className="menu-panel__row-title">说话风格</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
        </div>

        {/* INTELLIGENCE */}
        <div className="menu-panel__section">
          <p className="menu-panel__section-label">INTELLIGENCE</p>
          <button className="menu-panel__row" onClick={() => go(onOpenCharProfile)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-sage-light)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            </div>
            <span className="menu-panel__row-title">创造力</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
          <div className="menu-panel__row-divider" />
          <button className="menu-panel__row" onClick={() => go(onOpenMemory)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-primary-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className="menu-panel__row-title">记忆系统</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
          <div className="menu-panel__row-divider" />
          <button className="menu-panel__row" onClick={() => go(onOpenCharProfile)}>
            <div className="menu-panel__icon-box" style={{ background: 'var(--color-lavender-light)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-lavender)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="menu-panel__row-title">自动行为</span>
            <span className="menu-panel__row-arrow">›</span>
          </button>
        </div>
      </div>
    </>
  )
}
