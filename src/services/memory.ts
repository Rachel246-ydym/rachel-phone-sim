// 记忆核心逻辑：自动总结、标签、筛选（自动总结的 AI 调用在后续阶段接入 ai.ts）

import type { Memory, MemoryTag } from '../types'
import { createId, getAll, put, remove } from './storage'

export async function addMemory(
  characterId: string,
  content: string,
  tag: MemoryTag,
  source: string,
  branchId?: string,
): Promise<Memory> {
  const memory: Memory = {
    id: createId(),
    characterId,
    content,
    tag,
    source,
    createdAt: Date.now(),
    ...(branchId !== undefined ? { branchId } : {}),
  }
  await put('memories', memory)
  return memory
}

export async function listMemories(characterId: string): Promise<Memory[]> {
  const all = await getAll<Memory>('memories')
  return all
    .filter((m) => m.characterId === characterId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function filterByTag(memories: Memory[], tag: MemoryTag | 'all'): Memory[] {
  if (tag === 'all') return memories
  return memories.filter((m) => m.tag === tag)
}

export function filterByBranch(memories: Memory[], branchId: string): Memory[] {
  return memories.filter((m) => m.branchId === branchId)
}

export async function updateMemory(memory: Memory): Promise<void> {
  await put('memories', memory)
}

export async function deleteMemory(id: string): Promise<void> {
  await remove('memories', id)
}

export async function clearMemories(characterId: string, tag?: MemoryTag): Promise<number> {
  const all = await getAll<Memory>('memories')
  const targets = all.filter(
    (m) => m.characterId === characterId && (tag === undefined || m.tag === tag),
  )
  await Promise.all(targets.map((m) => remove('memories', m.id)))
  return targets.length
}

export async function buildMemoryContext(characterId: string, count: number): Promise<string> {
  const memories = await listMemories(characterId)
  const recent = memories.slice(0, count)
  if (recent.length === 0) return ''
  return (
    '\n\n核心记忆（角色对用户的了解与重要经历）：\n' +
    recent.map((m, i) => `${i + 1}. ${m.content}`).join('\n')
  )
}
