import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, type AiMessage } from '../../../services/ai'
import { addMemory, buildMemoryContext } from '../../../services/memory'
import type { ApiConfig, Character, Message } from '../../../types'

function buildSystemPrompt(character: Character, memoryContext: string): string {
  return (
    [
      `你正在扮演「${character.name}」，通过手机和用户聊天。`,
      character.nickname ? `你称呼用户为「${character.nickname}」。` : '',
      '动作描写用 * 包裹（如 *他低头笑了笑*），区别于对话文本。',
      character.persona,
    ]
      .filter(Boolean)
      .join('\n') + memoryContext
  )
}

async function runAutoSummary(
  character: Character,
  allMessages: Message[],
  apiConfig: ApiConfig,
): Promise<void> {
  const key = `memory_auto_${character.id}`
  const entry = await get<{ id: string; value: { enabled: boolean; every: number } }>(
    'settings',
    key,
  )
  const auto = entry?.value ?? { enabled: false, every: 20 }
  if (!auto.enabled || auto.every <= 0) return

  const assistantCount = allMessages.filter((m) => m.role === 'assistant').length
  if (assistantCount === 0 || assistantCount % auto.every !== 0) return

  const recent = allMessages.slice(-auto.every * 2)
  const summaryMessages: AiMessage[] = [
    {
      role: 'system',
      content:
        '你是记忆整理助手。请将以下对话内容整理为一条简洁的核心记忆（3-5句话），客观描述发生了什么，不含主观评价。',
    },
    {
      role: 'user',
      content:
        `对话内容：\n` +
        recent
          .map((m) => `${m.role === 'user' ? '用户' : character.name}：${m.content}`)
          .join('\n\n') +
        '\n\n请生成核心记忆：',
    },
  ]
  const summary = await chatCompletion(apiConfig, summaryMessages, {
    ...character.modelParams,
    maxTokens: 300,
    stream: false,
  })
  if (summary.trim()) {
    await addMemory(
      character.id,
      summary.trim(),
      'auto-summary',
      `自动总结（第${assistantCount}轮对话）`,
    )
  }
}

async function runHeartVoice(
  character: Character,
  userContent: string,
  assistantReply: string,
  apiConfig: ApiConfig,
  onResult: (voice: string) => void,
): Promise<void> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你正在扮演「${character.name}」。${character.persona ? '\n' + character.persona : ''}`,
    },
    {
      role: 'user',
      content:
        `刚才和用户的对话：\n用户："${userContent}"\n你的回复："${assistantReply}"\n\n` +
        `基于刚才的对话，用第一人称写出你此刻的内心想法，1-2句话，不超过50字。`,
    },
  ]
  const voice = await chatCompletion(apiConfig, messages, {
    ...character.modelParams,
    maxTokens: 100,
    stream: false,
  })
  const content = voice.trim()
  if (!content) return
  await put('heartVoices', {
    id: createId(),
    characterId: character.id,
    content,
    createdAt: Date.now(),
  })
  onResult(content)
}

export function useChatRoom() {
  const { characters, activeCharacterId, messages, apiConfigs } = useAppState()
  const dispatch = useAppDispatch()
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [latestHeartVoice, setLatestHeartVoice] = useState<string | null>(null)
  const sendingRef = useRef(false)

  const character = characters.find((c) => c.id === activeCharacterId) ?? null
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const characterId = character?.id ?? null

  useEffect(() => {
    setLatestHeartVoice(null)
  }, [characterId])

  useEffect(() => {
    if (!characterId) return
    let cancelled = false
    void getAll<Message>('messages').then((all) => {
      if (cancelled) return
      const own = all
        .filter((m) => m.characterId === characterId && !m.storyId)
        .sort((a, b) => a.timestamp - b.timestamp)
      dispatch({ type: 'chat/setMessages', messages: own })
    })
    return () => {
      cancelled = true
    }
  }, [characterId, dispatch])

  async function send(text: string) {
    const content = text.trim()
    if (!character || !content || sendingRef.current) return
    if (!apiConfig) {
      setError('请先在「我的」→ API 设置中添加 API 配置')
      return
    }
    setError(null)
    sendingRef.current = true

    const userMessage: Message = {
      id: createId(),
      characterId: character.id,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    await put('messages', userMessage)
    dispatch({ type: 'chat/appendMessage', message: userMessage })

    const memCount = character.modelParams.memoryCount ?? 20
    const memoryContext = await buildMemoryContext(character.id, memCount)
    const params = character.modelParams
    const replyMode = params.replyMode ?? 'manual'
    const replyCount =
      replyMode === 'manual'
        ? 1
        : Math.floor(Math.random() * (params.maxReplies - params.minReplies + 1)) +
          params.minReplies
    const systemMsg: AiMessage = {
      role: 'system',
      content: buildSystemPrompt(character, memoryContext),
    }

    try {
      let historyMessages: Message[] = [...messages, userMessage]
      let lastReply = ''

      for (let i = 0; i < replyCount; i++) {
        setStreamingText('')
        const aiMessages: AiMessage[] = [
          systemMsg,
          ...historyMessages.map((m) => ({ role: m.role, content: m.content })),
        ]
        const reply = params.stream
          ? await chatCompletionStream(apiConfig, aiMessages, params, (delta) =>
              setStreamingText((prev) => (prev ?? '') + delta),
            )
          : await chatCompletion(apiConfig, aiMessages, params)
        lastReply = reply
        const assistantMessage: Message = {
          id: createId(),
          characterId: character.id,
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        }
        await put('messages', assistantMessage)
        dispatch({ type: 'chat/appendMessage', message: assistantMessage })
        historyMessages = [...historyMessages, assistantMessage]
        if (i < replyCount - 1) {
          await new Promise<void>((resolve) => setTimeout(resolve, 800))
        }
      }

      // fire-and-forget: auto-summary + heart voice
      void runAutoSummary(character, historyMessages, apiConfig)
      if (character.heartVoiceEnabled) {
        void runHeartVoice(character, content, lastReply, apiConfig, setLatestHeartVoice)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 回复失败，请稍后重试')
    } finally {
      setStreamingText(null)
      sendingRef.current = false
    }
  }

  return {
    character,
    messages,
    streamingText,
    error,
    latestHeartVoice,
    send,
    sending: streamingText !== null,
  }
}
