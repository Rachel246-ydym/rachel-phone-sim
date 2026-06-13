import { useEffect, useRef, useState, type ReactNode, type ChangeEvent } from 'react'
import type { AutoBehaviorSettings, Character, ModelParams } from '../../../types'
import { fileToAvatar } from './avatar'
import { get } from '../../../services/storage'
import ModelParamsPanel from '../Settings/ModelParamsPanel'
import AutoBehaviorPanel, { type BranchOption } from '../Settings/AutoBehaviorPanel'
import '../Settings/ChatSettings.css'

export interface CharacterDraft {
  name: string
  nickname: string
  avatar: string | null
  persona: string
  heartVoiceEnabled: boolean
  heartVoiceMode: 'topbar' | 'notification'
  modelParams: ModelParams
  autoBehavior: AutoBehaviorSettings
  autoSummary: { enabled: boolean; every: number }
}

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  minReplies: 1,
  maxReplies: 3,
  temperature: 0.8,
  topP: 0.9,
  maxTokens: 2048,
  stream: true,
  contextLimit: 20,
  timeAware: true,
  memoryCount: 20,
  replyMode: 'manual',
}

const DEFAULT_AUTO_BEHAVIOR: AutoBehaviorSettings = {
  autoSend: { enabled: false, intervalMinutes: 60 },
  autoDiary: { enabled: false, time: '08:00', branchId: null },
  autoMoments: { enabled: false, time: '20:00', branchId: null },
}

interface CharacterFormProps {
  initial: Character | null
  branches: BranchOption[]
  onSave: (draft: CharacterDraft) => Promise<void>
  onDelete?: () => void
  onClearMessages?: () => void
  onViewHeartVoices?: () => void
  onViewMemory?: () => void
}

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <label className="chat-settings__toggle-wrap" onClick={onToggle}>
      <input type="checkbox" className="chat-settings__toggle-input" checked={checked} onChange={onToggle} />
      <span className="chat-settings__toggle-track" />
      <span className="chat-settings__toggle-thumb" />
    </label>
  )
}

function Coll({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="cf__section">
      <summary className="cf__section-head">
        <span>{title}</span>
        <span className="cf__section-arrow">›</span>
      </summary>
      <div className="cf__section-body">{children}</div>
    </details>
  )
}

export default function CharacterForm({
  initial,
  branches,
  onSave,
  onDelete,
  onClearMessages,
  onViewHeartVoices,
  onViewMemory,
}: CharacterFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null)
  const [persona, setPersona] = useState(initial?.persona ?? '')
  const [hvEnabled, setHvEnabled] = useState(initial?.heartVoiceEnabled ?? false)
  const [hvMode, setHvMode] = useState<'topbar' | 'notification'>(initial?.heartVoiceMode ?? 'topbar')
  const [params, setParams] = useState<ModelParams>(initial?.modelParams ?? DEFAULT_MODEL_PARAMS)
  const [autoBehavior, setAutoBehavior] = useState<AutoBehaviorSettings>(
    initial?.autoBehavior ?? DEFAULT_AUTO_BEHAVIOR,
  )
  const [autoSummary, setAutoSummary] = useState({ enabled: false, every: 20 })
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initial?.id) return
    void get<{ id: string; value: { enabled: boolean; every: number } }>(
      'settings',
      `memory_auto_${initial.id}`,
    ).then((entry) => {
      if (entry?.value) setAutoSummary(entry.value)
    })
  }, [initial?.id])

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(await fileToAvatar(file))
    e.target.value = ''
  }

  async function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        nickname: nickname.trim(),
        avatar,
        persona: persona.trim(),
        heartVoiceEnabled: hvEnabled,
        heartVoiceMode: hvMode,
        modelParams: params,
        autoBehavior,
        autoSummary,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="char-form">
      {/* ── 基本信息 ── */}
      <button
        className="char-form__avatar"
        onClick={() => fileInputRef.current?.click()}
        aria-label="上传头像"
      >
        {avatar ? <img src={avatar} alt="角色头像" /> : <span>上传头像</span>}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

      <label className="char-form__field">
        <span className="char-form__label">角色名称</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：江浔" />
      </label>
      <label className="char-form__field">
        <span className="char-form__label">用户昵称（角色怎么称呼你）</span>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="如：京京" />
      </label>
      <label className="char-form__field">
        <span className="char-form__label">角色人设与背景</span>
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          rows={10}
          placeholder="外形、性格、背景故事……"
        />
      </label>

      {/* ── 模型参数 ── */}
      <Coll title="模型参数">
        <ModelParamsPanel params={params} onChange={setParams} showTitle={false} hideMemoryCount />
      </Coll>

      {/* ── 记忆设置 ── */}
      <Coll title="记忆设置">
        <div className="chat-settings__row chat-settings__row--col">
          <div className="chat-settings__label-row">
            <span className="chat-settings__label">注入记忆条数</span>
            <span className="chat-settings__value">{params.memoryCount ?? 20} 条</span>
          </div>
          <input
            type="range" className="chat-settings__slider"
            min={10} max={100} step={1}
            value={params.memoryCount ?? 20}
            onChange={(e) => setParams({ ...params, memoryCount: parseInt(e.target.value) })}
          />
        </div>
        <div className="chat-settings__row">
          <span className="chat-settings__label">自动生成核心记忆</span>
          <Toggle
            checked={autoSummary.enabled}
            onToggle={() => setAutoSummary((s) => ({ ...s, enabled: !s.enabled }))}
          />
        </div>
        {autoSummary.enabled && (
          <div className="cf__sub-row">
            <span className="chat-settings__label">每</span>
            <input
              className="chat-settings__number" type="number" min={1} max={100}
              value={autoSummary.every}
              onChange={(e) => setAutoSummary((s) => ({ ...s, every: Number(e.target.value) }))}
            />
            <span className="chat-settings__label">轮对话总结一次</span>
          </div>
        )}
        {onViewMemory && (
          <button className="cf__view-btn" onClick={onViewMemory}>查看记忆核心 ›</button>
        )}
      </Coll>

      {/* ── 心声设置 ── */}
      <Coll title="心声设置">
        <div className="chat-settings__row">
          <span className="chat-settings__label">启用心声</span>
          <Toggle checked={hvEnabled} onToggle={() => setHvEnabled((v) => !v)} />
        </div>
        {hvEnabled && (
          <div className="chat-settings__row chat-settings__row--col">
            <span className="chat-settings__label">显示模式</span>
            <div className="chat-settings__radio-group">
              {(['topbar', 'notification'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`chat-settings__radio-btn${hvMode === mode ? ' chat-settings__radio-btn--active' : ''}`}
                  onClick={() => setHvMode(mode)}
                >
                  {mode === 'topbar' ? '顶部栏' : '通知弹窗'}
                </button>
              ))}
            </div>
          </div>
        )}
        {onViewHeartVoices && (
          <button className="cf__view-btn" onClick={onViewHeartVoices}>查看心声记录 ›</button>
        )}
      </Coll>

      {/* ── 自动行为 ── */}
      <Coll title="自动行为">
        <AutoBehaviorPanel
          settings={autoBehavior}
          branches={branches}
          onChange={setAutoBehavior}
          showTitle={false}
        />
      </Coll>

      {/* ── 危险操作（仅编辑模式） ── */}
      {(onClearMessages || onDelete) && (
        <Coll title="危险操作">
          <div className="cf__danger-body">
            {onClearMessages && (
              <button className="cf__danger-btn" onClick={onClearMessages}>
                清除聊天记录
              </button>
            )}
            {onDelete && (
              <button className="cf__danger-btn cf__danger-btn--red" onClick={onDelete}>
                删除角色
              </button>
            )}
          </div>
        </Coll>
      )}

      <button
        className="char-form__save"
        onClick={() => void handleSave()}
        disabled={!name.trim() || saving}
      >
        {saving ? '保存中…' : '保存'}
      </button>
    </div>
  )
}
