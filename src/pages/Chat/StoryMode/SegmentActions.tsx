import { useState } from 'react'
import type { Message } from '../../../types'

interface SegmentActionsProps {
  segment: Message
  onClose: () => void
  onRegenerate: () => void
  onSaveEdit: (content: string) => void
  onDelete: () => void
  onCreateBranch: (name: string) => void
}

// 段落操作菜单：重生成 / 编辑 / 创建分支 / 删除（二次确认）
export default function SegmentActions({
  segment,
  onClose,
  onRegenerate,
  onSaveEdit,
  onDelete,
  onCreateBranch,
}: SegmentActionsProps) {
  const [mode, setMode] = useState<'menu' | 'edit' | 'branch' | 'confirm'>('menu')
  const [draft, setDraft] = useState(segment.content)
  const [branchName, setBranchName] = useState('')

  return (
    <div className="story-sheet__backdrop" onClick={onClose}>
      <div className="story-sheet" onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <>
            <button className="story-sheet__option" onClick={onRegenerate}>
              重新生成
            </button>
            <button className="story-sheet__option" onClick={() => setMode('edit')}>
              编辑
            </button>
            <button className="story-sheet__option" onClick={() => setMode('branch')}>
              从此处创建分支
            </button>
            <button
              className="story-sheet__option story-sheet__option--danger"
              onClick={() => setMode('confirm')}
            >
              删除
            </button>
            <button className="story-sheet__cancel" onClick={onClose}>
              取消
            </button>
          </>
        )}
        {mode === 'edit' && (
          <>
            <h2 className="story-sheet__title">编辑段落</h2>
            <textarea
              className="story-sheet__editor"
              value={draft}
              rows={10}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={onClose}>
                取消
              </button>
              <button
                className="story-sheet__primary"
                disabled={!draft.trim()}
                onClick={() => onSaveEdit(draft.trim())}
              >
                保存
              </button>
            </div>
          </>
        )}
        {mode === 'branch' && (
          <>
            <h2 className="story-sheet__title">从此处创建分支</h2>
            <input
              className="story-sheet__input"
              value={branchName}
              placeholder="分支名称"
              autoFocus
              onChange={(e) => setBranchName(e.target.value)}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={onClose}>
                取消
              </button>
              <button
                className="story-sheet__primary"
                disabled={!branchName.trim()}
                onClick={() => onCreateBranch(branchName.trim())}
              >
                创建
              </button>
            </div>
          </>
        )}
        {mode === 'confirm' && (
          <>
            <p className="story-sheet__confirm-text">确定删除这一段叙事吗？删除后无法恢复。</p>
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={onClose}>
                取消
              </button>
              <button className="story-sheet__danger" onClick={onDelete}>
                删除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
