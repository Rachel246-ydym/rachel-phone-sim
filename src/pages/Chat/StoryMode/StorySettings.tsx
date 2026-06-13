import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import type { NarrativePerson, StoryTheme } from '../../../types'
import type { StorySettingsData } from './useStorySettings'

interface StorySettingsProps {
  initial: StorySettingsData
  onBack: () => void
  onSave: (data: StorySettingsData) => Promise<void>
}

const THEMES: { value: StoryTheme; label: string; bg: string; fg: string }[] = [
  { value: 'dark', label: '暗黑', bg: '#121214', fg: '#f0f0f2' },
  { value: 'light', label: '白底', bg: '#ffffff', fg: '#1a1a1e' },
  { value: 'cream', label: '米白', bg: '#f5f0e8', fg: '#2a2a1e' },
  { value: 'navy', label: '深蓝', bg: '#0d1b2a', fg: '#d6e4f0' },
]

const PERSONS: { value: NarrativePerson; label: string }[] = [
  { value: 'first', label: '第一人称' },
  { value: 'third', label: '第三人称' },
  { value: 'mixed', label: '混合视角' },
]

export default function StorySettings({ initial, onBack, onSave }: StorySettingsProps) {
  const [form, setForm] = useState<StorySettingsData>(initial)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <SubPage title="剧情设定" onBack={onBack}>
      <div className="story-settings">
        <section className="story-settings__section">
          <h2 className="story-settings__section-title">外观主题</h2>
          <div className="story-settings__theme-row">
            {THEMES.map((t) => (
              <button
                key={t.value}
                className={`story-settings__theme-chip${form.theme === t.value ? ' story-settings__theme-chip--active' : ''}`}
                style={{ background: t.bg, color: t.fg }}
                onClick={() => setForm((f) => ({ ...f, theme: t.value }))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="story-settings__section">
          <div className="story-settings__row">
            <span className="story-settings__label">默认加入角色记忆</span>
            <button
              className={`story-settings__toggle${form.useCharMemory ? ' story-settings__toggle--on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, useCharMemory: !f.useCharMemory }))}
              aria-label={form.useCharMemory ? '已开启' : '已关闭'}
            >
              <span className="story-settings__toggle-knob" />
            </button>
          </div>
        </section>

        <section className="story-settings__section">
          <h2 className="story-settings__section-title">叙事人称</h2>
          <div className="story-settings__chip-row">
            {PERSONS.map((p) => (
              <button
                key={p.value}
                className={`story-settings__chip${form.narrativePerson === p.value ? ' story-settings__chip--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, narrativePerson: p.value }))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="story-settings__section">
          <h2 className="story-settings__section-title">文风描述</h2>
          <textarea
            className="story-settings__textarea"
            rows={4}
            placeholder="描述叙事风格，例如：笔触细腻、侧重心理描写、带有文学感…"
            value={form.styleGuide}
            onChange={(e) => setForm((f) => ({ ...f, styleGuide: e.target.value }))}
          />
        </section>

        <section className="story-settings__section">
          <div className="story-settings__row">
            <label className="story-settings__label" htmlFor="ss-target-words">
              目标字数
            </label>
            <input
              id="ss-target-words"
              className="story-settings__number"
              type="number"
              min={100}
              max={10000}
              step={100}
              value={form.targetWords}
              onChange={(e) => setForm((f) => ({ ...f, targetWords: Number(e.target.value) }))}
            />
          </div>
        </section>

        <section className="story-settings__section">
          <div className="story-settings__row">
            <label className="story-settings__label" htmlFor="ss-auto-summary">
              每几条自动总结
            </label>
            <input
              id="ss-auto-summary"
              className="story-settings__number"
              type="number"
              min={1}
              max={20}
              step={1}
              value={form.autoSummaryEvery}
              onChange={(e) => setForm((f) => ({ ...f, autoSummaryEvery: Number(e.target.value) }))}
            />
          </div>
        </section>

        <div className="story-settings__footer">
          <button
            className="story-settings__save"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? '保存中…' : '保存设置'}
          </button>
        </div>

        {toast && <div className="story-settings__toast">设置已保存</div>}
      </div>
    </SubPage>
  )
}
