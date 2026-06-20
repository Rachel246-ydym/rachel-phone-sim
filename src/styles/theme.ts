import type { ThemeMode } from '../types'

export const THEME_MODE_VARS: Record<ThemeMode, Record<string, string>> = {
  light: {
    '--bg-screen': '#FAF6F0',
    '--bg-card': '#FFFFFF',
    '--bg-input': '#F5F0EA',
    '--glass-bg': 'rgba(255,255,255,0.78)',
    '--border': '#E4DCD2',
    '--border-light': '#EDE8E0',
    '--color-primary': '#C17C74',
    '--color-primary-light': '#EEDDD8',
    '--color-primary-bg': '#F8F0ED',
    '--color-sage': '#7D9B82',
    '--color-sage-light': '#E2ECE4',
    '--color-lavender': '#9B8BB4',
    '--color-lavender-light': '#E8E2F0',
    '--color-amber': '#C4A254',
    '--color-amber-light': '#F0E8D2',
    '--color-slate': '#7889A0',
    '--color-slate-light': '#DEE4EC',
    '--text-primary': '#3D3832',
    '--text-secondary': '#8A8178',
    '--text-light': '#B5ADA5',
    '--text-title': '#2E2A26',
    '--emotion-warm': '#D4917A',
    '--emotion-calm': '#C8BFAA',
    '--emotion-deep': '#C17C74',
    '--emotion-cool': '#8BA4B8',
  },
  dark: {
    '--bg-screen': '#1A2332',
    '--bg-card': '#243040',
    '--bg-input': '#1E2838',
    '--glass-bg': 'rgba(26,35,50,0.88)',
    '--border': 'rgba(255,255,255,0.08)',
    '--border-light': 'rgba(255,255,255,0.04)',
    '--color-primary': '#C17C74',
    '--color-primary-light': '#EEDDD8',
    '--color-primary-bg': '#F8F0ED',
    '--color-sage': '#7D9B82',
    '--color-sage-light': '#E2ECE4',
    '--color-lavender': '#9B8BB4',
    '--color-lavender-light': '#E8E2F0',
    '--color-amber': '#C4A254',
    '--color-amber-light': '#F0E8D2',
    '--color-slate': '#7889A0',
    '--color-slate-light': '#DEE4EC',
    '--text-primary': '#E8E0D4',
    '--text-secondary': '#8A8A98',
    '--text-light': '#5A5A68',
    '--text-title': '#F0EAE0',
    '--emotion-warm': '#D4917A',
    '--emotion-calm': '#C8BFAA',
    '--emotion-deep': '#C17C74',
    '--emotion-cool': '#8BA4B8',
  },
}

export function applyThemeMode(mode: ThemeMode): void {
  const vars = THEME_MODE_VARS[mode]
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}
