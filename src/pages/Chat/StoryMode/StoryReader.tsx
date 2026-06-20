import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import ArchiveList from './ArchiveList'
import BranchBar from './BranchBar'
import SegmentActions from './SegmentActions'
import StorySettings from './StorySettings'
import { useArchives } from './useArchives'
import { useStoryReader } from './useStoryReader'
import { useStorySettings, THEME_VARS } from './useStorySettings'
import type { Character, Message } from '../../../types'

interface StoryReaderProps {
  character: Character
  storyId: string
  onBack: () => void
}

type StoryTab = 'narrative' | 'short' | 'if' | 'archive'

const TABS: { id: StoryTab; label: string }[] = [
  { id: 'narrative', label: '长篇叙事' },
  { id: 'short', label: '短线下' },
  { id: 'if', label: 'IF线' },
  { id: 'archive', label: '存档' },
]

const CHAPTER_SIZE = 5
const LONG_PRESS_MS = 550

export default function StoryReader({ character, storyId, onBack }: StoryReaderProps) {
  const { settings, saveSettings } = useStorySettings()
  const {
    story, branches, messages, streamingText, regeneratingId,
    error, busy, send, continueStory, regenerate, editSegment,
    deleteSegment, switchBranch, createBranch, renameBranch,
    deleteBranch, restoreArchive,
  } = useStoryReader(character, storyId, settings)
  const { archives, archiving, createArchive, updateArchive, deleteArchive } =
    useArchives(character, storyId)

  const [input, setInput] = useState('')
  const [menuTarget, setMenuTarget] = useState<Message | null>(null)
  const [activeTab, setActiveTab] = useState<StoryTab>('narrative')
  const [showSettings, setShowSettings] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

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

  function submit() {
    if (busy || !input.trim()) return
    void send(input)
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function archiveAt(segment: Message, name: string) {
    if (!story) return
    const index = messages.findIndex((m) => m.id === segment.id)
    if (index < 0) return
    const history = messages.slice(0, index + 1)
    const segmentIndex = history.filter((m) => m.role === 'assistant').length
    void createArchive(name, story.activeBranchId, segmentIndex, history)
  }

  if (showSettings) {
    return (
      <StorySettings
        initial={settings}
        onBack={() => setShowSettings(false)}
        onSave={async (data) => { await saveSettings(data) }}
      />
    )
  }

  if (activeTab === 'archive') {
    return (
      <ArchiveList
        archives={archives}
        branches={branches}
        onBack={() => setActiveTab('narrative')}
        onLoad={async (archive) => {
          const err = await restoreArchive(archive)
          if (!err) setActiveTab('narrative')
          return err
        }}
        onUpdate={(id, name, summary) => void updateArchive(id, name, summary)}
        onDelete={(id) => void deleteArchive(id)}
      />
    )
  }

  let segIndex = 0

  return (
    <div className="story-reader" style={THEME_VARS[settings.theme] as React.CSSProperties}>
      {/* Topbar */}
      <div className="story-reader__topbar">
        <button className="story-reader__back" onClick={onBack} aria-label="返回">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M8.5 1.5L1.5 8.5l7 7" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="story-reader__header-text">
          <span className="story-reader__mode-label">线下模式</span>
          <span className="story-reader__char-name">{story?.title ?? character.name}</span>
        </div>
        <button
          className="story-reader__archive-btn"
          disabled={busy}
          onClick={() => setActiveTab('archive')}
        >
          <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
            <path d="M1 2a1 1 0 011-1h9a1 1 0 011 1v12.5l-5.5-2.75L1 14.5V2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          存档
        </button>
        <button
          className="story-reader__settings-btn"
          onClick={() => setShowSettings(true)}
          aria-label="剧情设定"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="story-reader__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`story-reader__tab${activeTab === tab.id ? ' story-reader__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && <span className="story-reader__tab-indicator" />}
          </button>
        ))}
      </div>

      {/* Branch selector (shown when multiple branches exist) */}
      {branches.length > 1 && (
        <div className="story-reader__branch-row">
          <BranchBar
            branches={branches}
            activeBranchId={story?.activeBranchId ?? null}
            disabled={busy}
            onSwitch={(id) => void switchBranch(id)}
            onRename={(id, name) => void renameBranch(id, name)}
            onDelete={(id) => void deleteBranch(id)}
          />
        </div>
      )}

      {/* Story content */}
      <div className="story-reader__scroll">
        {messages.length === 0 && streamingText === null && (
          <p className="story-reader__empty">输入一段开场行为或场景，开始这个故事</p>
        )}
        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="story-reader__user">
                <p className="story-reader__user-text">{m.content}</p>
              </div>
            )
          }
          segIndex += 1
          const isRegenerating = m.id === regeneratingId
          const showChapter = segIndex % CHAPTER_SIZE === 1 && segIndex > 1

          return (
            <div key={m.id}>
              {showChapter && (
                <div className="story-reader__chapter">
                  — 第{Math.ceil(segIndex / CHAPTER_SIZE)}章 —
                </div>
              )}
              <section
                className="story-reader__segment"
                onDoubleClick={() => !busy && setMenuTarget(m)}
                onPointerDown={() => !busy && startPress(m)}
                onPointerUp={cancelPress}
                onPointerMove={cancelPress}
                onPointerLeave={cancelPress}
              >
                <div className="story-reader__segment-text">
                  {isRegenerating ? streamingText || '正在重新生成…' : m.content}
                </div>
              </section>
            </div>
          )
        })}
        {streamingText !== null && regeneratingId === null && (
          <section className="story-reader__segment">
            <div className="story-reader__segment-text">{streamingText || '正在生成…'}</div>
          </section>
        )}
        {archiving && <p className="story-reader__archiving">正在生成剧情总结并创建存档…</p>}
        {error && <p className="story-reader__error">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="story-reader__input-bar">
        <textarea
          className="story-reader__input"
          value={input}
          rows={1}
          placeholder="描述你的动作或对话…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="story-reader__buttons">
          <button
            className="story-reader__send-interact"
            onClick={submit}
            disabled={busy || !input.trim()}
          >
            发送互动
          </button>
          <button
            className="story-reader__send-continue"
            onClick={() => void continueStory()}
            disabled={busy}
          >
            续写
          </button>
        </div>
      </div>

      {menuTarget && (
        <SegmentActions
          segment={menuTarget}
          onClose={() => setMenuTarget(null)}
          onRegenerate={() => { setMenuTarget(null); void regenerate(menuTarget.id) }}
          onSaveEdit={(content) => { setMenuTarget(null); void editSegment(menuTarget.id, content) }}
          onDelete={() => { setMenuTarget(null); void deleteSegment(menuTarget.id) }}
          onCreateBranch={(name) => { setMenuTarget(null); void createBranch(menuTarget.id, name) }}
          onArchive={(name) => {
            const target = menuTarget
            setMenuTarget(null)
            archiveAt(target, name)
          }}
        />
      )}
    </div>
  )
}
