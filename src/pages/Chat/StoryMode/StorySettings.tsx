import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import type { NarrativePerson } from '../../../types'
import type { StorySettingsData, LongNarrativeSettings, ShortRPSettings } from './useStorySettings'
import { THEME_VARS } from './useStorySettings'
import NumberStepper from './NumberStepper'

interface StorySettingsProps {
  initial: StorySettingsData
  onBack: () => void
  onSave: (data: StorySettingsData) => Promise<void>
}

const STYLE_EXAMPLE = `写实细腻，注重感官细节。环境描写沉浸，情绪含蓄不直白。对话自然贴近日常口语，避免书面化。节奏舒缓，留白充分。`

const CUSTOM_PROMPT_EXAMPLE = `1. 扩写剧情时不要出现括号和你的思考过程，直接输出正文。
2. 角色对话不超过三句，多用动作和神态代替语言。
3. 禁止替用户角色说话或做决定。`

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
              <p className="story-settings__section-desc">描述你希望的叙事风格和文字质感</p>
              <textarea
                className="story-settings__textarea"
                rows={4}
                placeholder="描述叙事风格，例如：笔触细腻、侧重心理描写…"
                value={longForm.styleGuide}
                onChange={(e) => setLong('styleGuide', e.target.value)}
              />
              {!longForm.styleGuide && (
                <button
                  className="story-settings__example-link"
                  onClick={() => setLong('styleGuide', STYLE_EXAMPLE)}
                >
                  📝 查看示例
                </button>
              )}
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label">目标字数</label>
                <NumberStepper
                  value={longForm.targetWords}
                  min={100}
                  max={3000}
                  step={100}
                  onChange={(v) => setLong('targetWords', v)}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label">上下文读取上限（段）</label>
                <NumberStepper
                  value={longForm.contextLimit}
                  min={1}
                  max={30}
                  step={1}
                  onChange={(v) => setLong('contextLimit', v)}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label">每几条自动总结</label>
                <NumberStepper
                  value={longForm.autoSummaryEvery}
                  min={3}
                  max={20}
                  step={1}
                  onChange={(v) => setLong('autoSummaryEvery', v)}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <h2 className="story-settings__section-title">自定义指令（可选）</h2>
              <p className="story-settings__section-desc">添加额外的创作规则或限制</p>
              <textarea
                className="story-settings__textarea"
                rows={3}
                placeholder="可选。添加额外的叙事规则或文风要求…"
                value={longForm.customPrompt ?? ''}
                onChange={(e) => setLong('customPrompt', e.target.value)}
              />
              {!longForm.customPrompt && (
                <button
                  className="story-settings__example-link"
                  onClick={() => setLong('customPrompt', CUSTOM_PROMPT_EXAMPLE)}
                >
                  📝 查看示例
                </button>
              )}
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
                <label className="story-settings__label">回复字数上限</label>
                <NumberStepper
                  value={shortForm.replyWordLimit}
                  min={30}
                  max={200}
                  step={10}
                  onChange={(v) => setShort('replyWordLimit', v)}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <div className="story-settings__row">
                <label className="story-settings__label">上下文读取上限（条）</label>
                <NumberStepper
                  value={shortForm.contextLimit}
                  min={1}
                  max={30}
                  step={1}
                  onChange={(v) => setShort('contextLimit', v)}
                />
              </div>
            </section>

            <section className="story-settings__section">
              <h2 className="story-settings__section-title">自定义指令（可选）</h2>
              <p className="story-settings__section-desc">添加额外的创作规则或限制</p>
              <textarea
                className="story-settings__textarea"
                rows={3}
                placeholder="可选。添加额外的对话规则或要求…"
                value={shortForm.customPrompt ?? ''}
                onChange={(e) => setShort('customPrompt', e.target.value)}
              />
              {!shortForm.customPrompt && (
                <button
                  className="story-settings__example-link"
                  onClick={() => setShort('customPrompt', CUSTOM_PROMPT_EXAMPLE)}
                >
                  📝 查看示例
                </button>
              )}
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
