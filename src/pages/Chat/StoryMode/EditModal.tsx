import { useEffect, useRef, useState } from 'react'

interface EditModalProps {
  initialContent: string
  onClose: () => void
  onSave: (content: string) => void
}

export default function EditModal({ initialContent, onClose, onSave }: EditModalProps) {
  const [draft, setDraft] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div className="edit-modal__backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="edit-modal__title">编辑内容</h2>
        <textarea
          ref={textareaRef}
          className="edit-modal__textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
        />
        <div className="edit-modal__row">
          <button className="edit-modal__cancel" onClick={onClose}>取消</button>
          <button
            className="edit-modal__save"
            disabled={!draft.trim()}
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
