import { useEffect, useRef } from 'react'
import { useAppState } from '../store/AppContext'
import { chatCompletion, getConfigForFeature, type AiMessage } from '../services/ai'
import { createId, getAll, put } from '../services/storage'
import type { ApiConfig, Character, Message } from '../types'

async function triggerAutoSend(character: Character, apiConfig: ApiConfig): Promise<void> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是「${character.name}」，正在主动给用户发消息。${character.persona}`,
    },
    {
      role: 'user',
      content:
        '请以角色身份主动发送一条自然的消息，分享当下的心情、想法或一件小事。只写消息正文，不加任何前缀。',
    },
  ]
  const content = await chatCompletion(apiConfig, messages, {
    ...character.modelParams,
    maxTokens: 200,
    stream: false,
  })
  if (!content.trim()) return
  await put('messages', {
    id: createId(),
    characterId: character.id,
    role: 'assistant',
    content: content.trim(),
    timestamp: Date.now(),
  })
}

async function triggerAutoDiary(
  character: Character,
  apiConfig: ApiConfig,
  branchId: string | null,
): Promise<void> {
  let contextMessages: AiMessage[] = []
  if (branchId) {
    const allMessages = await getAll<Message>('messages')
    const recent = allMessages
      .filter((m) => m.storyBranchId === branchId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
    contextMessages = recent.map((m) => ({ role: m.role, content: m.content }))
  }
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是「${character.name}」，正在写一篇日记。${character.persona}`,
    },
    ...contextMessages,
    {
      role: 'user',
      content: '请以第一人称为角色写一篇简短的日记，记录今天的心情和发生的事情，200字以内。',
    },
  ]
  const content = await chatCompletion(apiConfig, messages, {
    ...character.modelParams,
    maxTokens: 400,
    stream: false,
  })
  if (!content.trim()) return
  await put('moments', {
    id: createId(),
    characterId: character.id,
    content: content.trim(),
    type: 'diary',
    branchId,
    createdAt: Date.now(),
  })
}

async function triggerAutoMoments(
  character: Character,
  apiConfig: ApiConfig,
  branchId: string | null,
): Promise<void> {
  let contextMessages: AiMessage[] = []
  if (branchId) {
    const allMessages = await getAll<Message>('messages')
    const recent = allMessages
      .filter((m) => m.storyBranchId === branchId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
    contextMessages = recent.map((m) => ({ role: m.role, content: m.content }))
  }
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是「${character.name}」，正在发布一条朋友圈。${character.persona}`,
    },
    ...contextMessages,
    {
      role: 'user',
      content: '请为角色写一条朋友圈状态，简短自然，分享心情、生活片段或感悟，100字以内。',
    },
  ]
  const content = await chatCompletion(apiConfig, messages, {
    ...character.modelParams,
    maxTokens: 200,
    stream: false,
  })
  if (!content.trim()) return
  await put('moments', {
    id: createId(),
    characterId: character.id,
    content: content.trim(),
    type: 'moment',
    branchId,
    createdAt: Date.now(),
  })
}

export function useAutoScheduler() {
  const { characters, activeCharacterId, apiConfigs, featureApiAssignment } = useAppState()
  const character = characters.find((c) => c.id === activeCharacterId) ?? null
  const primaryConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null

  const autoSendConfig = getConfigForFeature(apiConfigs, featureApiAssignment, 'auto_send') ?? primaryConfig
  const autoDiaryConfig = getConfigForFeature(apiConfigs, featureApiAssignment, 'auto_diary') ?? primaryConfig
  const autoMomentsConfig = getConfigForFeature(apiConfigs, featureApiAssignment, 'auto_moments') ?? primaryConfig

  const autoSendRef = useRef<number | null>(null)
  const dailyRef = useRef<number | null>(null)
  const lastDiaryDateRef = useRef<string>('')
  const lastMomentsDateRef = useRef<string>('')

  useEffect(() => {
    if (autoSendRef.current !== null) window.clearInterval(autoSendRef.current)
    if (dailyRef.current !== null) window.clearInterval(dailyRef.current)
    autoSendRef.current = null
    dailyRef.current = null

    if (!character || !primaryConfig) return
    const auto = character.autoBehavior
    if (!auto) return

    if (auto.autoSend.enabled && auto.autoSend.intervalMinutes >= 60 && autoSendConfig) {
      const ms = auto.autoSend.intervalMinutes * 60 * 1000
      autoSendRef.current = window.setInterval(() => {
        void triggerAutoSend(character, autoSendConfig).catch(() => undefined)
      }, ms)
    }

    const needsDailyCheck = auto.autoDiary.enabled || auto.autoMoments.enabled
    if (needsDailyCheck) {
      dailyRef.current = window.setInterval(() => {
        const now = new Date()
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:00`
        const today = now.toISOString().slice(0, 10)

        if (
          auto.autoDiary.enabled &&
          autoDiaryConfig &&
          auto.autoDiary.time === hhmm &&
          lastDiaryDateRef.current !== today
        ) {
          lastDiaryDateRef.current = today
          void triggerAutoDiary(character, autoDiaryConfig, auto.autoDiary.branchId).catch(() => undefined)
        }
        if (
          auto.autoMoments.enabled &&
          autoMomentsConfig &&
          auto.autoMoments.time === hhmm &&
          lastMomentsDateRef.current !== today
        ) {
          lastMomentsDateRef.current = today
          void triggerAutoMoments(character, autoMomentsConfig, auto.autoMoments.branchId).catch(
            () => undefined,
          )
        }
      }, 60_000)
    }

    return () => {
      if (autoSendRef.current !== null) window.clearInterval(autoSendRef.current)
      if (dailyRef.current !== null) window.clearInterval(dailyRef.current)
    }
  }, [character, primaryConfig, autoSendConfig, autoDiaryConfig, autoMomentsConfig])
}
