import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, getAll, put } from '../../../services/storage'
import { chatCompletion, chatCompletionStream, type AiMessage } from '../../../services/ai'
import type { Character, Message } from '../../../types'

function buildSystemPrompt(character: Character): string {
  return [
    `你正在扮演「${character.name}」，通过手机和用户聊天。`,
    character.nickname ? `你称呼用户为「${character.nickname}」。` : '',
    '动作描写用 * 包裹（如 *他低头笑了笑*），区别于对话文本。',
    character.persona,
  ]
    .filter(Boolean)
    .join('\n')
}

export function useChatRoom() {
  const { characters, activeCharacterId, messages, apiConfigs } = useAppState()
  const dispatch = useAppDispatch()
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sendingRef = useRef(false)

  const character = characters.find((c) => c.id === activeCharacterId) ?? null
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const characterId = character?.id ?? null

  useEffect(() => {
    if (!characterId) return
    let cancelled = false
    void getAll<Message>('messages').then((all) => {
      if (cancelled) return
      const own = all
        .filter((m) => m.characterId === characterId)
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

    const aiMessages: AiMessage[] = [
      { role: 'system', content: buildSystemPrompt(character) },
      ...[...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
    ]

    try {
      setStreamingText('')
      const params = character.modelParams
      const reply = params.stream
        ? await chatCompletionStream(apiConfig, aiMessages, params, (delta) =>
            setStreamingText((prev) => (prev ?? '') + delta),
          )
        : await chatCompletion(apiConfig, aiMessages, params)
      const assistantMessage: Message = {
        id: createId(),
        characterId: character.id,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      }
      await put('messages', assistantMessage)
      dispatch({ type: 'chat/appendMessage', message: assistantMessage })
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
    send,
    sending: streamingText !== null,
  }
}
