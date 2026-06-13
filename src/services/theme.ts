import type { ThemeId } from '../types'

interface ThemeVars {
  '--color-primary': string
  '--color-primary-dim': string
  '--color-bg': string
  '--color-surface': string
  '--color-surface-raised': string
  '--color-border': string
  '--color-text': string
  '--color-text-secondary': string
}

export interface Theme {
  id: ThemeId
  label: string
  swatch: string
  vars: ThemeVars
}

export const THEMES: Theme[] = [
  {
    id: 'mono',
    label: '黑白',
    swatch: '#b0b0ba',
    vars: {
      '--color-primary': '#b0b0ba',
      '--color-primary-dim': '#888892',
      '--color-bg': '#111113',
      '--color-surface': '#1c1c1f',
      '--color-surface-raised': '#252528',
      '--color-border': '#303035',
      '--color-text': '#f0f0f2',
      '--color-text-secondary': '#9a9aa3',
    },
  },
  {
    id: 'blue',
    label: '淡蓝',
    swatch: '#5BA4CF',
    vars: {
      '--color-primary': '#5BA4CF',
      '--color-primary-dim': '#3d7da8',
      '--color-bg': '#111317',
      '--color-surface': '#1b1f26',
      '--color-surface-raised': '#242930',
      '--color-border': '#2c3138',
      '--color-text': '#f0f0f2',
      '--color-text-secondary': '#9a9aa3',
    },
  },
  {
    id: 'green',
    label: '淡绿',
    swatch: '#4CAF7D',
    vars: {
      '--color-primary': '#4CAF7D',
      '--color-primary-dim': '#3a8a62',
      '--color-bg': '#121214',
      '--color-surface': '#1d1d22',
      '--color-surface-raised': '#26262d',
      '--color-border': '#2c2c33',
      '--color-text': '#f0f0f2',
      '--color-text-secondary': '#9a9aa3',
    },
  },
  {
    id: 'pink',
    label: '淡粉',
    swatch: '#E07BA8',
    vars: {
      '--color-primary': '#E07BA8',
      '--color-primary-dim': '#b55a82',
      '--color-bg': '#141213',
      '--color-surface': '#211d1f',
      '--color-surface-raised': '#2a2527',
      '--color-border': '#332d30',
      '--color-text': '#f0f0f2',
      '--color-text-secondary': '#9a9aa3',
    },
  },
  {
    id: 'lavender',
    label: '薰衣草',
    swatch: '#9E82D4',
    vars: {
      '--color-primary': '#9E82D4',
      '--color-primary-dim': '#7a61ab',
      '--color-bg': '#121218',
      '--color-surface': '#1c1c27',
      '--color-surface-raised': '#252531',
      '--color-border': '#2e2e40',
      '--color-text': '#f0f0f2',
      '--color-text-secondary': '#9a9aa3',
    },
  },
  {
    id: 'dark',
    label: '深色',
    swatch: '#3c3c4a',
    vars: {
      '--color-primary': '#8888a0',
      '--color-primary-dim': '#666678',
      '--color-bg': '#000000',
      '--color-surface': '#0d0d12',
      '--color-surface-raised': '#141418',
      '--color-border': '#1e1e26',
      '--color-text': '#e0e0e2',
      '--color-text-secondary': '#777785',
    },
  },
]

export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES.find((t) => t.id === 'green')!
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
}
