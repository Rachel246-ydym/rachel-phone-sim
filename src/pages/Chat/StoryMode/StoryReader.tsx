import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import SubPage from '../../../components/SubPage'
import BranchBar from './BranchBar'
import SegmentActions from './SegmentActions'
import { useStoryReader } from './useStoryReader'
import type { Character, Message } from '../../../types'

interface StoryReaderProps {
  character: Character
  storyId: string
  onBack: () => void
}

const LONG_PRESS_MS = 550

export default function StoryReader({ character, storyId, onBack }: StoryReaderProps) {
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
  } = useStoryReader(character, storyId)
  const [input, setInput] = useState('')
  const [menuTarget, setMenuTarget] = useState<Message | null>(null)
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

  let segIndex = 0
  let interactions = 0

  return (
    <SubPage title={story?.title ?? '故事'} onBack={onBack}>
      <div className="story-reader">
        <BranchBar
          branches={branches}
          activeBranchId={story?.activeBranchId ?? null}
          disabled={busy}
          onSwitch={(id) => void switchBranch(id)}
          onRename={(id, name) => void renameBranch(id, name)}
          onDelete={(id) => void deleteBranch(id)}
        />
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
        />
      )}
    </SubPage>
  )
}
