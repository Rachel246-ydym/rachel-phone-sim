import { useState } from 'react'
import SubPage from '../../../components/SubPage'
import type { MemoryTag } from '../../../types'
import { useMemoryCore } from './useMemoryCore'
import './MemoryCore.css'

type FilterTag = MemoryTag | 'all'

const FILTER_OPTIONS: { value: FilterTag; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'auto-summary', label: '自动总结' },
  { value: 'manual-add', label: '手动添加' },
  { value: 'self-reflection', label: '角色自剖' },
  { value: 'story', label: '线下剧情' },
]

const TAG_LABEL: Partial<Record<MemoryTag, string>> = {
  'auto-summary': '自动总结',
  'manual-summary': '手动总结',
  'manual-add': '手动添加',
  'self-reflection': '角色自剖',
  story: '线下剧情',
  interaction: '互动',
}

export default function MemoryCore({ onBack }: { onBack: () => void }) {
  const {
    character,
    memories,
    autoSettings,
    loading,
    addManual,
    editMemory,
    removeMemory,
    clearAll,
    clearByTag,
    saveAutoSettings,
  } = useMemoryCore()

  const [filterTag, setFilterTag] = useState<FilterTag>('all')
  const [addText, setAddText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState<'all' | MemoryTag | null>(null)

  if (!character) {
    return (
      <SubPage title="记忆核心" onBack={onBack}>
        <p className="memory-core__missing">未选择角色，请先从聊天列表进入角色</p>
      </SubPage>
    )
  }

  const filtered =
    filterTag === 'all' ? memories : memories.filter((m) => m.tag === filterTag)

  async function handleAdd() {
    if (!addText.trim() || adding) return
    setAdding(true)
    await addManual(addText)
    setAddText('')
    setAdding(false)
  }

  function startEdit(id: string, content: string) {
    setEditingId(id)
    setEditText(content)
    setConfirmDeleteId(null)
  }

  async function handleSaveEdit() {
    if (!editingId || !editText.trim()) return
    await editMemory(editingId, editText)
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await removeMemory(id)
    setConfirmDeleteId(null)
  }

  async function handleClearConfirm() {
    if (!confirmClear) return
    if (confirmClear === 'all') {
      await clearAll()
    } else {
      await clearByTag(confirmClear)
    }
    setConfirmClear(null)
  }

  return (
    <SubPage title="记忆核心" onBack={onBack}>
      <div className="memory-core">
        {/* 自动总结设置 */}
        <section className="memory-core__auto-section">
          <div className="memory-core__row">
            <span className="memory-core__auto-label">自动生成核心记忆</span>
            <button
              className={`memory-core__toggle${autoSettings.enabled ? ' memory-core__toggle--on' : ''}`}
              onClick={() =>
                void saveAutoSettings({ ...autoSettings, enabled: !autoSettings.enabled })
              }
              aria-label={autoSettings.enabled ? '已开启' : '已关闭'}
            >
              <span className="memory-core__toggle-knob" />
            </button>
          </div>
          {autoSettings.enabled && (
            <div className="memory-core__row memory-core__row--sub">
              <label className="memory-core__auto-label" htmlFor="mc-every">
                每
              </label>
              <input
                id="mc-every"
                className="memory-core__number"
                type="number"
                min={1}
                max={100}
                value={autoSettings.every}
                onChange={(e) =>
                  void saveAutoSettings({ ...autoSettings, every: Number(e.target.value) })
                }
              />
              <span className="memory-core__auto-label">轮对话自动总结</span>
            </div>
          )}
        </section>

        {/* 标签筛选 */}
        <div className="memory-core__filter-bar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`memory-core__filter-chip${filterTag === opt.value ? ' memory-core__filter-chip--active' : ''}`}
              onClick={() => setFilterTag(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 手动添加 */}
        <div className="memory-core__add-bar">
          <textarea
            className="memory-core__add-input"
            rows={2}
            placeholder="输入记忆内容，手动添加…"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
          />
          <button
            className="memory-core__add-btn"
            disabled={!addText.trim() || adding}
            onClick={() => void handleAdd()}
          >
            添加
          </button>
        </div>

        {/* 清理按钮 */}
        <div className="memory-core__clear-bar">
          <button className="memory-core__clear-btn" onClick={() => setConfirmClear('all')}>
            清空全部
          </button>
          {filterTag !== 'all' && (
            <button
              className="memory-core__clear-btn"
              onClick={() => setConfirmClear(filterTag as MemoryTag)}
            >
              清空「{FILTER_OPTIONS.find((o) => o.value === filterTag)?.label}」
            </button>
          )}
        </div>

        {/* 二次确认清理 */}
        {confirmClear && (
          <div className="memory-core__confirm-bar">
            <span className="memory-core__confirm-text">
              确定删除
              {confirmClear === 'all'
                ? '全部'
                : `「${FILTER_OPTIONS.find((o) => o.value === confirmClear)?.label ?? ''}」`}
              记忆？
            </span>
            <button
              className="memory-core__confirm-yes"
              onClick={() => void handleClearConfirm()}
            >
              确定
            </button>
            <button className="memory-core__confirm-no" onClick={() => setConfirmClear(null)}>
              取消
            </button>
          </div>
        )}

        {/* 记忆列表 */}
        {loading ? (
          <p className="memory-core__empty">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="memory-core__empty">暂无记忆条目</p>
        ) : (
          <ul className="memory-core__list">
            {filtered.map((m) => (
              <li key={m.id} className="memory-core__item">
                {editingId === m.id ? (
                  <div className="memory-core__edit-box">
                    <textarea
                      className="memory-core__edit-input"
                      rows={3}
                      value={editText}
                      autoFocus
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="memory-core__edit-actions">
                      <button
                        className="memory-core__edit-save"
                        onClick={() => void handleSaveEdit()}
                      >
                        保存
                      </button>
                      <button
                        className="memory-core__edit-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="memory-core__item-meta">
                      <span className="memory-core__tag">{TAG_LABEL[m.tag] ?? m.tag}</span>
                      <span className="memory-core__time">
                        {new Date(m.createdAt).toLocaleDateString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="memory-core__content">{m.content}</p>
                    <div className="memory-core__item-actions">
                      <button
                        className="memory-core__item-btn"
                        onClick={() => startEdit(m.id, m.content)}
                      >
                        编辑
                      </button>
                      {confirmDeleteId === m.id ? (
                        <>
                          <button
                            className="memory-core__item-btn memory-core__item-btn--danger"
                            onClick={() => void handleDelete(m.id)}
                          >
                            确认删除
                          </button>
                          <button
                            className="memory-core__item-btn"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          className="memory-core__item-btn memory-core__item-btn--danger"
                          onClick={() => setConfirmDeleteId(m.id)}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SubPage>
  )
}
