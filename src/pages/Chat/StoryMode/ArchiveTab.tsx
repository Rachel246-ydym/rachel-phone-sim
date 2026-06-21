import { useEffect, useState } from 'react'
import { getAll, put, remove } from '../../../services/storage'
import type { Character, Message, Story } from '../../../types'

interface ArchiveTabProps {
  character: Character
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

export default function ArchiveTab({ character }: ArchiveTabProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({})
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([getAll<Story>('stories'), getAll<Message>('messages')]).then(
      ([allStories, allMessages]) => {
        if (cancelled) return
        const forChar = allStories.filter((s) => s.characterId === character.id)
        const pinned = forChar.filter((s) => s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
        const unpinned = forChar.filter((s) => !s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
        setStories([...pinned, ...unpinned])
        const counts: Record<string, number> = {}
        for (const m of allMessages) {
          if (m.storyId && m.role === 'assistant') {
            counts[m.storyId] = (counts[m.storyId] ?? 0) + 1
          }
        }
        setSegmentCounts(counts)
      },
    )
    return () => { cancelled = true }
  }, [character.id])

  async function togglePin(story: Story) {
    const updated: Story = { ...story, pinned: !story.pinned }
    await put('stories', updated)
    setStories((prev) => {
      const list = prev.map((s) => (s.id === story.id ? updated : s))
      const pinned = list.filter((s) => s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
      const unpinned = list.filter((s) => !s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
      return [...pinned, ...unpinned]
    })
  }

  async function deleteStory(story: Story) {
    await remove('stories', story.id)
    setStories((prev) => prev.filter((s) => s.id !== story.id))
    setDeleteTarget(null)
  }

  if (stories.length === 0) {
    return (
      <div className="archive-tab__empty">
        <p>还没有故事或 IF线</p>
      </div>
    )
  }

  return (
    <div className="archive-tab">
      <ul className="archive-tab__list">
        {stories.map((s) => (
          <li key={s.id} className="archive-tab__item">
            <div className="archive-tab__item-info">
              <span className="archive-tab__item-title">
                {s.title}
                {s.storyType === 'if' && <span className="archive-tab__if-badge">IF</span>}
              </span>
              <span className="archive-tab__item-meta">
                {segmentCounts[s.id] ?? 0} 段 · {formatTime(s.updatedAt)}
              </span>
            </div>
            <div className="archive-tab__item-actions">
              <button
                className={`archive-tab__pin${s.pinned ? ' archive-tab__pin--active' : ''}`}
                aria-label={s.pinned ? '取消置顶' : '置顶'}
                onClick={() => void togglePin(s)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M9.5 1.5l5 5-2 2-2.5-1-4 4v2H4v-2l-1-1 4-4-1-2.5 2-2z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                    fill={s.pinned ? 'currentColor' : 'none'}
                  />
                </svg>
              </button>
              <button
                className="archive-tab__delete"
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
            </div>
          </li>
        ))}
      </ul>

      {deleteTarget && (
        <div className="story-sheet__backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="story-sheet__confirm-text">
              确定删除「{deleteTarget.title}」吗？删除后无法恢复。
            </p>
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="story-sheet__danger" onClick={() => void deleteStory(deleteTarget)}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
