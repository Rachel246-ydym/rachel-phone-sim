import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../../store/AppContext'
import { createId, getAll, put, remove } from '../../../services/storage'
import { chatCompletion } from '../../../services/ai'
import type { Archive, Character, Message } from '../../../types'

function buildSummaryPrompt(character: Character): string {
  return [
    `你是一位剧情记录员，请为「${character.name}」与用户共同经历的线下剧情撰写一段完整的剧情总结。`,
    '按时间顺序覆盖全部关键情节、场景变化、人物行为与情感发展，不要遗漏，也不要续写新剧情。',
    '直接输出总结正文，不要加标题或任何前缀。',
  ].join('\n')
}

function sortArchives(list: Archive[]): Archive[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt)
}

export function useArchives(character: Character, storyId: string) {
  const { apiConfigs } = useAppState()
  const apiConfig = apiConfigs.find((c) => c.isPrimary) ?? apiConfigs[0] ?? null
  const [archives, setArchives] = useState<Archive[]>([])
  const [archiving, setArchiving] = useState(false)
  const archivingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void getAll<Archive>('archives').then((all) => {
      if (!cancelled) setArchives(sortArchives(all.filter((a) => a.storyId === storyId)))
    })
    return () => {
      cancelled = true
    }
  }, [storyId])

  async function generateSummary(history: Message[]): Promise<string> {
    if (!apiConfig) {
      throw new Error('请先在「我的」→ API 设置中添加 API 配置')
    }
    // 整段剧情合并为单条消息，避免被 contextLimit 截断；放宽 maxTokens 保证总结完整
    const narrative = history
      .map((m) => (m.role === 'user' ? `【用户】${m.content}` : m.content))
      .join('\n\n')
    const params = {
      ...character.modelParams,
      maxTokens: Math.max(character.modelParams.maxTokens, 2000),
    }
    return chatCompletion(
      apiConfig,
      [
        { role: 'system', content: buildSummaryPrompt(character) },
        { role: 'user', content: narrative },
      ],
      params,
    )
  }

  // 总结生成失败时仍保留存档，避免丢失存档点，失败原因写入总结便于手动补充
  async function createArchive(
    name: string,
    branchId: string,
    segmentIndex: number,
    history: Message[],
  ) {
    if (archivingRef.current) return
    archivingRef.current = true
    setArchiving(true)
    let summary: string
    try {
      summary = await generateSummary(history)
    } catch (err) {
      const reason = err instanceof Error ? err.message : '未知错误'
      summary = `（剧情总结生成失败：${reason}。可通过「编辑」手动补充。）`
    }
    const archive: Archive = {
      id: createId(),
      storyId,
      branchId,
      segmentIndex,
      name,
      summary,
      createdAt: Date.now(),
    }
    await put('archives', archive)
    setArchives((prev) => sortArchives([...prev, archive]))
    archivingRef.current = false
    setArchiving(false)
  }

  async function updateArchive(id: string, name: string, summary: string) {
    const target = archives.find((a) => a.id === id)
    if (!target || !name.trim()) return
    const updated: Archive = { ...target, name: name.trim(), summary }
    await put('archives', updated)
    setArchives((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  async function deleteArchive(id: string) {
    await remove('archives', id)
    setArchives((prev) => prev.filter((a) => a.id !== id))
  }

  return { archives, archiving, createArchive, updateArchive, deleteArchive }
}
