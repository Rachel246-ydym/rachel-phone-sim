import { useRef, useState, type ChangeEvent } from 'react'
import type { Character } from '../../../types'
import { fileToAvatar } from './avatar'

export interface CharacterDraft {
  name: string
  nickname: string
  avatar: string | null
  persona: string
}

interface CharacterFormProps {
  initial: Character | null
  onSave: (draft: CharacterDraft) => Promise<void>
  onDelete?: () => void
}

export default function CharacterForm({ initial, onSave, onDelete }: CharacterFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null)
  const [persona, setPersona] = useState(initial?.persona ?? '')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="char-form">
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
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="如：京京"
        />
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

      <button
        className="char-form__save"
        onClick={handleSave}
        disabled={!name.trim() || saving}
      >
        {saving ? '保存中…' : '保存'}
      </button>
      {onDelete && (
        <button className="char-form__delete" onClick={onDelete}>
          删除角色
        </button>
      )}
    </div>
  )
}
