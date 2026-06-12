import { useState } from 'react'
import type { StoryBranch } from '../../../types'

interface BranchBarProps {
  branches: StoryBranch[]
  activeBranchId: string | null
  disabled: boolean
  onSwitch: (branchId: string) => void
  onRename: (branchId: string, name: string) => void
  onDelete: (branchId: string) => void
}

// 故事顶部的分支切换器：切换 / 重命名 / 删除（主线不可删除）
export default function BranchBar({
  branches,
  activeBranchId,
  disabled,
  onSwitch,
  onRename,
  onDelete,
}: BranchBarProps) {
  const [open, setOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<StoryBranch | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<StoryBranch | null>(null)
  const active = branches.find((b) => b.id === activeBranchId) ?? null

  return (
    <div className="branch-bar">
      <button
        className="branch-bar__current"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="branch-bar__icon">⑂</span>
        {active?.name ?? '主线'}
        <span className="branch-bar__caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <ul className="branch-bar__dropdown">
          {branches.map((b) => (
            <li key={b.id} className="branch-bar__row">
              <button
                className={
                  b.id === activeBranchId
                    ? 'branch-bar__name branch-bar__name--active'
                    : 'branch-bar__name'
                }
                onClick={() => {
                  setOpen(false)
                  if (b.id !== activeBranchId) onSwitch(b.id)
                }}
              >
                {b.name}
                {b.branchPoint !== null && (
                  <span className="branch-bar__point">自第{b.branchPoint}段</span>
                )}
              </button>
              <button
                className="branch-bar__op"
                onClick={() => {
                  setOpen(false)
                  setRenameDraft(b.name)
                  setRenameTarget(b)
                }}
              >
                重命名
              </button>
              {b.parentBranchId !== null && (
                <button
                  className="branch-bar__op branch-bar__op--danger"
                  onClick={() => {
                    setOpen(false)
                    setDeleteTarget(b)
                  }}
                >
                  删除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {renameTarget && (
        <div className="story-sheet__backdrop" onClick={() => setRenameTarget(null)}>
          <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="story-sheet__title">重命名分支</h2>
            <input
              className="story-sheet__input"
              value={renameDraft}
              autoFocus
              onChange={(e) => setRenameDraft(e.target.value)}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={() => setRenameTarget(null)}>
                取消
              </button>
              <button
                className="story-sheet__primary"
                disabled={!renameDraft.trim()}
                onClick={() => {
                  onRename(renameTarget.id, renameDraft.trim())
                  setRenameTarget(null)
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
              确定删除分支「{deleteTarget.name}」吗？该分支的所有段落将一并删除，无法恢复。
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
    </div>
  )
}
