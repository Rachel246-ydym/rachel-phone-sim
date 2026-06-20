import { useAppDispatch, useAppState } from '../store/AppContext'
import { put } from '../services/storage'
import type { ThemeMode } from '../types'

export function useTheme(): { themeMode: ThemeMode; toggleTheme: () => Promise<void> } {
  const { displaySettings } = useAppState()
  const dispatch = useAppDispatch()
  const themeMode: ThemeMode = displaySettings.themeMode ?? 'light'

  async function toggleTheme() {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light'
    const newSettings = { ...displaySettings, themeMode: newMode }
    await put('settings', { id: 'displaySettings', value: newSettings })
    dispatch({ type: 'profile/setDisplaySettings', settings: newSettings })
  }

  return { themeMode, toggleTheme }
}
