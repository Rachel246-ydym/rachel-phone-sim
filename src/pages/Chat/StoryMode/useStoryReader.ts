import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put, remove } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, type AiMessage } from '../../../services/ai'
import type { Archive, Character, Message, Story, StoryBranch } from '../../../types'
import type { StorySettingsData } from './useStorySettings'

const PERSON_LABEL: Record<StorySettingsData['narrativePerson'], string> = {
  first: '第一人称（以"我"视角叙述）',
  third: '第三人称（以"他/她"视角叙述）',
  mixed: '混合视角（灵活切换叙事人称）',
}

function buildStoryPrompt(character: Character, settings: StorySettingsData): string {
  return [
    `你是一位小说叙事者，正在创作「${character.name}」与用户共同经历的线下剧情。`,
    character.nickname ? `故事中的用户即「${character.nickname}」。` : '',
    `角色设定：${character.persona}`,
    `叙事人称：${PERSON_LABEL[settings.narrativePerson]}`,
    `每段目标字数：约 ${settings.targetWords} 字`,
    settings.styleGuide ? `文风要求：${settings.styleGuide}` : '',
    '用户每次输入自己的行为或对话，你据此生成下一段大段连贯的叙事文本，包含场景、动作、心理与对话描写。',
    '每次只推进一段剧情，在适合用户介入的节点收尾，不要替用户做决定或代写用户的台词。',
  ]
    .filter(Boolean)
    .join('\n')
}

// 主线（parentBranchId 为 null）排最前，其余按创建时间排序
function sortBranches(list: StoryBranch[]): StoryBranch[] {
  return [...list].sort(
    (a, b) =>
      Number(a.parentBranchId !== null) - Number(b.parentBranchId !== null) ||
      a.createdAt - b.createdAt,
  )
}

async function loadBranchMessages(storyId: string, branchId: string): Promise<Message[]> {
  const all = await getAll<Message>('messages')
  return all
    .filter((m) => m.storyId === storyId && m.storyBranchId === branchId)
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function useStoryReader(character: Character, storyId: string, settings: StorySettingsData) {
  const { apiConfigs } = useAppState()
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const [story, setStory] = useState<Story | null>(null)
  const [branches, setBranches] = useState<StoryBranch[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [loaded, allBranches] = await Promise.all([
        get<Story>('stories', storyId),
        getAll<StoryBranch>('storyBranches'),
      ])
      if (cancelled) return
      setStory(loaded ?? null)
      setBranches(sortBranches(allBranches.filter((b) => b.storyId === storyId)))
      if (loaded) {
        const msgs = await loadBranchMessages(storyId, loaded.activeBranchId)
        if (!cancelled) setMessages(msgs)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [storyId])

  async function generate(history: Message[], onDelta: (delta: string) => void): Promise<string> {
    if (!apiConfig) {
      throw new Error('请先在「我的」→ API 设置中添加 API 配置')
    }
    const aiMessages: AiMessage[] = [
      { role: 'system', content: buildStoryPrompt(character, settings) },
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

  async function switchBranch(branchId: string) {
    if (!story || busyRef.current || branchId === story.activeBranchId) return
    const updated: Story = { ...story, activeBranchId: branchId }
    await put('stories', updated)
    setStory(updated)
    setMessages(await loadBranchMessages(storyId, branchId))
  }

  // 从指定段落创建分支：复制该段及之前的所有内容，之后独立发展
  async function createBranch(segmentId: string, name: string) {
    const index = messages.findIndex((m) => m.id === segmentId)
    if (!story || index < 0 || busyRef.current) return
    const prefix = messages.slice(0, index + 1)
    const branch: StoryBranch = {
      id: createId(),
      storyId,
      parentBranchId: story.activeBranchId,
      branchPoint: prefix.filter((m) => m.role === 'assistant').length,
      name,
      createdAt: Date.now(),
    }
    await put('storyBranches', branch)
    const copies = prefix.map((m) => ({ ...m, id: createId(), storyBranchId: branch.id }))
    for (const copy of copies) {
      await put('messages', copy)
    }
    const updated: Story = { ...story, activeBranchId: branch.id, updatedAt: Date.now() }
    await put('stories', updated)
    setBranches((prev) => sortBranches([...prev, branch]))
    setStory(updated)
    setMessages(copies)
  }

  async function renameBranch(branchId: string, name: string) {
    const target = branches.find((b) => b.id === branchId)
    const trimmed = name.trim()
    if (!target || !trimmed) return
    const updated: StoryBranch = { ...target, name: trimmed }
    await put('storyBranches', updated)
    setBranches((prev) => prev.map((b) => (b.id === branchId ? updated : b)))
  }

  // 删除分支及其全部段落；主线不可删除，删除当前分支后回到主线
  async function deleteBranch(branchId: string) {
    const target = branches.find((b) => b.id === branchId)
    if (!story || !target || target.parentBranchId === null || busyRef.current) return
    const owned = await loadBranchMessages(storyId, branchId)
    for (const m of owned) {
      await remove('messages', m.id)
    }
    await remove('storyBranches', branchId)
    const remaining = branches.filter((b) => b.id !== branchId)
    setBranches(remaining)
    if (story.activeBranchId === branchId) {
      const fallback = remaining.find((b) => b.parentBranchId === null) ?? remaining[0]
      if (fallback) {
        const updated: Story = { ...story, activeBranchId: fallback.id }
        await put('stories', updated)
        setStory(updated)
        setMessages(await loadBranchMessages(storyId, fallback.id))
      }
    }
  }

  // 加载存档：切到存档分支并回到存档段落，删除该分支存档点之后的内容；返回错误文案或 null
  async function restoreArchive(archive: Archive): Promise<string | null> {
    if (!story || busyRef.current) return '正在生成中，暂时无法加载存档'
    if (!branches.some((b) => b.id === archive.branchId)) {
      return '该存档所属的分支已被删除，无法加载'
    }
    const all = await loadBranchMessages(storyId, archive.branchId)
    let seen = 0
    let cut = all.length
    for (let i = 0; i < all.length; i += 1) {
      if (all[i].role === 'assistant') {
        seen += 1
        if (seen === archive.segmentIndex) {
          cut = i + 1
          break
        }
      }
    }
    for (const m of all.slice(cut)) {
      await remove('messages', m.id)
    }
    if (story.activeBranchId !== archive.branchId) {
      const updated: Story = { ...story, activeBranchId: archive.branchId }
      await put('stories', updated)
      setStory(updated)
    }
    setMessages(all.slice(0, cut))
    setError(null)
    return null
  }

  return {
    story,
    branches,
    messages,
    streamingText,
    regeneratingId,
    error,
    busy: streamingText !== null,
    send,
    regenerate,
    editSegment,
    deleteSegment,
    switchBranch,
    createBranch,
    renameBranch,
    deleteBranch,
    restoreArchive,
  }
}
