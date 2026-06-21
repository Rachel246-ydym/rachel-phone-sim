import { useEffect, useState } from 'react'
import { get, put } from '../../../services/storage'
import type { NarrativePerson, StoryTheme } from '../../../types'

export interface LongNarrativeSettings {
  theme: StoryTheme
  useCharMemory: boolean
  styleGuide: string
  targetWords: number
  autoSummaryEvery: number
  narrativePerson: NarrativePerson
  contextLimit: number
  streamOutput: boolean
  customPrompt: string
}

export interface ShortRPSettings {
  useCharMemory: boolean
  replyWordLimit: number
  contextLimit: number
  streamOutput: boolean
  customPrompt: string
}

export interface StorySettingsData {
  longNarrative: LongNarrativeSettings
  shortRP: ShortRPSettings
}

const SETTINGS_KEY = 'story_settings'

const DEFAULT_LONG: LongNarrativeSettings = {
  theme: 'dark',
  useCharMemory: false,
  styleGuide: '',
  targetWords: 2000,
  autoSummaryEvery: 5,
  narrativePerson: 'third',
  contextLimit: 10,
  streamOutput: true,
  customPrompt: '',
}

const DEFAULT_SHORT: ShortRPSettings = {
  useCharMemory: false,
  replyWordLimit: 100,
  contextLimit: 10,
  streamOutput: true,
  customPrompt: '',
}

export const DEFAULT_SETTINGS: StorySettingsData = {
  longNarrative: DEFAULT_LONG,
  shortRP: DEFAULT_SHORT,
}

export const THEME_VARS: Record<StoryTheme, Record<string, string>> = {
  dark: {},
  light: {
    '--color-bg': '#ffffff',
    '--color-surface': '#f5f5f7',
    '--color-surface-raised': '#ebebed',
    '--color-border': '#d8d8de',
    '--color-text': '#1a1a1e',
    '--color-text-secondary': '#6a6a73',
  },
  cream: {
    '--color-bg': '#f5f0e8',
    '--color-surface': '#ede8e0',
    '--color-surface-raised': '#e5e0d8',
    '--color-border': '#d0ccc4',
    '--color-text': '#2a2a1e',
    '--color-text-secondary': '#7a7468',
  },
  navy: {
    '--color-bg': '#0d1b2a',
    '--color-surface': '#162233',
    '--color-surface-raised': '#1e2d40',
    '--color-border': '#2a3d50',
    '--color-text': '#d6e4f0',
    '--color-text-secondary': '#7a9bba',
  },
}

function migrate(raw: unknown): StorySettingsData {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS
  const r = raw as Record<string, unknown>
  if (r.longNarrative && r.shortRP) {
    return {
      longNarrative: { ...DEFAULT_LONG, ...(r.longNarrative as Partial<LongNarrativeSettings>) },
      shortRP: { ...DEFAULT_SHORT, ...(r.shortRP as Partial<ShortRPSettings>) },
    }
  }
  // Migrate from old flat format
  return {
    longNarrative: {
      theme: (r.theme as StoryTheme) ?? DEFAULT_LONG.theme,
      useCharMemory: (r.useCharMemory as boolean) ?? DEFAULT_LONG.useCharMemory,
      styleGuide: (r.styleGuide as string) ?? DEFAULT_LONG.styleGuide,
      targetWords: (r.targetWords as number) ?? DEFAULT_LONG.targetWords,
      autoSummaryEvery: (r.autoSummaryEvery as number) ?? DEFAULT_LONG.autoSummaryEvery,
      narrativePerson: (r.narrativePerson as NarrativePerson) ?? DEFAULT_LONG.narrativePerson,
      contextLimit: DEFAULT_LONG.contextLimit,
      streamOutput: DEFAULT_LONG.streamOutput,
      customPrompt: '',
    },
    shortRP: DEFAULT_SHORT,
  }
}

export function useStorySettings() {
  const [settings, setSettings] = useState<StorySettingsData>(DEFAULT_SETTINGS)

  useEffect(() => {
    void (async () => {
      const entry = await get<{ id: string; value: unknown }>('settings', SETTINGS_KEY)
      if (entry) setSettings(migrate(entry.value))
    })()
  }, [])

  async function saveSettings(data: StorySettingsData): Promise<void> {
    await put('settings', { id: SETTINGS_KEY, value: data })
    setSettings(data)
  }

  return { settings, saveSettings }
}
