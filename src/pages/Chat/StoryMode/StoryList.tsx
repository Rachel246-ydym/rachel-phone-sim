import { useEffect, useState, type FormEvent } from 'react'
import SubPage from '../../../components/SubPage'
import { createId, getAll, put } from '../../../services/storage'
import type { Character, Message, Story, StoryBranch } from '../../../types'

interface StoryListProps {
  character: Character
  onBack: () => void
  onOpen: (storyId: string) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StoryList({ character, onBack, onOpen }: StoryListProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({})
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    let cancelled = false
    void Promise.all([getAll<Story>('stories'), getAll<Message>('messages')]).then(
      ([allStories, allMessages]) => {
        if (cancelled) return
        setStories(
          allStories
            .filter((s) => s.characterId === character.id)
            .sort((a, b) => b.updatedAt - a.updatedAt),
        )
        const counts: Record<string, number> = {}
        for (const m of allMessages) {
          if (m.storyId && m.role === 'assistant') {
            counts[m.storyId] = (counts[m.storyId] ?? 0) + 1
          }
        }
        setSegmentCounts(counts)
      },
    )
    return () => {
      cancelled = true
    }
  }, [character.id])

  async function create(e: FormEvent) {
    e.preventDefault()
    const name = title.trim()
    if (!name) return
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
      title: name,
      activeBranchId: branch.id,
      createdAt: now,
      updatedAt: now,
    }
    await put('storyBranches', branch)
    await put('stories', story)
    onOpen(storyId)
  }

  return (
    <SubPage
      title="线下剧情"
      onBack={onBack}
      action={
        <button className="story-list__add" onClick={() => setCreating(true)} aria-label="新建故事">
          ＋
        </button>
      }
    >
      {stories.length === 0 ? (
        <div className="story-list__empty">
          <p>还没有故事</p>
          <p className="story-list__empty-hint">点击右上角 ＋ 开始一段新剧情</p>
        </div>
      ) : (
        <ul className="story-list__items">
          {stories.map((s) => (
            <li key={s.id}>
              <button className="story-list__item" onClick={() => onOpen(s.id)}>
                <span className="story-list__name">{s.title}</span>
                <span className="story-list__meta">
                  {segmentCounts[s.id] ?? 0} 段 · 最后更新 {formatTime(s.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {creating && (
        <div className="story-sheet__backdrop" onClick={() => setCreating(false)}>
          <form
            className="story-sheet"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void create(e)}
          >
            <h2 className="story-sheet__title">新建故事</h2>
            <input
              className="story-sheet__input"
              value={title}
              placeholder="故事标题"
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="story-sheet__row">
              <button type="button" className="story-sheet__cancel" onClick={() => setCreating(false)}>
                取消
              </button>
              <button type="submit" className="story-sheet__primary" disabled={!title.trim()}>
                创建
              </button>
            </div>
          </form>
        </div>
      )}
    </SubPage>
  )
}
