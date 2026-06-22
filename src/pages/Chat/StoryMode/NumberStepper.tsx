import { useRef, useState } from 'react'

interface NumberStepperProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export default function NumberStepper({ value, min, max, step, onChange }: NumberStepperProps) {
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const touchStartValue = useRef<number>(value)

  function clamp(v: number) {
    return Math.max(min, Math.min(max, Math.round(v / step) * step))
  }

  function decrement() {
    onChange(clamp(value - step))
  }

  function increment() {
    onChange(clamp(value + step))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  function handleFocus() {
    setEditing(true)
    setInputValue(String(value))
  }

  function handleBlur() {
    setEditing(false)
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      onChange(clamp(parsed))
    }
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
    touchStartValue.current = value
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.touches[0].clientY
    const steps = Math.round(delta / 12)
    onChange(clamp(touchStartValue.current + steps * step))
  }

  function handleTouchEnd() {
    touchStartY.current = null
  }

  const atMin = value <= min
  const atMax = value >= max

  return (
    <div className="num-stepper">
      <button
        className={`num-stepper__btn${atMin ? ' num-stepper__btn--disabled' : ''}`}
        disabled={atMin}
        onClick={decrement}
        aria-label="减少"
      >
        −
      </button>
      <input
        className="num-stepper__input"
        type="text"
        inputMode="numeric"
        value={editing ? inputValue : String(value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="数值"
      />
      <button
        className={`num-stepper__btn${atMax ? ' num-stepper__btn--disabled' : ''}`}
        disabled={atMax}
        onClick={increment}
        aria-label="增加"
      >
        +
      </button>
    </div>
  )
}
