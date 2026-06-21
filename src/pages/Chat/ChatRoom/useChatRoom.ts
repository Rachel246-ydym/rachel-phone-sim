import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, getConfigForFeature, type AiMessage } from '../../../services/ai'
import { addMemory, buildMemoryContext } from '../../../services/memory'
import { CHAT_SYSTEM_PROMPT } from '../../../constants/builtInPrompts'
import type { ApiConfig, Character, Message } from '../../../types'

function buildSystemPrompt(character: Character, memoryContext: string): string {
  return [
    CHAT_SYSTEM_PROMPT,
    '【角色设定】',
    `你正在扮演「${character.name}」，通过手机和用户聊天。`,
    character.nickname ? `你称呼用户为「${character.nickname}」。` : '',
    character.persona,
    character.speakingStyle ? `【说话风格】\n${character.speakingStyle}` : '',
    memoryContext,
    character.customChatPrompt ? `【用户自定义指令】\n${character.customChatPrompt}` : '',
  ].filter(Boolean).join('\n')
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

  const maxLen = character.characterSettings?.memoryMaxSummaryLength ?? 100
  const recent = allMessages.slice(-auto.every * 2)
  const summaryMessages: AiMessage[] = [
    {
      role: 'system',
      content:
        `你是记忆整理助手。请将以下对话内容整理为一条核心记忆，格式严格为：【标题】不超过10个字的标题【内容】不超过${maxLen}字的正文。客观描述发生了什么，不含主观评价。`,
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
  const raw = await chatCompletion(apiConfig, summaryMessages, {
    ...character.modelParams,
    maxTokens: 400,
    stream: false,
  })
  if (!raw.trim()) return

  const titleMatch = raw.match(/【标题】(.+?)【内容】/)
  const contentMatch = raw.match(/【内容】([\s\S]+)$/)
  const title = titleMatch?.[1]?.trim() ?? ''
  const content = contentMatch?.[1]?.trim() ?? raw.trim()

  if (content) {
    await addMemory(
      character.id,
      content,
      'auto-summary',
      `自动总结（第${assistantCount}轮对话）`,
      undefined,
      title,
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
  const { characters, activeCharacterId, messages, apiConfigs, featureApiAssignment } = useAppState()
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

      const summaryConfig = getConfigForFeature(apiConfigs, featureApiAssignment, 'auto_summary') ?? apiConfig
      const hvConfig = getConfigForFeature(apiConfigs, featureApiAssignment, 'heart_voice') ?? apiConfig

      void runAutoSummary(character, historyMessages, summaryConfig)
      if (character.heartVoiceEnabled) {
        void runHeartVoice(character, content, lastReply, hvConfig, setLatestHeartVoice)
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
