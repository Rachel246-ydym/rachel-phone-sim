import { useEffect, useRef, useState, type KeyboardEvent, useCallback } from 'react'
import { useAppState } from '../../../store/AppContext'
import ArchiveList from './ArchiveList'
import ArchiveTab from './ArchiveTab'
import BranchBar from './BranchBar'
import EditModal from './EditModal'
import IfLineTab from './IfLineTab'
import SegmentActions from './SegmentActions'
import StorySettings from './StorySettings'
import { useArchives } from './useArchives'
import { useStoryReader } from './useStoryReader'
import { useStorySettings, THEME_VARS } from './useStorySettings'
import type { Character, Message } from '../../../types'

interface StoryReaderProps {
  character: Character
  mainStoryId: string | null
  onMainStoryCreated: (id: string) => void
  onBack: () => void
}

type StoryTab = 'main' | 'if' | 'archive'
type WriteMode = 'long' | 'short'
const CHAPTER_SIZE = 5
const LONG_PRESS_MS = 550
const INPUT_MAX_HEIGHT = 260

function formatTime(ts: number): string {
  const d = new Date(ts)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

interface UndoItem { message: Message; position: number }

export default function StoryReader({
  character, mainStoryId, onMainStoryCreated, onBack,
}: StoryReaderProps) {
  const { userProfile } = useAppState()
  const { settings, saveSettings } = useStorySettings()
  const [activeTab, setActiveTab] = useState<StoryTab>('main')
  const [writeMode, setWriteMode] = useState<WriteMode>('long')
  const [selectedIfLineId, setSelectedIfLineId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showArchiveList, setShowArchiveList] = useState(false)
  const [input, setInput] = useState('')
  const [menuTarget, setMenuTarget] = useState<Message | null>(null)
  const [editingSegment, setEditingSegment] = useState<Message | null>(null)
  const [undoStack, setUndoStack] = useState<UndoItem[]>([])
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const pressTimer = useRef<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const titleSaveTimer = useRef<number | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const newH = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)
    el.style.height = `${newH}px`
    el.style.overflowY = el.scrollHeight > INPUT_MAX_HEIGHT ? 'auto' : 'hidden'
  }, [])

  const activeStoryId =
    activeTab === 'if' && selectedIfLineId ? selectedIfLineId : mainStoryId
  const isIfLine = activeTab === 'if' && selectedIfLineId !== null

  const storyHook = useStoryReader(
    character, activeStoryId, settings, isIfLine,
    (id) => { if (!isIfLine) onMainStoryCreated(id) },
  )
  const archivesHook = useArchives(character, activeStoryId ?? '')

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storyHook.messages.length, storyHook.streamingText])

  // Clear undo stack when switching stories
  useEffect(() => { setUndoStack([]) }, [activeStoryId])

  function cancelPress() {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  function startPress(segment: Message) {
    cancelPress()
    pressTimer.current = window.setTimeout(() => setMenuTarget(segment), LONG_PRESS_MS)
  }

  function handleDeleteWithUndo(segmentId: string) {
    const result = storyHook.deleteSegment(segmentId)
    if (result) {
      setUndoStack((prev) => [...prev.slice(-4), result])
    }
  }

  function handleUndo() {
    const item = undoStack[undoStack.length - 1]
    if (!item) return
    setUndoStack((prev) => prev.slice(0, -1))
    void storyHook.restoreSegment(item.message, item.position)
  }

  async function handleCreateIfLine(segmentId: string, title: string) {
    const newId = await storyHook.createIfLineFromSegment(segmentId, title)
    if (newId) {
      setActiveTab('if')
      setSelectedIfLineId(newId)
    }
  }

  function submit() {
    if (storyHook.busy || !input.trim()) return
    void storyHook.send(input, writeMode)
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.overflowY = 'hidden'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  function startTitleEdit() {
    const currentTitle = isIfLine
      ? (storyHook.story?.title ?? 'IF线')
      : (storyHook.story?.title ?? '未命名故事')
    setTitleValue(currentTitle)
    setEditingTitle(true)
  }

  function confirmTitleEdit() {
    setEditingTitle(false)
    const trimmed = titleValue.trim()
    if (!trimmed) return
    if (titleSaveTimer.current !== null) window.clearTimeout(titleSaveTimer.current)
    titleSaveTimer.current = window.setTimeout(() => {
      void storyHook.renameStory(trimmed)
    }, 300)
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  const theme = settings.longNarrative.theme
  const themeVars = THEME_VARS[theme] as React.CSSProperties

  if (showSettings) {
    return (
      <StorySettings
        initial={settings}
        onBack={() => setShowSettings(false)}
        onSave={async (d) => { await saveSettings(d) }}
      />
    )
  }

  if (showArchiveList) {
    return (
      <ArchiveList
        archives={archivesHook.archives}
        branches={storyHook.branches}
        onBack={() => setShowArchiveList(false)}
        onLoad={async (archive) => {
          const err = await storyHook.restoreArchive(archive)
          if (!err) setShowArchiveList(false)
          return err
        }}
        onUpdate={(id, name, summary) => void archivesHook.updateArchive(id, name, summary)}
        onDelete={(id) => void archivesHook.deleteArchive(id)}
      />
    )
  }

  const isWritingVisible = activeTab === 'main' || (activeTab === 'if' && selectedIfLineId !== null)
  const ifLineTitle = storyHook.story?.title

  // topbar back action depends on context
  function handleBack() {
    if (activeTab === 'if' && selectedIfLineId) { setSelectedIfLineId(null); return }
    onBack()
  }

  let segIndex = 0

  return (
    <div className="story-reader" style={themeVars}>
      {/* Topbar */}
      <div className="story-reader__topbar">
        <button className="story-reader__back" onClick={handleBack} aria-label="返回">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M8.5 1.5L1.5 8.5l7 7" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="story-reader__header-text">
          <span className="story-reader__mode-label">
            线下模式{isIfLine && <span className="story-reader__if-badge">IF</span>}
          </span>
          {editingTitle ? (
            <input
              className="story-reader__title-input"
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={confirmTitleEdit}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            <span
              className="story-reader__char-name story-reader__char-name--editable"
              onClick={startTitleEdit}
            >
              {isIfLine ? (ifLineTitle ?? 'IF线') : (storyHook.story?.title ?? '未命名故事')}
            </span>
          )}
        </div>
        {isWritingVisible && (
          <button
            className="story-reader__archive-btn"
            disabled={storyHook.busy}
            onClick={() => setShowArchiveList(true)}
          >
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
              <path d="M1 2a1 1 0 011-1h9a1 1 0 011 1v12.5l-5.5-2.75L1 14.5V2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            存档
          </button>
        )}
        <button className="story-reader__settings-btn" onClick={() => setShowSettings(true)} aria-label="剧情设定">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="5" cy="5" r="1.5" fill="currentColor" />
            <circle cx="10" cy="9" r="1.5" fill="currentColor" />
            <circle cx="7" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </button>
        {isWritingVisible && (
          <button
            className={`story-reader__undo-btn${undoStack.length === 0 ? ' story-reader__undo-btn--disabled' : ''}`}
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            aria-label="撤回"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9a6 6 0 106-6H5M3 5v4h4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="story-reader__tabs">
        {([['main', '主线'], ['if', 'IF线'], ['archive', '存档']] as const).map(([id, label]) => (
          <button
            key={id}
            className={`story-reader__tab${activeTab === id ? ' story-reader__tab--active' : ''}`}
            onClick={() => { setActiveTab(id); if (id !== 'if') setSelectedIfLineId(null) }}
          >
            {label}
            {activeTab === id && <span className="story-reader__tab-indicator" />}
          </button>
        ))}
      </div>

      {/* Mode switcher (main / if writing) */}
      {isWritingVisible && (
        <div className="story-mode-switcher__row">
          <div className="story-mode-switcher">
            <button
              className={`story-mode-switcher__btn${writeMode === 'long' ? ' story-mode-switcher__btn--active' : ''}`}
              onClick={() => setWriteMode('long')}
            >
              长篇叙事
            </button>
            <button
              className={`story-mode-switcher__btn${writeMode === 'short' ? ' story-mode-switcher__btn--active' : ''}`}
              onClick={() => setWriteMode('short')}
            >
              短线下
            </button>
          </div>
        </div>
      )}

      {/* Branch bar */}
      {isWritingVisible && storyHook.branches.length > 1 && (
        <div className="story-reader__branch-row">
          <BranchBar
            branches={storyHook.branches}
            activeBranchId={storyHook.story?.activeBranchId ?? null}
            disabled={storyHook.busy}
            onSwitch={(id) => void storyHook.switchBranch(id)}
            onRename={(id, name) => void storyHook.renameBranch(id, name)}
            onDelete={(id) => void storyHook.deleteBranch(id)}
          />
        </div>
      )}

      {/* Story content */}
      {isWritingVisible && (
        <div className="story-reader__scroll">
          {storyHook.messages.length === 0 && storyHook.streamingText === null && (
            <p className="story-reader__empty">输入一段开场行为或场景，开始这个故事</p>
          )}

          {writeMode === 'long' ? (
            // Long narrative view
            storyHook.messages.map((m) => {
              if (m.role === 'user') {
                const isExpand = m.tag === 'expand'
                return (
                  <div
                    key={m.id}
                    className="story-reader__user-block"
                    onDoubleClick={() => !storyHook.busy && setMenuTarget(m)}
                    onPointerDown={() => !storyHook.busy && startPress(m)}
                    onPointerUp={cancelPress}
                    onPointerMove={cancelPress}
                    onPointerLeave={cancelPress}
                  >
                    <div className="story-reader__user-header">
                      <span className="story-reader__user-name">
                        {userProfile?.nickname || userProfile?.name || '我'}
                      </span>
                      {isExpand && <span className="story-reader__expand-badge">扩写</span>}
                      <span className="story-reader__seg-sep">|</span>
                      <span className="story-reader__seg-time">{formatTime(m.timestamp)}</span>
                    </div>
                    <div className="story-reader__user-card">
                      <p className="story-reader__user-text">{m.content}</p>
                    </div>
                  </div>
                )
              }
              segIndex += 1
              const isRegen = m.id === storyHook.regeneratingId
              const showChapter = segIndex % CHAPTER_SIZE === 1 && segIndex > 1
              return (
                <div key={m.id}>
                  {showChapter && (
                    <div className="story-reader__chapter">— 第{Math.ceil(segIndex / CHAPTER_SIZE)}章 —</div>
                  )}
                  <section
                    className="story-reader__segment"
                    onDoubleClick={() => !storyHook.busy && setMenuTarget(m)}
                    onPointerDown={() => !storyHook.busy && startPress(m)}
                    onPointerUp={cancelPress}
                    onPointerMove={cancelPress}
                    onPointerLeave={cancelPress}
                  >
                    <div className="story-reader__seg-header">
                      {character.avatar ? (
                        <img className="story-reader__seg-avatar" src={character.avatar} alt="" />
                      ) : (
                        <span className="story-reader__seg-avatar story-reader__seg-avatar--fallback">
                          {character.name.charAt(0)}
                        </span>
                      )}
                      <span className="story-reader__seg-name">{character.name}</span>
                      <span className="story-reader__seg-sep">|</span>
                      <span className="story-reader__seg-time">{formatTime(m.timestamp)}</span>
                    </div>
                    <div className="story-reader__segment-text">
                      {isRegen ? storyHook.streamingText || '正在重新生成…' : m.content}
                    </div>
                  </section>
                </div>
              )
            })
          ) : (
            // Short RP bubble view
            storyHook.messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="story-reader__bubble-user">
                    <p className="story-reader__bubble-user-text">{m.content}</p>
                  </div>
                )
              }
              const isRegen = m.id === storyHook.regeneratingId
              return (
                <div key={m.id} className="story-reader__bubble-ai-wrap">
                  <div
                    className="story-reader__bubble-ai"
                    onDoubleClick={() => !storyHook.busy && setMenuTarget(m)}
                    onPointerDown={() => !storyHook.busy && startPress(m)}
                    onPointerUp={cancelPress}
                    onPointerMove={cancelPress}
                    onPointerLeave={cancelPress}
                  >
                    {isRegen ? storyHook.streamingText || '正在重新生成…' : m.content}
                  </div>
                </div>
              )
            })
          )}

          {storyHook.streamingText !== null && storyHook.regeneratingId === null && (
            writeMode === 'long' ? (
              <section className="story-reader__segment">
                <div className="story-reader__seg-header">
                  {character.avatar ? (
                    <img className="story-reader__seg-avatar" src={character.avatar} alt="" />
                  ) : (
                    <span className="story-reader__seg-avatar story-reader__seg-avatar--fallback">
                      {character.name.charAt(0)}
                    </span>
                  )}
                  <span className="story-reader__seg-name">{character.name}</span>
                  <span className="story-reader__seg-sep">|</span>
                  <span className="story-reader__seg-time">{formatTime(Date.now())}</span>
                </div>
                <div className="story-reader__segment-text">{storyHook.streamingText || '正在生成…'}</div>
              </section>
            ) : (
              <div className="story-reader__bubble-ai-wrap">
                <div className="story-reader__bubble-ai">{storyHook.streamingText || '正在生成…'}</div>
              </div>
            )
          )}

          {archivesHook.archiving && <p className="story-reader__archiving">正在生成剧情总结并创建存档…</p>}
          {storyHook.error && <p className="story-reader__error">{storyHook.error}</p>}
          <div ref={endRef} />
        </div>
      )}

      {/* Input bar */}
      {isWritingVisible && (
        <div className="story-reader__input-bar">
          {storyHook.busy ? (
            <div className="gen-status-bar">
              <div className="gen-status-bar__dots">
                <span className="gen-status-bar__dot" />
                <span className="gen-status-bar__dot" />
                <span className="gen-status-bar__dot" />
              </div>
              <span className="gen-status-bar__text">正在生成剧情…</span>
              <button className="gen-status-bar__stop" onClick={storyHook.stopGeneration}>
                停止
              </button>
            </div>
          ) : (
            <>
              <textarea
                ref={inputRef}
                className="story-reader__input"
                value={input}
                rows={1}
                placeholder="说什么或做什么…"
                onChange={(e) => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
              />
              {writeMode === 'long' ? (
                <>
                  {/* Primary: send or continue story */}
                  <div className="story-reader__btn-wrap">
                    <button
                      className="story-reader__btn-primary"
                      onClick={() => {
                        if (input.trim()) submit()
                        else void storyHook.continueStory('long')
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 14V4M4 9l5-5 5 5" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="story-reader__btn-label">
                      {input.trim() ? '发送互动' : '续写'}
                    </span>
                  </div>
                  {/* Secondary: expand */}
                  <div className="story-reader__btn-wrap">
                    <button
                      className="story-reader__btn-secondary"
                      disabled={!input.trim()}
                      onClick={() => { void storyHook.expand(input); setInput('') }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 1H3a1 1 0 00-1 1v8a1 1 0 001 1h2v3l3-3h5a1 1 0 001-1V2a1 1 0 00-1-1z"
                          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="story-reader__btn-label">扩写</span>
                  </div>
                </>
              ) : (
                /* Short mode: send only */
                <div className="story-reader__btn-wrap">
                  <button
                    className="story-reader__btn-primary"
                    disabled={!input.trim()}
                    onClick={submit}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 14V4M4 9l5-5 5 5" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="story-reader__btn-label">发送互动</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* IF line tab - list view */}
      {activeTab === 'if' && !selectedIfLineId && (
        <IfLineTab
          character={character}
          onSelect={(id) => setSelectedIfLineId(id)}
        />
      )}

      {/* Archive tab */}
      {activeTab === 'archive' && <ArchiveTab character={character} />}

      {/* Segment actions menu */}
      {menuTarget && (
        <SegmentActions
          segmentRole={menuTarget.role === 'user' ? 'user' : 'assistant'}
          isPinned={(storyHook.story?.pinnedParagraphIds ?? []).includes(menuTarget.id)}
          onClose={() => setMenuTarget(null)}
          onRegenerate={menuTarget.role === 'assistant'
            ? () => { setMenuTarget(null); void storyHook.regenerate(menuTarget.id, writeMode) }
            : undefined}
          onEditClick={() => { setEditingSegment(menuTarget); setMenuTarget(null) }}
          onDelete={() => { const t = menuTarget; setMenuTarget(null); handleDeleteWithUndo(t.id) }}
          onCreateIfLine={menuTarget.role === 'assistant'
            ? (title) => { const t = menuTarget; setMenuTarget(null); void handleCreateIfLine(t.id, title) }
            : undefined}
          onTogglePin={menuTarget.role === 'assistant'
            ? () => void storyHook.togglePinParagraph(menuTarget.id)
            : undefined}
        />
      )}

      {/* Edit modal (shared for user and AI segments) */}
      {editingSegment && (
        <EditModal
          initialContent={editingSegment.content}
          onClose={() => setEditingSegment(null)}
          onSave={(content) => {
            void storyHook.editSegment(editingSegment.id, content)
            setEditingSegment(null)
          }}
        />
      )}
    </div>
  )
}
