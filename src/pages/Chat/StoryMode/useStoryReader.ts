import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put, remove } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, type AiMessage } from '../../../services/ai'
import { buildMemoryContext } from '../../../services/memory'
import type { Archive, Character, Message, Story, StoryBranch } from '../../../types'
import type { StorySettingsData } from './useStorySettings'

const PERSON_LABEL: Record<string, string> = {
  first: '第一人称（以"我"视角叙述）',
  third: '第三人称（以"他/她"视角叙述）',
  mixed: '混合视角（灵活切换叙事人称）',
}

function buildLongPrompt(character: Character, settings: StorySettingsData): string {
  const ln = settings.longNarrative
  return [
    `你是一位小说叙事者，正在创作「${character.name}」与用户共同经历的线下剧情。`,
    character.nickname ? `故事中的用户即「${character.nickname}」。` : '',
    `角色设定：${character.persona}`,
    `叙事人称：${PERSON_LABEL[ln.narrativePerson] ?? '第三人称'}`,
    `每段目标字数：约 ${ln.targetWords} 字`,
    ln.styleGuide ? `文风要求：${ln.styleGuide}` : '',
    '用户每次输入自己的行为或对话，你据此生成下一段大段连贯的叙事文本，包含场景、动作、心理与对话描写。',
    '每次只推进一段剧情，在适合用户介入的节点收尾，不要替用户做决定或代写用户的台词。',
  ].filter(Boolean).join('\n')
}

function buildShortPrompt(character: Character, settings: StorySettingsData): string {
  const sr = settings.shortRP
  return [
    `你是角色「${character.name}」，正在和用户进行线下互动剧情。`,
    character.nickname ? `用户的名字是「${character.nickname}」。` : '',
    `角色设定：${character.persona}`,
    character.speakingStyle ? `说话风格：${character.speakingStyle}` : '',
    `请根据用户的行为描写，以${character.name}的身份作出简短真实的反应。`,
    `每次回复不超过${sr.replyWordLimit}字，不要代写用户的动作。`,
  ].filter(Boolean).join('\n')
}

function limitHistory(history: Message[], segmentLimit: number): Message[] {
  let count = 0
  const result: Message[] = []
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') count++
    result.unshift(history[i])
    if (count >= segmentLimit) break
  }
  return result
}

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

export function useStoryReader(
  character: Character,
  storyId: string | null,
  settings: StorySettingsData,
  isIfLine: boolean = false,
  onStoryCreated?: (id: string) => void,
) {
  const { apiConfigs } = useAppState()
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const [story, setStory] = useState<Story | null>(null)
  const [branches, setBranches] = useState<StoryBranch[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)
  const storyRef = useRef<Story | null>(null)
  storyRef.current = story

  useEffect(() => {
    setStory(null)
    setBranches([])
    setMessages([])
    setError(null)
    if (!storyId) return
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
    return () => { cancelled = true }
  }, [storyId])

  async function ensureStory(): Promise<Story> {
    if (storyRef.current) return storyRef.current
    const now = Date.now()
    const newStoryId = createId()
    const branch: StoryBranch = {
      id: createId(),
      storyId: newStoryId,
      parentBranchId: null,
      branchPoint: null,
      name: '主线',
      createdAt: now,
    }
    const newStory: Story = {
      id: newStoryId,
      characterId: character.id,
      title: isIfLine ? 'IF线' : `${character.name}的故事`,
      activeBranchId: branch.id,
      createdAt: now,
      updatedAt: now,
      storyType: isIfLine ? 'if' : 'main',
    }
    await put('storyBranches', branch)
    await put('stories', newStory)
    setBranches([branch])
    setStory(newStory)
    onStoryCreated?.(newStoryId)
    return newStory
  }

  async function generate(
    history: Message[],
    mode: 'long' | 'short',
    onDelta: (delta: string) => void,
  ): Promise<string> {
    if (!apiConfig) throw new Error('请先在「我的」→ API 设置中添加 API 配置')
    const isShort = mode === 'short'
    const sett = isShort ? settings.shortRP : settings.longNarrative
    let systemContent = isShort
      ? buildShortPrompt(character, settings)
      : buildLongPrompt(character, settings)
    if (!isIfLine && sett.useCharMemory) {
      const memCount = character.modelParams.memoryCount ?? 20
      systemContent += await buildMemoryContext(character.id, memCount)
    }
    const limited = limitHistory(history, sett.contextLimit)
    const aiMessages: AiMessage[] = [
      { role: 'system', content: systemContent },
      ...limited.map((m) => ({ role: m.role, content: m.content })),
    ]
    const params = character.modelParams
    return sett.streamOutput
      ? chatCompletionStream(apiConfig, aiMessages, params, onDelta)
      : chatCompletion(apiConfig, aiMessages, params)
  }

  async function touchStory(current: Story) {
    const updated: Story = { ...current, updatedAt: Date.now() }
    await put('stories', updated)
    setStory(updated)
    return updated
  }

  async function send(text: string, mode: 'long' | 'short') {
    const content = text.trim()
    if (!content || busyRef.current) return
    busyRef.current = true
    setError(null)
    try {
      const current = await ensureStory()
      const userMessage: Message = {
        id: createId(),
        characterId: character.id,
        role: 'user',
        content,
        timestamp: Date.now(),
        storyId: current.id,
        storyBranchId: current.activeBranchId,
      }
      await put('messages', userMessage)
      const history = [...messages, userMessage]
      setMessages(history)
      setStreamingText('')
      const reply = await generate(history, mode, (delta) =>
        setStreamingText((prev) => (prev ?? '') + delta),
      )
      const segment: Message = {
        id: createId(),
        characterId: character.id,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        storyId: current.id,
        storyBranchId: current.activeBranchId,
      }
      await put('messages', segment)
      setMessages([...history, segment])
      await touchStory(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试')
    } finally {
      setStreamingText(null)
      busyRef.current = false
    }
  }

  async function continueStory(mode: 'long' | 'short') {
    if (busyRef.current) return
    busyRef.current = true
    setError(null)
    try {
      const current = await ensureStory()
      setStreamingText('')
      const reply = await generate(messages, mode, (delta) =>
        setStreamingText((prev) => (prev ?? '') + delta),
      )
      const segment: Message = {
        id: createId(),
        characterId: character.id,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        storyId: current.id,
        storyBranchId: current.activeBranchId,
      }
      await put('messages', segment)
      setMessages((prev) => [...prev, segment])
      await touchStory(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试')
    } finally {
      setStreamingText(null)
      busyRef.current = false
    }
  }

  async function expand(text: string) {
    const content = text.trim()
    if (!content || busyRef.current) return
    busyRef.current = true
    setError(null)
    try {
      const current = await ensureStory()
      const expandMsg: AiMessage = {
        role: 'user',
        content: `请将以下情节梗概扩写为完整的叙事段落：\n${content}`,
      }
      if (!apiConfig) throw new Error('请先在「我的」→ API 设置中添加 API 配置')
      const ln = settings.longNarrative
      let systemContent = buildLongPrompt(character, settings)
      if (!isIfLine && ln.useCharMemory) {
        systemContent += await buildMemoryContext(character.id, character.modelParams.memoryCount ?? 20)
      }
      const aiMessages: AiMessage[] = [
        { role: 'system', content: systemContent },
        ...limitHistory(messages, ln.contextLimit).map((m) => ({ role: m.role, content: m.content })),
        expandMsg,
      ]
      setStreamingText('')
      const reply = ln.streamOutput
        ? await chatCompletionStream(apiConfig, aiMessages, character.modelParams, (d) =>
            setStreamingText((prev) => (prev ?? '') + d))
        : await chatCompletion(apiConfig, aiMessages, character.modelParams)
      const segment: Message = {
        id: createId(),
        characterId: character.id,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        storyId: current.id,
        storyBranchId: current.activeBranchId,
      }
      await put('messages', segment)
      setMessages((prev) => [...prev, segment])
      await touchStory(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : '扩写失败，请稍后重试')
    } finally {
      setStreamingText(null)
      busyRef.current = false
    }
  }

  async function regenerate(segmentId: string, mode: 'long' | 'short') {
    const index = messages.findIndex((m) => m.id === segmentId)
    const target = messages[index]
    if (!target || busyRef.current) return
    busyRef.current = true
    setError(null)
    setRegeneratingId(segmentId)
    try {
      setStreamingText('')
      const reply = await generate(messages.slice(0, index), mode, (delta) =>
        setStreamingText((prev) => (prev ?? '') + delta),
      )
      const updated: Message = { ...target, content: reply }
      await put('messages', updated)
      setMessages((prev) => prev.map((m) => (m.id === segmentId ? updated : m)))
      if (storyRef.current) await touchStory(storyRef.current)
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

  function deleteSegment(segmentId: string): { message: Message; position: number } | null {
    const index = messages.findIndex((m) => m.id === segmentId)
    if (index < 0) return null
    const msg = messages[index]
    void remove('messages', segmentId)
    setMessages((prev) => prev.filter((m) => m.id !== segmentId))
    return { message: msg, position: index }
  }

  async function restoreSegment(message: Message, position: number) {
    await put('messages', message)
    setMessages((prev) => {
      const next = [...prev]
      const clamp = Math.min(position, next.length)
      next.splice(clamp, 0, message)
      return next
    })
  }

  async function togglePinParagraph(segmentId: string) {
    const current = storyRef.current
    if (!current) return
    const pinned = current.pinnedParagraphIds ?? []
    const next = pinned.includes(segmentId)
      ? pinned.filter((id) => id !== segmentId)
      : [...pinned, segmentId]
    const updated: Story = { ...current, pinnedParagraphIds: next }
    await put('stories', updated)
    setStory(updated)
  }

  async function switchBranch(branchId: string) {
    if (!storyRef.current || busyRef.current || branchId === storyRef.current.activeBranchId) return
    const updated: Story = { ...storyRef.current, activeBranchId: branchId }
    await put('stories', updated)
    setStory(updated)
    setMessages(await loadBranchMessages(storyRef.current.id, branchId))
  }

  async function createBranch(segmentId: string, name: string) {
    const index = messages.findIndex((m) => m.id === segmentId)
    if (!storyRef.current || index < 0 || busyRef.current) return
    const prefix = messages.slice(0, index + 1)
    const branch: StoryBranch = {
      id: createId(),
      storyId: storyRef.current.id,
      parentBranchId: storyRef.current.activeBranchId,
      branchPoint: prefix.filter((m) => m.role === 'assistant').length,
      name,
      createdAt: Date.now(),
    }
    await put('storyBranches', branch)
    const copies = prefix.map((m) => ({ ...m, id: createId(), storyBranchId: branch.id }))
    for (const copy of copies) await put('messages', copy)
    const updated: Story = { ...storyRef.current, activeBranchId: branch.id, updatedAt: Date.now() }
    await put('stories', updated)
    setBranches((prev) => sortBranches([...prev, branch]))
    setStory(updated)
    setMessages(copies)
  }

  async function createIfLineFromSegment(
    segmentId: string,
    title: string,
  ): Promise<string | null> {
    const index = messages.findIndex((m) => m.id === segmentId)
    if (!storyRef.current || index < 0) return null
    const prefix = messages.slice(0, index + 1)
    const now = Date.now()
    const newStoryId = createId()
    const branch: StoryBranch = {
      id: createId(),
      storyId: newStoryId,
      parentBranchId: null,
      branchPoint: null,
      name: '主线',
      createdAt: now,
    }
    const ifStory: Story = {
      id: newStoryId,
      characterId: character.id,
      title,
      activeBranchId: branch.id,
      createdAt: now,
      updatedAt: now,
      storyType: 'if',
    }
    await put('storyBranches', branch)
    await put('stories', ifStory)
    const copies = prefix.map((m) => ({
      ...m,
      id: createId(),
      storyId: newStoryId,
      storyBranchId: branch.id,
    }))
    for (const copy of copies) await put('messages', copy)
    return newStoryId
  }

  async function renameBranch(branchId: string, name: string) {
    const target = branches.find((b) => b.id === branchId)
    if (!target || !name.trim()) return
    const updated: StoryBranch = { ...target, name: name.trim() }
    await put('storyBranches', updated)
    setBranches((prev) => prev.map((b) => (b.id === branchId ? updated : b)))
  }

  async function deleteBranch(branchId: string) {
    const target = branches.find((b) => b.id === branchId)
    if (!storyRef.current || !target || target.parentBranchId === null || busyRef.current) return
    const owned = await loadBranchMessages(storyRef.current.id, branchId)
    for (const m of owned) await remove('messages', m.id)
    await remove('storyBranches', branchId)
    const remaining = branches.filter((b) => b.id !== branchId)
    setBranches(remaining)
    if (storyRef.current.activeBranchId === branchId) {
      const fallback = remaining.find((b) => b.parentBranchId === null) ?? remaining[0]
      if (fallback) {
        const updated: Story = { ...storyRef.current, activeBranchId: fallback.id }
        await put('stories', updated)
        setStory(updated)
        setMessages(await loadBranchMessages(storyRef.current.id, fallback.id))
      }
    }
  }

  async function restoreArchive(archive: Archive): Promise<string | null> {
    if (!storyRef.current || busyRef.current) return '正在生成中，暂时无法加载存档'
    if (!branches.some((b) => b.id === archive.branchId)) return '该存档所属的分支已被删除，无法加载'
    const all = await loadBranchMessages(storyRef.current.id, archive.branchId)
    let seen = 0
    let cut = all.length
    for (let i = 0; i < all.length; i++) {
      if (all[i].role === 'assistant') seen++
      if (seen === archive.segmentIndex) { cut = i + 1; break }
    }
    for (const m of all.slice(cut)) await remove('messages', m.id)
    if (storyRef.current.activeBranchId !== archive.branchId) {
      const updated: Story = { ...storyRef.current, activeBranchId: archive.branchId }
      await put('stories', updated)
      setStory(updated)
    }
    setMessages(all.slice(0, cut))
    setError(null)
    return null
  }

  return {
    story, branches, messages, streamingText, regeneratingId, error,
    busy: streamingText !== null,
    send, continueStory, expand, regenerate, editSegment, deleteSegment, restoreSegment,
    togglePinParagraph, switchBranch, createBranch, createIfLineFromSegment,
    renameBranch, deleteBranch, restoreArchive,
  }
}
