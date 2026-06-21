import { useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { get, put } from '../../services/storage'

const BTN = 40
const EDGE_GAP = 16
const TOP_MIN = 44
const BOTTOM_MIN = 72 // nav(56) + gap(16)

interface SavedPos {
  side: 'left' | 'right'
  y: number
}

export default function ThemeToggle() {
  const { themeMode, toggleTheme } = useTheme()
  const [savedPos, setSavedPos] = useState<SavedPos | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const isDragging = useRef(false)
  const dragActivated = useRef(false) // true once drag has actually moved
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const origin = useRef({ touchX: 0, touchY: 0, elemTop: 0, elemLeft: 0 })
  const live = useRef({ top: 0, left: 0 })

  useEffect(() => {
    void get<{ id: string; value: SavedPos }>('settings', 'themeTogglePos').then((entry) => {
      if (entry?.value) setSavedPos(entry.value)
    })
  }, [])

  // Non-passive touchmove listener so e.preventDefault() works
  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return
    function onMove(e: TouchEvent) {
      if (!isDragging.current) return
      e.preventDefault()
      const t = e.touches[0]
      const phone = btn!.closest('.phone') as HTMLElement | null
      if (!phone) return
      const phoneH = phone.offsetHeight
      const phoneW = phone.offsetWidth
      let newTop = origin.current.elemTop + (t.clientY - origin.current.touchY)
      let newLeft = origin.current.elemLeft + (t.clientX - origin.current.touchX)
      newTop = Math.max(TOP_MIN, Math.min(phoneH - BOTTOM_MIN - BTN, newTop))
      newLeft = Math.max(0, Math.min(phoneW - BTN, newLeft))
      live.current = { top: newTop, left: newLeft }
      dragActivated.current = true
      btn!.style.top = `${newTop}px`
      btn!.style.left = `${newLeft}px`
      btn!.style.right = 'auto'
      btn!.style.bottom = 'auto'
      btn!.style.transform = 'scale(1.1)'
      btn!.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'
    }
    btn.addEventListener('touchmove', onMove, { passive: false })
    return () => btn.removeEventListener('touchmove', onMove)
  }, [])

  function handleTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    const t = e.touches[0]
    const phone = btnRef.current?.closest('.phone') as HTMLElement | null
    if (!phone) return
    const btnRect = btnRef.current!.getBoundingClientRect()
    const phoneRect = phone.getBoundingClientRect()
    origin.current = {
      touchX: t.clientX,
      touchY: t.clientY,
      elemTop: btnRect.top - phoneRect.top,
      elemLeft: btnRect.left - phoneRect.left,
    }
    live.current = { top: origin.current.elemTop, left: origin.current.elemLeft }
    isDragging.current = false
    dragActivated.current = false
    dragTimer.current = setTimeout(() => {
      isDragging.current = true
    }, 150)
  }

  function handleTouchEnd() {
    if (dragTimer.current) clearTimeout(dragTimer.current)
    isDragging.current = false
    const btn = btnRef.current!

    if (!dragActivated.current) {
      // Was a tap — reset styles and let the click event handle toggle
      btn.style.transform = ''
      dragActivated.current = false
      return
    }
    dragActivated.current = false

    // Was a real drag — snap to edge
    const phone = btn.closest('.phone') as HTMLElement | null
    if (!phone) { btn.style.cssText = ''; return }
    const phoneW = phone.offsetWidth
    const phoneH = phone.offsetHeight
    const centerX = live.current.left + BTN / 2
    const side: 'left' | 'right' = centerX < phoneW / 2 ? 'left' : 'right'
    const finalLeft = side === 'left' ? EDGE_GAP : phoneW - BTN - EDGE_GAP
    const finalTop = Math.max(TOP_MIN, Math.min(phoneH - BOTTOM_MIN - BTN, live.current.top))

    btn.style.transition = 'left 0.3s ease-out, top 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out'
    btn.style.left = `${finalLeft}px`
    btn.style.top = `${finalTop}px`
    btn.style.right = 'auto'
    btn.style.bottom = 'auto'
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = ''

    const newPos: SavedPos = { side, y: finalTop }
    setSavedPos(newPos)
    void put('settings', { id: 'themeTogglePos', value: newPos })

    setTimeout(() => {
      if (!btnRef.current) return
      btnRef.current.style.transition = ''
    }, 350)
  }

  const btnStyle: React.CSSProperties = savedPos
    ? {
        top: savedPos.y,
        bottom: 'auto',
        ...(savedPos.side === 'right'
          ? { right: EDGE_GAP, left: 'auto' }
          : { left: EDGE_GAP, right: 'auto' }),
      }
    : {}

  return (
    <button
      ref={btnRef}
      className="theme-toggle"
      style={btnStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => void toggleTheme()}
      aria-label="切换日夜模式"
    >
      {themeMode === 'light'
        ? <Moon size={18} strokeWidth={1.5} />
        : <Sun size={18} strokeWidth={1.5} />}
    </button>
  )
}
