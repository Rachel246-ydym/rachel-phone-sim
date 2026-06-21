import { useState, type ReactNode } from 'react'

export function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <label className="cf2-toggle" onClick={onToggle}>
      <input type="checkbox" className="cf2-toggle__input" checked={checked} onChange={onToggle} />
      <span className="cf2-toggle__track" />
      <span className="cf2-toggle__thumb" />
    </label>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cf2__section">
      <button className="cf2__section-head" onClick={() => setOpen((v) => !v)}>
        <span className="cf2__section-title">{title}</span>
        <svg
          className={`cf2__chevron${open ? ' cf2__chevron--open' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`cf2__section-body${open ? ' cf2__section-body--open' : ''}`}>
        <div className="cf2__section-inner">{children}</div>
      </div>
    </div>
  )
}
