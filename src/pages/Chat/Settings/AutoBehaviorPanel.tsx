import type { AutoBehaviorSettings, StoryBranch } from '../../../types'

export type BranchOption = StoryBranch & { storyTitle: string }

interface Props {
  settings: AutoBehaviorSettings
  branches: BranchOption[]
  onChange: (s: AutoBehaviorSettings) => void
  showTitle?: boolean
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <label className="chat-settings__toggle-wrap" onClick={onToggle}>
      <input
        type="checkbox"
        className="chat-settings__toggle-input"
        checked={checked}
        onChange={onToggle}
      />
      <span className="chat-settings__toggle-track" />
      <span className="chat-settings__toggle-thumb" />
    </label>
  )
}

function BranchSelect({
  value,
  branches,
  onChange,
}: {
  value: string | null
  branches: BranchOption[]
  onChange: (id: string | null) => void
}) {
  return (
    <select
      className="chat-settings__select"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">不绑定剧情线</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.storyTitle ? `《${b.storyTitle}》/ ${b.name}` : b.name}
        </option>
      ))}
    </select>
  )
}

export default function AutoBehaviorPanel({ settings, branches, onChange, showTitle = true }: Props) {
  function patchSend(patch: Partial<typeof settings.autoSend>) {
    onChange({ ...settings, autoSend: { ...settings.autoSend, ...patch } })
  }

  function patchDiary(patch: Partial<typeof settings.autoDiary>) {
    onChange({ ...settings, autoDiary: { ...settings.autoDiary, ...patch } })
  }

  function patchMoments(patch: Partial<typeof settings.autoMoments>) {
    onChange({ ...settings, autoMoments: { ...settings.autoMoments, ...patch } })
  }

  return (
    <div className="chat-settings__section">
      {showTitle && <p className="chat-settings__section-title">自动行为</p>}

      {/* Auto send */}
      <div className="chat-settings__row">
        <span className="chat-settings__label">自动发送消息</span>
        <Toggle
          checked={settings.autoSend.enabled}
          onToggle={() => patchSend({ enabled: !settings.autoSend.enabled })}
        />
      </div>
      {settings.autoSend.enabled && (
        <div className="chat-settings__sub">
          <div className="chat-settings__row chat-settings__row--col">
            <div className="chat-settings__label-row">
              <span className="chat-settings__label">发送间隔</span>
              <span className="chat-settings__value">
                {settings.autoSend.intervalMinutes} 分钟
              </span>
            </div>
            <input
              type="range"
              className="chat-settings__slider"
              min={60} max={120} step={5}
              value={settings.autoSend.intervalMinutes}
              onChange={(e) => patchSend({ intervalMinutes: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}

      {/* Auto diary */}
      <div className="chat-settings__row">
        <span className="chat-settings__label">自动生成日记</span>
        <Toggle
          checked={settings.autoDiary.enabled}
          onToggle={() => patchDiary({ enabled: !settings.autoDiary.enabled })}
        />
      </div>
      {settings.autoDiary.enabled && (
        <div className="chat-settings__sub">
          <div className="chat-settings__row">
            <span className="chat-settings__label">每日生成时间</span>
            <select
              className="chat-settings__select"
              style={{ maxWidth: 100 }}
              value={settings.autoDiary.time}
              onChange={(e) => patchDiary({ time: e.target.value })}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="chat-settings__row">
            <span className="chat-settings__label">绑定剧情线</span>
            <BranchSelect
              value={settings.autoDiary.branchId}
              branches={branches}
              onChange={(id) => patchDiary({ branchId: id })}
            />
          </div>
        </div>
      )}

      {/* Auto moments */}
      <div className="chat-settings__row">
        <span className="chat-settings__label">自动发送朋友圈</span>
        <Toggle
          checked={settings.autoMoments.enabled}
          onToggle={() => patchMoments({ enabled: !settings.autoMoments.enabled })}
        />
      </div>
      {settings.autoMoments.enabled && (
        <div className="chat-settings__sub">
          <div className="chat-settings__row">
            <span className="chat-settings__label">每日发送时间</span>
            <select
              className="chat-settings__select"
              style={{ maxWidth: 100 }}
              value={settings.autoMoments.time}
              onChange={(e) => patchMoments({ time: e.target.value })}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="chat-settings__row">
            <span className="chat-settings__label">绑定剧情线</span>
            <BranchSelect
              value={settings.autoMoments.branchId}
              branches={branches}
              onChange={(id) => patchMoments({ branchId: id })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
