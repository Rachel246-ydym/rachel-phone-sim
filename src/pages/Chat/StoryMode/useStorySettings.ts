import { useEffect, useState } from 'react'
import { get, put } from '../../../services/storage'
import type { NarrativePerson, StoryTheme } from '../../../types'

export interface StorySettingsData {
  theme: StoryTheme
  useCharMemory: boolean
  styleGuide: string
  targetWords: number
  autoSummaryEvery: number
  narrativePerson: NarrativePerson
}

const SETTINGS_KEY = 'story_settings'

const DEFAULT_SETTINGS: StorySettingsData = {
  theme: 'dark',
  useCharMemory: false,
  styleGuide: '',
  targetWords: 2000,
  autoSummaryEvery: 5,
  narrativePerson: 'third',
}

// CSS variable overrides for each theme; dark uses root defaults (empty)
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

export function useStorySettings() {
  const [settings, setSettings] = useState<StorySettingsData>(DEFAULT_SETTINGS)

  useEffect(() => {
    void (async () => {
      const entry = await get<{ id: string; value: StorySettingsData }>('settings', SETTINGS_KEY)
      if (entry) setSettings(entry.value)
    })()
  }, [])

  async function saveSettings(data: StorySettingsData): Promise<void> {
    await put('settings', { id: SETTINGS_KEY, value: data })
    setSettings(data)
  }

  return { settings, saveSettings }
}
