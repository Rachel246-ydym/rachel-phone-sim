import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { themeMode, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="切换日夜模式"
    >
      {themeMode === 'light'
        ? <Moon size={18} strokeWidth={1.5} />
        : <Sun size={18} strokeWidth={1.5} />}
    </button>
  )
}
