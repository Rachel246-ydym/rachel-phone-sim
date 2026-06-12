import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put, remove } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, type AiMessage } from '../../../services/ai'
import type { Character, Message, Story } from '../../../types'

function buildStoryPrompt(character: Character): string {
  return [
    `你是一位小说叙事者，正在创作「${character.name}」与用户共同经历的线下剧情。`,
    character.nickname ? `故事中的用户即「${character.nickname}」。` : '',
    `角色设定：${character.persona}`,
    '用户每次输入自己的行为或对话，你据此生成下一段大段连贯的叙事文本，包含场景、动作、心理与对话描写。',
    '每次只推进一段剧情，在适合用户介入的节点收尾，不要替用户做决定或代写用户的台词。',
  ]
    .filter(Boolean)
    .join('\n')
}

export function useStoryReader(character: Character, storyId: string) {
  const { apiConfigs } = useAppState()
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const [story, setStory] = useState<Story | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([get<Story>('stories', storyId), getAll<Message>('messages')]).then(
      ([loaded, all]) => {
        if (cancelled) return
        setStory(loaded ?? null)
        setMessages(
          all.filter((m) => m.storyId === storyId).sort((a, b) => a.timestamp - b.timestamp),
        )
      },
    )
    return () => {
      cancelled = true
    }
  }, [storyId])

  async function generate(history: Message[], onDelta: (delta: string) => void): Promise<string> {
    if (!apiConfig) {
      throw new Error('请先在「我的」→ API 设置中添加 API 配置')
    }
    const aiMessages: AiMessage[] = [
      { role: 'system', content: buildStoryPrompt(character) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]
    const params = character.modelParams
    return params.stream
      ? chatCompletionStream(apiConfig, aiMessages, params, onDelta)
      : chatCompletion(apiConfig, aiMessages, params)
  }

  async function touchStory(current: Story) {
    const updated: Story = { ...current, updatedAt: Date.now() }
    await put('stories', updated)
    setStory(updated)
  }

  async function send(text: string) {
    const content = text.trim()
    if (!story || !content || busyRef.current) return
    busyRef.current = true
    setError(null)
    const userMessage: Message = {
      id: createId(),
      characterId: character.id,
      role: 'user',
      content,
      timestamp: Date.now(),
      storyId: story.id,
      storyBranchId: story.activeBranchId,
    }
    try {
      await put('messages', userMessage)
      const history = [...messages, userMessage]
      setMessages(history)
      setStreamingText('')
      const reply = await generate(history, (delta) =>
        setStreamingText((prev) => (prev ?? '') + delta),
      )
      const segment: Message = {
        id: createId(),
        characterId: character.id,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        storyId: story.id,
        storyBranchId: story.activeBranchId,
      }
      await put('messages', segment)
      setMessages([...history, segment])
      await touchStory(story)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试')
    } finally {
      setStreamingText(null)
      busyRef.current = false
    }
  }

  async function regenerate(segmentId: string) {
    const index = messages.findIndex((m) => m.id === segmentId)
    const target = messages[index]
    if (!story || !target || busyRef.current) return
    busyRef.current = true
    setError(null)
    setRegeneratingId(segmentId)
    try {
      setStreamingText('')
      const reply = await generate(messages.slice(0, index), (delta) =>
        setStreamingText((prev) => (prev ?? '') + delta),
      )
      const updated: Message = { ...target, content: reply }
      await put('messages', updated)
      setMessages((prev) => prev.map((m) => (m.id === segmentId ? updated : m)))
      await touchStory(story)
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新生成失败，请稍后重试')
    } finally {
      setStreamingText(null)
      setRegeneratingId(null)
      busyRef.current = false
    }
  }

  async function editSegment(segmentId: string, content: string) {
    const target = messages.find((m) => m.id === segmentId)
    if (!target) return
    const updated: Message = { ...target, content }
    await put('messages', updated)
    setMessages((prev) => prev.map((m) => (m.id === segmentId ? updated : m)))
  }

  async function deleteSegment(segmentId: string) {
    await remove('messages', segmentId)
    setMessages((prev) => prev.filter((m) => m.id !== segmentId))
  }

  return {
    story,
    messages,
    streamingText,
    regeneratingId,
    error,
    busy: streamingText !== null,
    send,
    regenerate,
    editSegment,
    deleteSegment,
  }
}
