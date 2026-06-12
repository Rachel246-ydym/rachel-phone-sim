import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import type { Archive, StoryBranch } from '../../../types'

interface ArchiveListProps {
  archives: Archive[]
  branches: StoryBranch[]
  onBack: () => void
  onLoad: (archive: Archive) => Promise<string | null>
  onUpdate: (id: string, name: string, summary: string) => void
  onDelete: (id: string) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 当前故事的存档列表：加载（回到存档点）/ 编辑（名称与总结）/ 删除（二次确认）
export default function ArchiveList({
  archives,
  branches,
  onBack,
  onLoad,
  onUpdate,
  onDelete,
}: ArchiveListProps) {
  const [loadTarget, setLoadTarget] = useState<Archive | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Archive | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [summaryDraft, setSummaryDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Archive | null>(null)

  function branchName(branchId: string): string {
    return branches.find((b) => b.id === branchId)?.name ?? '（分支已删除）'
  }

  async function confirmLoad(target: Archive) {
    const err = await onLoad(target)
    if (err) {
      setLoadError(err)
    } else {
      setLoadTarget(null)
    }
  }

  return (
    <SubPage title="存档" onBack={onBack}>
      {archives.length === 0 ? (
        <div className="archive-list__empty">
          <p>还没有存档</p>
          <p className="archive-list__empty-hint">长按段落选择「在此处存档」即可创建</p>
        </div>
      ) : (
        <ul className="archive-list__items">
          {archives.map((a) => (
            <li key={a.id} className="archive-list__item">
              <span className="archive-list__name">{a.name}</span>
              <span className="archive-list__meta">
                ⑂ {branchName(a.branchId)} · 至第{a.segmentIndex}段 · {formatTime(a.createdAt)}
              </span>
              <p className="archive-list__summary">{a.summary}</p>
              <div className="archive-list__ops">
                <button
                  className="archive-list__op archive-list__op--primary"
                  onClick={() => {
                    setLoadError(null)
                    setLoadTarget(a)
                  }}
                >
                  加载
                </button>
                <button
                  className="archive-list__op"
                  onClick={() => {
                    setNameDraft(a.name)
                    setSummaryDraft(a.summary)
                    setEditTarget(a)
                  }}
                >
                  编辑
                </button>
                <button
                  className="archive-list__op archive-list__op--danger"
                  onClick={() => setDeleteTarget(a)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {loadTarget && (
        <div className="story-sheet__backdrop" onClick={() => setLoadTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="story-sheet__confirm-text">
              加载「{loadTarget.name}」将切换到分支「{branchName(loadTarget.branchId)}
              」并回到第{loadTarget.segmentIndex}段，该分支在存档点之后的内容将被删除。确定继续吗？
            </p>
            {loadError && <p className="archive-list__load-error">{loadError}</p>}
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setLoadTarget(null)}>
                取消
              </button>
              <button className="story-sheet__primary" onClick={() => void confirmLoad(loadTarget)}>
                加载
              </button>
            </div>
          </div>
        </div>
      )}
      {editTarget && (
        <div className="story-sheet__backdrop" onClick={() => setEditTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="story-sheet__title">编辑存档</h2>
            <input
              className="story-sheet__input"
              value={nameDraft}
              placeholder="存档名称"
              onChange={(e) => setNameDraft(e.target.value)}
            />
            <textarea
              className="story-sheet__editor"
              value={summaryDraft}
              rows={8}
              placeholder="剧情总结"
              onChange={(e) => setSummaryDraft(e.target.value)}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setEditTarget(null)}>
                取消
              </button>
              <button
                className="story-sheet__primary"
                disabled={!nameDraft.trim()}
                onClick={() => {
                  onUpdate(editTarget.id, nameDraft, summaryDraft)
                  setEditTarget(null)
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="story-sheet__backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="story-sheet__confirm-text">
              确定删除存档「{deleteTarget.name}」吗？删除后无法恢复。
            </p>
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button
                className="story-sheet__danger"
                onClick={() => {
                  onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </SubPage>
  )
}
