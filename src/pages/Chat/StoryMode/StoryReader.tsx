import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import SubPage from '../../../components/SubPage'
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

const LONG_PRESS_MS = 550

export default function StoryReader({ character, storyId, onBack }: StoryReaderProps) {
  const { settings, saveSettings } = useStorySettings()
  const {
    story,
    branches,
    messages,
    streamingText,
    regeneratingId,
    error,
    busy,
    send,
    regenerate,
    editSegment,
    deleteSegment,
    switchBranch,
    createBranch,
    renameBranch,
    deleteBranch,
    restoreArchive,
  } = useStoryReader(character, storyId, settings)
  const { archives, archiving, createArchive, updateArchive, deleteArchive } = useArchives(
    character,
    storyId,
  )
  const [input, setInput] = useState('')
  const [menuTarget, setMenuTarget] = useState<Message | null>(null)
  const [showArchives, setShowArchives] = useState(false)
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
        onSave={async (data) => {
          await saveSettings(data)
        }}
      />
    )
  }

  if (showArchives) {
    return (
      <ArchiveList
        archives={archives}
        branches={branches}
        onBack={() => setShowArchives(false)}
        onLoad={async (archive) => {
          const err = await restoreArchive(archive)
          if (!err) setShowArchives(false)
          return err
        }}
        onUpdate={(id, name, summary) => void updateArchive(id, name, summary)}
        onDelete={(id) => void deleteArchive(id)}
      />
    )
  }

  let segIndex = 0
  let interactions = 0

  return (
    <SubPage title={story?.title ?? '故事'} onBack={onBack}>
      <div className="story-reader" style={THEME_VARS[settings.theme] as React.CSSProperties}>
        <div className="story-reader__topbar">
          <BranchBar
            branches={branches}
            activeBranchId={story?.activeBranchId ?? null}
            disabled={busy}
            onSwitch={(id) => void switchBranch(id)}
            onRename={(id, name) => void renameBranch(id, name)}
            onDelete={(id) => void deleteBranch(id)}
          />
          <button
            className="story-reader__archive-btn"
            disabled={busy}
            onClick={() => setShowArchives(true)}
          >
            存档
          </button>
          <button
            className="story-reader__settings-btn"
            onClick={() => setShowSettings(true)}
            aria-label="剧情设定"
          >
            ⚙
          </button>
        </div>
        <div className="story-reader__scroll">
          {messages.length === 0 && streamingText === null && (
            <p className="story-reader__empty">输入一段开场行为或场景，开始这个故事</p>
          )}
          {messages.map((m) => {
            if (m.role === 'user') {
              interactions += 1
              return (
                <p key={m.id} className="story-reader__user">
                  {m.content}
                </p>
              )
            }
            segIndex += 1
            const isRegenerating = m.id === regeneratingId
            return (
              <section
                key={m.id}
                className="story-reader__segment"
                onDoubleClick={() => !busy && setMenuTarget(m)}
                onPointerDown={() => !busy && startPress(m)}
                onPointerUp={cancelPress}
                onPointerMove={cancelPress}
                onPointerLeave={cancelPress}
              >
                <header className="story-reader__segment-meta">
                  第{segIndex}段 · 累计至{interactions}条互动
                </header>
                <div className="story-reader__segment-text">
                  {isRegenerating ? streamingText || '正在重新生成…' : m.content}
                </div>
              </section>
            )
          })}
          {streamingText !== null && regeneratingId === null && (
            <section className="story-reader__segment">
              <header className="story-reader__segment-meta">
                第{segIndex + 1}段 · 累计至{interactions}条互动
              </header>
              <div className="story-reader__segment-text">{streamingText || '正在生成…'}</div>
            </section>
          )}
          {archiving && <p className="story-reader__archiving">正在生成剧情总结并创建存档…</p>}
          {error && <p className="story-reader__error">{error}</p>}
          <div ref={endRef} />
        </div>
        <div className="story-reader__input-bar">
          <textarea
            className="story-reader__input"
            value={input}
            rows={1}
            placeholder="输入你的行为或对话，推动剧情…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="story-reader__send"
            onClick={submit}
            disabled={busy || !input.trim()}
          >
            推进
          </button>
        </div>
      </div>
      {menuTarget && (
        <SegmentActions
          segment={menuTarget}
          onClose={() => setMenuTarget(null)}
          onRegenerate={() => {
            setMenuTarget(null)
            void regenerate(menuTarget.id)
          }}
          onSaveEdit={(content) => {
            setMenuTarget(null)
            void editSegment(menuTarget.id, content)
          }}
          onDelete={() => {
            setMenuTarget(null)
            void deleteSegment(menuTarget.id)
          }}
          onCreateBranch={(name) => {
            setMenuTarget(null)
            void createBranch(menuTarget.id, name)
          }}
          onArchive={(name) => {
            const target = menuTarget
            setMenuTarget(null)
            archiveAt(target, name)
          }}
        />
      )}
    </SubPage>
  )
}
