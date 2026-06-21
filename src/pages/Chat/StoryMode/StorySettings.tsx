import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import type { NarrativePerson, StoryTheme } from '../../../types'
import type { StorySettingsData, LongNarrativeSettings, ShortRPSettings } from './useStorySettings'
import { THEME_VARS } from './useStorySettings'

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

type SettingsTab = 'long' | 'short'

export default function StorySettings({ initial, onBack, onSave }: StorySettingsProps) {
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('long')
  const [longForm, setLongForm] = useState<LongNarrativeSettings>(initial.longNarrative)
  const [shortForm, setShortForm] = useState<ShortRPSettings>(initial.shortRP)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  function setLong<K extends keyof LongNarrativeSettings>(key: K, value: LongNarrativeSettings[K]) {
    setLongForm((f) => ({ ...f, [key]: value }))
  }

  function setShort<K extends keyof ShortRPSettings>(key: K, value: ShortRPSettings[K]) {
    setShortForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave({ longNarrative: longForm, shortRP: shortForm })
    setSaving(false)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <SubPage title="剧情设定" onBack={onBack}>
      <div className="story-settings">
        {/* Section tab switcher */}
        <div className="story-settings__section story-settings__section--tabs">
          <div className="story-mode-switcher">
            <button
              className={`story-mode-switcher__btn${settingsTab === 'long' ? ' story-mode-switcher__btn--active' : ''}`}
              onClick={() => setSettingsTab('long')}
            >
              长篇叙事设定
            </button>
            <button
              className={`story-mode-switcher__btn${settingsTab === 'short' ? ' story-mode-switcher__btn--active' : ''}`}
              onClick={() => setSettingsTab('short')}
            >
              短线下设定
            </button>
          </div>
        </div>

        {settingsTab === 'long' && (
          <>
            <section className="story-settings__section">
              <h2 className="story-settings__section-title">外观主题</h2>
              <div className="story-settings__theme-row">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    className={`story-settings__theme-chip${longForm.theme === t.value ? ' story-settings__theme-chip--active' : ''}`}
                    style={{ background: t.bg, color: t.fg }}
                    onClick={() => setLong('theme', t.value)}
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
                  className={`story-settings__toggle${longForm.useCharMemory ? ' story-settings__toggle--on' : ''}`}
                  onClick={() => setLong('useCharMemory', !longForm.useCharMemory)}
                >
                  <span className="story-settings__toggle-knob" />
                </button>
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <span className="story-settings__label">流式输出</span>
                <button
                  className={`story-settings__toggle${longForm.streamOutput ? ' story-settings__toggle--on' : ''}`}
                  onClick={() => setLong('streamOutput', !longForm.streamOutput)}
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
                    className={`story-settings__chip${longForm.narrativePerson === p.value ? ' story-settings__chip--active' : ''}`}
                    onClick={() => setLong('narrativePerson', p.value)}
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
                placeholder="描述叙事风格，例如：笔触细腻、侧重心理描写…"
                value={longForm.styleGuide}
                onChange={(e) => setLong('styleGuide', e.target.value)}
              />
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label" htmlFor="ss-target-words">目标字数</label>
                <input
                  id="ss-target-words" className="story-settings__number" type="number"
                  min={500} max={3000} step={100} value={longForm.targetWords}
                  onChange={(e) => setLong('targetWords', Number(e.target.value))}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label" htmlFor="ss-context-long">上下文读取上限（段）</label>
                <input
                  id="ss-context-long" className="story-settings__number" type="number"
                  min={1} max={30} step={1} value={longForm.contextLimit}
                  onChange={(e) => setLong('contextLimit', Number(e.target.value))}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label" htmlFor="ss-auto-summary">每几条自动总结</label>
                <input
                  id="ss-auto-summary" className="story-settings__number" type="number"
                  min={1} max={20} step={1} value={longForm.autoSummaryEvery}
                  onChange={(e) => setLong('autoSummaryEvery', Number(e.target.value))}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <h2 className="story-settings__section-title">自定义指令（可选）</h2>
              <textarea
                className="story-settings__textarea"
                rows={3}
                placeholder="可选。添加额外的叙事规则或文风要求…"
                value={longForm.customPrompt ?? ''}
                onChange={(e) => setLong('customPrompt', e.target.value)}
              />
            </section>
          </>
        )}

        {settingsTab === 'short' && (
          <>
            <section className="story-settings__section">
              <div className="story-settings__row">
                <span className="story-settings__label">默认加入角色记忆</span>
                <button
                  className={`story-settings__toggle${shortForm.useCharMemory ? ' story-settings__toggle--on' : ''}`}
                  onClick={() => setShort('useCharMemory', !shortForm.useCharMemory)}
                >
                  <span className="story-settings__toggle-knob" />
                </button>
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <span className="story-settings__label">流式输出</span>
                <button
                  className={`story-settings__toggle${shortForm.streamOutput ? ' story-settings__toggle--on' : ''}`}
                  onClick={() => setShort('streamOutput', !shortForm.streamOutput)}
                >
                  <span className="story-settings__toggle-knob" />
                </button>
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label" htmlFor="ss-reply-limit">回复字数上限</label>
                <input
                  id="ss-reply-limit" className="story-settings__number" type="number"
                  min={30} max={200} step={10} value={shortForm.replyWordLimit}
                  onChange={(e) => setShort('replyWordLimit', Number(e.target.value))}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label" htmlFor="ss-context-short">上下文读取上限（条）</label>
                <input
                  id="ss-context-short" className="story-settings__number" type="number"
                  min={1} max={30} step={1} value={shortForm.contextLimit}
                  onChange={(e) => setShort('contextLimit', Number(e.target.value))}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <h2 className="story-settings__section-title">自定义指令（可选）</h2>
              <textarea
                className="story-settings__textarea"
                rows={3}
                placeholder="可选。添加额外的对话规则或要求…"
                value={shortForm.customPrompt ?? ''}
                onChange={(e) => setShort('customPrompt', e.target.value)}
              />
            </section>
          </>
        )}

        <div className="story-settings__footer">
          <button className="story-settings__save" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '保存中…' : '保存设置'}
          </button>
        </div>

        {toast && <div className="story-settings__toast">设置已保存</div>}
      </div>
    </SubPage>
  )
}

export { THEME_VARS }
