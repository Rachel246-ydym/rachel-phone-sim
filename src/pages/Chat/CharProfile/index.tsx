import { useEffect, useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, getAll, put, remove } from '../../../services/storage'
import type { Character, Message, Story, StoryBranch } from '../../../types'
import CharacterForm, { type CharacterDraft } from './CharacterForm'
import HeartVoiceList from './HeartVoiceList'
import MemoryCore from '../MemoryCore'
import type { BranchOption } from '../Settings/AutoBehaviorPanel'
import './CharProfile.css'

type ProfileView = 'list' | 'form' | 'heartVoiceList' | 'memoryCore'

async function loadBranches(characterId: string): Promise<BranchOption[]> {
  const [allStories, allBranches] = await Promise.all([
    getAll<Story>('stories'),
    getAll<StoryBranch>('storyBranches'),
  ])
  const myStories = allStories.filter((s) => s.characterId === characterId)
  const storyTitles = Object.fromEntries(myStories.map((s) => [s.id, s.title]))
  const myStoryIds = new Set(myStories.map((s) => s.id))
  return allBranches
    .filter((b) => myStoryIds.has(b.storyId))
    .map((b) => ({ ...b, storyTitle: storyTitles[b.storyId] ?? '' }))
}

export default function CharProfile({ onBack }: { onBack: () => void }) {
  const { characters } = useAppState()
  const dispatch = useAppDispatch()
  const [view, setView] = useState<ProfileView>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [branches, setBranches] = useState<BranchOption[]>([])

  const editing = characters.find((c) => c.id === editingId) ?? null

  useEffect(() => {
    if (!editingId) { setBranches([]); return }
    void loadBranches(editingId).then(setBranches)
  }, [editingId])

  function openCreate() {
    setEditingId(null)
    setView('form')
  }

  function openEdit(id: string) {
    setEditingId(id)
    setView('form')
  }

  function openMemory() {
    if (!editingId) return
    dispatch({ type: 'chat/setActiveCharacter', characterId: editingId })
    setView('memoryCore')
  }

  async function handleSave(draft: CharacterDraft) {
    const { autoSummary, ...charFields } = draft
    const id = editing?.id ?? createId()
    const character: Character = editing
      ? { ...editing, ...charFields }
      : {
          id,
          ...charFields,
          online: true,
          createdAt: Date.now(),
        }
    await Promise.all([
      put('characters', character),
      put('settings', { id: `memory_auto_${id}`, value: autoSummary }),
    ])
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

  async function handleClearMessages() {
    if (!editing) return
    if (!window.confirm(`确定清除「${editing.name}」的所有聊天记录？`)) return
    const all = await getAll<Message>('messages')
    const own = all.filter((m) => m.characterId === editing.id && !m.storyId)
    await Promise.all(own.map((m) => remove('messages', m.id)))
    dispatch({ type: 'chat/setMessages', messages: [] })
  }

  if (view === 'memoryCore') {
    return <MemoryCore onBack={() => setView('form')} />
  }

  if (view === 'heartVoiceList' && editingId) {
    return (
      <HeartVoiceList
        characterId={editingId}
        characterName={editing?.name ?? ''}
        onBack={() => setView('form')}
      />
    )
  }

  if (view === 'form') {
    return (
      <SubPage title={editing ? '编辑角色' : '新建角色'} onBack={() => setView('list')}>
        <CharacterForm
          initial={editing}
          branches={branches}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClearMessages={editing ? handleClearMessages : undefined}
          onViewHeartVoices={editing ? () => setView('heartVoiceList') : undefined}
          onViewMemory={editing ? openMemory : undefined}
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
