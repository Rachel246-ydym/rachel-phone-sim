import { useState } from 'react'

interface SegmentActionsProps {
  segmentRole?: 'user' | 'assistant'
  isPinned?: boolean
  onClose: () => void
  onRegenerate?: () => void
  onEditClick: () => void
  onDelete: () => void
  onCreateIfLine?: (title: string) => void
  onTogglePin?: () => void
}

type Mode = 'menu' | 'ifline' | 'confirm'

export default function SegmentActions({
  segmentRole = 'assistant',
  isPinned = false,
  onClose,
  onRegenerate,
  onEditClick,
  onDelete,
  onCreateIfLine,
  onTogglePin,
}: SegmentActionsProps) {
  const [mode, setMode] = useState<Mode>('menu')
  const [ifLineTitle, setIfLineTitle] = useState('')
  const isUser = segmentRole === 'user'

  return (
    <div className="story-sheet__backdrop" onClick={onClose}>
      <div className="seg-actions" onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <>
            {!isUser && onRegenerate && (
              <>
                <button className="seg-actions__option" onClick={onRegenerate}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.5 8a5.5 5.5 0 11-1.2-3.5M13.5 2v3h-3"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  重新生成
                </button>
                <div className="seg-actions__divider" />
              </>
            )}

            <button className="seg-actions__option" onClick={onEditClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11 2.5l2.5 2.5-8 8H3v-2.5l8-8zM9.5 4l2 2"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              编辑
            </button>
            <div className="seg-actions__divider" />

            <button className="seg-actions__option seg-actions__option--danger" onClick={() => setMode('confirm')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6.5 7v5M9.5 7v5M3 4l.8 9.5A.5.5 0 004.3 14h7.4a.5.5 0 00.5-.5L13 4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              删除
            </button>

            {!isUser && onCreateIfLine && (
              <>
                <div className="seg-actions__divider" />
                <button className="seg-actions__option seg-actions__option--lavender" onClick={() => setMode('ifline')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2v5M5 5l3-3 3 3M5 10c0 2 1.5 3 3 3s3-1 3-3M2 10h4M10 10h4"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  从这里分支
                </button>
              </>
            )}

            {!isUser && onTogglePin && (
              <>
                <div className="seg-actions__divider" />
                <button className="seg-actions__option seg-actions__option--amber" onClick={() => { onTogglePin(); onClose() }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M9.5 1.5l5 5-2 2-2.5-1-4 4v2H4v-2l-1-1 4-4-1-2.5 2-2z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                      fill={isPinned ? 'currentColor' : 'none'}
                    />
                  </svg>
                  {isPinned ? '取消收藏' : '收藏段落'}
                </button>
              </>
            )}
          </>
        )}

        {mode === 'ifline' && onCreateIfLine && (
          <>
            <h2 className="story-sheet__title">从这里分支 → 新 IF线</h2>
            <p className="story-sheet__hint">将当前段落及之前内容复制到新 IF线，之后独立发展</p>
            <input
              className="story-sheet__input"
              value={ifLineTitle}
              placeholder="IF线标题"
              autoFocus
              onChange={(e) => setIfLineTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && ifLineTitle.trim()) onCreateIfLine(ifLineTitle.trim()) }}
            />
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={onClose}>取消</button>
              <button
                className="story-sheet__primary"
                disabled={!ifLineTitle.trim()}
                onClick={() => onCreateIfLine(ifLineTitle.trim())}
              >
                创建
              </button>
            </div>
          </>
        )}

        {mode === 'confirm' && (
          <>
            <p className="story-sheet__confirm-text">确定删除这一段叙事吗？可通过顶栏撤回按钮恢复。</p>
            <div className="story-sheet__row">
              <button className="story-sheet__cancel" onClick={onClose}>取消</button>
              <button className="story-sheet__danger" onClick={onDelete}>删除</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
