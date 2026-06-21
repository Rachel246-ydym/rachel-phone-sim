import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { AutoBehaviorSettings, Character, ModelParams, Relationship } from '../../../types'
import { fileToAvatar } from './avatar'
import { get } from '../../../services/storage'
import ModelParamsPanel from '../Settings/ModelParamsPanel'
import AutoBehaviorPanel, { type BranchOption } from '../Settings/AutoBehaviorPanel'
import { Toggle, Section } from './CharFormSection'
import '../Settings/ChatSettings.css'
import './CharProfile.css'

export interface CharacterDraft {
  name: string
  nickname: string
  avatar: string | null
  persona: string
  speakingStyle: string
  relationship: Relationship
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

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'lover', label: '恋人' },
  { value: 'friend', label: '挚友' },
  { value: 'family', label: '家人' },
]

interface CharacterFormProps {
  initial: Character | null
  branches: BranchOption[]
  onBack: () => void
  onSave: (draft: CharacterDraft) => Promise<void>
  onDelete?: () => void
  onClearMessages?: () => void
  onViewHeartVoices?: () => void
  onViewMemory?: () => void
}


export default function CharacterForm({
  initial,
  branches,
  onBack,
  onSave,
  onDelete,
  onClearMessages,
  onViewHeartVoices,
  onViewMemory,
}: CharacterFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [relationship, setRelationship] = useState<Relationship>(initial?.relationship ?? 'lover')
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null)
  const [persona, setPersona] = useState(initial?.persona ?? '')
  const [speakingStyle, setSpeakingStyle] = useState(initial?.speakingStyle ?? '')
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
        speakingStyle: speakingStyle.trim(),
        relationship,
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
    <div className="cf2">
      {/* ── 顶栏 ── */}
      <header className="cf2__header">
        <button className="cf2__back" onClick={onBack} aria-label="返回">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="cf2__header-title">{initial ? '编辑档案' : '新建角色'}</h1>
        <button className="cf2__header-save" onClick={() => void handleSave()} disabled={!name.trim() || saving}>
          {saving ? '保存中' : '保存'}
        </button>
      </header>

      {/* ── 可滚动主体 ── */}
      <div className="cf2__body">
        {/* 头像 */}
        <div className="cf2__avatar-wrap">
          <button className="cf2__avatar" onClick={() => fileInputRef.current?.click()} aria-label="上传头像">
            {avatar
              ? <img src={avatar} alt="角色头像" className="cf2__avatar-img" />
              : <span className="cf2__avatar-initial">{name ? name.slice(0, 1) : '角'}</span>
            }
            <span className="cf2__avatar-edit" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        {/* BASIC */}
        <p className="cf2__group-label">BASIC</p>
        <div className="cf2__card">
          <div className="cf2__field">
            <span className="cf2__field-label">角色名称</span>
            <input className="cf2__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：江浔" />
          </div>
          <div className="cf2__field">
            <span className="cf2__field-label">用户昵称</span>
            <input className="cf2__input" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="角色怎么称呼你" />
          </div>
          <div className="cf2__field">
            <span className="cf2__field-label">关系状态</span>
            <div className="cf2__chips">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.value}
                  className={`cf2__chip${relationship === r.value ? ' cf2__chip--active' : ''}`}
                  onClick={() => setRelationship(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <p className="cf2__group-label">DETAILS</p>
        <div className="cf2__sections">

          <Section title="人设">
            <span className="cf2__field-label">角色性格与背景设定</span>
            <textarea className="cf2__textarea" value={persona} onChange={(e) => setPersona(e.target.value)}
              placeholder="描述角色的性格、背景、说话习惯…" style={{ minHeight: 100 }} />
          </Section>

          <Section title="说话风格">
            <span className="cf2__field-label">回复风格描述</span>
            <textarea className="cf2__textarea" value={speakingStyle} onChange={(e) => setSpeakingStyle(e.target.value)}
              placeholder="如：温和、偶尔引用文学作品、会用省略号" style={{ minHeight: 80 }} />
          </Section>

          <Section title="模型参数">
            <ModelParamsPanel params={params} onChange={setParams} showTitle={false} hideMemoryCount />
          </Section>

          <Section title="记忆系统">
            <div className="cf2__row">
              <span className="cf2__row-label">自动总结</span>
              <Toggle checked={autoSummary.enabled} onToggle={() => setAutoSummary((s) => ({ ...s, enabled: !s.enabled }))} />
            </div>
            {autoSummary.enabled && (
              <div className="cf2__sub-row">
                <span className="cf2__row-label">每</span>
                <input className="cf2__number" type="number" min={1} max={100}
                  value={autoSummary.every}
                  onChange={(e) => setAutoSummary((s) => ({ ...s, every: Number(e.target.value) }))} />
                <span className="cf2__row-label">轮对话总结一次</span>
              </div>
            )}
            <div className="cf2__row">
              <span className="cf2__row-label">注入记忆条数</span>
              <span className="cf2__row-value">{params.memoryCount ?? 20} 条</span>
            </div>
            <input type="range" className="chat-settings__slider" min={10} max={100} step={1}
              value={params.memoryCount ?? 20}
              onChange={(e) => setParams({ ...params, memoryCount: parseInt(e.target.value) })} />
            {onViewMemory && (
              <button className="cf2__manage-btn" onClick={onViewMemory}>管理记忆</button>
            )}
          </Section>

          <Section title="自动行为">
            <AutoBehaviorPanel settings={autoBehavior} branches={branches} onChange={setAutoBehavior} showTitle={false} />
          </Section>

          <Section title="心声设置">
            <div className="cf2__row">
              <span className="cf2__row-label">启用心声</span>
              <Toggle checked={hvEnabled} onToggle={() => setHvEnabled((v) => !v)} />
            </div>
            {hvEnabled && (
              <>
                <span className="cf2__field-label" style={{ marginTop: 8 }}>显示模式</span>
                <div className="cf2__chips">
                  {(['topbar', 'notification'] as const).map((mode) => (
                    <button key={mode}
                      className={`cf2__chip${hvMode === mode ? ' cf2__chip--active' : ''}`}
                      onClick={() => setHvMode(mode)}>
                      {mode === 'topbar' ? '顶部栏' : '通知弹窗'}
                    </button>
                  ))}
                </div>
              </>
            )}
            {onViewHeartVoices && (
              <button className="cf2__manage-btn" onClick={onViewHeartVoices}>查看心声记录</button>
            )}
          </Section>

          {(onClearMessages || onDelete) && (
            <Section title="危险操作">
              {onClearMessages && (
                <button className="cf2__danger-btn" onClick={onClearMessages}>清除聊天记录</button>
              )}
              {onDelete && (
                <button className="cf2__danger-btn cf2__danger-btn--red" onClick={onDelete}>删除角色</button>
              )}
            </Section>
          )}
        </div>

        {/* 底部保存按钮 */}
        <div className="cf2__footer">
          <button className="cf2__save-main" onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? '保存中…' : '保存档案'}
          </button>
        </div>
      </div>
    </div>
  )
}
