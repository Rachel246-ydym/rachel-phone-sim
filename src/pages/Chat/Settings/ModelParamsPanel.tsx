import type { ModelParams, ReplyMode } from '../../../types'

interface Props {
  params: ModelParams
  onChange: (p: ModelParams) => void
  showTitle?: boolean
  hideMemoryCount?: boolean
}

const REPLY_MODES: { value: ReplyMode; label: string }[] = [
  { value: 'manual', label: '手动' },
  { value: 'auto-interruptible', label: '自动可打断' },
  { value: 'auto-uninterruptible', label: '自动不打断' },
]

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

export default function ModelParamsPanel({ params, onChange, showTitle = true, hideMemoryCount = false }: Props) {
  const replyMode = params.replyMode ?? 'manual'

  function set<K extends keyof ModelParams>(key: K, value: ModelParams[K]) {
    onChange({ ...params, [key]: value })
  }

  function handleMinReplies(v: number) {
    onChange({ ...params, minReplies: v, maxReplies: Math.max(params.maxReplies, v) })
  }

  function handleMaxReplies(v: number) {
    onChange({ ...params, maxReplies: v, minReplies: Math.min(params.minReplies, v) })
  }

  return (
    <div className="chat-settings__section">
      {showTitle && <p className="chat-settings__section-title">模型参数</p>}

      {/* Reply mode */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">回复模式</span>
        </div>
        <div className="chat-settings__radio-group">
          {REPLY_MODES.map(({ value, label }) => (
            <button
              key={value}
              className={`chat-settings__radio-btn${replyMode === value ? ' chat-settings__radio-btn--active' : ''}`}
              onClick={() => set('replyMode', value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">温度 Temperature</span>
          <span className="chat-settings__value">{params.temperature.toFixed(2)}</span>
        </div>
        <input
          type="range"
          className="chat-settings__slider"
          min={0} max={2} step={0.05}
          value={params.temperature}
          onChange={(e) => set('temperature', parseFloat(e.target.value))}
        />
      </div>

      {/* Top P */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">Top P</span>
          <span className="chat-settings__value">{params.topP.toFixed(2)}</span>
        </div>
        <input
          type="range"
          className="chat-settings__slider"
          min={0} max={1} step={0.05}
          value={params.topP}
          onChange={(e) => set('topP', parseFloat(e.target.value))}
        />
      </div>

      {/* Max tokens */}
      <div className="chat-settings__row">
        <span className="chat-settings__label">最大输出 Token 数</span>
        <input
          type="number"
          className="chat-settings__number"
          min={100} max={32768} step={256}
          value={params.maxTokens}
          onChange={(e) => set('maxTokens', Math.max(100, parseInt(e.target.value) || 100))}
        />
      </div>

      {/* Context limit */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">上下文消息数量上限</span>
          <span className="chat-settings__value">{params.contextLimit} 条</span>
        </div>
        <input
          type="range"
          className="chat-settings__slider"
          min={1} max={100} step={1}
          value={params.contextLimit}
          onChange={(e) => set('contextLimit', parseInt(e.target.value))}
        />
      </div>

      {/* Stream */}
      <div className="chat-settings__row">
        <span className="chat-settings__label">流式输出</span>
        <Toggle checked={params.stream} onToggle={() => set('stream', !params.stream)} />
      </div>

      {/* Min replies */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">最少回复条数</span>
          <span className="chat-settings__value">{params.minReplies} 条</span>
        </div>
        <input
          type="range"
          className="chat-settings__slider"
          min={1} max={10} step={1}
          value={params.minReplies}
          onChange={(e) => handleMinReplies(parseInt(e.target.value))}
        />
      </div>

      {/* Max replies */}
      <div className="chat-settings__row chat-settings__row--col">
        <div className="chat-settings__label-row">
          <span className="chat-settings__label">最多回复条数</span>
          <span className="chat-settings__value">{params.maxReplies} 条</span>
        </div>
        <input
          type="range"
          className="chat-settings__slider"
          min={1} max={10} step={1}
          value={params.maxReplies}
          onChange={(e) => handleMaxReplies(parseInt(e.target.value))}
        />
      </div>

      {/* Memory count */}
      {!hideMemoryCount && (
        <div className="chat-settings__row chat-settings__row--col">
          <div className="chat-settings__label-row">
            <span className="chat-settings__label">注入记忆条数</span>
            <span className="chat-settings__value">{params.memoryCount ?? 20} 条</span>
          </div>
          <input
            type="range"
            className="chat-settings__slider"
            min={10} max={100} step={1}
            value={params.memoryCount ?? 20}
            onChange={(e) => set('memoryCount', parseInt(e.target.value))}
          />
        </div>
      )}
    </div>
  )
}
