import { useEffect, useState } from 'react'
import { createId, getAll, put, remove } from '../../../services/storage'
import type { Character, Story, StoryBranch } from '../../../types'

interface IfLineTabProps {
  character: Character
  onSelect: (storyId: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function IfLineTab({ character, onSelect }: IfLineTabProps) {
  const [ifLines, setIfLines] = useState<Story[]>([])
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null)

  useEffect(() => {
    let cancelled = false
    void getAll<Story>('stories').then((all) => {
      if (cancelled) return
      setIfLines(
        all
          .filter((s) => s.characterId === character.id && s.storyType === 'if')
          .sort((a, b) => b.updatedAt - a.updatedAt),
      )
    })
    return () => { cancelled = true }
  }, [character.id])

  async function createIfLine() {
    const title = newTitle.trim()
    if (!title) return
    const now = Date.now()
    const storyId = createId()
    const branch: StoryBranch = {
      id: createId(),
      storyId,
      parentBranchId: null,
      branchPoint: null,
      name: '主线',
      createdAt: now,
    }
    const story: Story = {
      id: storyId,
      characterId: character.id,
      title,
      activeBranchId: branch.id,
      createdAt: now,
      updatedAt: now,
      storyType: 'if',
    }
    await put('storyBranches', branch)
    await put('stories', story)
    setIfLines((prev) => [story, ...prev])
    setCreating(false)
    setNewTitle('')
    onSelect(storyId)
  }

  async function deleteIfLine(story: Story) {
    await remove('stories', story.id)
    setIfLines((prev) => prev.filter((s) => s.id !== story.id))
    setDeleteTarget(null)
  }

  return (
    <div className="ifline-tab">
      <button className="ifline-tab__new-btn" onClick={() => setCreating(true)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        新建 IF线
      </button>

      {ifLines.length === 0 && (
        <div className="ifline-tab__empty">
          <p>还没有 IF线</p>
          <p className="ifline-tab__empty-hint">点击上方按钮新建，或在段落菜单中「从这里分支」</p>
        </div>
      )}

      <ul className="ifline-tab__list">
        {ifLines.map((s) => (
          <li key={s.id} className="ifline-tab__item">
            <button className="ifline-tab__item-body" onClick={() => onSelect(s.id)}>
              <span className="ifline-tab__item-title">{s.title}</span>
              <span className="ifline-tab__item-meta">最后更新 {formatTime(s.updatedAt)}</span>
            </button>
            <button
              className="ifline-tab__delete"
              aria-label="删除"
              onClick={() => setDeleteTarget(s)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6.5 7v5M9.5 7v5M3 4l.8 9.5A.5.5 0 004.3 14h7.4a.5.5 0 00.5-.5L13 4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {creating && (
        <div className="story-sheet__backdrop" onClick={() => setCreating(false)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="story-sheet__title">新建 IF线</h2>
            <input
              className="story-sheet__input"
              value={newTitle}
              placeholder="IF线标题"
              autoFocus
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void createIfLine() }}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setCreating(false)}>取消</button>
              <button
                className="story-sheet__primary"
                disabled={!newTitle.trim()}
                onClick={() => void createIfLine()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="story-sheet__backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="story-sheet__confirm-text">
              确定删除 IF线「{deleteTarget.title}」吗？删除后无法恢复。
            </p>
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="story-sheet__danger" onClick={() => void deleteIfLine(deleteTarget)}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
