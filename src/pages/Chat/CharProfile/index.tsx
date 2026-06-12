import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, put, remove } from '../../../services/storage'
import type { Character, ModelParams } from '../../../types'
import CharacterForm, { type CharacterDraft } from './CharacterForm'
import './CharProfile.css'

const DEFAULT_MODEL_PARAMS: ModelParams = {
  minReplies: 1,
  maxReplies: 3,
  temperature: 0.8,
  topP: 0.9,
  maxTokens: 2048,
  stream: true,
  contextLimit: 20,
  timeAware: true,
}

export default function CharProfile({ onBack }: { onBack: () => void }) {
  const { characters } = useAppState()
  const dispatch = useAppDispatch()
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = characters.find((c) => c.id === editingId) ?? null

  function openCreate() {
    setEditingId(null)
    setView('form')
  }

  function openEdit(id: string) {
    setEditingId(id)
    setView('form')
  }

  async function handleSave(draft: CharacterDraft) {
    const character: Character = editing
      ? { ...editing, ...draft }
      : {
          id: createId(),
          ...draft,
          online: true,
          modelParams: DEFAULT_MODEL_PARAMS,
          createdAt: Date.now(),
        }
    await put('characters', character)
    dispatch({ type: 'chat/upsertCharacter', character })
    setView('list')
  }

  async function handleDelete() {
    if (!editing) return
    if (!window.confirm(`确定删除角色「${editing.name}」吗？此操作不可恢复。`)) return
    await remove('characters', editing.id)
    dispatch({ type: 'chat/removeCharacter', characterId: editing.id })
    setView('list')
  }

  if (view === 'form') {
    return (
      <SubPage title={editing ? '编辑角色' : '新建角色'} onBack={() => setView('list')}>
        <CharacterForm
          initial={editing}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
        />
      </SubPage>
    )
  }

  return (
    <SubPage title="角色档案" onBack={onBack}>
      <div className="char-profile">
        {characters.length === 0 ? (
          <p className="char-profile__empty">还没有角色，点击下方按钮创建第一个角色吧</p>
        ) : (
          <ul className="char-profile__list">
            {characters.map((c) => (
              <li key={c.id}>
                <button className="char-profile__item" onClick={() => openEdit(c.id)}>
                  <span className="char-profile__avatar">
                    {c.avatar ? <img src={c.avatar} alt={c.name} /> : c.name.slice(0, 1)}
                  </span>
                  <span className="char-profile__info">
                    <span className="char-profile__name">{c.name}</span>
                    <span className="char-profile__nickname">
                      称呼我：{c.nickname || '未设置'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="char-profile__create" onClick={openCreate}>
          ＋ 新建角色
        </button>
      </div>
    </SubPage>
  )
}
