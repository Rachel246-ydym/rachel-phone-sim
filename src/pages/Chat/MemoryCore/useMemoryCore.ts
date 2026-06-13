import { useEffect, useState } from 'react'
import { useAppState } from '../../../store/AppContext'
import { get, put } from '../../../services/storage'
import {
  addMemory,
  clearMemories,
  deleteMemory,
  listMemories,
  updateMemory,
} from '../../../services/memory'
import type { Memory, MemoryTag } from '../../../types'

export interface AutoSummarySettings {
  enabled: boolean
  every: number
}

const DEFAULT_AUTO: AutoSummarySettings = { enabled: false, every: 20 }

export function useMemoryCore() {
  const { characters, activeCharacterId } = useAppState()
  const character = characters.find((c) => c.id === activeCharacterId) ?? null
  const [memories, setMemories] = useState<Memory[]>([])
  const [autoSettings, setAutoSettings] = useState<AutoSummarySettings>(DEFAULT_AUTO)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!character) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      const [mems, entry] = await Promise.all([
        listMemories(character.id),
        get<{ id: string; value: AutoSummarySettings }>('settings', `memory_auto_${character.id}`),
      ])
      if (cancelled) return
      setMemories(mems)
      if (entry) setAutoSettings(entry.value)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [character?.id])

  async function addManual(content: string): Promise<void> {
    if (!character || !content.trim()) return
    const mem = await addMemory(character.id, content.trim(), 'manual-add', '手动添加')
    setMemories((prev) => [mem, ...prev])
  }

  async function editMemory(id: string, content: string): Promise<void> {
    const target = memories.find((m) => m.id === id)
    if (!target || !content.trim()) return
    const updated: Memory = { ...target, content: content.trim() }
    await updateMemory(updated)
    setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }

  async function removeMemory(id: string): Promise<void> {
    await deleteMemory(id)
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  async function clearAll(): Promise<void> {
    if (!character) return
    await clearMemories(character.id)
    setMemories([])
  }

  async function clearByTag(tag: MemoryTag): Promise<void> {
    if (!character) return
    await clearMemories(character.id, tag)
    setMemories((prev) => prev.filter((m) => m.tag !== tag))
  }

  async function saveAutoSettings(next: AutoSummarySettings): Promise<void> {
    if (!character) return
    await put('settings', { id: `memory_auto_${character.id}`, value: next })
    setAutoSettings(next)
  }

  return {
    character,
    memories,
    autoSettings,
    loading,
    addManual,
    editMemory,
    removeMemory,
    clearAll,
    clearByTag,
    saveAutoSettings,
  }
}
